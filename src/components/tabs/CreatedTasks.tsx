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
    userRole,
    departmentsList
  } = useApp();

  const [activeStatsFilter, setActiveStatsFilter] = useState<'Active' | 'All' | 'Pending' | 'In_Progress' | 'Completed'>('Active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('');

  if (currentTab !== 'created_tasks') return null;

  // Filter tasks created by this user
  const myCreatedTasks = createdTasks.filter(t => t.createdBy === user?.uid);

  const displayedTasks = myCreatedTasks
    .filter(t => {
      if (selectedDeptFilter) {
        if (selectedDeptFilter === 'unassigned') {
          if (t.assignedDepartmentId) return false;
        } else {
          if (t.assignedDepartmentId !== selectedDeptFilter) return false;
        }
      }
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

  // Group displayed created tasks by Department
  const groupedTasksByDepartment = (() => {
    const map = new Map<string, { deptName: string; tasks: any[] }>();
    departmentsList.forEach(d => {
      map.set(d.departmentId, { deptName: d.departmentName, tasks: [] });
    });
    map.set('general', { deptName: 'General / Direct Tasks', tasks: [] });

    displayedTasks.forEach(t => {
      const dId = t.assignedDepartmentId && map.has(t.assignedDepartmentId) ? t.assignedDepartmentId : 'general';
      map.get(dId)!.tasks.push(t);
    });

    return Array.from(map.values()).filter(g => g.tasks.length > 0);
  })();

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
      {/* Official Print Header */}
      <div className="hidden print:block mb-6 border-b-2 border-black pb-4 text-black text-left">
        <h1 className="text-2xl font-bold uppercase tracking-wider">DHLC Tasks — Created Tasks Desk Master Report</h1>
        <p className="text-xs mt-1">Creator / Admin: <strong>{user?.name || user?.email}</strong> | Generated: {new Date().toLocaleString()} | Total Tasks: {displayedTasks.length}</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="text-left">
          <h2 className="text-xl font-bold font-sans">Created Tasks Desk</h2>
          <p className="text-xs text-slate-400">Manage and update tasks created by you</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
          >
            <option value="">All Departments</option>
            {departmentsList.map(d => (
              <option key={d.departmentId} value={d.departmentId}>🏢 {d.departmentName}</option>
            ))}
            <option value="unassigned">General / Unassigned</option>
          </select>

          <input
            type="text"
            placeholder="Search created tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500 w-full sm:w-56"
          />

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center space-x-1.5"
          >
            <span>🖨️ Print Created Tasks</span>
          </button>

          <button
            onClick={() => setShowCreateTaskModal(true)}
            className="h-9 px-4 flex items-center justify-center bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-xs transition-all duration-200 shadow-lg shadow-brand-500/10 cursor-pointer whitespace-nowrap"
          >
            + Create Task
          </button>
          {userRole === 'Admin' && (
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="h-9 px-4 flex items-center justify-center bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition-all duration-200 shadow-lg shadow-rose-500/10 cursor-pointer whitespace-nowrap"
            >
              📢 Broadcast Alert
            </button>
          )}
        </div>
      </div>

      {/* Stats Filter Cards */}
      <div className="grid grid-cols-4 gap-2 md:gap-4 text-left print:hidden">
        <div
          onClick={() => setActiveStatsFilter('Active')}
          className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${
            activeStatsFilter === 'Active' ? 'bg-brand-600/20 border-brand-500 shadow-lg' : 'glass border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] sm:text-xs text-slate-400 font-medium block">Active Tasks</span>
          <span className="text-lg sm:text-2xl font-bold text-slate-100 mt-1 block">
            {myCreatedTasks.filter(t => t.status !== 'Completed').length}
          </span>
        </div>

        <div
          onClick={() => setActiveStatsFilter('Pending')}
          className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${
            activeStatsFilter === 'Pending' ? 'bg-slate-800 border-slate-600 shadow-lg' : 'glass border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] sm:text-xs text-slate-400 font-medium block">Pending</span>
          <span className="text-lg sm:text-2xl font-bold text-slate-300 mt-1 block">
            {myCreatedTasks.filter(t => t.status === 'Pending').length}
          </span>
        </div>

        <div
          onClick={() => setActiveStatsFilter('In_Progress')}
          className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${
            activeStatsFilter === 'In_Progress' ? 'bg-blue-600/20 border-blue-500 shadow-lg' : 'glass border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] sm:text-xs text-blue-400 font-medium block">In Progress</span>
          <span className="text-lg sm:text-2xl font-bold text-blue-300 mt-1 block">
            {myCreatedTasks.filter(t => t.status === 'In_Progress').length}
          </span>
        </div>

        <div
          onClick={() => setActiveStatsFilter('Completed')}
          className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${
            activeStatsFilter === 'Completed' ? 'bg-emerald-600/20 border-emerald-500 shadow-lg' : 'glass border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] sm:text-xs text-emerald-400 font-medium block">Completed</span>
          <span className="text-lg sm:text-2xl font-bold text-emerald-300 mt-1 block">
            {myCreatedTasks.filter(t => t.status === 'Completed').length}
          </span>
        </div>
      </div>

      {/* Screen Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 print:hidden">
        {displayedTasks.map(renderTaskCard)}
      </div>

      {/* Print View: Grouped by Department */}
      <div className="hidden print:block space-y-6 text-left">
        {groupedTasksByDepartment.map(group => (
          <div key={group.deptName} className="space-y-2">
            <h3 className="text-base font-bold uppercase tracking-wider text-black border-b-2 border-black pb-1">
              🏢 Department: {group.deptName} ({group.tasks.length} Tasks)
            </h3>
            <table className="w-full text-left text-xs border-collapse border border-black text-black">
              <thead>
                <tr className="bg-gray-200 border-b border-black">
                  <th className="p-2 border border-black">Work Order Title</th>
                  <th className="p-2 border border-black">Assigned To</th>
                  <th className="p-2 border border-black">Urgency</th>
                  <th className="p-2 border border-black">Status</th>
                  <th className="p-2 border border-black">Due Date</th>
                  <th className="p-2 border border-black">Instructions / Message</th>
                </tr>
              </thead>
              <tbody>
                {group.tasks.map((t: any) => {
                  const firstComm = t.comments && t.comments.length > 0 ? t.comments[0] : null;
                  const msg = firstComm?.text || t.taskMessage || 'No text description';
                  return (
                    <tr key={t.taskId} className="border-b border-black">
                      <td className="p-2 border border-black font-bold">{t.taskTitle}</td>
                      <td className="p-2 border border-black">{t.assignedToName || 'Department Group'}</td>
                      <td className="p-2 border border-black">{t.urgency}</td>
                      <td className="p-2 border border-black font-semibold">{t.status}</td>
                      <td className="p-2 border border-black font-mono">{t.dueDate ? new Date(t.dueDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'None'}</td>
                      <td className="p-2 border border-black whitespace-pre-wrap">{msg}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {displayedTasks.length === 0 && (
        <div className="p-12 text-center text-slate-500 text-xs bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed space-y-2 print:hidden">
          <p className="text-base font-semibold text-slate-400">No tasks created under this status filter.</p>
        </div>
      )}


    </div>
  );
};
