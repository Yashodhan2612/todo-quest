import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import type { AppStore } from '../store/useAppStore';
import { TodoCard } from './TodoCard';

const PRIORITY_OPTIONS = ['all', 'high', 'medium', 'low'] as const;
const CATEGORY_OPTIONS = ['all', 'meeting', 'documentation', 'testing', 'distribution', 'research', 'prototyping'] as const;
const STATUS_OPTIONS = ['all', 'active', 'completed'] as const;

export function TodoList({ store }: { store: AppStore }) {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const todos = store.filteredTodos.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...todos].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (a.priority !== b.priority) return priorityOrder[a.priority] - priorityOrder[b.priority];
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">My Quests</h2>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={store.openAddModal}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 4px 16px rgba(139,92,246,0.4)' }}
        >
          + New Quest
        </motion.button>
      </div>

      {/* Search + filter bar */}
      <div className="glass p-3 flex items-center gap-3">
        <Search size={16} className="text-purple-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search quests..."
          className="flex-1 bg-transparent text-sm text-white placeholder-purple-400/60 border-none outline-none"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${showFilters ? 'text-purple-200 bg-purple-500/20' : 'text-purple-400 hover:text-purple-200 hover:bg-white/5'}`}
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass p-4 space-y-3">
              <FilterRow
                label="Status"
                options={STATUS_OPTIONS}
                selected={store.filters.status}
                onChange={(v) => store.setFilters({ status: v as typeof store.filters.status })}
              />
              <FilterRow
                label="Priority"
                options={PRIORITY_OPTIONS}
                selected={store.filters.priority}
                onChange={(v) => store.setFilters({ priority: v as typeof store.filters.priority })}
              />
              <FilterRow
                label="Category"
                options={CATEGORY_OPTIONS}
                selected={store.filters.category}
                onChange={(v) => store.setFilters({ category: v as typeof store.filters.category })}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats row */}
      <div className="flex gap-2 text-xs text-purple-300">
        <span className="px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {store.todos.filter(t => t.status === 'active').length} active
        </span>
        <span className="px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {store.todos.filter(t => t.status === 'completed').length} completed
        </span>
        <span className="px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {store.todos.filter(t => t.dueDate && t.dueDate < new Date().toISOString().split('T')[0] && t.status === 'active').length} overdue
        </span>
      </div>

      {/* Todo list */}
      <AnimatePresence mode="popLayout">
        {sorted.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass text-center py-16"
          >
            <div className="text-4xl mb-3">🗡️</div>
            <div className="text-white font-medium">No quests found</div>
            <div className="text-purple-400 text-sm mt-1">Add a new quest to begin your adventure!</div>
          </motion.div>
        ) : (
          sorted.map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onComplete={() => store.completeTodo(todo.id)}
              onUncomplete={() => store.uncompleteTodo(todo.id)}
              onDelete={() => store.deleteTodo(todo.id)}
              onEdit={() => store.startEditing(todo.id)}
            />
          ))
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterRow({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly string[];
  selected: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-purple-400 w-16 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`text-xs px-2.5 py-1 rounded-full capitalize transition-all cursor-pointer ${
              selected === opt
                ? 'text-white'
                : 'text-purple-400 hover:text-purple-200'
            }`}
            style={
              selected === opt
                ? { background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 0 10px rgba(139,92,246,0.3)' }
                : { background: 'rgba(255,255,255,0.05)' }
            }
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
