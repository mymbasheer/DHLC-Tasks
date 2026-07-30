import React from 'react';
import { User, Task } from '../../types';

interface UserProfileModalProps {
  user: User | null;
  tasks: Task[];
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, tasks, onClose }) => {
  if (!user) return null;

  const userTasks = tasks.filter(t => t.assignedTo === user.uid);
  const activeTasks = userTasks.filter(t => t.status === 'Pending' || t.status === 'In_Progress');
  const completedTasks = userTasks.filter(t => t.status === 'Completed');
  const suspendedTasks = userTasks.filter(t => t.status === 'Suspended');

  const deptNames = user.departmentNames && user.departmentNames.length > 0
    ? user.departmentNames
    : (user.departmentName ? [user.departmentName] : []);

  const p = user.permissions || {};

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-lg p-6 space-y-5 border border-slate-800 text-left shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{user.name}</h3>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg cursor-pointer">✕</button>
        </div>

        {/* Details & Roles */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Role & Status</span>
            <div className="flex items-center justify-between pt-0.5">
              <span className="font-bold text-brand-400">{user.role}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {user.status || 'Active'}
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Mobile / WhatsApp</span>
            <p className="font-bold text-slate-200 truncate">
              {user.mobileNumber ? (
                <a href={`https://wa.me/${user.mobileNumber.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">
                  {user.mobileNumber}
                </a>
              ) : 'Not Provided'}
            </p>
          </div>
        </div>

        {/* Assigned Departments */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Assigned Department(s)</span>
          <div className="flex flex-wrap gap-1.5">
            {deptNames.map((d, i) => (
              <span key={i} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-xs font-bold">
                🏢 {d}
              </span>
            ))}
            {deptNames.length === 0 && (
              <span className="text-xs text-slate-500 italic">No department assigned</span>
            )}
          </div>
        </div>

        {/* Task Performance Summary */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Workload & Task Stats</span>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Active</span>
              <span className="text-lg font-bold text-amber-400">{activeTasks.length}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Completed</span>
              <span className="text-lg font-bold text-emerald-400">{completedTasks.length}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Suspended</span>
              <span className="text-lg font-bold text-blue-400">{suspendedTasks.length}</span>
            </div>
          </div>
        </div>

        {/* Granted Operational Rights */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active System Rights</span>
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            {p.canCreateTasks && <span className="bg-slate-950 border border-slate-800 text-slate-300 px-2 py-1 rounded-lg">Create Tasks</span>}
            {p.canManageUsers && <span className="bg-slate-950 border border-slate-800 text-brand-400 px-2 py-1 rounded-lg">Manage Users</span>}
            {p.canManageDepartments && <span className="bg-slate-950 border border-slate-800 text-brand-400 px-2 py-1 rounded-lg">Manage Depts</span>}
            {p.canViewReports && <span className="bg-slate-950 border border-slate-800 text-emerald-400 px-2 py-1 rounded-lg">Reports Desk</span>}
            {p.canExportReports && <span className="bg-slate-950 border border-slate-800 text-emerald-400 px-2 py-1 rounded-lg">Export CSV</span>}
            {p.canViewMap && <span className="bg-slate-950 border border-slate-800 text-cyan-400 px-2 py-1 rounded-lg">Location Map</span>}
            {p.canDeleteTasks && <span className="bg-slate-950 border border-slate-800 text-rose-400 px-2 py-1 rounded-lg">Delete Tasks</span>}
            {p.canBroadcast && <span className="bg-slate-950 border border-slate-800 text-purple-400 px-2 py-1 rounded-lg">Broadcast</span>}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
