import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import type { AppStore } from '../store/useAppStore';

const SHORTCUTS = [
  { keys: ['N'], desc: 'New Quest', group: 'Navigation' },
  { keys: ['D'], desc: 'Dashboard', group: 'Navigation' },
  { keys: ['T'], desc: 'My Quests', group: 'Navigation' },
  { keys: ['C'], desc: 'Calendar', group: 'Navigation' },
  { keys: ['A'], desc: 'Achievements', group: 'Navigation' },
  { keys: ['?'], desc: 'Toggle this help', group: 'Navigation' },
  { keys: ['Esc'], desc: 'Close modal / help', group: 'Modal' },
  { keys: ['⌘', 'Enter'], desc: 'Submit form', group: 'Modal' },
  { keys: ['Tab'], desc: 'Next field', group: 'Modal' },
];

const GROUPS = ['Navigation', 'Modal'];

function Kbd({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-mono font-bold"
      style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0' }}>
      {children}
    </span>
  );
}

interface Props {
  store: AppStore;
}

export function KeyboardShortcuts({ store }: Props) {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // Always handle Escape
      if (e.key === 'Escape') {
        if (store.showAddModal) { store.closeAddModal(); return; }
        if (showHelp) { setShowHelp(false); return; }
      }

      // Cmd/Ctrl + Enter: submit the active form
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        const form = document.querySelector('form');
        if (form) {
          form.requestSubmit();
          e.preventDefault();
        }
        return;
      }

      // Skip global shortcuts when typing in fields
      if (isInput || store.showAddModal) return;

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          store.openAddModal();
          break;
        case 'd':
          store.setView('dashboard');
          break;
        case 't':
          store.setView('todos');
          break;
        case 'c':
          store.setView('calendar');
          break;
        case 'a':
          store.setView('achievements');
          break;
        case '?':
          setShowHelp((v) => !v);
          break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [store, showHelp]);

  return (
    <>
      {/* Floating hint button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowHelp((v) => !v)}
        title="Keyboard shortcuts (?)"
        className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full flex items-center justify-center text-purple-300 hover:text-white transition-all cursor-pointer"
        style={{
          background: 'rgba(124,58,237,0.25)',
          border: '1px solid rgba(139,92,246,0.35)',
          boxShadow: '0 4px 16px rgba(139,92,246,0.25)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Keyboard size={18} />
      </motion.button>

      {/* Help modal */}
      <AnimatePresence>
        {showHelp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelp(false)}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="w-full max-w-sm glass p-6 pointer-events-auto"
                style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Keyboard size={16} className="text-purple-400" />
                    Keyboard Shortcuts
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowHelp(false)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-purple-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <X size={14} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  {GROUPS.map((group) => (
                    <div key={group}>
                      <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">{group}</div>
                      <div className="space-y-1.5">
                        {SHORTCUTS.filter((s) => s.group === group).map((sc) => (
                          <div key={sc.desc} className="flex items-center justify-between gap-4">
                            <span className="text-sm text-purple-200">{sc.desc}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              {sc.keys.map((k) => <Kbd key={k}>{k}</Kbd>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-purple-500 mt-5 text-center">
                  Press <Kbd>?</Kbd> anytime to toggle this panel
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
