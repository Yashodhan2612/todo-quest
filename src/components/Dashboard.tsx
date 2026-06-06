import { motion } from 'framer-motion';
import { TrendingUp, Target, Flame, Zap, CheckCircle2, Clock } from 'lucide-react';
import type { AppStore } from '../store/useAppStore';
import { levelFromXp, ALL_BADGES } from '../utils/badges';
import { format } from 'date-fns';

export function Dashboard({ store, userName }: { store: AppStore; userName: string }) {
  const { level, currentXp, neededXp } = levelFromXp(store.game.xp);
  const xpPct = Math.min((currentXp / neededXp) * 100, 100);
  const today = new Date().toISOString().split('T')[0];

  const activeTodos = store.todos.filter((t) => t.status === 'active');
  const todayDue = activeTodos.filter((t) => t.dueDate === today);
  const overdue = activeTodos.filter((t) => t.dueDate && t.dueDate < today);
  const upcoming = activeTodos.filter((t) => t.dueDate && t.dueDate > today).slice(0, 3);
  const unlockedBadges = ALL_BADGES.filter((b) => store.game.badges.includes(b.id));
  const nextBadges = ALL_BADGES.filter((b) => !store.game.badges.includes(b.id)).slice(0, 3);

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good {getGreeting()}, {userName}! 👋
          </h1>
          <p className="text-purple-300 text-sm mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        {store.game.streak > 0 && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="glass px-4 py-2 flex items-center gap-2"
            style={{ border: '1px solid rgba(251,146,60,0.3)', boxShadow: '0 0 20px rgba(251,146,60,0.15)' }}
          >
            <span className="fire text-2xl">🔥</span>
            <div>
              <div className="text-orange-300 font-bold text-lg leading-none">{store.game.streak}</div>
              <div className="text-orange-400 text-xs">day streak</div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Target, label: 'Active Quests', value: activeTodos.length, color: '#7c3aed', glow: 'rgba(124,58,237,0.3)' },
          { icon: CheckCircle2, label: 'Completed', value: store.game.totalCompleted, color: '#10b981', glow: 'rgba(16,185,129,0.3)' },
          { icon: Flame, label: 'Today Done', value: store.game.todayCompletions, color: '#f97316', glow: 'rgba(249,115,22,0.3)' },
          { icon: Zap, label: 'Total XP', value: store.game.xp, color: '#eab308', glow: 'rgba(234,179,8,0.3)' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ scale: 1.02, y: -2 }}
            className="glass p-4 glass-hover"
            style={{ boxShadow: `0 4px 20px ${stat.glow}` }}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-purple-300 mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Level Progress */}
      <motion.div variants={item} className="glass p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}>
              {level}
            </div>
            <div>
              <div className="font-semibold text-white">Level {level}</div>
              <div className="text-xs text-purple-300">{currentXp} / {neededXp} XP to next level</div>
            </div>
          </div>
          <TrendingUp size={20} className="text-purple-400" />
        </div>
        <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full relative overflow-hidden"
            style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)' }}
          >
            <div className="absolute inset-0 shimmer" />
          </motion.div>
        </div>

        {/* Recent XP gains */}
        {store.game.recentXpGains.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {store.game.recentXpGains.slice(0, 4).map((gain) => (
              <span key={gain.id} className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(234,179,8,0.15)', color: '#fde047', border: '1px solid rgba(234,179,8,0.2)' }}>
                +{gain.amount} XP
              </span>
            ))}
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Quests */}
        <motion.div variants={item} className="glass p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target size={18} className="text-purple-400" />
            <h3 className="font-semibold text-white">Today's Quests</h3>
            {overdue.length > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }}>
                {overdue.length} overdue
              </span>
            )}
          </div>
          {todayDue.length === 0 && overdue.length === 0 ? (
            <div className="text-center py-6 text-purple-400 text-sm">
              <div className="text-3xl mb-2">🌟</div>
              No quests due today!
            </div>
          ) : (
            <div className="space-y-2">
              {[...overdue.slice(0, 2), ...todayDue.slice(0, 3)].map((todo) => (
                <MiniTodoRow key={todo.id} todo={todo} isOverdue={overdue.includes(todo)} onComplete={() => store.completeTodo(todo.id)} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Upcoming */}
        <motion.div variants={item} className="glass p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-purple-400" />
            <h3 className="font-semibold text-white">Upcoming</h3>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-6 text-purple-400 text-sm">
              <div className="text-3xl mb-2">📅</div>
              No upcoming quests
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((todo) => (
                <MiniTodoRow key={todo.id} todo={todo} isOverdue={false} onComplete={() => store.completeTodo(todo.id)} />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Badges Preview */}
      <motion.div variants={item} className="glass p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            🏆 Achievements
          </h3>
          <button onClick={() => store.setView('achievements')}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors cursor-pointer">
            View all →
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {unlockedBadges.slice(0, 6).map((badge) => (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.1, y: -2 }}
              title={badge.name}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl cursor-pointer"
              style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}
            >
              {badge.icon}
            </motion.div>
          ))}
          {unlockedBadges.length === 0 && (
            <div className="text-sm text-purple-400">Complete todos to unlock badges!</div>
          )}
        </div>
        {nextBadges.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="text-xs text-purple-400 mb-2">Next to unlock:</div>
            <div className="flex gap-2 flex-wrap">
              {nextBadges.map((badge) => (
                <div key={badge.id} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)', color: '#a78bfa' }}>
                  <span className="grayscale opacity-50">{badge.icon}</span>
                  {badge.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function MiniTodoRow({
  todo,
  isOverdue,
  onComplete,
}: {
  todo: { id: string; title: string; priority: string; dueDate?: string; xpReward: number };
  isOverdue: boolean;
  onComplete: () => void;
}) {
  const priorityDot: Record<string, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#22c55e',
  };

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 hover:bg-white/5 group">
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={onComplete}
        className="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all cursor-pointer"
        style={{ borderColor: priorityDot[todo.priority] }}
      />
      <span className="flex-1 text-sm text-white truncate">{todo.title}</span>
      <div className="flex items-center gap-2 shrink-0">
        {isOverdue && (
          <span className="text-xs text-red-400">overdue</span>
        )}
        <span className="text-xs text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity">
          +{todo.xpReward}xp
        </span>
      </div>
    </div>
  );
}

function getGreeting(): string {
  // Use Intl to get the current hour in the user's local timezone
  const hourStr = new Intl.DateTimeFormat(undefined, { hour: 'numeric', hour12: false, timeZoneName: 'short' })
    .formatToParts(new Date())
    .find((p) => p.type === 'hour')?.value ?? String(new Date().getHours());
  const h = parseInt(hourStr, 10);
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
