import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

// Ring sound — plays a distinct 3-tone chime for new messages/tasks
function playRingTone() {
  try {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const tones = [
      { freq: 523.25, start: 0,    dur: 0.18 }, // C5
      { freq: 659.25, start: 0.20, dur: 0.18 }, // E5
      { freq: 783.99, start: 0.40, dur: 0.30 }, // G5
    ];

    tones.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });
  } catch (e) {
    console.warn('Ring tone blocked:', e);
  }
}

const TYPE_CONFIG = {
  new: {
    accent: 'bg-brand-500',
    iconBg: 'bg-brand-500/10 border-brand-500/20 text-brand-400',
    title: '🆕 New Task Assigned',
    buttonClass: 'bg-brand-600 hover:bg-brand-500 shadow-brand-600/10',
  },
  transfer: {
    accent: 'bg-amber-500',
    iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    title: '🔀 Task Transferred to You',
    buttonClass: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/10',
  },
  message: {
    accent: 'bg-rose-500',
    iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    title: '💬 New Follow-Up Message',
    buttonClass: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/10',
  },
};

export const AssignmentNotification: React.FC = () => {
  const { assignmentNotification, setAssignmentNotification, openTaskDetails } = useApp();
  const hasRungRef = useRef(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (assignmentNotification && !hasRungRef.current) {
      playRingTone();
      hasRungRef.current = true;
      // Auto-dismiss after 8 seconds
      timer = setTimeout(() => {
        setAssignmentNotification(null);
        hasRungRef.current = false;
      }, 8000);
    }
    if (!assignmentNotification) {
      hasRungRef.current = false;
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [assignmentNotification]);

  if (!assignmentNotification) return null;

  const { task, type, authorName } = assignmentNotification;
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.new;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-start sm:justify-end p-4 pointer-events-none">
      <div
        className="w-full max-w-sm glass border border-slate-800 rounded-2xl shadow-2xl p-4 space-y-4 pointer-events-auto bg-slate-950/90 backdrop-blur-xl relative overflow-hidden"
        style={{ animation: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Color accent top bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${cfg.accent}`} />

        {/* Ring pulse ring */}
        <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full ${cfg.accent} opacity-10 animate-ping`} />

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`p-2.5 rounded-xl border flex-shrink-0 ${cfg.iconBg}`}>
            {type === 'transfer' && (
              <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            )}
            {type === 'new' && (
              <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            )}
            {type === 'message' && (
              <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-grow text-left space-y-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-100">{cfg.title}</h4>
            <p className="text-sm font-semibold text-slate-200 truncate">{task.taskTitle}</p>
            {type === 'message' && authorName && (
              <p className="text-[10px] text-rose-300 font-medium">From: {authorName}</p>
            )}
            {task.clientDetails?.isClientRelated && (
              <p className="text-[10px] text-slate-400 font-medium">
                Client: {task.clientDetails.clientName}
              </p>
            )}
            <p className="text-[10px] text-slate-500">
              Due: {new Date(task.dueDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </p>
          </div>

          {/* Close */}
          <button
            onClick={() => setAssignmentNotification(null)}
            className="text-slate-550 hover:text-slate-300 transition-colors p-1 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              openTaskDetails(task);
              setAssignmentNotification(null);
            }}
            className={`flex-grow py-2 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer text-center shadow-lg ${cfg.buttonClass}`}
          >
            {type === 'message' ? 'View Message' : 'Open Task'}
          </button>
          <button
            onClick={() => setAssignmentNotification(null)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-all border border-slate-850 cursor-pointer"
          >
            Dismiss
          </button>
        </div>

        {/* Auto-dismiss progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800">
          <div
            className={`h-full ${cfg.accent} opacity-60`}
            style={{ animation: 'shrinkWidth 8s linear forwards' }}
          />
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes shrinkWidth {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
};
