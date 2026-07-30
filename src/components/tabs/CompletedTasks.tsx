import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
const TASK_TYPE_CONFIG: Record<string, { flag: string; color: string; bg: string; border: string; pulse?: boolean }> = {
  Normal: { flag: '🟢', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  Medium: { flag: '🟡', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  High: { flag: '🟠', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  Urgent: { flag: '🔴', color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', pulse: true }
};

export const CompletedTasks: React.FC = () => {
  const {
    currentTab,
    myTasks,
    createdTasks,
    user,
    hasUnreadComments,
    taskStatusClass,
    taskStatusName,
    openTaskDetails
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');

  if (currentTab !== 'completed_tasks') return null;

  // Admin sees all completed tasks they created or were assigned to. 
  const myCompletedTasks = myTasks.filter(t => t.status === 'Completed');
  const myCreatedCompletedTasks = createdTasks.filter(t => t.status === 'Completed' && t.createdBy === user?.uid);
  
  // Combine them and deduplicate
  const allRelevantCompleted = [...myCompletedTasks, ...myCreatedCompletedTasks].reduce((acc: any[], current: any) => {
    const x = acc.find((item: any) => item.taskId === current.taskId);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);

  const displayedTasks = allRelevantCompleted
    .filter((t: any) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        t.taskTitle.toLowerCase().includes(term) ||
        (t.assignedToName && t.assignedToName.toLowerCase().includes(term)) ||
        (t.comments?.[0]?.text && t.comments[0].text.toLowerCase().includes(term))
      );
    })
    .sort((a: any, b: any) => {
      const dateA = a.completedAt || a.dateKey || '';
      const dateB = b.completedAt || b.dateKey || '';
      return dateB.localeCompare(dateA);
    });

  const renderTaskCard = (task: any) => {
    const hasUnread = typeof hasUnreadComments === 'function' ? hasUnreadComments(task) : false;
    const typeKey = task.taskType || 'Normal';
    const typeConfig = TASK_TYPE_CONFIG[typeKey] || TASK_TYPE_CONFIG['Normal'];
    const cardBorder = hasUnread
      ? 'border-rose-500 bg-rose-500/5 shadow-lg shadow-rose-500/5'
      : 'border-slate-800 hover:border-slate-700';

    return (
      <div
        key={task.taskId}
        className={`glass rounded-xl p-5 space-y-4 transition-all duration-200 border ${cardBorder}`}
      >
        <div className="flex flex-col space-y-2 text-left">
          <div className="flex items-center justify-between">
            {typeKey !== 'Regular' && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border}`}>
                <span>{typeConfig.flag}</span>
                <span>{typeKey}</span>
              </span>
            )}
            {hasUnread && (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-500 text-white animate-pulse shadow shadow-rose-500/50">
                💬 New Message
              </span>
            )}
          </div>
          <div className="flex items-start justify-between mt-1">
            <h3 className="text-base font-bold text-slate-100">{task.taskTitle}</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${taskStatusClass ? taskStatusClass(task.status) : ''}`}>
              {taskStatusName ? taskStatusName(task.status) : task.status}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium">
            Completed: <span className="text-slate-200 font-bold">{(task.completedAt || task.updatedAt || '').split('T')[0]}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 border-t border-slate-800 pt-4">
          <button onClick={() => openTaskDetails && openTaskDetails(task)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer w-full text-center">
            View Details
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-left">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Completed Tasks History
          </h2>
          <p className="text-xs text-slate-400">All tasks that have been marked as completed</p>
        </div>
        
        <div className="w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search completed tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 placeholder-slate-500"
          />
        </div>
      </div>

      {displayedTasks.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center text-slate-500">
          No completed tasks found in history.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedTasks.map(renderTaskCard)}
        </div>
      )}
    </div>
  );
};
