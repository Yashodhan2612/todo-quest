import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import type { AppStore } from '../store/useAppStore';
import type { Todo } from '../types';

const PRIORITY_DOT: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

export function CalendarView({ store }: { store: AppStore }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const todosWithDue = store.todos.filter((t) => t.dueDate);

  function getTodosForDay(day: Date) {
    return todosWithDue.filter((t) => t.dueDate && isSameDay(parseISO(t.dueDate), day));
  }

  const selectedDayTodos = selectedDay ? getTodosForDay(selectedDay) : [];

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">Calendar</h2>

      <div className="glass p-5">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1))}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-purple-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <ChevronLeft size={18} />
          </motion.button>
          <h3 className="text-lg font-bold text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1))}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-purple-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <ChevronRight size={18} />
          </motion.button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-purple-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayTodos = getTodosForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
            const todayDay = isToday(day);
            return (
              <motion.button
                key={day.toISOString()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date('1900-01-01')) ? null : day)}
                className={`cal-day relative rounded-xl py-2 px-1 flex flex-col items-center gap-1 min-h-[56px] cursor-pointer transition-all ${
                  !isCurrentMonth ? 'opacity-30' : ''
                }`}
                style={
                  isSelected
                    ? { background: 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(168,85,247,0.3))', border: '1px solid rgba(139,92,246,0.5)' }
                    : todayDay
                    ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }
                    : { border: '1px solid transparent' }
                }
              >
                <span className={`text-sm font-medium ${todayDay ? 'text-purple-300' : 'text-white'}`}>
                  {format(day, 'd')}
                </span>
                {dayTodos.length > 0 && (
                  <div className="flex gap-0.5 flex-wrap justify-center">
                    {dayTodos.slice(0, 3).map((t) => (
                      <span
                        key={t.id}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: t.status === 'completed' ? '#a855f7' : PRIORITY_DOT[t.priority] }}
                      />
                    ))}
                    {dayTodos.length > 3 && (
                      <span className="text-purple-400 text-xs">+{dayTodos.length - 3}</span>
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected day panel */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="glass p-5"
          >
            <h4 className="font-semibold text-white mb-4">
              {format(selectedDay, 'EEEE, MMMM d')}
              {isToday(selectedDay) && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(139,92,246,0.2)', color: '#c4b5fd' }}>Today</span>
              )}
            </h4>
            {selectedDayTodos.length === 0 ? (
              <div className="text-center py-6 text-purple-400 text-sm">
                <div className="text-2xl mb-2">🗓️</div>
                No quests on this day
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDayTodos.map((todo) => (
                  <CalendarTodoItem
                    key={todo.id}
                    todo={todo}
                    onComplete={() => store.completeTodo(todo.id)}
                    onDelete={() => store.deleteTodo(todo.id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="glass p-4 flex flex-wrap gap-4">
        <span className="text-xs text-purple-300">Legend:</span>
        {[
          { color: '#ef4444', label: 'High priority' },
          { color: '#f59e0b', label: 'Medium priority' },
          { color: '#22c55e', label: 'Low priority' },
          { color: '#a855f7', label: 'Completed' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-purple-300">
            <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarTodoItem({
  todo,
  onComplete,
  onDelete,
}: {
  todo: Todo;
  onComplete: () => void;
  onDelete: () => void;
}) {
  const done = todo.status === 'completed';
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5">
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={!done ? onComplete : undefined}
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer"
        style={{ borderColor: done ? '#a855f7' : PRIORITY_DOT[todo.priority], background: done ? 'rgba(168,85,247,0.25)' : 'transparent' }}
      >
        {done && <span className="text-purple-300 text-xs">✓</span>}
      </motion.button>
      <span className={`flex-1 text-sm ${done ? 'line-through text-purple-400' : 'text-white'}`}>{todo.title}</span>
      <span className="text-xs capitalize px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(255,255,255,0.05)', color: '#a78bfa' }}>
        {todo.priority}
      </span>
      <button onClick={onDelete}
        className="text-red-400/40 hover:text-red-400 transition-colors text-xs cursor-pointer">✕</button>
    </div>
  );
}
