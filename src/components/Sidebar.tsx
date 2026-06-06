import { motion } from 'framer-motion';
import { LayoutDashboard, CheckSquare, Calendar, Trophy, Plus, LogOut } from 'lucide-react';
import type { AppStore } from '../store/useAppStore';
import { levelFromXp } from '../utils/badges';
import { useAuth } from '../contexts/AuthContext';

const VIEWS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'todos', label: 'My Quests', icon: CheckSquare },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
] as const;

const KB_HINTS: Record<string, string> = {
  dashboard: 'D',
  todos: 'T',
  calendar: 'C',
  achievements: 'A',
};

export function Sidebar({ store }: { store: AppStore }) {
  const { signOut, userName } = useAuth();
  const { level, currentXp, neededXp } = levelFromXp(store.game.xp);
  const xpPct = Math.min((currentXp / neededXp) * 100, 100);

  return (
    <aside className="w-64 shrink-0 flex flex-col gap-4 py-6 px-4">
      {/* Logo */}
      <div className="px-2 mb-2">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl float"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 0 20px rgba(139,92,246,0.5)' }}>
            ⚔️
          </div>
          <div>
            <div className="font-bold text-white text-lg leading-tight">TodoQuest</div>
            <div className="text-xs text-purple-300">Gamified Productivity</div>
          </div>
        </motion.div>
      </div>

      {/* Player Card */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="glass p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
            {String(level).padStart(2, '0')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{userName}</div>
            <div className="text-xs text-purple-300">Level {level} · {store.game.xp} XP</div>
          </div>
          {store.game.streak > 0 && (
            <div className="flex items-center gap-1 text-orange-400">
              <span className="fire text-lg">🔥</span>
              <span className="text-sm font-bold">{store.game.streak}</span>
            </div>
          )}
        </div>
        {/* XP Bar */}
        <div className="relative">
          <div className="text-xs text-purple-300 mb-1 flex justify-between">
            <span>{currentXp} XP</span>
            <span>{neededXp} XP</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)' }}
            />
          </div>
        </div>
      </motion.div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        {VIEWS.map((view, i) => {
          const Icon = view.icon;
          const active = store.activeView === view.id;
          return (
            <motion.button
              key={view.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => store.setView(view.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                active
                  ? 'text-white'
                  : 'text-purple-300 hover:text-white hover:bg-white/5'
              }`}
              style={active ? {
                background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(168,85,247,0.2))',
                boxShadow: '0 0 16px rgba(139,92,246,0.2)',
                border: '1px solid rgba(139,92,246,0.3)',
              } : {}}
            >
              <Icon size={18} />
              {view.label}
              <span className="ml-auto flex items-center gap-1.5">
                {view.id === 'todos' && store.todos.filter(t => t.status === 'active').length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: 'rgba(139,92,246,0.3)', color: '#c4b5fd' }}>
                    {store.todos.filter(t => t.status === 'active').length}
                  </span>
                )}
                <span className="text-xs opacity-40 font-mono px-1 rounded"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  {KB_HINTS[view.id]}
                </span>
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* Add Quest Button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={store.openAddModal}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-auto flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
        }}
      >
        <Plus size={18} />
        New Quest
        <span className="ml-auto text-xs opacity-50 font-mono px-1 rounded"
          style={{ background: 'rgba(0,0,0,0.2)' }}>N</span>
      </motion.button>

      {/* Sign out */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={signOut}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm text-purple-400 hover:text-red-300 transition-colors cursor-pointer"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <LogOut size={15} />
        Sign out
      </motion.button>

      {/* Stats footer */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Completed', value: store.game.totalCompleted },
          { label: 'Badges', value: store.game.badges.length },
        ].map((s) => (
          <div key={s.label} className="glass p-2 text-center rounded-lg">
            <div className="text-lg font-bold text-white">{s.value}</div>
            <div className="text-xs text-purple-300">{s.label}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}
