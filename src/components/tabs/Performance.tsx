import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const Performance: React.FC = () => {
  const {
    currentTab,
    performanceRecords,
    usersList,
    user,
    userRole,
    resetPerformanceLeaderboard
  } = useApp();

  const [timeframe, setTimeframe] = useState<'monthly' | 'yearly'>('monthly');
  
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth(); // 0-11
  
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIndex);
  const [searchQuery, setSearchQuery] = useState('');

  if (currentTab !== 'performance') return null;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [currentYear, currentYear - 1, currentYear - 2];

  // Filter records based on selected timeframe
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

  // Calculate metrics per user
  // We want to list all users who are not pending, and calculate their scores
  const activePersonnel = usersList.filter(u => u.role !== 'Pending');

  const leaderboardData = activePersonnel.map(u => {
    const userRecords = filteredRecords.filter(rec => rec.userId === u.uid);
    const completedCount = userRecords.length;
    
    // Average completion time
    const totalHours = userRecords.reduce((acc, curr) => acc + (curr.durationHours || 0), 0);
    const avgHours = completedCount > 0 ? Number((totalHours / completedCount).toFixed(1)) : 0;

    // On time rate
    const onTimeCount = userRecords.filter(rec => rec.onTime).length;
    const onTimeRate = completedCount > 0 ? Math.round((onTimeCount / completedCount) * 100) : 100;

    return {
      uid: u.uid,
      name: u.name,
      email: u.email,
      role: u.role,
      completedCount,
      avgHours,
      onTimeRate
    };
  });

  // Sort: 
  // 1. Completed tasks descending
  // 2. Avg completion hours ascending (tie breaker, but only if they have > 0 completed tasks)
  // 3. On-time rate descending (tie breaker)
  const rankedLeaderboard = [...leaderboardData].sort((a, b) => {
    if (b.completedCount !== a.completedCount) {
      return b.completedCount - a.completedCount;
    }
    // If completed count is same, lower average hours is better (but 0 means no tasks, which is worst)
    if (a.completedCount > 0 && b.completedCount > 0) {
      if (a.avgHours !== b.avgHours) {
        return a.avgHours - b.avgHours;
      }
      return b.onTimeRate - a.onTimeRate;
    }
    return a.completedCount > 0 ? -1 : 1;
  }).map((item, index) => ({
    ...item,
    rank: item.completedCount > 0 ? index + 1 : '-'
  }));

  // Find current user stats
  const currentUserStats = rankedLeaderboard.find(item => item.uid === user?.uid);

  // Filter displayed ranks by search query
  const displayedRanks = rankedLeaderboard.filter(item => {
    if (userRole !== 'Admin' && item.uid !== user?.uid) return false;
    if (!searchQuery) return true;
    return item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           item.role.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getRankBadge = (rank: any) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank === '-') return '❌';
    return rank;
  };

  const getRankColor = (rank: any) => {
    if (rank === 1) return 'text-amber-400 font-extrabold text-lg';
    if (rank === 2) return 'text-slate-350 font-extrabold text-lg';
    if (rank === 3) return 'text-amber-600 font-extrabold text-lg';
    return 'text-slate-400 font-bold';
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-left">
          <h2 className="text-xl font-bold font-sans">Performance Leaderboard</h2>
          <p className="text-xs text-slate-400">Track and compare operational tasks completion rates and speeds</p>
        </div>

        {/* Timeframe & Date Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframe === 'monthly' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeframe('yearly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframe === 'yearly' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Yearly
            </button>
          </div>

          {timeframe === 'monthly' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
            >
              {months.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          )}

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {user?.email === 'mymbasheer@gmail.com' && (
            <button
              onClick={resetPerformanceLeaderboard}
              className="bg-rose-600/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              ⚠️ Reset Leaderboard
            </button>
          )}
        </div>
      </div>

      {/* Personal Summary (Visible to non-admins or as a personal callout for admins too) */}
      {currentUserStats && (
        <div className="grid grid-cols-4 gap-2 md:gap-4 text-left">
          <div className="glass p-3 sm:p-4 rounded-xl border border-brand-500/20 bg-brand-500/5">
            <span className="text-[9px] sm:text-[10px] text-brand-300 uppercase font-semibold">Your Rank</span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-100 mt-1 flex items-center gap-1">
              <span>{currentUserStats.rank === '-' ? 'N/A' : `#${currentUserStats.rank}`}</span>
              <span className="text-sm sm:text-xl">{getRankBadge(currentUserStats.rank)}</span>
            </h3>
          </div>
          <div className="glass p-3 sm:p-4 rounded-xl">
            <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">Tasks Completed</span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1">
              {currentUserStats.completedCount}
            </h3>
          </div>
          <div className="glass p-3 sm:p-4 rounded-xl">
            <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">On-Time Rate</span>
            <h3 className={`text-xl sm:text-2xl font-bold mt-1 ${
              currentUserStats.onTimeRate >= 80 ? 'text-emerald-400' : currentUserStats.onTimeRate >= 50 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {currentUserStats.completedCount > 0 ? `${currentUserStats.onTimeRate}%` : 'N/A'}
            </h3>
          </div>
          <div className="glass p-3 sm:p-4 rounded-xl">
            <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">Avg Speed (Hours)</span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1">
              {currentUserStats.completedCount > 0 ? `${currentUserStats.avgHours}h` : 'N/A'}
            </h3>
          </div>
        </div>
      )}

      {/* Leaderboard Table Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-left">
            <h3 className="text-base font-bold text-slate-200">
              {userRole === 'Admin' 
                ? (timeframe === 'monthly' ? `${months[selectedMonth]} ${selectedYear} Standing Leaderboard` : `${selectedYear} Standing Leaderboard`)
                : 'Your Personal Standing & Ranking'}
            </h3>
            <p className="text-xs text-slate-500">
              {userRole === 'Admin' 
                ? 'Rankings based on task execution volumes and speed metrics' 
                : 'Your calculated completion standing in this timeframe'}
            </p>
          </div>
          
          {userRole === 'Admin' && (
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500 w-full sm:w-64"
            />
          )}
        </div>

        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-350 table-fixed sm:table-auto">
              <thead className="bg-slate-955 text-slate-400 uppercase text-[9px] sm:text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-2 sm:p-4 text-center w-12 sm:w-16">Rank</th>
                  <th className="p-2 sm:p-4">Personnel</th>
                  <th className="p-2 sm:p-4 hidden sm:table-cell">Role</th>
                  <th className="p-2 sm:p-4 text-center">Completed</th>
                  <th className="p-2 sm:p-4 text-center">On-Time</th>
                  <th className="p-2 sm:p-4 text-center">Avg Speed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs sm:text-sm">
                {displayedRanks.map((row) => {
                  const isSelf = row.uid === user?.uid;
                  return (
                    <tr
                      key={row.uid}
                      className={`hover:bg-slate-900/30 transition-colors ${
                        isSelf ? 'bg-brand-500/5 border-l-4 border-l-brand-500' : ''
                      }`}
                    >
                      <td className="p-2 sm:p-4 text-center">
                        <span className={getRankColor(row.rank)}>
                          {getRankBadge(row.rank)}
                        </span>
                      </td>
                      <td className="p-2 sm:p-4 font-semibold text-slate-200 truncate">
                        <div className="flex flex-col">
                          <span className="truncate">{row.name}</span>
                          <span className="text-[9px] text-slate-500 font-normal hidden sm:block truncate">{row.email}</span>
                        </div>
                      </td>
                      <td className="p-2 sm:p-4 hidden sm:table-cell">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-400">
                          {row.role}
                        </span>
                      </td>
                      <td className="p-2 sm:p-4 text-center font-bold text-slate-100">
                        {row.completedCount}
                      </td>
                      <td className="p-2 sm:p-4 text-center font-semibold">
                        {row.completedCount > 0 ? (
                          <span className={row.onTimeRate >= 80 ? 'text-emerald-400' : row.onTimeRate >= 50 ? 'text-amber-400' : 'text-rose-400'}>
                            {row.onTimeRate}%
                          </span>
                        ) : (
                          <span className="text-slate-655">-</span>
                        )}
                      </td>
                      <td className="p-2 sm:p-4 text-center text-slate-300">
                        {row.completedCount > 0 ? `${row.avgHours}h` : '-'}
                      </td>
                    </tr>
                  );
                })}
                {displayedRanks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 text-xs hidden sm:table-cell">
                      No active personnel records found for this period.
                    </td>
                    <td colSpan={5} className="p-8 text-center text-slate-500 text-xs sm:hidden">
                      No active personnel records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
