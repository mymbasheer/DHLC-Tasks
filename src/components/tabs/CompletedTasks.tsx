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
    masterTasks,
    user,
    userRole,
    hasUnreadComments,
    taskStatusClass,
    taskStatusName,
    openTaskDetails,
    departmentsList
  } = useApp();

  const [adminScope, setAdminScope] = useState<'all' | 'mine'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('');

  if (currentTab !== 'completed_tasks') return null;

  const isAdmin = userRole === 'Admin' || Boolean(user?.permissions?.canViewReports);

  // Determine completed tasks pool
  let allRelevantCompleted: any[] = [];
  if (isAdmin && adminScope === 'all') {
    allRelevantCompleted = masterTasks.filter(t => t.status === 'Completed');
  } else {
    const myCompleted = myTasks.filter(t => t.status === 'Completed');
    const myCreatedCompleted = createdTasks.filter(t => t.status === 'Completed' && t.createdBy === user?.uid);
    allRelevantCompleted = [...myCompleted, ...myCreatedCompleted].reduce((acc: any[], current: any) => {
      if (!acc.find((item: any) => item.taskId === current.taskId)) {
        return acc.concat([current]);
      }
      return acc;
    }, []);
  }

  const displayedTasks = allRelevantCompleted
    .filter((t: any) => {
      if (selectedDeptFilter) {
        if (selectedDeptFilter === 'unassigned') {
          if (t.assignedDepartmentId) return false;
        } else {
          if (t.assignedDepartmentId !== selectedDeptFilter) return false;
        }
      }
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        t.taskTitle.toLowerCase().includes(term) ||
        (t.assignedToName && t.assignedToName.toLowerCase().includes(term)) ||
        (t.assignedDepartmentName && t.assignedDepartmentName.toLowerCase().includes(term)) ||
        (t.comments?.[0]?.text && t.comments[0].text.toLowerCase().includes(term))
      );
    })
    .sort((a: any, b: any) => {
      const dateA = a.completedAt || a.updatedAt || a.dateKey || '';
      const dateB = b.completedAt || b.updatedAt || b.dateKey || '';
      return dateB.localeCompare(dateA);
    });

  // Group displayed completed tasks by Department
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
                <span className="text-slate-500">Unassigned</span>
              )}
            </div>
            {task.assignedToName && task.assignedDepartmentName && (
              <div>Assigned Rep: <span className="text-slate-200 font-bold">👤 {task.assignedToName}</span></div>
            )}
            <div>Completed On: <span className="text-slate-200 font-bold">{(task.completedAt || task.updatedAt || '').split('T')[0]}</span></div>
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
      {/* Official Print Header */}
      <div className="hidden print:block mb-6 border-b-2 border-black pb-4 text-black text-left">
        <h1 className="text-2xl font-bold uppercase tracking-wider">DHLC Tasks — Completed Tasks History Report</h1>
        <p className="text-xs mt-1">Scope: <strong>{isAdmin && adminScope === 'all' ? 'All Organization History' : 'Personal Completed History'}</strong> | Generated: {new Date().toLocaleString()} | Total Completed: {displayedTasks.length}</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="text-left">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Completed Tasks History
          </h2>
          <p className="text-xs text-slate-400">Complete archive and audit trail of finished tasks</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Admin Scope Toggle */}
          {isAdmin && (
            <div className="flex items-center bg-slate-955 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAdminScope('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  adminScope === 'all'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🏢 Org History ({masterTasks.filter(t => t.status === 'Completed').length})
              </button>
              <button
                type="button"
                onClick={() => setAdminScope('mine')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  adminScope === 'mine'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                👤 My Finished
              </button>
            </div>
          )}

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
            placeholder="Search completed tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-56 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 placeholder-slate-500"
          />

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center space-x-1.5"
          >
            <span>🖨️ Print Completed History</span>
          </button>
        </div>
      </div>

      {/* Screen View */}
      {displayedTasks.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center text-slate-500 print:hidden">
          No completed tasks found in history.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
          {displayedTasks.map(renderTaskCard)}
        </div>
      )}

      {/* Print View: Grouped by Department */}
      <div className="hidden print:block space-y-6 text-left">
        {groupedTasksByDepartment.map(group => (
          <div key={group.deptName} className="space-y-2">
            <h3 className="text-base font-bold uppercase tracking-wider text-black border-b-2 border-black pb-1">
              🏢 Department: {group.deptName} ({group.tasks.length} Completed Tasks)
            </h3>
            <table className="w-full text-left text-xs border-collapse border border-black text-black">
              <thead>
                <tr className="bg-gray-200 border-b border-black">
                  <th className="p-2 border border-black">Task Title</th>
                  <th className="p-2 border border-black">Target / Assignee</th>
                  <th className="p-2 border border-black">Completed Date</th>
                  <th className="p-2 border border-black">Details / Instructions</th>
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
                      <td className="p-2 border border-black font-mono">{(t.completedAt || t.updatedAt || '').split('T')[0]}</td>
                      <td className="p-2 border border-black whitespace-pre-wrap">{msg}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};
