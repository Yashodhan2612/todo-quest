import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Todo, GameState, AppState } from '../types';
import { checkBadges, levelFromXp, xpForPriority } from '../utils/badges';
import { supabase } from '../lib/supabase';
import type { DbTodo, DbGameState } from '../lib/supabase';

const DEFAULT_GAME: GameState = {
  xp: 0,
  level: 1,
  streak: 0,
  todayCompletions: 0,
  totalCompleted: 0,
  badges: [],
  recentXpGains: [],
};

// ── DB <-> App type converters ──────────────────────────────

function dbToTodo(r: DbTodo): Todo {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    priority: r.priority as Todo['priority'],
    category: r.category as Todo['category'],
    status: r.status as Todo['status'],
    dueDate: r.due_date ?? undefined,
    createdAt: r.created_at,
    completedAt: r.completed_at ?? undefined,
    xpReward: r.xp_reward,
    xpGained: r.xp_gained ?? undefined,
  };
}

function dbToGame(r: DbGameState): GameState {
  return {
    xp: r.xp,
    level: r.level,
    streak: r.streak,
    lastCompletionDate: r.last_completion_date ?? undefined,
    todayCompletions: r.today_completions,
    totalCompleted: r.total_completed,
    badges: r.badges ?? [],
    recentXpGains: r.recent_xp_gains ?? [],
  };
}

function refreshStreak(game: GameState): GameState {
  if (!game.lastCompletionDate) return game;
  const today = new Date().toISOString().split('T')[0];
  const diffDays = Math.floor(
    (new Date(today).getTime() - new Date(game.lastCompletionDate).getTime()) / 86400000
  );
  if (diffDays <= 1) return game;
  return { ...game, streak: 0, todayCompletions: 0 };
}

// ── Store hook ──────────────────────────────────────────────

