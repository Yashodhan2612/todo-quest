import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Todo, GameState, AppState } from '../types';
import { checkBadges, levelFromXp, xpForPriority } from '../utils/badges';

const STORAGE_KEY = 'todo-quest-state';

const DEFAULT_GAME: GameState = {
  xp: 0,
  level: 1,
  streak: 0,
  todayCompletions: 0,
  totalCompleted: 0,
  badges: [],
  recentXpGains: [],
};

function loadState(): { todos: Todo[]; game: GameState } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { todos: [], game: DEFAULT_GAME };
    return JSON.parse(raw);
  } catch {
    return { todos: [], game: DEFAULT_GAME };
  }
}

function saveState(todos: Todo[], game: GameState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ todos, game }));
}

function refreshStreak(game: GameState): GameState {
  const today = new Date().toISOString().split('T')[0];
  if (!game.lastCompletionDate) return game;

  const last = new Date(game.lastCompletionDate);
  const now = new Date(today);
  const diffDays = Math.floor((now.getTime() - last.getTime()) / 86400000);

  if (diffDays === 0) return game;
  if (diffDays === 1) return game; // still valid, streak continues on next completion
  // more than 1 day gap — break streak
  return { ...game, streak: 0, todayCompletions: 0 };
}

export function useAppStore() {
  const [state, setState] = useState<AppState>(() => {
    const { todos, game } = loadState();
    const refreshed = refreshStreak(game);
    return {
      todos,
      game: refreshed,
      activeView: 'dashboard',
      filters: { status: 'all', priority: 'all', category: 'all' },
      showAddModal: false,
    };
  });

  // persist on change
  useEffect(() => {
    saveState(state.todos, state.game);
  }, [state.todos, state.game]);

  const addTodo = useCallback((data: Omit<Todo, 'id' | 'createdAt' | 'status' | 'xpReward'>) => {
    const todo: Todo = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      status: 'active',
      xpReward: xpForPriority(data.priority),
    };
    setState((s) => ({ ...s, todos: [todo, ...s.todos], showAddModal: false }));
  }, []);

  const updateTodo = useCallback((id: string, updates: Partial<Todo>) => {
    setState((s) => ({
      ...s,
      todos: s.todos.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      editingTodo: undefined,
    }));
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setState((s) => ({ ...s, todos: s.todos.filter((t) => t.id !== id) }));
  }, []);

  const completeTodo = useCallback((id: string): { newBadges: string[]; xpGained: number } => {
    let newBadges: string[] = [];
    let xpGained = 0;

    setState((s) => {
      const todo = s.todos.find((t) => t.id === id);
      if (!todo || todo.status === 'completed') return s;

      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();

      const updatedTodos = s.todos.map((t) =>
        t.id === id ? { ...t, status: 'completed' as const, completedAt: now } : t
      );

      let xp = todo.xpReward;
      // streak bonus
      const bonusXp = s.game.streak > 0 ? Math.floor(xp * 0.1 * Math.min(s.game.streak, 10)) : 0;
      xp += bonusXp;
      xpGained = xp;

      const newTotalXp = s.game.xp + xp;
      const { level } = levelFromXp(newTotalXp);

      const isNewDay = s.game.lastCompletionDate !== today;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      const newStreak = isNewDay
        ? s.game.lastCompletionDate === yStr || s.game.streak === 0
          ? s.game.streak + 1
          : 1
        : s.game.streak;

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
      const allBadges = [...newGame.badges, ...newBadges];
      const finalGame = {
        ...newGame,
        badges: allBadges,
      };

      return { ...s, todos: updatedTodos, game: finalGame };
    });

    return { newBadges, xpGained };
  }, []);

  const uncompleteTodo = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      todos: s.todos.map((t) =>
        t.id === id ? { ...t, status: 'active' as const, completedAt: undefined } : t
      ),
    }));
  }, []);

  const setView = useCallback((view: AppState['activeView']) => {
    setState((s) => ({ ...s, activeView: view }));
  }, []);

  const setFilters = useCallback((filters: Partial<AppState['filters']>) => {
    setState((s) => ({ ...s, filters: { ...s.filters, ...filters } }));
  }, []);

  const openAddModal = useCallback(() => setState((s) => ({ ...s, showAddModal: true })), []);
  const closeAddModal = useCallback(() => setState((s) => ({ ...s, showAddModal: false, editingTodo: undefined })), []);

  const startEditing = useCallback((id: string) => {
    setState((s) => ({ ...s, editingTodo: id, showAddModal: true }));
  }, []);

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
