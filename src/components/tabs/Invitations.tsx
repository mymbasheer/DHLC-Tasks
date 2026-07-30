import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';

interface PersonnelCardProps {
  personnel: User;
}

const PersonnelCard: React.FC<PersonnelCardProps> = ({ personnel }) => {
  const { updateUserRights, toggleUserStatus, deleteUser, departmentsList } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(personnel.name);
  const [email, setEmail] = useState(personnel.email);
  const [role, setRole] = useState(personnel.role);
  const [mobileNumber, setMobileNumber] = useState(personnel.mobileNumber || '');
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>(() => {
    if (personnel.departmentIds && personnel.departmentIds.length > 0) return personnel.departmentIds;
    return personnel.departmentId ? [personnel.departmentId] : [];
  });

  // 9 Granular Rights Matrix state
  const [perms, setPerms] = useState({
    canCreateTasks: personnel.permissions?.canCreateTasks ?? true,
    canManageUsers: personnel.permissions?.canManageUsers ?? (personnel.role === 'Admin'),
    canManageDepartments: personnel.permissions?.canManageDepartments ?? (personnel.role === 'Admin'),
    canViewReports: personnel.permissions?.canViewReports ?? (personnel.role === 'Admin'),
    canExportReports: personnel.permissions?.canExportReports ?? (personnel.role === 'Admin'),
    canViewPerformance: personnel.permissions?.canViewPerformance ?? true,
    canViewMap: personnel.permissions?.canViewMap ?? (personnel.role === 'Admin'),
    canDeleteTasks: personnel.permissions?.canDeleteTasks ?? (personnel.role === 'Admin'),
    canBroadcast: personnel.permissions?.canBroadcast ?? (personnel.role === 'Admin'),
  });

  useEffect(() => {
    if (!isEditing) {
      setName(personnel.name);
      setEmail(personnel.email);
      setRole(personnel.role);
      setMobileNumber(personnel.mobileNumber || '');
      setSelectedDeptIds(personnel.departmentIds && personnel.departmentIds.length > 0 ? personnel.departmentIds : (personnel.departmentId ? [personnel.departmentId] : []));
      setPerms({
        canCreateTasks: personnel.permissions?.canCreateTasks ?? true,
        canManageUsers: personnel.permissions?.canManageUsers ?? (personnel.role === 'Admin'),
        canManageDepartments: personnel.permissions?.canManageDepartments ?? (personnel.role === 'Admin'),
        canViewReports: personnel.permissions?.canViewReports ?? (personnel.role === 'Admin'),
        canExportReports: personnel.permissions?.canExportReports ?? (personnel.role === 'Admin'),
        canViewPerformance: personnel.permissions?.canViewPerformance ?? true,
        canViewMap: personnel.permissions?.canViewMap ?? (personnel.role === 'Admin'),
        canDeleteTasks: personnel.permissions?.canDeleteTasks ?? (personnel.role === 'Admin'),
        canBroadcast: personnel.permissions?.canBroadcast ?? (personnel.role === 'Admin'),
      });
    }
  }, [personnel, isEditing]);

  const handleDeptToggle = (deptId: string) => {
    setSelectedDeptIds(prev => 
      prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]
    );
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    if (newRole === 'Admin') {
      setPerms({
        canCreateTasks: true,
        canManageUsers: true,
        canManageDepartments: true,
        canViewReports: true,
        canExportReports: true,
        canViewPerformance: true,
        canViewMap: true,
        canDeleteTasks: true,
        canBroadcast: true,
      });
    } else if (newRole === 'User') {
      setPerms({
        canCreateTasks: true,
        canManageUsers: false,
        canManageDepartments: false,
        canViewReports: false,
        canExportReports: false,
        canViewPerformance: true,
        canViewMap: false,
        canDeleteTasks: false,
        canBroadcast: false,
      });
    }
  };

  const handleCancel = () => {
    setName(personnel.name);
    setEmail(personnel.email);
    setRole(personnel.role);
    setMobileNumber(personnel.mobileNumber || '');
    setSelectedDeptIds(personnel.departmentIds && personnel.departmentIds.length > 0 ? personnel.departmentIds : (personnel.departmentId ? [personnel.departmentId] : []));
    setPerms({
      canCreateTasks: personnel.permissions?.canCreateTasks ?? true,
      canManageUsers: personnel.permissions?.canManageUsers ?? (personnel.role === 'Admin'),
      canManageDepartments: personnel.permissions?.canManageDepartments ?? (personnel.role === 'Admin'),
      canViewReports: personnel.permissions?.canViewReports ?? (personnel.role === 'Admin'),
      canExportReports: personnel.permissions?.canExportReports ?? (personnel.role === 'Admin'),
      canViewPerformance: personnel.permissions?.canViewPerformance ?? true,
      canViewMap: personnel.permissions?.canViewMap ?? (personnel.role === 'Admin'),
      canDeleteTasks: personnel.permissions?.canDeleteTasks ?? (personnel.role === 'Admin'),
      canBroadcast: personnel.permissions?.canBroadcast ?? (personnel.role === 'Admin'),
    });
    setIsEditing(false);
  };

  const handleSave = () => {
    const matchedDepts = departmentsList.filter(d => selectedDeptIds.includes(d.departmentId));
    const primaryDeptId = selectedDeptIds[0] || '';
    const primaryDeptName = matchedDepts[0]?.departmentName || '';
    const deptNames = matchedDepts.map(d => d.departmentName);

    updateUserRights(
      personnel.uid, 
      name, 
      email, 
      role, 
      mobileNumber, 
      primaryDeptId, 
      primaryDeptName, 
      selectedDeptIds, 
      deptNames,
      perms
    );
    setIsEditing(false);
  };

  const displayDeptNames: string[] = personnel.departmentNames && personnel.departmentNames.length > 0
    ? personnel.departmentNames
    : (personnel.departmentName ? [personnel.departmentName] : []);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow relative">
      <div className="space-y-1.5 text-left">
        {isEditing ? (
          <div className="space-y-2">
            <label className="block text-[10px] text-slate-500 uppercase font-semibold">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
            />
            <label className="block text-[10px] text-slate-500 uppercase font-semibold">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 focus:outline-none focus:border-brand-500"
            />
            <label className="block text-[10px] text-slate-500 uppercase font-semibold">Mobile / WhatsApp No</label>
            <input
              type="text"
              placeholder="e.g. +949876543210"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
            />
            <label className="block text-[10px] text-slate-500 uppercase font-semibold">Assign Role</label>
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="Pending">Pending / Unassigned</option>
              <option value="Admin">Admin</option>
              <option value="User">Personnel (User)</option>
            </select>

            <label className="block text-[10px] text-slate-500 uppercase font-bold text-emerald-400">Assign Departments (Multiple Allowed)</label>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-1.5 max-h-36 overflow-y-auto">
              {departmentsList.map((dept) => (
                <label key={dept.departmentId} className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDeptIds.includes(dept.departmentId)}
                    onChange={() => handleDeptToggle(dept.departmentId)}
                    className="rounded border-slate-800 bg-slate-900 text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5"
                  />
                  <span>🏢 {dept.departmentName}</span>
                </label>
              ))}
              {departmentsList.length === 0 && (
                <span className="text-[10px] text-slate-500 italic">No departments created yet.</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-slate-200 text-sm">{name}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{email}</p>
              {displayDeptNames.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {displayDeptNames.map((dName, idx) => (
                    <span key={idx} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">
                      🏢 {dName}
                    </span>
                  ))}
                </div>
              )}
              {personnel.mobileNumber && (
                <p className="text-[11px] text-brand-400 mt-1 flex items-center gap-1 font-medium">
                  🟢 WA: <a href={`https://wa.me/${personnel.mobileNumber.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-300">{personnel.mobileNumber}</a>
                </p>
              )}
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${personnel.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
              {personnel.status || 'Active'}
            </span>
          </div>
        )}
      </div>

      {/* Operational Permissions Matrix Checkboxes */}
      <div className="space-y-2 pt-2 border-t border-slate-800/40 text-left">
        <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider text-brand-400">User Rights Matrix</span>
        {isEditing ? (
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input type="checkbox" checked={perms.canCreateTasks} onChange={e => setPerms({ ...perms, canCreateTasks: e.target.checked })} className="rounded bg-slate-900 border-slate-800 text-brand-500 h-3.5 w-3.5" />
              <span>Create Tasks</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input type="checkbox" checked={perms.canManageUsers} onChange={e => setPerms({ ...perms, canManageUsers: e.target.checked })} className="rounded bg-slate-900 border-slate-800 text-brand-500 h-3.5 w-3.5" />
              <span>Manage Users</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input type="checkbox" checked={perms.canManageDepartments} onChange={e => setPerms({ ...perms, canManageDepartments: e.target.checked })} className="rounded bg-slate-900 border-slate-800 text-brand-500 h-3.5 w-3.5" />
              <span>Manage Depts</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input type="checkbox" checked={perms.canViewReports} onChange={e => setPerms({ ...perms, canViewReports: e.target.checked })} className="rounded bg-slate-900 border-slate-800 text-brand-500 h-3.5 w-3.5" />
              <span>Reports Desk</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input type="checkbox" checked={perms.canExportReports} onChange={e => setPerms({ ...perms, canExportReports: e.target.checked })} className="rounded bg-slate-900 border-slate-800 text-brand-500 h-3.5 w-3.5" />
              <span>Export CSV</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input type="checkbox" checked={perms.canViewPerformance} onChange={e => setPerms({ ...perms, canViewPerformance: e.target.checked })} className="rounded bg-slate-900 border-slate-800 text-brand-500 h-3.5 w-3.5" />
              <span>Performance</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input type="checkbox" checked={perms.canViewMap} onChange={e => setPerms({ ...perms, canViewMap: e.target.checked })} className="rounded bg-slate-900 border-slate-800 text-brand-500 h-3.5 w-3.5" />
              <span>Location Map</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input type="checkbox" checked={perms.canDeleteTasks} onChange={e => setPerms({ ...perms, canDeleteTasks: e.target.checked })} className="rounded bg-slate-900 border-slate-800 text-brand-500 h-3.5 w-3.5" />
              <span>Delete Tasks</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input type="checkbox" checked={perms.canBroadcast} onChange={e => setPerms({ ...perms, canBroadcast: e.target.checked })} className="rounded bg-slate-900 border-slate-800 text-brand-500 h-3.5 w-3.5" />
              <span>Send Broadcast</span>
            </label>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {perms.canCreateTasks && <span className="bg-slate-950 border border-slate-800 text-[9px] text-slate-300 px-1.5 py-0.5 rounded">Create Tasks</span>}
            {perms.canManageUsers && <span className="bg-slate-950 border border-slate-800 text-[9px] text-brand-400 px-1.5 py-0.5 rounded">Manage Users</span>}
            {perms.canViewReports && <span className="bg-slate-950 border border-slate-800 text-[9px] text-emerald-400 px-1.5 py-0.5 rounded">Reports</span>}
            {perms.canViewMap && <span className="bg-slate-950 border border-slate-800 text-[9px] text-cyan-400 px-1.5 py-0.5 rounded">Map</span>}
            {perms.canDeleteTasks && <span className="bg-slate-950 border border-slate-800 text-[9px] text-rose-400 px-1.5 py-0.5 rounded">Delete Tasks</span>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/40">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="flex-grow py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="flex-grow py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
            >
              Edit Rights
            </button>
            <button
              onClick={() => toggleUserStatus(personnel.uid, personnel.status)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-350 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center whitespace-nowrap"
            >
              {personnel.status === 'Suspended' ? 'Activate' : 'Suspend'}
            </button>
            <button
              onClick={() => deleteUser(personnel.uid)}
              className="p-2 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center flex-shrink-0"
              title="Delete Personnel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export const Invitations: React.FC = () => {
  const { currentTab, usersList, userRole, departmentsList, createDepartment, deleteDepartment } = useApp();
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');

  if (currentTab !== 'invites') return null;
  if (userRole !== 'Admin') return null;

  const personnelList = usersList.filter((u) => u.role !== 'Owner');

  const handleCreateDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    createDepartment(newDeptName, newDeptDesc);
    setNewDeptName('');
    setNewDeptDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Department Management Section */}
      <div className="glass rounded-2xl p-6 space-y-6 text-left w-full border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            🏢 Department Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">Create company departments and organize personnel into structured operational units.</p>
        </div>

        {/* Add Department Form */}
        <form onSubmit={handleCreateDept} className="flex flex-col sm:flex-row gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <input
            type="text"
            placeholder="Department Name (e.g. Accounts, Logistics, Field Ops)"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
            required
          />
          <input
            type="text"
            placeholder="Description (Optional)"
            value={newDeptDesc}
            onChange={(e) => setNewDeptDesc(e.target.value)}
            className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap shadow-md shadow-brand-600/20"
          >
            + Create Department
          </button>
        </form>

        {/* Department Chips / List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {departmentsList.map((dept) => {
            const memberCount = usersList.filter(u => u.departmentId === dept.departmentId).length;
            return (
              <div key={dept.departmentId} className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                    <span>🏢</span>
                    <span>{dept.departmentName}</span>
                  </h4>
                  {dept.description && <p className="text-[11px] text-slate-400 mt-0.5">{dept.description}</p>}
                  <span className="text-[10px] text-emerald-400 font-semibold block mt-1.5">
                    👥 {memberCount} Assigned Personnel
                  </span>
                </div>
                <button
                  onClick={() => deleteDepartment(dept.departmentId)}
                  className="p-2 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition-all cursor-pointer"
                  title="Delete Department"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
        {departmentsList.length === 0 && (
          <p className="text-xs text-slate-500 text-center italic py-2">No departments created yet. Create a department above.</p>
        )}
      </div>

      {/* User Rights Matrix Overview Table */}
      <div className="glass rounded-2xl p-6 space-y-4 text-left w-full border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            🛡️ User Rights Matrix Overview
          </h2>
          <p className="text-xs text-slate-400 mt-1">Audit active operational permissions across all registered personnel</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Role</th>
                <th className="p-3 text-center">Create Tasks</th>
                <th className="p-3 text-center">Manage Users</th>
                <th className="p-3 text-center">Manage Depts</th>
                <th className="p-3 text-center">Reports</th>
                <th className="p-3 text-center">Export CSV</th>
                <th className="p-3 text-center">Location Map</th>
                <th className="p-3 text-center">Delete Tasks</th>
                <th className="p-3 text-center">Broadcast</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {personnelList.map(u => {
                const p = u.permissions || {};
                return (
                  <tr key={u.uid} className="hover:bg-slate-900/30">
                    <td className="p-3 font-bold text-slate-200">{u.name}</td>
                    <td className="p-3 font-semibold text-brand-400">{u.role}</td>
                    <td className="p-3 text-center font-bold">{p.canCreateTasks ? '✅' : '❌'}</td>
                    <td className="p-3 text-center font-bold">{p.canManageUsers ? '✅' : '❌'}</td>
                    <td className="p-3 text-center font-bold">{p.canManageDepartments ? '✅' : '❌'}</td>
                    <td className="p-3 text-center font-bold">{p.canViewReports ? '✅' : '❌'}</td>
                    <td className="p-3 text-center font-bold">{p.canExportReports ? '✅' : '❌'}</td>
                    <td className="p-3 text-center font-bold">{p.canViewMap ? '✅' : '❌'}</td>
                    <td className="p-3 text-center font-bold">{p.canDeleteTasks ? '✅' : '❌'}</td>
                    <td className="p-3 text-center font-bold">{p.canBroadcast ? '✅' : '❌'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-6 text-left w-full border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Personnel Rights & Roles Assignment</h2>
          <p className="text-xs text-slate-400 mt-1">Manage access levels, modify roles, assign departments, and toggle detailed operational rights for each team member.</p>
        </div>

        {/* Responsive grid card list instead of a wide table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {personnelList.map((u) => (
            <PersonnelCard key={u.uid} personnel={u} />
          ))}
        </div>

        {personnelList.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
            No registered personnel found.
          </div>
        )}
      </div>
    </div>
  );
};
