import React from 'react';
import { useApp } from './context/AppContext';
import { Loader } from './components/layout/Loader';
import { Toast } from './components/layout/Toast';
import { Header } from './components/layout/Header';
import { Navigation } from './components/Navigation';
import { Auth } from './components/Auth';
import { MyTasks } from './components/tabs/MyTasks';
import { CompletedTasks } from './components/tabs/CompletedTasks';
import { CreatedTasks } from './components/tabs/CreatedTasks';

import { Invitations } from './components/tabs/Invitations';
import { Reports } from './components/tabs/Reports';
import { MapView } from './components/tabs/MapView';
import { Performance } from './components/tabs/Performance';
import { CreateTaskModal } from './components/modals/CreateTaskModal';
import { TaskDetailsModal } from './components/modals/TaskDetailsModal';
import { AssignmentNotification } from './components/layout/AssignmentNotification';
import { InstallPrompt } from './components/layout/InstallPrompt';
import { BroadcastModal } from './components/modals/BroadcastModal';

const AppContent: React.FC = () => {
  const {
    user,
    userRole,
    logout,
    activeReminderAlarm,
    setActiveReminderAlarm,
    stopAlarmSound,
    activeBroadcast,
    setActiveBroadcast,
    customDialog
  } = useApp();

  return (
    <div className="min-h-screen text-slate-100 flex flex-col antialiased">
      <Loader />
      <Toast />
      <AssignmentNotification />
      <InstallPrompt />
      <Header />

      {/* Main Container */}
      <div className="flex-grow flex flex-col md:flex-row w-full max-w-none">
        {!user ? (
          <main className="flex-grow p-4 md:p-6 max-w-md w-full mx-auto space-y-6">
            <Auth />
          </main>
        ) : userRole === 'Pending' ? (
          <main className="flex-grow flex items-center justify-center p-4 md:p-6 max-w-lg w-full mx-auto">
            <div className="glass rounded-2xl p-8 space-y-6 text-center shadow-xl border border-slate-800">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <svg className="w-12 h-12 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-100">Account Awaiting Approval</h2>
                <p className="text-sm text-slate-400">
                  Hello, <span className="font-semibold text-slate-200">{user.displayName || user.name || user.email}</span>!
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your account has been registered successfully. An Administrator will review and activate your permissions shortly.
                </p>
              </div>
              <button
                onClick={logout}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Log Out / Switch Account
              </button>
            </div>
          </main>
        ) : (
          <>
            <Navigation />
            <main className="flex-grow p-4 md:p-6 space-y-6 overflow-x-hidden">
              <MyTasks />
              <CompletedTasks />
              <CreatedTasks />
              <Performance />
              <MapView />
              <Invitations />
              <Reports />
            </main>
          </>
        )}
      </div>

      <CreateTaskModal />
      <TaskDetailsModal />
      <BroadcastModal />

      {activeReminderAlarm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md">
          <div className="glass rounded-3xl p-8 max-w-sm w-full text-center space-y-6 border border-brand-500/30 shadow-2xl animate-shake">
            <div className="w-20 h-20 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto text-4xl animate-ring-bell shadow-[0_0_20px_rgba(244,63,94,0.4)]">
              🔔
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Task Reminder!</h3>
              <p className="text-sm font-semibold text-brand-400">{activeReminderAlarm.taskTitle}</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {activeReminderAlarm.comments?.[0]?.text || "This task requires your attention now."}
              </p>
            </div>
            <button
              onClick={() => {
                stopAlarmSound();
                setActiveReminderAlarm(null);
              }}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl shadow-lg transition-all duration-200 cursor-pointer"
            >
              Dismiss Reminder
            </button>
          </div>
        </div>
      )}      {activeBroadcast && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass rounded-3xl p-8 max-w-sm w-full text-center space-y-6 border border-rose-500/30 shadow-2xl animate-shake">
            <div className="w-20 h-20 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto text-4xl animate-ring-bell shadow-[0_0_20px_rgba(244,63,94,0.4)]">
              📢
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Broadcast Alert!</h3>
              <p className="text-xs text-slate-400">Received from {activeBroadcast.createdByName || 'Admin'}</p>
              
              {activeBroadcast.text && (
                <p className="text-sm font-semibold text-brand-300 leading-relaxed pt-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                  {activeBroadcast.text}
                </p>
              )}

              {activeBroadcast.voiceUrl && (
                <div className="pt-3">
                  <span className="block text-[10px] text-slate-500 font-semibold mb-1 uppercase tracking-wider">Voice Broadcast</span>
                  <audio src={activeBroadcast.voiceUrl} controls className="w-full h-8 bg-slate-950 rounded-xl" autoPlay />
                </div>
              )}
            </div>
            <button
              onClick={() => {
                stopAlarmSound();
                localStorage.setItem('fj-dismissed-broadcast-id', activeBroadcast.id);
                setActiveBroadcast(null);
              }}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl shadow-lg transition-all duration-200 cursor-pointer"
            >
              Close Announcement
            </button>
          </div>
        </div>
      )}

      {customDialog && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass rounded-3xl p-6 max-w-sm w-full space-y-4 border border-brand-500/30 shadow-2xl text-left">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              ⚠️ {customDialog.title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {customDialog.message}
            </p>
            {customDialog.type === 'prompt' && (
              <input
                type="text"
                defaultValue={customDialog.defaultValue}
                placeholder={customDialog.placeholder}
                id="custom-dialog-input"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (document.getElementById('custom-dialog-input') as HTMLInputElement)?.value;
                    customDialog.onResolve(val);
                  }
                }}
              />
            )}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  if (customDialog.type === 'prompt') {
                    const val = (document.getElementById('custom-dialog-input') as HTMLInputElement)?.value;
                    customDialog.onResolve(val);
                  } else {
                    customDialog.onResolve(true);
                  }
                }}
                className="w-1/2 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow transition-colors cursor-pointer text-center"
              >
                Confirm
              </button>
              <button
                onClick={() => customDialog.onResolve(null)}
                className="w-1/2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-305 text-xs font-semibold rounded-xl transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded bell ring animations */}
      <style>{`
        @keyframes ringBell {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(15deg); }
          20% { transform: rotate(-10deg); }
          30% { transform: rotate(12deg); }
          40% { transform: rotate(-8deg); }
          50% { transform: rotate(10deg); }
          60% { transform: rotate(-6deg); }
          70% { transform: rotate(4deg); }
          80% { transform: rotate(-3deg); }
          90% { transform: rotate(2deg); }
        }
        @keyframes alertShake {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        .animate-ring-bell {
          animation: ringBell 0.8s ease-in-out infinite;
        }
        .animate-shake {
          animation: alertShake 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AppContent;
