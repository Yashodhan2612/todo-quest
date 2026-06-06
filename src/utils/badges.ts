import type { Badge, GameState, Todo } from '../types';

export const ALL_BADGES: Badge[] = [
  {
    id: 'first_quest',
    name: 'First Quest',
    description: 'Complete your very first todo',
    icon: '⚔️',
    condition: 'Complete 1 todo',
    rarity: 'common',
  },
  {
    id: 'on_a_roll',
    name: 'On a Roll',
    description: 'Complete 5 todos',
    icon: '🎯',
    condition: 'Complete 5 todos',
    rarity: 'common',
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Complete 100 todos',
    icon: '💯',
    condition: 'Complete 100 todos',
    rarity: 'epic',
  },
  {
    id: 'streak_3',
    name: 'Consistent',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    condition: '3-day streak',
    rarity: 'common',
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '⚡',
    condition: '7-day streak',
    rarity: 'rare',
  },
  {
    id: 'streak_30',
    name: 'Monthly Legend',
    description: 'Maintain a 30-day streak',
    icon: '👑',
    condition: '30-day streak',
    rarity: 'legendary',
  },
  {
    id: 'level_5',
    name: 'Apprentice',
    description: 'Reach level 5',
    icon: '🌟',
    condition: 'Reach level 5',
    rarity: 'common',
  },
  {
    id: 'level_10',
    name: 'Journeyman',
    description: 'Reach level 10',
    icon: '💎',
    condition: 'Reach level 10',
    rarity: 'rare',
  },
  {
    id: 'level_25',
    name: 'Master',
    description: 'Reach level 25',
    icon: '🏆',
    condition: 'Reach level 25',
    rarity: 'epic',
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete 5 todos in one day',
    icon: '⚡',
    condition: 'Complete 5 todos in a single day',
    rarity: 'rare',
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete a high-priority todo before noon',
    icon: '🌅',
    condition: 'High-priority todo done before noon',
    rarity: 'common',
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete 10 todos with no overdue ones',
    icon: '✨',
    condition: '10 todos, none overdue',
    rarity: 'epic',
  },
  {
    id: 'legendary_500',
    name: 'Legend',
    description: 'Earn 500 XP',
    icon: '🌌',
    condition: 'Earn 500 XP total',
    rarity: 'legendary',
  },
];

export const RARITY_COLORS: Record<string, string> = {
  common: 'from-slate-400 to-slate-500',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-500',
};

export const RARITY_GLOW: Record<string, string> = {
  common: 'rgba(148, 163, 184, 0.4)',
  rare: 'rgba(96, 165, 250, 0.5)',
  epic: 'rgba(167, 139, 250, 0.6)',
  legendary: 'rgba(250, 204, 21, 0.7)',
};

export function checkBadges(game: GameState, todos: Todo[]): string[] {
  const newBadges: string[] = [];
  const today = new Date().toISOString().split('T')[0];
  const nowHour = new Date().getHours();

  const checks: Record<string, boolean> = {
    first_quest: game.totalCompleted >= 1,
    on_a_roll: game.totalCompleted >= 5,
    centurion: game.totalCompleted >= 100,
    streak_3: game.streak >= 3,
    streak_7: game.streak >= 7,
    streak_30: game.streak >= 30,
    level_5: game.level >= 5,
    level_10: game.level >= 10,
    level_25: game.level >= 25,
    speed_demon: game.todayCompletions >= 5,
    early_bird:
      nowHour < 12 &&
      todos.some(
        (t) =>
          t.priority === 'high' &&
          t.status === 'completed' &&
          t.completedAt?.startsWith(today)
      ),
    perfectionist:
      game.totalCompleted >= 10 &&
      todos.filter((t) => t.dueDate && t.status === 'active').every((t) => {
        return !t.dueDate || t.dueDate >= today;
      }),
    legendary_500: game.xp >= 500,
  };

  for (const [id, met] of Object.entries(checks)) {
    if (met && !game.badges.includes(id)) {
      newBadges.push(id);
    }
  }

  return newBadges;
}

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.4, level - 1));
}

export function levelFromXp(totalXp: number): { level: number; currentXp: number; neededXp: number } {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return { level, currentXp: remaining, neededXp: xpForLevel(level) };
}

export function xpForPriority(priority: string): number {
  return priority === 'high' ? 30 : priority === 'medium' ? 20 : 10;
}
