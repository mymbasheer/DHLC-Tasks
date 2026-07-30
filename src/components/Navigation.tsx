import React from 'react';
import { useApp } from '../context/AppContext';

export const Navigation: React.FC = () => {
  const { currentTab, setCurrentTab, userRole, user, mobileMenuOpen, setMobileMenuOpen, forceAppUpdate } = useApp();

  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone || 
                         document.referrer.includes('android-app://');
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }
    
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleForceInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    } else {
      alert("To install this app on your device:\n\n- On iOS (Safari): Tap the Share icon and select 'Add to Home Screen'.\n- On Android / Desktop: Tap the browser menu (3 dots) and select 'Install app' or 'Add to Home screen'.");
    }
  };

  const p = user?.permissions || {};
  const isAdminOrOwner = userRole === 'Admin';

  const canCreate = isAdminOrOwner || p.canCreateTasks;
  const canViewReports = isAdminOrOwner || p.canViewReports;
  const canViewPerformance = p.canViewPerformance !== false;
  const canViewMap = isAdminOrOwner || p.canViewMap;
  const canManageUsers = isAdminOrOwner || p.canManageUsers;

  const navItems = [
    {
      id: 'tasks',
      label: 'My Tasks',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      show: true
    },
    {
      id: 'completed_tasks',
      label: 'Task History',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      ),
      show: true
    },
    {
      id: 'created_tasks',
      label: 'Created Tasks',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      show: canCreate
    },
    {
      id: 'reports',
      label: 'Reports Desk',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      show: canViewReports
    },
    {
      id: 'performance',
      label: 'Performance Dashboard',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      show: canViewPerformance
    },
    {
      id: 'map',
      label: 'Location Map',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      show: canViewMap
    },
    {
      id: 'invites',
      label: 'User Management',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      show: canManageUsers
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-50/30 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 md:top-[65px] left-0 z-50 md:z-30 h-screen md:h-[calc(100vh-65px)] w-60 shrink-0 border-r border-slate-200/80 bg-white md:bg-transparent p-5 space-y-4 overflow-y-auto transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile Header Inside Drawer */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 md:hidden">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 60%, #8b5cf6 100%)' }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-bold text-sm text-slate-900">DHLC Tasks</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-1">
          {navItems.filter(item => item.show).map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center space-x-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap cursor-pointer w-full ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-100'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => {
              forceAppUpdate();
              setMobileMenuOpen(false);
            }}
            className="flex items-center space-x-3 px-3.5 py-2.5 text-xs font-semibold rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-455 transition-all duration-200 whitespace-nowrap cursor-pointer w-full mt-6 border border-dashed border-slate-700/50"
          >
            <span className="text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L22 4" />
              </svg>
            </span>
            <span>Check for Updates</span>
          </button>

          {!isInstalled && (
            <button
              onClick={handleForceInstall}
              className="flex items-center space-x-3 px-3.5 py-2.5 text-xs font-bold rounded-lg text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 transition-all duration-200 whitespace-nowrap cursor-pointer w-full mt-3 border border-blue-500/20 shadow-sm"
            >
              <span className="text-blue-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </span>
              <span>Install App</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
