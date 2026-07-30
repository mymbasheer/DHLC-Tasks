import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

// Task type priority order and flag config
const TASK_TYPE_ORDER: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Normal: 3, Regular: 3 };

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

export const MyTasks: React.FC = () => {
  const {
    currentTab,
    userRole,
    user,
    todayDateKey,
    setTodayDateKey,
    filteredMyTasks,
    setShowCreateTaskModal,
    setShowBroadcastModal,
    hasUnreadComments,
    taskStatusClass,
    taskStatusName,
    openTaskDetails,
    cycleStatus,
    showToast,
    assignableUsers
  } = useApp();

  const [activeStatsFilter, setActiveStatsFilter] = useState<'Active' | 'All' | 'Pending' | 'In_Progress' | 'Completed'>('Active');

  if (currentTab !== 'tasks') return null;

  const canCreate = userRole === 'Admin' || user?.permissions?.canCreateTasks;

  // Filter by status, then sort by task type priority
  const displayedTasks = filteredMyTasks
    .filter(t => {
      if (activeStatsFilter === 'Active') return t.status !== 'Completed';
      if (activeStatsFilter === 'All') return true;
      return t.status === activeStatsFilter;
    })
    .sort((a, b) => {
      const aOrder = TASK_TYPE_ORDER[a.taskType] ?? 3;
      const bOrder = TASK_TYPE_ORDER[b.taskType] ?? 3;
      return aOrder - bOrder;
    });

  const handleReassign = async (task: any, newAssigneeId: string) => {
    if (!newAssigneeId) return;
    try {
      const assigneeObj = assignableUsers.find(u => u.uid === newAssigneeId);
      const assigneeName = assigneeObj ? assigneeObj.name : 'Unknown';
      const taskRef = doc(db, 'tasks', task.taskId);
      await setDoc(taskRef, {
        assignedTo: newAssigneeId,
        assignedToName: assigneeName,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showToast('Task reassigned successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to reassign task', 'error');
    }
  };

  const handleFollowUp = async (task: any, newDateStr: string) => {
    if (!newDateStr) return;
    try {
      const taskRef = doc(db, 'tasks', task.taskId);
      await setDoc(taskRef, {
        dateKey: newDateStr,
        dueDate: newDateStr + 'T' + (task.dueDate ? task.dueDate.split('T')[1] : '12:00'),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showToast('Task follow-up date updated', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update follow-up date', 'error');
    }
  };

  const renderTaskCard = (task: any) => {
    if (!task) return null;
    const hasUnread = typeof hasUnreadComments === 'function' ? hasUnreadComments(task) : false;
    const typeKey = task.taskType || 'Normal';
    const typeConfig = TASK_TYPE_CONFIG[typeKey] || TASK_TYPE_CONFIG['Normal'];
    const cardBorder = hasUnread
      ? 'border-rose-500 bg-rose-500/5 shadow-lg shadow-rose-500/5'
      : CARD_BORDER[typeKey] || CARD_BORDER['Normal'];

    // First comment = original task message
    const allComments = task.comments || [];
    const firstComment = allComments.length > 0 ? allComments[0] : null;
    const taskMessage = firstComment?.text || '';
    const voiceUrl = firstComment?.voiceUrl || '';
    const imageUrl = firstComment?.imageUrl || '';

    // Follow-up messages = comments after the first (added by admin/owner after task creation)
    const followUpComments = allComments.slice(1).filter((c: any) => c.authorId !== task.assignedTo);
    const hasFollowUps = followUpComments.length > 0;

    return (
      <div
        key={task.taskId}
        className={`glass rounded-xl p-5 space-y-4 transition-all duration-200 border ${cardBorder}`}
      >
        {/* Task Header */}
        <div className="flex flex-col space-y-2 text-left">
          <div className="flex items-center justify-between">
            {typeKey !== 'Regular' && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border} ${typeConfig.pulse ? 'animate-pulse' : ''}`}>
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

          <div className="text-[10px] text-slate-400 font-medium flex flex-wrap gap-2 items-center">
            <div>Assigned Date: <span className="text-slate-200 font-bold">{task.dateKey || 'Not Set'}</span></div>
            {task.assignedDepartmentName && (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                🏢 {task.assignedDepartmentName}
              </span>
            )}
          </div>
        </div>

        {/* Task Content / Description */}
        <div className="border-t border-slate-900 pt-3 space-y-3 text-left">
          {taskMessage && (
            <p className="text-sm text-slate-300 bg-slate-950/30 rounded-xl p-3 border border-slate-900 leading-relaxed">
              {taskMessage}
            </p>
          )}

          {/* Voice Player */}
          {voiceUrl && (
            <div className="space-y-1 bg-slate-950/20 p-2.5 border border-slate-900 rounded-xl">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">🎤 Voice Message</span>
              <audio src={voiceUrl} controls className="w-full h-8 text-xs bg-slate-950 rounded-lg p-1 border border-slate-800" />
            </div>
          )}

          {/* Image Attachment */}
          {imageUrl && (
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">🖼️ Photo Attachment</span>
              <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="inline-block relative rounded-xl overflow-hidden border border-slate-850 hover:border-slate-700 transition-colors">
                <img src={imageUrl} alt="Attached" className="max-w-[200px] h-32 object-cover" />
              </a>
            </div>
          )}

          {/* Follow-up messages — shown only for incomplete tasks */}
          {hasFollowUps && task.status !== 'Completed' && (
            <div className="bg-amber-500/5 border border-amber-500/25 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 text-xs">📋</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Follow-Up Messages ({followUpComments.length})
                </span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {followUpComments.map((c: any) => (
                  <div key={c.commentId} className="bg-slate-900/60 border border-amber-500/10 rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="font-bold text-amber-400">{c.authorName}</span>
                      <span className="text-slate-500">{new Date(c.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                    {c.text && <p className="text-xs text-slate-200">{c.text}</p>}
                    {c.voiceUrl && (
                      <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded border border-slate-800">
                        <span className="text-[9px] text-amber-400">🎤</span>
                        <audio src={c.voiceUrl} controls className="h-5 flex-grow text-xs" />
                      </div>
                    )}
                    {c.imageUrl && (
                      <a href={c.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-block rounded overflow-hidden border border-slate-800">
                        <img src={c.imageUrl} alt="Follow-up" className="max-w-[120px] h-16 object-cover" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Inline Assignment & Follow-up Controls */}
        <div className="border-t border-slate-900 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left text-xs">
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Reassign Task</label>
            <select
              value={task.assignedTo || ''}
              onChange={(e) => handleReassign(task, e.target.value)}
              className="w-full bg-slate-955 border border-slate-850 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="">-- Choose User --</option>
              {assignableUsers.map((u: any) => (
                <option key={u.uid} value={u.uid}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Follow-up / Move Date</label>
            <input
              type="date"
              value={task.dateKey || ''}
              onChange={(e) => handleFollowUp(task, e.target.value)}
              className="w-full bg-slate-955 border border-slate-850 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-3 border-t border-slate-900 flex items-center justify-between gap-3 text-xs">
          <button
            onClick={() => cycleStatus && cycleStatus(task)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              task.status === 'Completed'
                ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30'
                : task.status === 'In_Progress'
                ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            Status: {taskStatusName ? taskStatusName(task.status) : task.status}
          </button>

          <button
            onClick={() => openTaskDetails && openTaskDetails(task)}
            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-semibold transition-colors cursor-pointer shadow-sm"
          >
            Open Task & Chat 💬
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-left">
          <h2 className="text-xl font-bold font-sans">My Tasks Board</h2>
          <p className="text-xs text-slate-400">View tasks and work orders assigned to you or your department</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <span className="text-slate-400 px-2 font-medium">Date:</span>
            <input
              type="date"
              value={todayDateKey}
              onChange={(e) => setTodayDateKey(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none px-2 py-1 font-mono"
            />
          </div>

          {canCreate && (
            <button
              onClick={() => setShowCreateTaskModal(true)}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-brand-600/20 flex items-center space-x-1.5"
            >
              <span>+ Create Task</span>
            </button>
          )}
          {userRole === 'Admin' && (
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-indigo-600/20 flex items-center space-x-1.5"
              title="Send Broadcast Announcement"
            >
              <span>📢 Broadcast</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-800/60 text-xs">
        <button
          onClick={() => setActiveStatsFilter('Active')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeStatsFilter === 'Active'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          Active Tasks ({filteredMyTasks.filter(t => t.status !== 'Completed').length})
        </button>
        <button
          onClick={() => setActiveStatsFilter('Pending')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeStatsFilter === 'Pending'
              ? 'bg-slate-800 text-slate-200 shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          Pending ({filteredMyTasks.filter(t => t.status === 'Pending').length})
        </button>
        <button
          onClick={() => setActiveStatsFilter('In_Progress')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeStatsFilter === 'In_Progress'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          In Progress ({filteredMyTasks.filter(t => t.status === 'In_Progress').length})
        </button>
        <button
          onClick={() => setActiveStatsFilter('Completed')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeStatsFilter === 'Completed'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          Completed ({filteredMyTasks.filter(t => t.status === 'Completed').length})
        </button>
        <button
          onClick={() => setActiveStatsFilter('All')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeStatsFilter === 'All'
              ? 'bg-slate-700 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          All Tasks ({filteredMyTasks.length})
        </button>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedTasks.map(renderTaskCard)}
      </div>

      {displayedTasks.length === 0 && (
        <div className="p-12 text-center text-slate-500 text-xs bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed space-y-2">
          <p className="text-base font-semibold text-slate-400">No tasks found for this selection.</p>
          <p className="text-xs text-slate-500">Change the date or status filter above to view other tasks.</p>
        </div>
      )}
    </div>
  );
};
