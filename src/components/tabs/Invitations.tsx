import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Department } from '../../types';
import { UserProfileModal } from '../modals/UserProfileModal';

interface PersonnelCardProps {
  personnel: User;
  onViewProfile: (user: User) => void;
}

const PersonnelCard: React.FC<PersonnelCardProps> = ({ personnel, onViewProfile }) => {
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
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-200 text-sm">{name}</h4>
                <button
                  onClick={() => onViewProfile(personnel)}
                  className="px-2 py-0.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded text-[9px] font-bold cursor-pointer transition-colors"
                  title="View Profile Details"
                >
                  👁️ Profile
                </button>
              </div>
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
  const { currentTab, usersList, userRole, departmentsList, createDepartment, deleteDepartment, updateUserRights, toggleUserStatus, masterTasks, showToast } = useApp();
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');

  // Active Department Personnel view state
  const [activeDeptModal, setActiveDeptModal] = useState<Department | null>(null);

  // User Profile Modal State
  const [profileModalUser, setProfileModalUser] = useState<User | null>(null);

  // Bulk User Selection State
  const [selectedUserUids, setSelectedUserUids] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState<'Admin' | 'User'>('User');
  const [bulkDeptId, setBulkDeptId] = useState<string>('');
  const bulkPerms = {
    canCreateTasks: true,
    canManageUsers: false,
    canManageDepartments: false,
    canViewReports: false,
    canExportReports: false,
    canViewPerformance: true,
    canViewMap: false,
    canDeleteTasks: false,
    canBroadcast: false,
  };

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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserUids(personnelList.map(u => u.uid));
    } else {
      setSelectedUserUids([]);
    }
  };

  const handleToggleSelectUser = (uid: string) => {
    setSelectedUserUids(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleBulkActivateAndRights = async () => {
    if (selectedUserUids.length === 0) return;

    const matchedDept = departmentsList.find(d => d.departmentId === bulkDeptId);
    const deptId = matchedDept ? matchedDept.departmentId : '';
    const deptName = matchedDept ? matchedDept.departmentName : '';
    const deptIds = matchedDept ? [matchedDept.departmentId] : [];
    const deptNames = matchedDept ? [matchedDept.departmentName] : [];

    const effectivePerms = bulkRole === 'Admin' ? {
      canCreateTasks: true,
      canManageUsers: true,
      canManageDepartments: true,
      canViewReports: true,
      canExportReports: true,
      canViewPerformance: true,
      canViewMap: true,
      canDeleteTasks: true,
      canBroadcast: true,
    } : bulkPerms;

    for (const uid of selectedUserUids) {
      const u = personnelList.find(item => item.uid === uid);
      if (u) {
        await updateUserRights(
          uid,
          u.name,
          u.email,
          bulkRole,
          u.mobileNumber || '',
          deptId || u.departmentId,
          deptName || u.departmentName,
          deptIds.length > 0 ? deptIds : (u.departmentIds || []),
          deptNames.length > 0 ? deptNames : (u.departmentNames || []),
          effectivePerms
        );
        if (u.status !== 'Active') {
          await toggleUserStatus(uid, 'Suspended'); // Toggles Suspended -> Active
        }
      }
    }

    showToast(`Bulk updated & activated ${selectedUserUids.length} users successfully!`, 'success');
    setSelectedUserUids([]);
  };

  return (
    <div className="space-y-6">
      {/* Department Management Section */}
      <div className="glass rounded-2xl p-6 space-y-6 text-left w-full border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            🏢 Department Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">Create company departments and organize personnel. Click any department name to view assigned personnel.</p>
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

        {/* Interactive Department Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {departmentsList.map((dept) => {
            const assignedMembers = usersList.filter(u => {
              const uDepts = u.departmentIds && u.departmentIds.length > 0 ? u.departmentIds : (u.departmentId ? [u.departmentId] : []);
              return uDepts.includes(dept.departmentId);
            });

            return (
              <div
                key={dept.departmentId}
                className="bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800 hover:border-brand-500/50 rounded-xl p-4 flex items-center justify-between shadow-sm transition-all cursor-pointer group"
                onClick={() => setActiveDeptModal(dept)}
              >
                <div>
                  <h4 className="font-bold text-slate-200 group-hover:text-brand-400 text-sm flex items-center gap-1.5 transition-colors">
                    <span>🏢</span>
                    <span className="underline decoration-dashed underline-offset-4">{dept.departmentName}</span>
                  </h4>
                  {dept.description && <p className="text-[11px] text-slate-400 mt-0.5">{dept.description}</p>}
                  <span className="text-[10px] text-emerald-400 font-semibold block mt-1.5">
                    👥 {assignedMembers.length} Assigned Personnel (Click to view)
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDepartment(dept.departmentId);
                  }}
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

      {/* User Rights Matrix Overview Table with Bulk Selection */}
      <div className="glass rounded-2xl p-6 space-y-4 text-left w-full border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              🛡️ User Rights Matrix Overview List
            </h2>
            <p className="text-xs text-slate-400 mt-1">Audit permissions, activate first-time logged-in users, or bulk-assign roles and rights simultaneously.</p>
          </div>

          {selectedUserUids.length > 0 && (
            <div className="bg-brand-600/10 border border-brand-500/30 p-3 rounded-xl flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-brand-300">
                Selected: {selectedUserUids.length} User(s)
              </span>
              <select
                value={bulkRole}
                onChange={(e) => setBulkRole(e.target.value as 'Admin' | 'User')}
                className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 font-semibold"
              >
                <option value="User">Assign Personnel (User) Role</option>
                <option value="Admin">Assign Admin Role</option>
              </select>

              <select
                value={bulkDeptId}
                onChange={(e) => setBulkDeptId(e.target.value)}
                className="bg-slate-950 border border-emerald-500/40 rounded-lg p-1.5 text-xs text-emerald-400 font-semibold"
              >
                <option value="">-- Assign Department --</option>
                {departmentsList.map(d => (
                  <option key={d.departmentId} value={d.departmentId}>🏢 {d.departmentName}</option>
                ))}
              </select>

              <button
                onClick={handleBulkActivateAndRights}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-md cursor-pointer whitespace-nowrap"
              >
                ⚡ Bulk Activate & Grant Rights
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedUserUids.length === personnelList.length && personnelList.length > 0}
                    onChange={handleSelectAll}
                    className="rounded bg-slate-900 border-slate-800 text-brand-500 h-3.5 w-3.5 cursor-pointer"
                  />
                </th>
                <th className="p-3">User / Status</th>
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
                const isAdmin = u.role === 'Admin';
                const isPending = u.role === 'Pending';
                const p = u.permissions || {};
                const canCreateTasks = p.canCreateTasks ?? true;
                const canManageUsers = isAdmin || !!p.canManageUsers;
                const canManageDepartments = isAdmin || !!p.canManageDepartments;
                const canViewReports = isAdmin || !!p.canViewReports;
                const canExportReports = isAdmin || !!p.canExportReports;
                const canViewMap = isAdmin || !!p.canViewMap;
                const canDeleteTasks = isAdmin || !!p.canDeleteTasks;
                const canBroadcast = isAdmin || !!p.canBroadcast;

                return (
                  <tr key={u.uid} className={`hover:bg-slate-900/30 ${isPending ? 'bg-amber-500/5' : ''}`}>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedUserUids.includes(u.uid)}
                        onChange={() => handleToggleSelectUser(u.uid)}
                        className="rounded bg-slate-900 border-slate-800 text-brand-500 h-3.5 w-3.5 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 font-bold text-slate-200">
                      <div className="flex items-center gap-2">
                        <span>{u.name}</span>
                        {isPending && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-amber-500/20 text-amber-400 font-extrabold border border-amber-500/30 animate-pulse">
                            🆕 1st Time Logged-In
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-brand-400">{u.role}</td>
                    <td className="p-3 text-center font-bold">{canCreateTasks ? '✅' : '❌'}</td>
                    <td className="p-3 text-center font-bold">{canManageUsers ? '✅' : '❌'}</td>
                    <td className="p-3 text-center font-bold">{canManageDepartments ? '✅' : '❌'}</td>
                    <td className="p-3 text-center font-bold">{canViewReports ? '✅' : '❌'}</td>
                    <td className="p-3 text-center font-bold">{canExportReports ? '✅' : '❌'}</td>
                    <td className="p-3 text-center font-bold">{canViewMap ? '✅' : '❌'}</td>
                    <td className="p-3 text-center font-bold">{canDeleteTasks ? '✅' : '❌'}</td>
                    <td className="p-3 text-center font-bold">{canBroadcast ? '✅' : '❌'}</td>
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
          <p className="text-xs text-slate-400 mt-1">Manage individual profiles, modify access levels, assign departments, and suspend/activate personnel.</p>
        </div>

        {/* Responsive grid card list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {personnelList.map((u) => (
            <PersonnelCard key={u.uid} personnel={u} onViewProfile={(user) => setProfileModalUser(user)} />
          ))}
        </div>

        {personnelList.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
            No registered personnel found.
          </div>
        )}
      </div>

      {/* Department Personnel View Modal */}
      {activeDeptModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass rounded-2xl w-full max-w-lg p-6 space-y-5 border border-slate-800 text-left shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>🏢 Personnel Assigned to {activeDeptModal.departmentName}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{activeDeptModal.description || 'Department operational unit'}</p>
              </div>
              <button onClick={() => setActiveDeptModal(null)} className="text-slate-400 hover:text-slate-200 text-lg cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {usersList
                .filter(u => {
                  const uDepts = u.departmentIds && u.departmentIds.length > 0 ? u.departmentIds : (u.departmentId ? [u.departmentId] : []);
                  return uDepts.includes(activeDeptModal.departmentId);
                })
                .map(u => (
                  <div key={u.uid} className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs">{u.name}</h4>
                      <p className="text-[10px] text-slate-400">{u.email}</p>
                      {u.mobileNumber && (
                        <p className="text-[10px] text-brand-400 mt-0.5">🟢 WA: {u.mobileNumber}</p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20 block">
                        {u.role}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold block ${
                        u.status === 'Active' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {u.status || 'Active'}
                      </span>
                    </div>
                  </div>
                ))}
              {usersList.filter(u => {
                const uDepts = u.departmentIds && u.departmentIds.length > 0 ? u.departmentIds : (u.departmentId ? [u.departmentId] : []);
                return uDepts.includes(activeDeptModal.departmentId);
              }).length === 0 && (
                <p className="text-xs text-slate-500 text-center italic py-4">No personnel currently assigned to this department.</p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveDeptModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {profileModalUser && (
        <UserProfileModal
          user={profileModalUser}
          tasks={masterTasks}
          onClose={() => setProfileModalUser(null)}
        />
      )}
    </div>
  );
};
