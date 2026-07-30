import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const TASK_TYPE_ORDER: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Normal: 3 };

const TASK_TYPE_CONFIG: Record<string, { flag: string; color: string; bg: string; border: string; pulse?: boolean }> = {
  Normal:  { flag: '🟢', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  Medium:  { flag: '🟡', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
  High:    { flag: '🟠', color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20'  },
  Urgent:  { flag: '🔴', color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20', pulse: true },
};

const CARD_BORDER: Record<string, string> = {
  Urgent:  'border-rose-500/80 bg-rose-950/10 shadow-lg shadow-rose-950/20',
  High:    'border-orange-500/60 bg-orange-950/5 shadow-md shadow-orange-950/10',
  Medium:  'border-amber-500/40 bg-amber-950/5',
  Normal:  'border-slate-800 hover:border-slate-700',
};

export const CreatedTasks: React.FC = () => {
  const {
    currentTab,
    createdTasks,
    setShowCreateTaskModal,
    taskStatusClass,
    taskStatusName,
    openTaskDetails,
    deleteTask,
    user,
    setShowBroadcastModal,
    userRole
  } = useApp();

  const [activeStatsFilter, setActiveStatsFilter] = useState<'Active' | 'All' | 'Pending' | 'In_Progress' | 'Completed'>('Active');
  const [searchTerm, setSearchTerm] = useState('');

  if (currentTab !== 'created_tasks') return null;

  // Filter tasks created by this user
  const myCreatedTasks = createdTasks.filter(t => t.createdBy === user?.uid);

  const displayedTasks = myCreatedTasks
    .filter(t => {
      if (activeStatsFilter === 'Active') return t.status !== 'Completed';
      if (activeStatsFilter === 'All') return true;
      return t.status === activeStatsFilter;
    })
    .filter(t => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        t.taskTitle.toLowerCase().includes(term) ||
        (t.assignedToName && t.assignedToName.toLowerCase().includes(term)) ||
        (t.comments?.[0]?.text && t.comments[0].text.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => {
      const aOrder = TASK_TYPE_ORDER[a.taskType] ?? 3;
      const bOrder = TASK_TYPE_ORDER[b.taskType] ?? 3;
      return aOrder - bOrder;
    });

  const renderTaskCard = (task: any) => {
    if (!task) return null;
    const typeKey = task.taskType || 'Normal';
    const typeConfig = TASK_TYPE_CONFIG[typeKey] || TASK_TYPE_CONFIG['Normal'];
    const cardBorder = CARD_BORDER[typeKey] || CARD_BORDER['Normal'];

    const allComments = task.comments || [];
    const firstComment = allComments.length > 0 ? allComments[0] : null;
    const taskMessage = firstComment?.text || '';
    const voiceUrl = firstComment?.voiceUrl || '';
    const imageUrl = firstComment?.imageUrl || '';

    return (
      <div
        key={task.taskId}
        className={`glass rounded-xl p-5 space-y-4 transition-all duration-200 border ${cardBorder}`}
      >
        <div className="flex flex-col space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border} ${typeConfig.pulse ? 'animate-pulse' : ''}`}>
              <span>{typeConfig.flag}</span>
              <span>{typeKey}</span>
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${taskStatusClass ? taskStatusClass(task.status) : ''}`}>
              {taskStatusName ? taskStatusName(task.status) : task.status}
            </span>
          </div>

          <div className="flex items-start justify-between mt-1">
            <h3 className="text-base font-bold text-slate-100">{task.taskTitle}</h3>
          </div>

          <div className="text-[10px] text-slate-400 font-medium space-y-1">
            <div>Assigned To: <span className="text-slate-200 font-bold">{task.assignedToName || (task.assignedDepartmentName ? `Department: ${task.assignedDepartmentName}` : 'Unassigned')}</span></div>
            {task.assignedDepartmentName && (
              <div>Department: <span className="text-emerald-400 font-bold">🏢 {task.assignedDepartmentName}</span></div>
            )}
            <div>Due Date: <span className="text-slate-200 font-bold">{task.dateKey || 'Not Set'}</span></div>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-3 space-y-3 text-left">
          {taskMessage && (
            <p className="text-sm text-slate-350 bg-slate-950/30 rounded-xl p-3 border border-slate-900 leading-relaxed truncate max-h-16">
              {taskMessage}
            </p>
          )}

          {voiceUrl && (
            <div className="flex items-center space-x-1.5 text-xs text-brand-400">
              🎤 Voice instructions attached
            </div>
          )}

          {imageUrl && (
            <div className="flex items-center space-x-1.5 text-xs text-brand-400">
              🖼️ Photo attachment attached
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-900 flex items-center justify-between gap-3 text-xs">
          <button onClick={() => openTaskDetails && openTaskDetails(task)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors cursor-pointer">
            View & Edit Details
          </button>
          <button onClick={() => deleteTask && deleteTask(task.taskId)} className="px-3 py-1.5 bg-rose-900/40 hover:bg-rose-900/60 text-rose-350 rounded-lg font-medium transition-colors cursor-pointer border border-rose-900/30">
            Delete Task
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-left">
          <h2 className="text-xl font-bold font-sans">Created Tasks Desk</h2>
          <p className="text-xs text-slate-400">Manage and update tasks created by you</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            placeholder="Search created tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-brand-500 w-full sm:w-64"
          />
          <button
            onClick={() => setShowCreateTaskModal(true)}
            className="h-10 px-4 flex items-center justify-center bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-brand-500/10 cursor-pointer whitespace-nowrap"
          >
            + Create Task
          </button>
          {userRole === 'Admin' && (
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="h-10 px-4 flex items-center justify-center bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all duration-200 shadow-lg shadow-rose-500/10 cursor-pointer whitespace-nowrap"
            >
              📢 Broadcast Alert
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 md:gap-4 text-left">
        <div
          onClick={() => setActiveStatsFilter('All')}
          className={`glass p-4 rounded-xl cursor-pointer hover:border-brand-500/50 transition-colors ${
            activeStatsFilter === 'All' ? 'border-brand-500 bg-brand-500/5' : ''
          }`}
        >
          <span className="text-[10px] text-slate-400 uppercase font-semibold">All Created</span>
          <h3 className="text-2xl font-bold text-slate-100 mt-1">
            {myCreatedTasks.length}
          </h3>
        </div>
        <div
          onClick={() => setActiveStatsFilter(activeStatsFilter === 'Pending' ? 'Active' : 'Pending')}
          className={`glass p-4 rounded-xl cursor-pointer hover:border-brand-500/50 transition-colors ${
            activeStatsFilter === 'Pending' ? 'border-brand-500 bg-brand-500/5' : ''
          }`}
        >
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Not Started</span>
          <h3 className="text-2xl font-bold text-slate-100 mt-1">
            {myCreatedTasks.filter(t => t.status === 'Pending').length}
          </h3>
        </div>
        <div
          onClick={() => setActiveStatsFilter(activeStatsFilter === 'In_Progress' ? 'Active' : 'In_Progress')}
          className={`glass p-4 rounded-xl cursor-pointer hover:border-brand-500/50 transition-colors ${
            activeStatsFilter === 'In_Progress' ? 'border-brand-500 bg-brand-500/5' : ''
          }`}
        >
          <span className="text-[10px] text-slate-400 uppercase font-semibold">In Progress</span>
          <h3 className="text-2xl font-bold text-slate-100 mt-1">
            {myCreatedTasks.filter(t => t.status === 'In_Progress').length}
          </h3>
        </div>
        <div className={`glass p-4 rounded-xl transition-colors border-slate-800 opacity-80`}>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Completed</span>
          <h3 className="text-2xl font-bold text-emerald-500 mt-1">
            {myCreatedTasks.filter(t => t.status === 'Completed').length}
          </h3>
        </div>
      </div>

      {displayedTasks.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center text-slate-500">
          No active tasks matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedTasks.map(t => renderTaskCard(t))}
        </div>
      )}


    </div>
  );
};
