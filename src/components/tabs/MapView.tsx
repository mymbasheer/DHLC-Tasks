import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const MapView: React.FC = () => {
  const { currentTab, masterTasks, myTasks, userRole, departmentsList, openTaskDetails } = useApp();
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');

  if (currentTab !== 'map' || userRole !== 'Admin') return null;

  const sourceTasks = userRole === 'Admin' ? masterTasks : myTasks;

  // Filter tasks with GPS coordinates
  const mappedTasks = sourceTasks.filter(t => {
    if (!t.createdLocation && !t.assigneeOpenLocation && !t.lastOpenedLocation) return false;
    if (selectedDeptId) {
      if (selectedDeptId === 'unassigned') {
        if (t.assignedDepartmentId) return false;
      } else {
        if (t.assignedDepartmentId !== selectedDeptId) return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans">🗺️ Field Operations & Task GPS Location Map</h2>
          <p className="text-xs text-slate-400">View real-time spatial locations captured during task dispatch and personnel site visits</p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-400 font-medium">Department:</span>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-semibold focus:outline-none focus:border-brand-500"
          >
            <option value="">All Departments</option>
            {departmentsList.map(d => (
              <option key={d.departmentId} value={d.departmentId}>🏢 {d.departmentName}</option>
            ))}
            <option value="unassigned">General / Unassigned</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="glass p-4 rounded-xl space-y-1 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Mapped Locations</span>
          <h3 className="text-xl font-bold text-slate-200">{mappedTasks.length}</h3>
        </div>
        <div className="glass p-4 rounded-xl space-y-1 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Active Geofenced Tasks</span>
          <h3 className="text-xl font-bold text-brand-400">{mappedTasks.filter(t => t.status !== 'Completed').length}</h3>
        </div>
        <div className="glass p-4 rounded-xl space-y-1 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Completed Field Visits</span>
          <h3 className="text-xl font-bold text-emerald-400">{mappedTasks.filter(t => t.status === 'Completed').length}</h3>
        </div>
      </div>

      {/* Task Location Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {mappedTasks.map(task => {
          const loc = task.lastOpenedLocation || task.assigneeOpenLocation || task.createdLocation;
          const locType = task.lastOpenedLocation ? 'Last Opened' : (task.assigneeOpenLocation ? 'Opened' : 'Created');
          const googleMapsUrl = loc ? `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}` : '#';

          return (
            <div key={task.taskId} className="glass rounded-xl p-5 space-y-3 border border-slate-800 hover:border-slate-700 transition-all text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-400 font-mono">📍 {loc?.cityName || 'Captured GPS'}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {task.status}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 text-sm">{task.taskTitle}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Assigned to: <strong className="text-slate-300">{task.assignedToName || 'Group'}</strong></p>
                {task.assignedDepartmentName && (
                  <p className="text-[10px] text-emerald-400 mt-1 font-semibold">🏢 {task.assignedDepartmentName}</p>
                )}
              </div>

              {loc && (
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>GPS Signal ({locType})</span>
                    <span className="font-mono">{new Date(loc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-slate-300 font-mono text-[10px]">
                    Lat: {loc.latitude.toFixed(5)}, Lon: {loc.longitude.toFixed(5)}
                  </div>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 font-bold underline pt-1 cursor-pointer"
                  >
                    <span>🗺️ Open in Google Maps ↗</span>
                  </a>
                </div>
              )}

              <div className="pt-2 border-t border-slate-900 flex justify-end">
                <button
                  onClick={() => openTaskDetails(task)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {mappedTasks.length === 0 && (
        <div className="p-12 text-center text-slate-500 text-xs bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed space-y-2">
          <p className="text-base font-semibold text-slate-400">No GPS location records found for active tasks.</p>
          <p className="text-xs text-slate-500">Locations are automatically recorded when personnel open tasks with GPS enabled.</p>
        </div>
      )}
    </div>
  );
};
