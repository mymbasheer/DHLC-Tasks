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
    masterTasks,
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

  const [adminScope, setAdminScope] = useState<'all' | 'mine'>('all');
  const [targetFilter, setTargetFilter] = useState<'all' | 'individual' | 'department' | 'alerts'>('all');
  const [activeStatsFilter, setActiveStatsFilter] = useState<'Active' | 'All' | 'Pending' | 'In_Progress' | 'Completed'>('Active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('');

  if (currentTab !== 'created_tasks') return null;

  // Determine base tasks pool
  const isAdmin = userRole === 'Admin';
  const baseTasks = (isAdmin && adminScope === 'all')
    ? masterTasks
    : createdTasks.filter(t => t.createdBy === user?.uid);

  // Helper to check alert status on individual tasks
  const getIndividualAlert = (task: any): { isAlert: boolean; label: string; color: string } => {
    // Only alert on non-completed tasks
    if (task.status === 'Completed') return { isAlert: false, label: '', color: '' };
    
    // Check if task is individual (has assignedTo)
    const isIndividual = Boolean(task.assignedTo);
    if (!isIndividual && !task.assignedDepartmentId) return { isAlert: false, label: '', color: '' };

    // 1. Overdue SLA
    if (task.dueDate && new Date(task.dueDate).getTime() < Date.now()) {
      return { 
        isAlert: true, 
        label: '🚨 OVERDUE SLA', 
        color: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' 
      };
    }

    // 2. Urgent Priority
    if (task.taskType === 'Urgent') {
      return { 
        isAlert: true, 
        label: '🔴 URGENT ATTENTION', 
        color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
      };
    }

    // 3. High Priority
    if (task.taskType === 'High') {
      return { 
        isAlert: true, 
        label: '🟠 HIGH PRIORITY', 
        color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' 
      };
    }

    // 4. Stuck in Pending > 24h
    if (task.status === 'Pending' && task.createdAt) {
      const elapsed = Date.now() - new Date(task.createdAt).getTime();
      if (elapsed > 24 * 60 * 60 * 1000) {
        return { 
          isAlert: true, 
          label: '⚠️ PENDING >24H', 
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
        };
      }
    }

    return { isAlert: false, label: '', color: '' };
  };

  // Counts for target filter
  const individualTasksCount = baseTasks.filter(t => Boolean(t.assignedTo) && !t.assignedDepartmentId).length;
  const departmentTasksCount = baseTasks.filter(t => Boolean(t.assignedDepartmentId)).length;
  const alertTasksCount = baseTasks.filter(t => getIndividualAlert(t).isAlert).length;

  // Filter tasks based on target, department, stats, and search
  const displayedTasks = baseTasks
    .filter(t => {
      // Target Segment Filter
      if (targetFilter === 'individual') {
        if (!t.assignedTo || t.assignedDepartmentId) return false;
      } else if (targetFilter === 'department') {
        if (!t.assignedDepartmentId) return false;
      } else if (targetFilter === 'alerts') {
        if (!getIndividualAlert(t).isAlert) return false;
      }

      // Department Filter
      if (selectedDeptFilter) {
        if (selectedDeptFilter === 'unassigned') {
          if (t.assignedDepartmentId) return false;
        } else {
          if (t.assignedDepartmentId !== selectedDeptFilter) return false;
        }
      }

      // Status Filter
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
        (t.assignedDepartmentName && t.assignedDepartmentName.toLowerCase().includes(term)) ||
        (t.comments?.[0]?.text && t.comments[0].text.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => {
      const aOrder = TASK_TYPE_ORDER[a.taskType] ?? 3;
      const bOrder = TASK_TYPE_ORDER[b.taskType] ?? 3;
      return aOrder - bOrder;
    });

  // Group displayed created tasks by Department for Print
  const groupedTasksByDepartment = (() => {
    const map = new Map<string, { deptName: string; tasks: any[] }>();
    departmentsList.forEach(d => {
      map.set(d.departmentId, { deptName: d.departmentName, tasks: [] });
    });
    map.set('general', { deptName: 'General / Individual Direct Tasks', tasks: [] });

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

    const alertInfo = getIndividualAlert(task);
    const allComments = task.comments || [];
    const firstComment = allComments.length > 0 ? allComments[0] : null;
    const taskMessage = firstComment?.text || '';
    const voiceUrl = firstComment?.voiceUrl || '';
    const imageUrl = firstComment?.imageUrl || '';

    return (
      <div
        key={task.taskId}
        className={`glass rounded-xl p-5 space-y-4 transition-all duration-200 border relative ${cardBorder}`}
      >
        {/* Alert Ribbon for Individual Tasks */}
        {alertInfo.isAlert && (
          <div className="absolute -top-2.5 right-4 z-10">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border shadow-md ${alertInfo.color}`}>
              {alertInfo.label}
            </span>
          </div>
        )}

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
            <div className="flex items-center gap-1.5">
              <span>Target:</span>
              {task.assignedDepartmentName ? (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
                  🏢 {task.assignedDepartmentName}
                </span>
              ) : task.assignedToName ? (
                <span className="text-brand-400 font-bold">
                  👤 {task.assignedToName}
                </span>
              ) : (
                <span className="text-slate-500 font-bold">Unassigned</span>
              )}
            </div>

            {task.assignedToName && task.assignedDepartmentName && (
              <div>Assigned Rep: <span className="text-slate-200 font-bold">👤 {task.assignedToName}</span></div>
            )}

            {task.createdByName && isAdmin && adminScope === 'all' && (
              <div>Created By: <span className="text-slate-300 font-semibold">{task.createdByName}</span></div>
            )}

            <div>Due Date: <span className="text-slate-200 font-bold">{task.dateKey || (task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not Set')}</span></div>

            {/* SLA Countdown in Card */}
            {task.dueDate && task.status !== 'Completed' && (
              <div className="pt-0.5">
                {(() => {
                  const now = Date.now();
                  const due = new Date(task.dueDate).getTime();
                  const diff = due - now;
                  if (diff <= 0) {
                    return <span className="text-rose-400 font-bold animate-pulse text-[10px]">🚨 SLA Expired</span>;
                  }
                  const hrs = Math.floor(diff / (1000 * 60 * 60));
                  const mins = Math.floor((diff / (1000 * 60)) % 60);
                  return <span className="text-amber-400 font-mono text-[10px]">⏳ SLA: {hrs}h {mins}m left</span>;
                })()}
              </div>
            )}
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

          {task.checklist && task.checklist.length > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span>📋 Checklist:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {task.checklist.filter((c: any) => c.completed).length}/{task.checklist.length} Done
              </span>
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
        <p className="text-xs mt-1">Scope: <strong>{isAdmin && adminScope === 'all' ? 'All Organization Tasks' : 'My Created Tasks'}</strong> | Target: <strong>{targetFilter.toUpperCase()}</strong> | Dept: <strong>{selectedDeptFilter || 'All Departments'}</strong> | Generated: {new Date().toLocaleString()} | Total: {displayedTasks.length}</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-sans">Created Tasks Desk</h2>
            {alertTasksCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                🚨 {alertTasksCount} Alert{alertTasksCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">Manage and oversee tasks created across your organization</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Admin Scope Toggle */}
          {isAdmin && (
            <div className="flex items-center bg-slate-955 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAdminScope('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  adminScope === 'all'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                👑 All Tasks ({masterTasks.length})
              </button>
              <button
                type="button"
                onClick={() => setAdminScope('mine')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  adminScope === 'mine'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                👤 Created by Me ({createdTasks.filter(t => t.createdBy === user?.uid).length})
              </button>
            </div>
          )}

          <input
            type="text"
            placeholder="Search tasks, assignees, messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500 w-full sm:w-56"
          />

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center space-x-1.5"
          >
            <span>🖨️ Print Tasks</span>
          </button>

          <button
            onClick={() => setShowCreateTaskModal(true)}
            className="h-9 px-4 flex items-center justify-center bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-xs transition-all duration-200 shadow-lg shadow-brand-500/10 cursor-pointer whitespace-nowrap"
          >
            + Create Task
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="h-9 px-4 flex items-center justify-center bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition-all duration-200 shadow-lg shadow-rose-500/10 cursor-pointer whitespace-nowrap"
            >
              📢 Broadcast Alert
            </button>
          )}
        </div>
      </div>

      {/* Target Type Filter Bar (All Tasks | Individual | Department Groups | Needs Attention Alert) */}
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <button
          onClick={() => setTargetFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            targetFilter === 'all'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          🌐 All Target Tasks ({baseTasks.length})
        </button>
        <button
          onClick={() => setTargetFilter('individual')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            targetFilter === 'individual'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          👤 Individual Tasks ({individualTasksCount})
        </button>
        <button
          onClick={() => setTargetFilter('department')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            targetFilter === 'department'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          🏢 Department Group Tasks ({departmentTasksCount})
        </button>
        <button
          onClick={() => setTargetFilter('alerts')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            targetFilter === 'alerts'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
              : 'bg-rose-950/20 text-rose-300 hover:bg-rose-950/40 border border-rose-800/40'
          }`}
        >
          <span>🚨 Needs Attention / Alerts</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono">
            {alertTasksCount}
          </span>
        </button>
      </div>

      {/* Department Quick Filter Buttons / Folder Badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 print:hidden">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 mr-1">
          🏢 Department:
        </span>
        <button
          onClick={() => setSelectedDeptFilter('')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
            selectedDeptFilter === ''
              ? 'bg-slate-200 text-slate-900'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          All Departments
        </button>
        {departmentsList.map(d => {
          const deptCount = baseTasks.filter(t => t.assignedDepartmentId === d.departmentId).length;
          return (
            <button
              key={d.departmentId}
              onClick={() => setSelectedDeptFilter(d.departmentId)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex-shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedDeptFilter === d.departmentId
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>🏢 {d.departmentName}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 font-mono">
                {deptCount}
              </span>
            </button>
          );
        })}
        <button
          onClick={() => setSelectedDeptFilter('unassigned')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
            selectedDeptFilter === 'unassigned'
              ? 'bg-slate-700 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          General / Direct
        </button>
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
            {baseTasks.filter(t => t.status !== 'Completed').length}
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
            {baseTasks.filter(t => t.status === 'Pending').length}
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
            {baseTasks.filter(t => t.status === 'In_Progress').length}
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
            {baseTasks.filter(t => t.status === 'Completed').length}
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
                  <th className="p-2 border border-black">Target / Assignee</th>
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
                      <td className="p-2 border border-black">{t.assignedDepartmentName ? `🏢 ${t.assignedDepartmentName}` : (t.assignedToName || 'Individual')}</td>
                      <td className="p-2 border border-black">{t.taskType || t.urgency}</td>
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
          <p className="text-base font-semibold text-slate-400">No tasks found matching your filters.</p>
          <p className="text-[11px] text-slate-500">Try changing your search query, target filter, or department selection.</p>
        </div>
      )}
    </div>
  );
};