export function useAppStore(userId: string) {
  const [state, setState] = useState<AppState>({
    todos: [],
    game: DEFAULT_GAME,
    activeView: 'dashboard',
    filters: { status: 'all', priority: 'all', category: 'all' },
    showAddModal: false,
    loading: true,
  });

  // Load data from Supabase on mount
  useEffect(() => {
    if (!userId) return;

    async function load() {
      const [{ data: todosData }, { data: gameData }] = await Promise.all([
        supabase.from('todos').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('game_state').select('*').eq('user_id', userId).single(),
      ]);

      const todos = (todosData ?? []).map(dbToTodo);
      const rawGame = gameData ? dbToGame(gameData as DbGameState) : DEFAULT_GAME;
      const game = refreshStreak(rawGame);

      // If streak was reset due to inactivity, sync that back
      if (gameData && game.streak !== rawGame.streak) {
        await supabase.from('game_state').update({ streak: 0, today_completions: 0 }).eq('user_id', userId);
      }

      setState((s) => ({ ...s, todos, game, loading: false }));
    }

    load();
  }, [userId]);

  // ── Persist game state to Supabase ──
  const syncGame = useCallback(async (game: GameState) => {
    await supabase.from('game_state').upsert({
      user_id: userId,
      xp: game.xp,
      level: game.level,
      streak: game.streak,
      last_completion_date: game.lastCompletionDate ?? null,
      today_completions: game.todayCompletions,
      total_completed: game.totalCompleted,
      badges: game.badges,
      recent_xp_gains: game.recentXpGains,
      updated_at: new Date().toISOString(),
    });
  }, [userId]);

  // ── CRUD ────────────────────────────────────────────────

  const addTodo = useCallback(async (data: Omit<Todo, 'id' | 'createdAt' | 'status' | 'xpReward' | 'xpGained'>) => {
    const reward = xpForPriority(data.priority);
    const { data: inserted, error } = await supabase.from('todos').insert({
      user_id: userId,
      title: data.title,
      description: data.description ?? null,
      priority: data.priority,
      category: data.category,
      status: 'active',
      due_date: data.dueDate ?? null,
      xp_reward: reward,
    }).select().single();

    if (error || !inserted) return;
    const todo = dbToTodo(inserted as DbTodo);
    setState((s) => ({ ...s, todos: [todo, ...s.todos], showAddModal: false }));
  }, [userId]);

  const updateTodo = useCallback(async (id: string, updates: Partial<Todo>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description ?? null;
    if (updates.priority !== undefined) { dbUpdates.priority = updates.priority; dbUpdates.xp_reward = xpForPriority(updates.priority); }
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate ?? null;

    await supabase.from('todos').update(dbUpdates).eq('id', id);

    setState((s) => ({
      ...s,
      todos: s.todos.map((t) => t.id === id ? { ...t, ...updates, xpReward: dbUpdates.xp_reward as number ?? t.xpReward } : t),
      editingTodo: undefined,
      showAddModal: false,
    }));
  }, [userId]);

  const deleteTodo = useCallback(async (id: string) => {
    await supabase.from('todos').delete().eq('id', id);
    setState((s) => ({ ...s, todos: s.todos.filter((t) => t.id !== id) }));
  }, [userId]);

  const completeTodo = useCallback((id: string): { newBadges: string[]; xpGained: number } => {
    let newBadges: string[] = [];
    let xpGainedOut = 0;

    setState((s) => {
      const todo = s.todos.find((t) => t.id === id);
      if (!todo || todo.status === 'completed') return s;

      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();

      // Compute XP with streak bonus
      let xp = todo.xpReward;
      const bonusXp = s.game.streak > 0 ? Math.floor(xp * 0.1 * Math.min(s.game.streak, 10)) : 0;
      xp += bonusXp;
      xpGainedOut = xp;

      const newTotalXp = s.game.xp + xp;
      const { level } = levelFromXp(newTotalXp);
      const isNewDay = s.game.lastCompletionDate !== today;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      const newStreak = isNewDay
        ? (s.game.lastCompletionDate === yStr || s.game.streak === 0 ? s.game.streak + 1 : 1)
        : s.game.streak;

      const updatedTodos = s.todos.map((t) =>
        t.id === id ? { ...t, status: 'completed' as const, completedAt: now, xpGained: xp } : t
      );

      const newGame: GameState = {
        ...s.game,
        xp: newTotalXp,
        level,
        streak: newStreak,
        lastCompletionDate: today,
        todayCompletions: isNewDay ? 1 : s.game.todayCompletions + 1,
        totalCompleted: s.game.totalCompleted + 1,
        recentXpGains: [
          { id: uuidv4(), amount: xp, reason: `Completed: ${todo.title.slice(0, 30)}`, timestamp: now },
          ...s.game.recentXpGains.slice(0, 9),
        ],
      };

      newBadges = checkBadges(newGame, updatedTodos);
      const finalGame = { ...newGame, badges: [...newGame.badges, ...newBadges] };

      // Sync to DB asynchronously
      supabase.from('todos').update({
        status: 'completed',
        completed_at: now,
        xp_gained: xp,
      }).eq('id', id).then(() => {});
      syncGame(finalGame);

      return { ...s, todos: updatedTodos, game: finalGame };
    });

    return { newBadges, xpGained: xpGainedOut };
  }, [syncGame]);

  const uncompleteTodo = useCallback((id: string) => {
    setState((s) => {
      const todo = s.todos.find((t) => t.id === id);
      if (!todo || todo.status !== 'completed') return s;

      const today = new Date().toISOString().split('T')[0];
      const wasCompletedToday = todo.completedAt?.startsWith(today) ?? false;

      // XP to subtract — use xpGained if available (actual amount awarded), else fall back to xpReward
      const xpLost = todo.xpGained ?? todo.xpReward;
      const newXp = Math.max(0, s.game.xp - xpLost);
      const { level } = levelFromXp(newXp);
      const newTotalCompleted = Math.max(0, s.game.totalCompleted - 1);
      const newTodayCompletions = wasCompletedToday
        ? Math.max(0, s.game.todayCompletions - 1)
        : s.game.todayCompletions;

      // Remove this todo's XP entry from recentXpGains
      const newRecentGains = s.game.recentXpGains.filter(
        (g) => !g.reason.includes(todo.title.slice(0, 30))
      );

      const updatedTodos = s.todos.map((t) =>
        t.id === id ? { ...t, status: 'active' as const, completedAt: undefined, xpGained: undefined } : t
      );

      const newGame: GameState = {
        ...s.game,
        xp: newXp,
        level,
        totalCompleted: newTotalCompleted,
        todayCompletions: newTodayCompletions,
        recentXpGains: newRecentGains,
      };

      // Sync to DB
      supabase.from('todos').update({
        status: 'active',
        completed_at: null,
        xp_gained: null,
      }).eq('id', id).then(() => {});
      syncGame(newGame);

      return { ...s, todos: updatedTodos, game: newGame };
    });
  }, [syncGame]);

  // ── UI state ────────────────────────────────────────────

  const setView = useCallback((view: AppState['activeView']) => {
    setState((s) => ({ ...s, activeView: view }));
  }, []);

  const setFilters = useCallback((filters: Partial<AppState['filters']>) => {
    setState((s) => ({ ...s, filters: { ...s.filters, ...filters } }));
  }, []);

  const openAddModal = useCallback(() => setState((s) => ({ ...s, showAddModal: true })), []);
  const closeAddModal = useCallback(() => setState((s) => ({ ...s, showAddModal: false, editingTodo: undefined })), []);
  const startEditing = useCallback((id: string) => setState((s) => ({ ...s, editingTodo: id, showAddModal: true })), []);

  const filteredTodos = state.todos.filter((t) => {
    const { status, priority, category } = state.filters;
    if (status !== 'all' && t.status !== status) return false;
    if (priority !== 'all' && t.priority !== priority) return false;
    if (category !== 'all' && t.category !== category) return false;
    return true;
  });

  return {
    ...state,
    filteredTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    completeTodo,
    uncompleteTodo,
    setView,
    setFilters,
    openAddModal,
    closeAddModal,
    startEditing,
  };
}

export type AppStore = ReturnType<typeof useAppStore>;
