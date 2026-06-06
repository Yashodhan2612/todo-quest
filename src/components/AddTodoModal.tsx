import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { AppStore } from '../store/useAppStore';
import type { Priority, Category } from '../types';
import { xpForPriority } from '../utils/badges';

const CATEGORIES: { value: Category; icon: string; label: string }[] = [
  { value: 'meeting', icon: '🤝', label: 'Meeting' },
  { value: 'documentation', icon: '📄', label: 'Docs' },
  { value: 'testing', icon: '🧪', label: 'Testing' },
  { value: 'distribution', icon: '📦', label: 'Distribution' },
  { value: 'research', icon: '🔬', label: 'Research' },
  { value: 'prototyping', icon: '🛠️', label: 'Prototyping' },
];

const PRIORITIES: { value: Priority; label: string; color: string; bg: string }[] = [
  { value: 'high', label: 'High', color: '#fca5a5', bg: 'rgba(239,68,68,0.15)' },
  { value: 'medium', label: 'Medium', color: '#fde68a', bg: 'rgba(245,158,11,0.15)' },
  { value: 'low', label: 'Low', color: '#86efac', bg: 'rgba(34,197,94,0.15)' },
];

export function AddTodoModal({ store }: { store: AppStore }) {
  const isEditing = !!store.editingTodo;
  const editingTodo = store.todos.find((t) => t.id === store.editingTodo);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('research');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (editingTodo) {
      setTitle(editingTodo.title);
      setDescription(editingTodo.description ?? '');
      setPriority(editingTodo.priority);
      setCategory(editingTodo.category);
      setDueDate(editingTodo.dueDate ?? '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setCategory('research');
      setDueDate('');
    }
  }, [editingTodo, store.showAddModal]);

  const xp = xpForPriority(priority);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditing && editingTodo) {
      store.updateTodo(editingTodo.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category,
        dueDate: dueDate || undefined,
        xpReward: xpForPriority(priority),
      });
    } else {
      store.addTodo({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category,
        dueDate: dueDate || undefined,
      });
    }
  }

  return (
    <AnimatePresence>
      {store.showAddModal && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={store.closeAddModal}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="w-full max-w-md glass p-6 relative"
              style={{
                pointerEvents: 'auto',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 48px rgba(139,92,246,0.15)',
                border: '1px solid rgba(139,92,246,0.25)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">
                  {isEditing ? '✏️ Edit Quest' : '⚔️ New Quest'}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={store.closeAddModal}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-purple-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X size={16} />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-xs font-medium text-purple-300 mb-1.5 block">Quest Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What do you need to accomplish?"
                    autoFocus
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-purple-400/50 transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-purple-300 mb-1.5 block">Description (optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add more details..."
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-purple-400/50 resize-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="text-xs font-medium text-purple-300 mb-1.5 block">Priority</label>
                  <div className="flex gap-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPriority(p.value)}
                        className="flex-1 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer"
                        style={{
                          background: priority === p.value ? p.bg : 'rgba(255,255,255,0.04)',
                          color: priority === p.value ? p.color : '#a78bfa',
                          border: `1px solid ${priority === p.value ? p.color + '60' : 'rgba(255,255,255,0.07)'}`,
                          boxShadow: priority === p.value ? `0 0 12px ${p.bg}` : 'none',
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-medium text-purple-300 mb-1.5 block">Category</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCategory(c.value)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer"
                        style={{
                          background: category === c.value ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.04)',
                          color: category === c.value ? '#c4b5fd' : '#a78bfa',
                          border: `1px solid ${category === c.value ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        }}
                      >
                        {c.icon} {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Due date */}
                <div>
                  <label className="text-xs font-medium text-purple-300 mb-1.5 block">Due Date (optional)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>

                {/* XP preview */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.15)' }}>
                  <Zap size={14} className="text-yellow-400" />
                  <span className="text-xs text-yellow-300">
                    Complete this quest to earn <strong>{xp} XP</strong>
                  </span>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={!title.trim()}
                  whileHover={title.trim() ? { scale: 1.02 } : {}}
                  whileTap={title.trim() ? { scale: 0.98 } : {}}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer"
                  style={{
                    background: title.trim()
                      ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                      : 'rgba(255,255,255,0.06)',
                    boxShadow: title.trim() ? '0 4px 20px rgba(139,92,246,0.4)' : 'none',
                    opacity: title.trim() ? 1 : 0.5,
                  }}
                >
                  {isEditing ? 'Save Changes' : '⚔️ Create Quest'}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
