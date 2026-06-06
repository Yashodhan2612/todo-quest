-- ============================================================
-- TodoQuest Schema Migration
-- Run this in: https://supabase.com/dashboard/project/uossvprevgympflpedur/sql/new
-- ============================================================

-- Profiles (one per auth user, stores display name)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null default 'Adventurer',
  email text,
  created_at timestamptz default now()
);

-- Todos
create table if not exists public.todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  priority text not null default 'medium',
  category text not null default 'research',
  status text not null default 'active',
  due_date date,
  created_at timestamptz default now(),
  completed_at timestamptz,
  xp_reward integer not null default 20,
  xp_gained integer
);

-- Game state (one row per user)
create table if not exists public.game_state (
  user_id uuid references auth.users(id) on delete cascade primary key,
  xp integer not null default 0,
  level integer not null default 1,
  streak integer not null default 0,
  last_completion_date date,
  today_completions integer not null default 0,
  total_completed integer not null default 0,
  badges jsonb not null default '[]'::jsonb,
  recent_xp_gains jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- ── Row Level Security ──────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.todos enable row level security;
alter table public.game_state enable row level security;

-- profiles
create policy "profiles_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- todos
create policy "todos_select" on public.todos for select using (auth.uid() = user_id);
create policy "todos_insert" on public.todos for insert with check (auth.uid() = user_id);
create policy "todos_update" on public.todos for update using (auth.uid() = user_id);
create policy "todos_delete" on public.todos for delete using (auth.uid() = user_id);

-- game_state
create policy "game_select" on public.game_state for select using (auth.uid() = user_id);
create policy "game_insert" on public.game_state for insert with check (auth.uid() = user_id);
create policy "game_update" on public.game_state for update using (auth.uid() = user_id);

-- ── Trigger: auto-create profile + game_state on signup ────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Adventurer'),
    new.email
  )
  on conflict (id) do nothing;

  insert into public.game_state (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
