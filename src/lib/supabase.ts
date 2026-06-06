import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type DbTodo = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: string;
  category: string;
  status: string;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  xp_reward: number;
  xp_gained: number | null;
};

export type DbGameState = {
  user_id: string;
  xp: number;
  level: number;
  streak: number;
  last_completion_date: string | null;
  today_completions: number;
  total_completed: number;
  badges: string[];
  recent_xp_gains: { id: string; amount: number; reason: string; timestamp: string }[];
  updated_at: string;
};

export type DbProfile = {
  id: string;
  name: string;
  email: string | null;
  created_at: string;
};
