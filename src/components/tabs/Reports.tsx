import React from 'react';
import { useApp } from '../../context/AppContext';

export const Reports: React.FC = () => {
  const {
    currentTab,
    reportFilters,
    setReportFilters,
    usersList,
    departmentsList,
    filteredReportTasks,
    userRoleName,
    taskStatusClass,
    taskStatusName,
    openTaskDetails,
    userRole,
    deleteTask
  } = useApp();

  if (currentTab !== 'reports') return null;

  const handleResetFilters = () => {
    setReportFilters({
      status: '',
      assigneeId: '',
      departmentId: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* Printable Official Header (Shown only during printing) */}
      <div className="hidden print:block mb-6 border-b-2 border-black pb-4 text-black">
        <h1 className="text-2xl font-bold uppercase tracking-wider">DHLC Tasks — Department Work Orders & Tasks Master Report</h1>
        <p className="text-xs mt-1">Generated Date: {new Date().toLocaleString()} | Total Tasks: {filteredReportTasks.length}</p>
        <div className="flex flex-wrap gap-4 text-xs mt-2 pt-2 border-t border-gray-300">
          <span>Filter Status: <strong>{reportFilters.status || 'All Statuses'}</strong></span>
          <span>Department: <strong>{departmentsList.find(d => d.departmentId === reportFilters.departmentId)?.departmentName || 'All Departments'}</strong></span>
          <span>Assignee: <strong>{usersList.find(u => u.uid === reportFilters.assigneeId)?.name || 'All Personnel'}</strong></span>
        </div>
      </div>

      {/* Screen Reports Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold">Reports & Auditing Desk</h2>
          <p className="text-xs text-slate-400">Run real-time filters across all company tasks, departments, and operational history.</p>
        </div>
        
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-xs transition-colors flex items-center space-x-2 shadow-md cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Print Complete Department Report</span>
        </button>
      </div>

      {/* Report Filters Card */}
      <div className="glass p-5 rounded-xl space-y-4 print:hidden">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Report Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          {/* Date From */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">Date From</label>
            <input
              type="date"
              value={reportFilters.dateFrom}
              onChange={(e) => setReportFilters({ ...reportFilters, dateFrom: e.target.value })}
              className="w-full bg-slate-955 border border-slate-855 rounded-lg p-2.5 text-slate-255 focus:outline-none focus:border-brand-500"
            />
          </div>
          
          {/* Date To */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">Date To</label>
            <input
              type="date"
              value={reportFilters.dateTo}
              onChange={(e) => setReportFilters({ ...reportFilters, dateTo: e.target.value })}
              className="w-full bg-slate-955 border border-slate-855 rounded-lg p-2.5 text-slate-255 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-emerald-400 mb-1.5 font-bold">Department</label>
            <select
              value={reportFilters.departmentId}
              onChange={(e) => setReportFilters({ ...reportFilters, departmentId: e.target.value })}
              className="w-full bg-slate-950 border border-emerald-500/40 rounded-lg p-2.5 text-slate-255 focus:outline-none focus:border-emerald-500 font-semibold"
            >
              <option value="">All Departments</option>
              {departmentsList.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>🏢 {d.departmentName}</option>
              ))}
            </select>
          </div>

          {/* Assignee Filter */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">Assignee</label>
            <select
              value={reportFilters.assigneeId}
              onChange={(e) => setReportFilters({ ...reportFilters, assigneeId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-855 rounded-lg p-2.5 text-slate-255 focus:outline-none focus:border-brand-500"
            >
              <option value="">All Personnel</option>
              {usersList.map((u) => (
                <option key={u.uid} value={u.uid}>{u.name} ({userRoleName(u.role)})</option>
              ))}
            </select>
          </div>

          {/* Task Status Filter */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">Task Status</label>
            <select
              value={reportFilters.status}
              onChange={(e) => setReportFilters({ ...reportFilters, status: e.target.value })}
              className="w-full bg-slate-950 border border-slate-855 rounded-lg p-2.5 text-slate-255 focus:outline-none focus:border-brand-500"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In_Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end pt-2">
          <button onClick={handleResetFilters} className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-250 rounded-lg text-xs font-semibold cursor-pointer">
            Reset Filters
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 text-xs max-w-sm print:hidden">
        <div className="glass p-4 rounded-xl">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Filtered Tasks</span>
          <h3 className="text-xl font-bold text-slate-200 mt-1">{filteredReportTasks.length}</h3>
        </div>
        <div className="glass p-4 rounded-xl">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Completed Tasks</span>
          <h3 className="text-xl font-bold text-emerald-400 mt-1">{filteredReportTasks.filter(t => t.status === 'Completed').length}</h3>
        </div>
      </div>

      {/* Stacked Report Tables */}
      <div className="space-y-6">
        {/* 1. Task Operations Report */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider print:text-black">Task Operations & Department Work Orders</h3>
          <div className="glass rounded-xl overflow-hidden print:border print:border-black print:bg-white print:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 print:text-black print:border-collapse">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 print:bg-gray-200 print:text-black print:border-black">
                  <tr>
                    <th className="p-3 print:border print:border-black">Work Order / Title</th>
                    <th className="p-3 print:border print:border-black">Department</th>
                    <th className="p-3 print:border print:border-black">Assignee</th>
                    <th className="p-3 print:border print:border-black">Status</th>
                    <th className="p-3 hidden md:table-cell print:table-cell print:border print:border-black">Urgency</th>
                    <th className="p-3 hidden md:table-cell print:table-cell print:border print:border-black">Due Date</th>
                    <th className="p-3 hidden md:table-cell print:hidden">Location</th>
                    {userRole === 'Admin' && <th className="p-3 print:hidden">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 print:divide-y print:divide-black">
                  {filteredReportTasks.map((task) => (
                    <tr key={task.taskId} className="hover:bg-slate-900/30 print:hover:bg-transparent">
                      <td className="p-3 font-semibold text-slate-200 print:text-black print:border print:border-black">
                        {userRole === 'Admin' ? (
                          <button
                            onClick={() => openTaskDetails(task)}
                            className="text-left font-bold text-brand-400 hover:text-brand-300 underline cursor-pointer print:text-black print:no-underline"
                          >
                            {task.taskTitle}
                          </button>
                        ) : (
                          <span>{task.taskTitle}</span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-emerald-400 print:text-black print:border print:border-black">
                        {task.assignedDepartmentName ? `🏢 ${task.assignedDepartmentName}` : '—'}
                      </td>
                      <td className="p-3 text-slate-400 print:text-black print:border print:border-black">
                        {task.assignedToName || 'Department Group'}
                      </td>
                      <td className="p-3 print:border print:border-black">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${taskStatusClass(task.status)} print:border-black print:text-black print:bg-transparent`}>
                           {taskStatusName(task.status)}
                        </span>
                      </td>
                      <td className="p-3 hidden md:table-cell print:table-cell print:border print:border-black">{task.urgency}</td>
                      <td className="p-3 text-slate-455 font-mono hidden md:table-cell print:table-cell print:border print:border-black">
                        {task.dueDate ? new Date(task.dueDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'None'}
                      </td>
                      <td className="p-3 hidden md:table-cell print:hidden">
                        {task.createdLocation ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${task.createdLocation.latitude},${task.createdLocation.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-400 hover:text-brand-300 font-semibold underline flex items-center gap-1"
                          >
                            📍 {task.createdLocation.cityName || 'View Map'}
                          </a>
                        ) : (
                          <span className="text-slate-500">Not Captured</span>
                        )}
                      </td>
                      {userRole === 'Admin' && (
                        <td className="p-3 print:hidden">
                          <button
                            onClick={() => {
                              console.log("[Reports] Clicked delete button for taskId:", task.taskId);
                              deleteTask(task.taskId);
                            }}
                            className="p-1.5 bg-rose-600/10 hover:bg-rose-600 text-rose-455 hover:text-white rounded-lg transition-all cursor-pointer"
                            title="Delete Task"
                          >
                            🗑️
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredReportTasks.length === 0 && (
                    <tr>
                      <td colSpan={userRole === 'Admin' ? 8 : 7} className="p-6 text-center text-slate-500 hidden md:table-cell print:table-cell">No tasks matched your filters.</td>
                      <td colSpan={4} className="p-6 text-center text-slate-500 md:hidden print:hidden">No tasks matched.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
