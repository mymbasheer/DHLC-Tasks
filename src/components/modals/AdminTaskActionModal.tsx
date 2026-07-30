import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface AdminTaskActionModalProps {
  task: Task | null;
  onClose: () => void;
}

export const AdminTaskActionModal: React.FC<AdminTaskActionModalProps> = ({ task, onClose }) => {
  const { user, showToast } = useApp();
  const [actionType, setActionType] = useState<'cancel' | 'postpone' | 'suspend'>('postpone');
  const [postponeDate, setPostponeDate] = useState<string>(
    task?.dueDate ? task.dueDate.slice(0, 16) : new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [suspendUntilDate, setSuspendUntilDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16)
  );
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      showToast('Mandatory comment / reason is required for this action.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const taskRef = doc(db, 'tasks', task.taskId);
      const nowIso = new Date().toISOString();
      const auditLog = {
        logId: 'log_' + Math.random().toString(36).substr(2, 9),
        timestamp: nowIso,
        actorId: user?.uid || 'admin',
        actorName: user?.name || user?.email || 'Admin',
        action: actionType === 'cancel' ? 'Task Cancelled / Deleted' : actionType === 'postpone' ? 'Task Postponed' : 'Task Suspended',
        details: commentText.trim()
      };

      const newAuditTrail = [...(task.auditTrail || []), auditLog];
      const newComments = [
        ...(task.comments || []),
        {
          commentId: 'comm_' + Math.random().toString(36).substr(2, 9),
          authorId: user?.uid || 'admin',
          authorName: user?.name || user?.email || 'Admin',
          authorRole: 'Admin',
          text: `⚠️ [Admin Action: ${actionType.toUpperCase()}] ${commentText.trim()}`,
          createdAt: nowIso
        }
      ];

      if (actionType === 'cancel') {
        await setDoc(taskRef, {
          status: 'Cancelled',
          actionReason: commentText.trim(),
          updatedAt: nowIso,
          auditTrail: newAuditTrail,
          comments: newComments
        }, { merge: true });
        showToast(`Task "${task.taskTitle}" has been cancelled/deleted with comments.`, 'success');
      } else if (actionType === 'postpone') {
        const newDateKey = postponeDate.split('T')[0];
        await setDoc(taskRef, {
          dueDate: postponeDate,
          dateKey: newDateKey,
          postponedTill: postponeDate,
          actionReason: commentText.trim(),
          updatedAt: nowIso,
          auditTrail: newAuditTrail,
          comments: newComments
        }, { merge: true });
        showToast(`Task postponed until ${new Date(postponeDate).toLocaleString()}`, 'success');
      } else if (actionType === 'suspend') {
        await setDoc(taskRef, {
          status: 'Suspended',
          suspendedUntil: suspendUntilDate,
          actionReason: commentText.trim(),
          updatedAt: nowIso,
          auditTrail: newAuditTrail,
          comments: newComments
        }, { merge: true });
        showToast(`Task suspended until ${new Date(suspendUntilDate).toLocaleString()}`, 'success');
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      showToast(`Action failed: ${err.message || err}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-lg p-6 space-y-5 border border-slate-800 text-left shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>⚡ Admin Task Control</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-semibold">{task.taskTitle}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Action Selector */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Action</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActionType('postpone')}
                className={`py-2 px-3 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                  actionType === 'postpone' ? 'bg-amber-600/20 text-amber-400 border-amber-500/50 shadow' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                ⏰ Postpone
              </button>
              <button
                type="button"
                onClick={() => setActionType('suspend')}
                className={`py-2 px-3 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                  actionType === 'suspend' ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                ⏸️ Suspend
              </button>
              <button
                type="button"
                onClick={() => setActionType('cancel')}
                className={`py-2 px-3 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                  actionType === 'cancel' ? 'bg-rose-600/20 text-rose-400 border-rose-500/50 shadow' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                🚫 Cancel / Delete
              </button>
            </div>
          </div>

          {/* Conditional Inputs */}
          {actionType === 'postpone' && (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-400">Postpone Till Date & Time</label>
              <input
                type="datetime-local"
                value={postponeDate}
                onChange={(e) => setPostponeDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          )}

          {actionType === 'suspend' && (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-400">Suspend Timeframe (Resume Date & Time)</label>
              <input
                type="datetime-local"
                value={suspendUntilDate}
                onChange={(e) => setSuspendUntilDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          )}

          {actionType === 'cancel' && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-300">
              ⚠️ Warning: Marking this task as Cancelled will halt its execution and remove it from active boards.
            </div>
          )}

          {/* Mandatory Comment */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Mandatory Admin Reason / Comments *
            </label>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Enter details explaining why this task is being postponed, suspended, or cancelled..."
              rows={3}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 text-white font-bold rounded-xl shadow transition-all cursor-pointer ${
                actionType === 'cancel' ? 'bg-rose-600 hover:bg-rose-500' : actionType === 'suspend' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-amber-600 hover:bg-amber-500'
              }`}
            >
              {submitting ? 'Applying...' : 'Save & Submit Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
