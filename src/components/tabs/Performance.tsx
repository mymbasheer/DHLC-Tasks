import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const Performance: React.FC = () => {
  const {
    currentTab,
    performanceRecords,
    usersList,
    departmentsList,
    userRole,
    resetPerformanceLeaderboard
  } = useApp();

  const [timeframe, setTimeframe] = useState<'monthly' | 'yearly'>('monthly');
  
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth(); // 0-11
  
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIndex);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  if (currentTab !== 'performance') return null;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [currentYear, currentYear - 1, currentYear - 2];

  // Filter records based on timeframe
  const filteredRecords = performanceRecords.filter(rec => {
    const recDate = new Date(rec.completedAt);
    if (isNaN(recDate.getTime())) return false;
    
    const matchesYear = recDate.getFullYear() === selectedYear;
    if (timeframe === 'yearly') {
      return matchesYear;
    } else {
      const matchesMonth = recDate.getMonth() === selectedMonth;
      return matchesYear && matchesMonth;
    }
  });

  // Filter active personnel
  const activePersonnel = usersList.filter(u => {
    if (u.role === 'Pending') return false;
    if (selectedDeptId) {
      const uDepts = u.departmentIds && u.departmentIds.length > 0 ? u.departmentIds : (u.departmentId ? [u.departmentId] : []);
      if (!uDepts.includes(selectedDeptId)) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const leaderboardData = activePersonnel.map(u => {
    const userRecords = filteredRecords.filter(rec => rec.userId === u.uid);
    const completedCount = userRecords.length;
    
    const totalHours = userRecords.reduce((acc, curr) => acc + (curr.durationHours || 0), 0);
    const avgHours = completedCount > 0 ? Number((totalHours / completedCount).toFixed(1)) : 0;

    const onTimeCount = userRecords.filter(rec => rec.onTime).length;
    const onTimeRate = completedCount > 0 ? Math.round((onTimeCount / completedCount) * 100) : 100;

    return {
      user: u,
      completedCount,
      avgHours,
      onTimeRate,
      onTimeCount
    };
  }).sort((a, b) => {
    if (b.completedCount !== a.completedCount) return b.completedCount - a.completedCount;
    return b.onTimeRate - a.onTimeRate;
  });

  // Department Productivity Comparison Aggregates
  const departmentStats = departmentsList.map(dept => {
    const deptMembers = usersList.filter(u => {
      const uDepts = u.departmentIds && u.departmentIds.length > 0 ? u.departmentIds : (u.departmentId ? [u.departmentId] : []);
      return uDepts.includes(dept.departmentId);
    });
    const memberUids = new Set(deptMembers.map(m => m.uid));
    const deptRecords = filteredRecords.filter(rec => memberUids.has(rec.userId));

    const totalTasks = deptRecords.length;
    const onTimeTasks = deptRecords.filter(r => r.onTime).length;
    const onTimeRate = totalTasks > 0 ? Math.round((onTimeTasks / totalTasks) * 100) : 100;

    return {
      departmentId: dept.departmentId,
      departmentName: dept.departmentName,
      memberCount: deptMembers.length,
      totalTasks,
      onTimeRate
    };
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans">Performance Leaderboard & Analytics</h2>
          <p className="text-xs text-slate-400">Track personnel and departmental completion rates, speed, and reliability metrics</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {userRole === 'Admin' && (
            <button
              onClick={resetPerformanceLeaderboard}
              className="px-3 py-1.5 bg-rose-900/30 border border-rose-800/40 text-rose-350 hover:bg-rose-900/50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Reset Analytics
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center space-x-1.5"
          >
            <span>🖨️ Print Analytics</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Card */}
      <div className="glass p-5 rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-850 text-xs">
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                timeframe === 'monthly' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly View
            </button>
            <button
              onClick={() => setTimeframe('yearly')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                timeframe === 'yearly' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Yearly View
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {timeframe === 'monthly' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-slate-950 border border-slate-850 rounded-xl p-2 text-slate-200 font-semibold focus:outline-none"
              >
                {months.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
            )}

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-950 border border-slate-850 rounded-xl p-2 text-slate-200 font-semibold focus:outline-none"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="bg-slate-950 border border-emerald-500/40 rounded-xl p-2 text-emerald-400 font-bold focus:outline-none"
            >
              <option value="">All Departments</option>
              {departmentsList.map(d => (
                <option key={d.departmentId} value={d.departmentId}>🏢 {d.departmentName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Departmental Productivity Comparison Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider">🏢 Department Productivity Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {departmentStats.map(dept => (
            <div key={dept.departmentId} className="glass p-4 rounded-xl space-y-2 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-sm">🏢 {dept.departmentName}</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">{dept.memberCount} Members</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block">Tasks Completed</span>
                  <span className="text-base font-bold text-brand-400">{dept.totalTasks}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block">On-Time Rate</span>
                  <span className={`text-base font-bold ${dept.onTimeRate >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {dept.onTimeRate}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard Ranking Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-850 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">🏆 Personnel Leaderboard</h3>
          <input
            type="text"
            placeholder="Search personnel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-950 border border-slate-850 rounded-lg px-3 py-1 text-xs text-slate-200 focus:outline-none"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Personnel</th>
                <th className="p-3">Department(s)</th>
                <th className="p-3 text-center">Completed Tasks</th>
                <th className="p-3 text-center">Avg. Completion Time</th>
                <th className="p-3 text-center">On-Time Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {leaderboardData.map((item, index) => {
                const deptNames = item.user.departmentNames && item.user.departmentNames.length > 0
                  ? item.user.departmentNames
                  : (item.user.departmentName ? [item.user.departmentName] : []);

                return (
                  <tr key={item.user.uid} className="hover:bg-slate-900/30">
                    <td className="p-3 font-bold text-slate-400">
                      {index === 0 ? '🥇 1st' : index === 1 ? '🥈 2nd' : index === 2 ? '🥉 3rd' : `#${index + 1}`}
                    </td>
                    <td className="p-3 font-bold text-slate-200">
                      {item.user.name}
                    </td>
                    <td className="p-3">
                      {deptNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {deptNames.map((d, i) => (
                            <span key={i} className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-semibold">
                              🏢 {d}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-bold text-brand-400 text-sm">{item.completedCount}</td>
                    <td className="p-3 text-center font-mono text-slate-300">{item.avgHours > 0 ? `${item.avgHours} hrs` : 'N/A'}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        item.onTimeRate >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {item.onTimeRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {leaderboardData.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">No personnel records found for this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
