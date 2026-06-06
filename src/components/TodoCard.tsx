import { motion } from 'framer-motion';
import { Trash2, Edit3, Check, RotateCcw, Calendar, Zap } from 'lucide-react';
import type { Todo } from '../types';
import { format, isToday, parseISO } from 'date-fns';

interface Props {
  todo: Todo;
  onComplete: () => void;
  onUncomplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  work: '💼',
  personal: '🏠',
  health: '💪',
  learning: '📚',
  other: '✨',
};

const PRIORITY_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: 'High', color: '#fca5a5', bg: 'rgba(239,68,68,0.15)' },
  medium: { label: 'Medium', color: '#fde68a', bg: 'rgba(245,158,11,0.15)' },
  low: { label: 'Low', color: '#86efac', bg: 'rgba(34,197,94,0.15)' },
};

export function TodoCard({ todo, onComplete, onUncomplete, onDelete, onEdit }: Props) {
  const done = todo.status === 'completed';
  const priority = PRIORITY_LABEL[todo.priority];
  const isOverdue = !done && todo.dueDate && todo.dueDate < new Date().toISOString().split('T')[0];
  const isDueToday = !done && todo.dueDate && isToday(parseISO(todo.dueDate));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      whileHover={{ y: -2 }}
      className={`glass glass-hover p-4 relative overflow-hidden ${done ? '' : `priority-${todo.priority}`}`}
    >
      {/* Shimmer on hover (done via CSS) */}
      {done && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.15)' }} />
      )}

      <div className="flex items-start gap-3 relative z-10">
        {/* Checkbox */}
        <motion.button
          whileTap={{ scale: 0.75 }}
          onClick={done ? onUncomplete : onComplete}
          className="mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer"
          style={{
            borderColor: done ? '#a855f7' : priority.color,
            background: done ? 'rgba(168,85,247,0.3)' : 'transparent',
          }}
        >
          {done && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="check-pop">
              <Check size={12} className="text-purple-200" />
            </motion.div>
          )}
        </motion.button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <span className={`font-medium text-sm leading-snug ${done ? 'todo-item-complete text-purple-300' : 'text-white'}`}>
              {todo.title}
            </span>
            <span className="text-base">{CATEGORY_ICONS[todo.category]}</span>
          </div>

          {todo.description && (
            <p className={`text-xs mt-1 leading-relaxed ${done ? 'text-purple-400/50' : 'text-purple-300'}`}>
              {todo.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Priority badge */}
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: priority.bg, color: priority.color }}>
              {priority.label}
            </span>

            {/* Due date */}
            {todo.dueDate && (
              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                isOverdue
                  ? 'text-red-300'
                  : isDueToday
                  ? 'text-yellow-300'
                  : 'text-purple-300'
              }`}
                style={{
                  background: isOverdue
                    ? 'rgba(239,68,68,0.12)'
                    : isDueToday
                    ? 'rgba(234,179,8,0.12)'
                    : 'rgba(255,255,255,0.06)',
                }}>
                <Calendar size={10} />
                {isOverdue ? 'Overdue · ' : isDueToday ? 'Today · ' : ''}
                {format(parseISO(todo.dueDate), 'MMM d')}
              </span>
            )}

            {/* XP reward */}
            {!done && (
              <span className="flex items-center gap-1 text-xs text-yellow-400/70">
                <Zap size={10} />
                {todo.xpReward} XP
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {!done && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onEdit}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-purple-400 hover:text-purple-200 hover:bg-white/10 transition-all cursor-pointer"
            >
              <Edit3 size={13} />
            </motion.button>
          )}
          {done && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onUncomplete}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-purple-400 hover:text-purple-200 hover:bg-white/10 transition-all cursor-pointer"
            >
              <RotateCcw size={13} />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
          >
            <Trash2 size={13} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
