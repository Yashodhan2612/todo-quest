import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface Props {
  amount: number;
  visible: boolean;
  onDone: () => void;
}

export function XpToast({ amount, visible, onDone }: Props) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onDone, 2000);
      return () => clearTimeout(t);
    }
  }, [visible, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: -40, scale: 1 }}
          exit={{ opacity: 0, y: -80, scale: 0.8 }}
          className="fixed bottom-8 right-8 z-50 pointer-events-none"
        >
          <div className="glass px-5 py-3 text-lg font-bold text-yellow-300 flex items-center gap-2"
            style={{ boxShadow: '0 0 24px rgba(250,204,21,0.4)' }}>
            <span>⚡</span>
            <span>+{amount} XP</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface BadgeToastProps {
  badgeIcon: string;
  badgeName: string;
  visible: boolean;
  onDone: () => void;
}

export function BadgeToast({ badgeIcon, badgeName, visible, onDone }: BadgeToastProps) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onDone, 3500);
      return () => clearTimeout(t);
    }
  }, [visible, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-8 right-8 z-50"
        >
          <div className="glass px-5 py-4 flex items-center gap-3"
            style={{ boxShadow: '0 0 32px rgba(167,139,250,0.5)', border: '1px solid rgba(167,139,250,0.4)' }}>
            <motion.span
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              className="text-3xl"
            >
              {badgeIcon}
            </motion.span>
            <div>
              <div className="text-xs text-purple-300 font-medium uppercase tracking-widest">Badge Unlocked!</div>
              <div className="text-white font-bold">{badgeName}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
