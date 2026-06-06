import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import type { AppStore } from '../store/useAppStore';
import { ALL_BADGES, RARITY_COLORS, RARITY_GLOW } from '../utils/badges';
import { levelFromXp } from '../utils/badges';

const RARITY_BORDER: Record<string, string> = {
  common: 'rgba(148, 163, 184, 0.3)',
  rare: 'rgba(96, 165, 250, 0.4)',
  epic: 'rgba(167, 139, 250, 0.5)',
  legendary: 'rgba(250, 204, 21, 0.6)',
};

export function Achievements({ store }: { store: AppStore }) {
  const { level, currentXp, neededXp } = levelFromXp(store.game.xp);
  const xpPct = Math.min((currentXp / neededXp) * 100, 100);
  const unlocked = store.game.badges;

  const byRarity = {
    legendary: ALL_BADGES.filter((b) => b.rarity === 'legendary'),
    epic: ALL_BADGES.filter((b) => b.rarity === 'epic'),
    rare: ALL_BADGES.filter((b) => b.rarity === 'rare'),
    common: ALL_BADGES.filter((b) => b.rarity === 'common'),
  };

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Achievements</h2>

      {/* Player stats */}
      <div className="glass p-5">
        <div className="flex items-center gap-4 mb-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white pulse-glow"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
          >
            {level}
          </motion.div>
          <div className="flex-1">
            <div className="text-white font-bold text-lg">Level {level}</div>
            <div className="text-purple-300 text-sm">{store.game.xp} XP earned in total</div>
            <div className="flex items-center gap-4 mt-1 text-sm">
              <span className="text-orange-400 flex items-center gap-1">
                🔥 <strong>{store.game.streak}</strong> day streak
              </span>
              <span className="text-green-400 flex items-center gap-1">
                ✅ <strong>{store.game.totalCompleted}</strong> completed
              </span>
              <span className="text-yellow-400 flex items-center gap-1">
                🏆 <strong>{unlocked.length}</strong> badges
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-purple-300 mb-1 flex justify-between">
          <span>XP to next level</span>
          <span>{currentXp} / {neededXp}</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
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
      </div>

      {/* Streak card */}
      {store.game.streak > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-5 flex items-center gap-4"
          style={{ border: '1px solid rgba(251,146,60,0.3)', boxShadow: '0 0 24px rgba(251,146,60,0.15)' }}
        >
          <span className="fire text-5xl">🔥</span>
          <div>
            <div className="text-white font-bold text-2xl">{store.game.streak} Day Streak!</div>
            <div className="text-orange-300 text-sm">Keep it up! Don't break the chain.</div>
          </div>
        </motion.div>
      )}

      {/* Badges by rarity */}
      {(['legendary', 'epic', 'rare', 'common'] as const).map((rarity) => (
        <div key={rarity}>
          <h3 className="text-sm font-semibold capitalize mb-3 flex items-center gap-2"
            style={{ color: rarity === 'legendary' ? '#fde047' : rarity === 'epic' ? '#c4b5fd' : rarity === 'rare' ? '#93c5fd' : '#94a3b8' }}>
            <span>{rarity === 'legendary' ? '🌌' : rarity === 'epic' ? '💜' : rarity === 'rare' ? '💙' : '⬜'}</span>
            {rarity} Badges
            <span className="font-normal text-purple-400">
              ({byRarity[rarity].filter(b => unlocked.includes(b.id)).length}/{byRarity[rarity].length})
            </span>
          </h3>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          >
            {byRarity[rarity].map((badge) => {
              const isUnlocked = unlocked.includes(badge.id);
              return (
                <motion.div
                  key={badge.id}
                  variants={item}
                  whileHover={isUnlocked ? { scale: 1.04, y: -3 } : {}}
                  className="glass p-4 flex flex-col items-center text-center gap-2 relative overflow-hidden"
                  style={{
                    border: `1px solid ${isUnlocked ? RARITY_BORDER[rarity] : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: isUnlocked ? `0 0 20px ${RARITY_GLOW[rarity]}` : 'none',
                    opacity: isUnlocked ? 1 : 0.5,
                  }}
                >
                  {isUnlocked && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 50% 0%, ${RARITY_GLOW[rarity]}, transparent 70%)`,
                      }}
                    />
                  )}
                  <div className={`text-3xl relative z-10 ${isUnlocked ? '' : 'grayscale'}`}>
                    {isUnlocked ? badge.icon : <Lock size={24} className="text-purple-500/50" />}
                  </div>
                  <div className="relative z-10">
                    <div className={`text-sm font-semibold ${isUnlocked ? 'text-white' : 'text-purple-500'}`}>
                      {badge.name}
                    </div>
                    <div className="text-xs text-purple-400 mt-0.5 leading-snug">
                      {isUnlocked ? badge.description : badge.condition}
                    </div>
                  </div>
                  {isUnlocked && (
                    <div className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${RARITY_COLORS[rarity]} text-white font-medium relative z-10`}>
                      Unlocked!
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      ))}
    </div>
  );
}
