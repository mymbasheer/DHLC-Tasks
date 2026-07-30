import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const BroadcastModal: React.FC = () => {
  const {
    showBroadcastModal,
    setShowBroadcastModal,
    sendBroadcast,
    broadcastVoiceRecordingState,
    broadcastVoiceUrl,
    setBroadcastVoiceUrl,
    startBroadcastVoiceRecord,
    stopBroadcastVoiceRecord,
    cancelBroadcastVoiceRecord
  } = useApp();

  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  if (!showBroadcastModal) return null;

  const handleSend = async () => {
    if (!messageText.trim() && !broadcastVoiceUrl) {
      alert('Please enter a message or record a voice note to broadcast!');
      return;
    }
    try {
      setSending(true);
      await sendBroadcast(messageText.trim(), broadcastVoiceUrl);
      // Reset state
      setMessageText('');
      setBroadcastVoiceUrl('');
      setShowBroadcastModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    cancelBroadcastVoiceRecord();
    setMessageText('');
    setBroadcastVoiceUrl('');
    setShowBroadcastModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-955/80 backdrop-blur-sm p-2 sm:p-4 flex items-start sm:items-center justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 sm:p-6 my-auto shadow-2xl relative space-y-5 text-left">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📢</span>
            <h3 className="text-lg font-bold text-white">Broadcast Alert</h3>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Broadcast a real-time message to all active personnel in the DHLC Tasks system. The message will pop up instantly on their screen with an alarm.
        </p>

        {/* Text area */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Message Text</label>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your announcement here..."
            rows={4}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-slate-200 focus:outline-none focus:border-brand-500 text-sm resize-none"
          />
        </div>

        {/* Voice recording */}
        <div className="space-y-2 bg-slate-950/40 p-4 border border-slate-950 rounded-2xl">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Voice Announcement</label>
          
          {broadcastVoiceRecordingState === 'idle' && (
            <button
              type="button"
              onClick={startBroadcastVoiceRecord}
              className="w-full py-3 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              🎤 Start Voice Recording
            </button>
          )}

          {broadcastVoiceRecordingState === 'recording' && (
            <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 animate-pulse">
              <span className="text-xs text-rose-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-ping" />
                Recording broadcast...
              </span>
              <button
                type="button"
                onClick={stopBroadcastVoiceRecord}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Stop
              </button>
            </div>
          )}

          {broadcastVoiceRecordingState === 'finished' && broadcastVoiceUrl && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2">
                <audio src={broadcastVoiceUrl} controls className="h-8 flex-grow text-xs" />
                <button
                  type="button"
                  onClick={() => setBroadcastVoiceUrl('')}
                  className="text-rose-500 hover:text-rose-400 font-bold px-2 text-sm cursor-pointer"
                  title="Remove Voice note"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3.5 border border-slate-800 hover:bg-slate-800 text-slate-350 font-bold rounded-2xl transition-all cursor-pointer text-center text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="flex-1 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl shadow-lg transition-all disabled:opacity-50 cursor-pointer text-center text-sm"
          >
            {sending ? 'Broadcasting...' : '📢 Broadcast Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
