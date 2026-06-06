export type Priority = 'high' | 'medium' | 'low';
export type TodoStatus = 'active' | 'completed';
export type Category = 'work' | 'personal' | 'health' | 'learning' | 'other';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  category: Category;
  status: TodoStatus;
  dueDate?: string; // ISO date string YYYY-MM-DD
  createdAt: string; // ISO datetime
  completedAt?: string; // ISO datetime
  xpReward: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface GameState {
  xp: number;
  level: number;
  streak: number;
  lastCompletionDate?: string; // YYYY-MM-DD
  todayCompletions: number;
  totalCompleted: number;
  badges: string[]; // badge ids
  recentXpGains: XpGain[];
}

export interface XpGain {
  id: string;
  amount: number;
  reason: string;
  timestamp: string;
}

export interface AppState {
  todos: Todo[];
  game: GameState;
  activeView: 'dashboard' | 'todos' | 'calendar' | 'achievements';
  filters: {
    status: 'all' | 'active' | 'completed';
    priority: 'all' | Priority;
    category: 'all' | Category;
  };
  showAddModal: boolean;
  editingTodo?: string;
}
