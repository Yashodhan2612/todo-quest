import { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from './store/useAppStore';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TodoList } from './components/TodoList';
import { CalendarView } from './components/CalendarView';
import { Achievements } from './components/Achievements';
import { AddTodoModal } from './components/AddTodoModal';
import { XpToast, BadgeToast } from './components/XpToast';
import { ALL_BADGES } from './utils/badges';

function Particles({ count = 14 }: { count?: number }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `rgba(${139 + Math.floor(Math.random() * 60)},${92 + Math.floor(Math.random() * 60)},246,${0.3 + Math.random() * 0.4})`,
          }}
          animate={{
            y: [0, -30 - Math.random() * 40, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 6,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function App() {
  const store = useAppStore();

  const [xpToast, setXpToast] = useState({ visible: false, amount: 0 });
  const [badgeToast, setBadgeToast] = useState({ visible: false, icon: '', name: '' });
  const badgeQueue = useRef<{ icon: string; name: string }[]>([]);

  const showNextBadge = useCallback(() => {
    const next = badgeQueue.current.shift();
    if (next) {
      setBadgeToast({ visible: true, ...next });
    }
  }, []);

  const handleCompleteTodo = useCallback(
    (id: string) => {
      const { newBadges, xpGained } = store.completeTodo(id);
      setXpToast({ visible: true, amount: xpGained });
      if (newBadges.length > 0) {
        const toQueue = newBadges.map((bid) => {
          const b = ALL_BADGES.find((x) => x.id === bid);
          return { icon: b?.icon ?? '🏆', name: b?.name ?? bid };
        });
        badgeQueue.current.push(...toQueue);
        setTimeout(showNextBadge, 800);
      }
    },
    [store, showNextBadge]
  );

  const storeWithToasts = { ...store, completeTodo: handleCompleteTodo };

  return (
    <div className="min-h-screen flex">
      <Particles />

      <div className="relative z-10 flex w-full max-w-7xl mx-auto px-4 py-6 gap-6">
        <Sidebar store={storeWithToasts as typeof store} />

        <main className="flex-1 min-w-0 overflow-y-auto pb-6">
          <AnimatePresence mode="wait">
            {store.activeView === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <Dashboard store={storeWithToasts as typeof store} />
              </motion.div>
            )}
            {store.activeView === 'todos' && (
              <motion.div key="todos" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <TodoList store={storeWithToasts as typeof store} />
              </motion.div>
            )}
            {store.activeView === 'calendar' && (
              <motion.div key="calendar" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <CalendarView store={storeWithToasts as typeof store} />
              </motion.div>
            )}
            {store.activeView === 'achievements' && (
              <motion.div key="achievements" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <Achievements store={storeWithToasts as typeof store} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AddTodoModal store={storeWithToasts as typeof store} />

      <XpToast
        amount={xpToast.amount}
        visible={xpToast.visible}
        onDone={() => setXpToast((s) => ({ ...s, visible: false }))}
      />

      <BadgeToast
        badgeIcon={badgeToast.icon}
        badgeName={badgeToast.name}
        visible={badgeToast.visible}
        onDone={() => {
          setBadgeToast((s) => ({ ...s, visible: false }));
          setTimeout(showNextBadge, 300);
        }}
      />
    </div>
  );
}
