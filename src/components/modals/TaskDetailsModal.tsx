import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/image';

// Task type flag config
const TASK_TYPE_CONFIG: Record<string, { label: string; flag: string; color: string; bg: string; border: string }> = {
  Normal:   { label: 'Normal',   flag: '🟢', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  Regular:  { label: 'Normal',   flag: '🟢', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  Medium:   { label: 'Medium',   flag: '🟡', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
  High:     { label: 'High',     flag: '🟠', color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20'  },
  Urgent:   { label: 'Urgent',   flag: '🔴', color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20'    },
};

export const TaskDetailsModal: React.FC = () => {
  const {
    showTaskDetailsModal,
    setShowTaskDetailsModal,
    currentDetailTask,
    userRole,
    user,
    usersList,
    transferTask,
    updateTaskStatus,
    newCommentText,
    setNewCommentText,
    startVoiceRecord,
    stopVoiceRecord,
    cancelVoiceRecord,
    voiceRecordingState,
    newCommentVoiceUrl,
    newCommentImageUrl,
    setNewCommentImageUrl,
    handleCommentImageUpload,
    addComment,
    startEditTask,
    deleteTask,
    isTaskEditMode,
    setIsTaskEditMode,
    editTaskForm,
    setEditTaskForm,
    updateTaskDetails,
    cancelEditTask,
    showCustomConfirm,
    showCustomPrompt
  } = useApp();

  const [showInlineReply, setShowInlineReply] = useState(false);

  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferReasonType, setTransferReasonType] = useState<'text' | 'voice'>('text');
  const [transferVoiceState, setTransferVoiceState] = useState<'idle' | 'recording' | 'finished'>('idle');
  const [transferVoiceUrl, setTransferVoiceUrl] = useState('');
  const transferRecorderRef = useRef<MediaRecorder | null>(null);
  const transferChunksRef = useRef<Blob[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [voiceUploading, setVoiceUploading] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'recording' | 'finished'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleWhatsAppShare = () => {
    if (!currentDetailTask) return;
    
    // Find assignee's mobile number if available
    const assigneeUser = usersList.find(u => u.uid === currentDetailTask.assignedTo);
    const defaultPhone = assigneeUser?.mobileNumber || '';

    showCustomPrompt("Enter WhatsApp Mobile Number (with country code, e.g. +919876543210):", defaultPhone).then((inputPhone) => {
      if (inputPhone === null) return; // User cancelled prompt

      const phone = inputPhone.replace(/\+/g, '').replace(/\s/g, '').replace(/-/g, '');

      const allComments = currentDetailTask.comments || [];
      const firstComment = allComments.length > 0 ? allComments[0] : null;
      
      const taskTitle = currentDetailTask.taskTitle;
      const taskType = currentDetailTask.taskType || 'Normal';
      const status = currentDetailTask.status;
      const textMsg = firstComment?.text || currentDetailTask.taskMessage || '';
      const voiceUrl = firstComment?.voiceUrl || currentDetailTask.taskVoiceUrl || '';
      const imageUrl = firstComment?.imageUrl || currentDetailTask.taskImageUrl || '';
      const videoUrl = firstComment?.videoUrl || '';

      let shareText = `📋 *Task Assignment:* ${taskTitle}\n`;
      shareText += `Type: ${taskType} | Status: ${status}\n`;
      if (textMsg) shareText += `\n*Instructions:*\n${textMsg}\n`;
      if (voiceUrl) shareText += `\n🎙️ *Voice Message:*\n${voiceUrl}\n`;
      if (imageUrl) shareText += `\n🖼️ *Photo Attachment:*\n${imageUrl}\n`;
      if (videoUrl) shareText += `\n🎥 *Video Attachment:*\n${videoUrl}\n`;

      const url = `https://wa.me/${phone}?text=${encodeURIComponent(shareText)}`;
      window.open(url, '_blank');
    });
  };

  const handleWhatsAppImageShare = (imgUrl: string) => {
    if (!currentDetailTask) return;
    const assigneeUser = usersList.find(u => u.uid === currentDetailTask.assignedTo);
    const defaultPhone = assigneeUser?.mobileNumber || '';
    showCustomPrompt("Enter WhatsApp Mobile Number (with country code, e.g. +949876543210):", defaultPhone).then((inputPhone) => {
      if (inputPhone === null) return;
      const phone = inputPhone.replace(/\+/g, '').replace(/\s/g, '').replace(/-/g, '');
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(imgUrl)}`;
      window.open(url, '_blank');
    });
  };

  // Image Upload for Edit Task
  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImageUploading(true);
      const compressedBlob = await compressImage(file);
      const storageRef = ref(storage, `tasks/images/${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}.jpg`);
      await uploadBytes(storageRef, compressedBlob);
      const url = await getDownloadURL(storageRef);
      setEditTaskForm((prev: any) => ({ ...prev, taskImageUrl: url }));
    } catch (err) {
      console.error(err);
    } finally {
      setImageUploading(false);
    }
  };

  // Start Voice Recording for Edit Task
  const startEditVoiceRecording = async () => {
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            sampleSize: 16,
            echoCancellation: true,
            noiseSuppression: true
          }
        });
      } catch (err) {
        console.warn("Retrying with simple audio constraints...", err);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      audioChunksRef.current = [];
      
      let options: any = { audioBitsPerSecond: 16000 };
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4;codecs=mp4a')) {
        options.mimeType = 'audio/mp4;codecs=mp4a';
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        try {
          setVoiceUploading(true);
          let type = mediaRecorder.mimeType;
          if (!type) {
            type = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm';
          }
          const audioBlob = new Blob(audioChunksRef.current, { type });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64data = reader.result as string;
            setEditTaskForm((prev: any) => ({ ...prev, taskVoiceUrl: base64data }));
            setVoiceState('finished');
            setVoiceUploading(false);
          };
        } catch (err) {
          console.error(err);
          setVoiceUploading(false);
        }
      };

      mediaRecorder.start();
      setVoiceState('recording');
    } catch (err) {
      console.error('Microphone access error:', err);
    }
  };

  // Stop Voice Recording for Edit Task
  const stopEditVoiceRecording = () => {
    if (mediaRecorderRef.current && voiceState === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // Delete Voice for Edit Task
  const deleteEditVoiceRecord = () => {
    if (mediaRecorderRef.current && voiceState === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setEditTaskForm((prev: any) => ({ ...prev, taskVoiceUrl: '' }));
    setVoiceState('idle');
    audioChunksRef.current = [];
  };

  // Audio File Upload for Edit Task
  const handleEditAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setVoiceUploading(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setEditTaskForm((prev: any) => ({ ...prev, taskVoiceUrl: base64data }));
        setVoiceState('finished');
        setVoiceUploading(false);
      };
    } catch (err) {
      console.error(err);
      setVoiceUploading(false);
    }
  };
  if (!showTaskDetailsModal || !currentDetailTask) return null;

  const isOwnerOrAdmin = userRole === 'Admin' || currentDetailTask.createdBy === user?.uid;

  const typeKey = currentDetailTask.taskType || 'Normal';
  const typeConfig = TASK_TYPE_CONFIG[typeKey] || TASK_TYPE_CONFIG['Normal'];

  // All comments: first comment is always the original task message (from assigner),
  // subsequent comments are follow-up messages (from assigner or assignee responses).
  const allComments = currentDetailTask.comments || [];
  // Always treat the first comment as original task message if it exists
  const firstComment = allComments.length > 0 ? allComments[0] : null;
  // All remaining comments are follow-ups (index 1 onwards)
  const followUpComments = allComments.length > 1 ? allComments.slice(1) : [];

  // Transfer voice recording helpers
  const startTransferVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      transferChunksRef.current = [];
      
      let options: any = { audioBitsPerSecond: 16000 };
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4;codecs=mp4a')) {
        options.mimeType = 'audio/mp4;codecs=mp4a';
      }

      const recorder = new MediaRecorder(stream, options);
      transferRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) transferChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm';
        const blob = new Blob(transferChunksRef.current, { type });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          setTransferVoiceUrl(reader.result as string);
          setTransferVoiceState('finished');
        };
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setTransferVoiceState('recording');
    } catch { /* mic denied */ }
  };

  const stopTransferVoice = () => {
    if (transferRecorderRef.current && transferVoiceState === 'recording') {
      transferRecorderRef.current.stop();
    }
  };

  const clearTransferVoice = () => {
    if (transferRecorderRef.current && transferVoiceState === 'recording') {
      transferRecorderRef.current.stop();
    }
    setTransferVoiceUrl('');
    setTransferVoiceState('idle');
    transferChunksRef.current = [];
  };

  const handleTransferConfirm = async () => {
    if (!selectedAssignee) return;
    // Reason is optional — combine text + voice url in reason string or pass separately
    const finalReason = transferReasonType === 'voice' ? (transferVoiceUrl ? '[Voice Reason]' : '') : transferReason;
    await transferTask(selectedAssignee, finalReason);
    setSelectedAssignee('');
    setTransferReason('');
    setTransferVoiceUrl('');
    setTransferVoiceState('idle');
  };

  const statusOptions = [
    { value: 'Pending',     label: 'Pending',     icon: '⏳', activeClass: 'bg-slate-700 text-slate-200 border-slate-600' },
    { value: 'In_Progress', label: 'In Progress',  icon: '🔄', activeClass: 'bg-blue-600/80 text-blue-100 border-blue-500' },
    { value: 'Completed',   label: 'Completed',    icon: '✅', activeClass: 'bg-emerald-600/80 text-emerald-100 border-emerald-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 bg-slate-50/40 backdrop-blur-xs">
      <div className="glass rounded-2xl w-full max-w-4xl p-4 sm:p-6 space-y-4 sm:space-y-6 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            {/* Task type flag badge */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border}`}>
              <span>{typeConfig.flag}</span>
              <span>{typeConfig.label}</span>
            </span>
            <h3 className="text-xl font-bold mt-2 text-slate-100">{currentDetailTask.taskTitle}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
              {currentDetailTask.assignedToName && (
                <div>Assigned to: <span className="text-brand-400 font-semibold">{currentDetailTask.assignedToName}</span></div>
              )}
              {currentDetailTask.assignedDepartmentName && (
                <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                  🏢 Department: {currentDetailTask.assignedDepartmentName}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isOwnerOrAdmin && (
              <div className="flex items-center space-x-1.5 mr-2">
                {!isTaskEditMode && (
                  <button onClick={startEditTask} className="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded text-[10px] font-semibold transition-all">
                    ✏️ Edit Task
                  </button>
                )}
                <button onClick={() => deleteTask(currentDetailTask.taskId)} className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-semibold transition-all">
                  🗑️ Delete Task
                </button>
                {userRole === 'Admin' && currentDetailTask.status !== 'Pending' && (
                  <button
                    onClick={async () => {
                      if (await showCustomConfirm('Are you sure you want to reset this task to Not Started?')) {
                        await updateTaskStatus(currentDetailTask, 'Pending');
                      }
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-semibold transition-all cursor-pointer"
                  >
                    🔄 Reset Task
                  </button>
                )}
              </div>
            )}
            <button
              onClick={handleWhatsAppShare}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold transition-all flex items-center space-x-1 shadow-sm mr-2"
              title="Share task & attachments via WhatsApp"
            >
              <span>🟢 Share WA</span>
            </button>
            <button onClick={() => { setShowTaskDetailsModal(false); setIsTaskEditMode(false); }} className="text-slate-400 hover:text-slate-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {!isTaskEditMode ? (
          <div className="space-y-6 overflow-y-auto pr-1 flex-grow">
            <div className="max-w-2xl mx-auto space-y-4 text-left">

              {/* Task Message & Media — from Assigner (first comment) */}
              {firstComment ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
                  {/* Header row: label + assigner name + timestamp + reply button */}
                  <div className="flex items-center justify-between border-b border-brand-500/10 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-black">📩 Message from Assigner</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-black font-medium">{new Date(firstComment.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      <button 
                        onClick={() => setShowInlineReply(!showInlineReply)}
                        className="text-[10px] bg-brand-600 hover:bg-brand-500 text-white px-3 py-1 rounded font-bold transition-colors shadow-sm"
                      >
                        ↩ Reply
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] font-semibold text-black">
                    {firstComment.authorName}
                  </p>
                  {/* Text message */}
                  {(firstComment.text || currentDetailTask.taskMessage) ? (
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      {firstComment.text || currentDetailTask.taskMessage}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No text message provided.</p>
                  )}
                  {/* Voice message */}
                  {(firstComment.voiceUrl || currentDetailTask.taskVoiceUrl) && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">🎤 Voice Message</span>
                      <audio src={firstComment.voiceUrl || currentDetailTask.taskVoiceUrl} controls className="w-full h-8 text-xs bg-slate-900 border border-slate-800 rounded p-1" />
                    </div>
                  )}
                  {/* Image attachment */}
                  {(firstComment.imageUrl || currentDetailTask.taskImageUrl) && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">🖼️ Image Attachment</span>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <a href={firstComment.imageUrl || currentDetailTask.taskImageUrl} target="_blank" rel="noopener noreferrer" className="inline-block relative rounded-lg overflow-hidden border border-slate-800 hover:border-slate-700 transition-colors">
                          <img src={firstComment.imageUrl || currentDetailTask.taskImageUrl} alt="Attached" className="max-w-[200px] h-32 object-cover" />
                        </a>
                        <button
                          onClick={() => handleWhatsAppImageShare(firstComment.imageUrl || currentDetailTask.taskImageUrl || '')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                        >
                          🟢 Share Image WA
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Inline Reply UI */}
                  {showInlineReply && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      
                      {/* Previews for Reply */}
                      {newCommentVoiceUrl && (
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
                          <span className="text-[10px] uppercase font-bold text-slate-500">🎤 Voice Attached</span>
                          <audio src={newCommentVoiceUrl} controls className="h-6 flex-grow text-xs" />
                          <button onClick={cancelVoiceRecord} className="p-1 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors" title="Discard Voice">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      )}
                      {newCommentImageUrl && (
                        <div className="flex items-start gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
                          <span className="text-[10px] uppercase font-bold text-slate-500 pt-1 block w-24">🖼️ Image Attached</span>
                          <div className="relative inline-block rounded overflow-hidden">
                            <img src={newCommentImageUrl} alt="Attachment Preview" className="max-w-[150px] max-h-[100px] object-cover" />
                            <button onClick={() => setNewCommentImageUrl('')} className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white shadow hover:bg-red-600 transition-colors" title="Remove Image">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Type your reply to assigner..."
                          autoFocus
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-500/30 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 shadow-[0_0_10px_rgba(var(--brand-500),0.1)]"
                        />
                        
                        {/* Image Upload Button */}
                        <label className="p-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors flex-shrink-0 cursor-pointer" title="Attach Image">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCommentImageUpload(file);
                            }}
                          />
                        </label>

                        {/* Voice Record Button */}
                        <button
                          type="button"
                          onMouseDown={startVoiceRecord}
                          onMouseUp={stopVoiceRecord}
                          onTouchStart={(e) => { e.preventDefault(); startVoiceRecord(); }}
                          onTouchEnd={(e) => { e.preventDefault(); stopVoiceRecord(); }}
                          className={`p-2 rounded-lg transition-colors flex-shrink-0 cursor-pointer ${voiceRecordingState === 'recording' ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white'}`}
                          title="Hold to Record Voice"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </button>
                        
                        {/* Send Button */}
                        <button 
                          onClick={() => {
                            addComment();
                            setShowInlineReply(false);
                          }} 
                          className="p-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors flex-shrink-0"
                        >
                          <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* No comments at all — show placeholder */
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-slate-500 italic">No message from assigner.</p>
                </div>
              )}


              {/* Follow-Up Messages */}
              {followUpComments.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4 shadow-sm">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span>📋</span> Follow-Up Messages ({followUpComments.length})
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {followUpComments.map((c) => (
                      <div key={c.commentId} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-amber-400">
                            {c.authorName}{' '}
                            {c.authorId === currentDetailTask.createdBy ? (
                              <span className="px-1.5 py-0.5 rounded text-[8px] bg-brand-500/20 text-brand-300 border border-brand-500/30 ml-1 font-bold">Assigner</span>
                            ) : c.authorId === currentDetailTask.assignedTo ? (
                              <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/20 text-emerald-350 border border-emerald-500/30 ml-1 font-bold">Assignee Response</span>
                            ) : (
                              <span className="text-[9px] text-slate-500">({c.authorRole})</span>
                            )}
                          </span>
                          <span className="text-slate-500">{new Date(c.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                        {c.text && <p className="text-xs text-slate-700 dark:text-slate-200">{c.text}</p>}
                        {c.voiceUrl && (
                          <div className="flex items-center gap-2 bg-slate-955/60 p-2 rounded border border-slate-800">
                            <span className="text-[10px] text-amber-400">🎤</span>
                            <audio src={c.voiceUrl} controls className="h-6 flex-grow text-xs" />
                          </div>
                        )}
                        {c.imageUrl && (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-1.5">
                            <a href={c.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-block rounded overflow-hidden border border-slate-800">
                              <img src={c.imageUrl} alt="Follow-up" className="max-w-[150px] h-24 object-cover" />
                            </a>
                            <button
                              onClick={() => handleWhatsAppImageShare(c.imageUrl || '')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                            >
                              🟢 Share Image WA
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transfer task */}
              <div className="bg-slate-955/40 p-4 border border-slate-800 rounded-xl space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">🔀 Transfer Task</h4>
                <div className="space-y-3">
                  <select
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Select User --</option>
                    {usersList
                      .filter(u => u.uid !== currentDetailTask.assignedTo && u.role !== 'Pending')
                      .map((u) => (
                        <option key={u.uid} value={u.uid}>
                          {u.name}
                        </option>
                      ))}
                  </select>

                  {selectedAssignee && (
                    <>
                      {/* Reason type toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Reason (Optional):</span>
                        <button
                          onClick={() => setTransferReasonType('text')}
                          className={`px-2.5 py-1 rounded text-[10px] font-semibold border transition-all ${transferReasonType === 'text' ? 'bg-brand-600 border-brand-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                        >
                          ✏️ Text
                        </button>
                        <button
                          onClick={() => setTransferReasonType('voice')}
                          className={`px-2.5 py-1 rounded text-[10px] font-semibold border transition-all ${transferReasonType === 'voice' ? 'bg-brand-600 border-brand-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                        >
                          🎤 Voice
                        </button>
                      </div>

                      {transferReasonType === 'text' ? (
                        <textarea
                          placeholder="Reason for transfer (optional)..."
                          value={transferReason}
                          onChange={(e) => setTransferReason(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-350 focus:outline-none focus:border-brand-500 placeholder-slate-500"
                        />
                      ) : (
                        <div className="space-y-2">
                          {transferVoiceState === 'idle' && (
                            <button
                              onClick={startTransferVoice}
                              className="w-full py-2 border border-dashed border-slate-700 rounded-lg text-xs text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-colors"
                            >
                              🎤 Hold to Record Voice Reason
                            </button>
                          )}
                          {transferVoiceState === 'recording' && (
                            <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/20 rounded-lg p-2 animate-pulse">
                              <span className="text-[11px] text-rose-400 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Recording...
                              </span>
                              <button onClick={stopTransferVoice} className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded transition-colors">
                                Stop
                              </button>
                            </div>
                          )}
                          {transferVoiceState === 'finished' && transferVoiceUrl && (
                            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-lg p-2">
                              <audio src={transferVoiceUrl} controls className="h-6 flex-grow text-xs" />
                              <button onClick={clearTransferVoice} className="text-rose-500 hover:text-rose-400 font-bold px-1">✕</button>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={handleTransferConfirm}
                        className="w-full h-10 flex items-center justify-center bg-brand-600 hover:bg-brand-555 text-white rounded-lg text-[10px] font-semibold transition-all"
                      >
                        Confirm Transfer
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Progress Controls */}
              <div className="bg-slate-955/40 p-4 border border-slate-800 rounded-xl space-y-4 text-xs">
                <h4 className="font-semibold text-slate-400 uppercase tracking-wider">Status Control</h4>

                {/* Execution Status — Selection Buttons */}
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-550 uppercase font-semibold">Execution Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {statusOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updateTaskStatus(currentDetailTask, opt.value)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${
                          currentDetailTask.status === opt.value
                            ? opt.activeClass
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-base">{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateTaskDetails();
            }}
            className="space-y-4 text-left overflow-y-auto pr-1 flex-grow"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Task Type</label>
                <select
                  value={editTaskForm.taskType || 'Normal'}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, taskType: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-brand-500 text-sm"
                >
                  <option value="Normal">🟢 Normal</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="High">🟠 High</option>
                  <option value="Urgent">🔴 Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Assignee</label>
                <select
                  value={editTaskForm.assignedTo || ''}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, assignedTo: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-brand-500 text-sm"
                >
                  <option value="">-- Choose User --</option>
                  {usersList.map((u) => (
                    <option key={u.uid} value={u.uid}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Task Message / Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Task Message (Optional)</label>
              <textarea
                value={editTaskForm.taskMessage || ''}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, taskMessage: e.target.value })}
                placeholder="Enter task instructions or details here..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-brand-500 text-sm resize-none"
              />
            </div>

            {/* Reminder Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Set Reminder Alarm</label>
                <select
                  value={editTaskForm.reminderHours || 'none'}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, reminderHours: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-brand-500 text-sm"
                >
                  <option value="none">🔕 No Reminder</option>
                  <option value="1">⏰ 1 Hour</option>
                  <option value="3">⏰ 3 Hours</option>
                  <option value="6">⏰ 6 Hours</option>
                  <option value="12">⏰ 12 Hours</option>
                  <option value="24">⏰ 24 Hours</option>
                  <option value="custom">⚙️ Custom Hours</option>
                </select>
              </div>
              {editTaskForm.reminderHours === 'custom' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Custom Hours</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 1.5 or 5"
                    value={editTaskForm.reminderHoursCustom || ''}
                    onChange={(e) => setEditTaskForm({ ...editTaskForm, reminderHoursCustom: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Media Section: Image upload & Voice Recording */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Image attachment */}
              <div className="bg-slate-900/40 p-4 border border-slate-900 rounded-xl flex flex-col justify-between min-h-[110px]">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Image Attachment</span>
                {editTaskForm.taskImageUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 p-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2 truncate">
                      <img src={editTaskForm.taskImageUrl} alt="Preview" className="w-8 h-8 object-cover rounded" />
                      <span className="text-[10px] text-slate-400 truncate">Image added</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditTaskForm((prev: any) => ({ ...prev, taskImageUrl: '' }))}
                      className="text-rose-500 hover:text-rose-400 font-bold px-2 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center justify-center border border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/20 hover:bg-slate-900/40 rounded-xl p-2 cursor-pointer transition-all duration-200">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditImageUpload}
                          disabled={imageUploading}
                          className="hidden"
                        />
                        <div className="flex flex-col items-center text-slate-400 hover:text-slate-200 text-center">
                          {imageUploading ? (
                            <span className="text-[10px] animate-pulse">Uploading...</span>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-[10px]">Gallery</span>
                            </>
                          )}
                        </div>
                      </label>

                      <label className="flex items-center justify-center border border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/20 hover:bg-slate-900/40 rounded-xl p-2 cursor-pointer transition-all duration-200">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleEditImageUpload}
                          disabled={imageUploading}
                          className="hidden"
                        />
                        <div className="flex flex-col items-center text-slate-400 hover:text-slate-200 text-center">
                          {imageUploading ? (
                            <span className="text-[10px] animate-pulse">Uploading...</span>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-[10px]">Camera</span>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Voice attachment */}
              <div className="bg-slate-900/40 p-4 border border-slate-900 rounded-xl flex flex-col justify-between min-h-[110px]">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Voice Message</span>
                {voiceUploading ? (
                  <div className="flex items-center justify-center p-2 text-xs text-slate-400 animate-pulse">
                    Uploading audio...
                  </div>
                ) : editTaskForm.taskVoiceUrl ? (
                  <div className="relative rounded-lg border border-slate-800 bg-slate-950 p-2 flex items-center justify-between">
                    <audio src={editTaskForm.taskVoiceUrl} controls className="h-6 w-[80%] text-xs" />
                    <button
                      type="button"
                      onClick={deleteEditVoiceRecord}
                      className="text-rose-500 hover:text-rose-400 font-bold px-2 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ) : voiceState === 'recording' ? (
                  <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/20 rounded-xl p-2 animate-pulse">
                    <div className="flex items-center space-x-1.5 text-[11px] text-rose-400">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>Recording...</span>
                    </div>
                    <button
                      type="button"
                      onClick={stopEditVoiceRecording}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded-lg transition-colors"
                    >
                      Stop
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={startEditVoiceRecording}
                      className="flex flex-col items-center justify-center border border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/20 hover:bg-slate-900/40 rounded-xl p-2 text-slate-400 hover:text-slate-200 transition-all duration-200"
                    >
                      <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <span className="text-[10px]">Record</span>
                    </button>
                    
                    <label className="flex flex-col items-center justify-center border border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/20 hover:bg-slate-900/40 rounded-xl p-2 cursor-pointer text-slate-400 hover:text-slate-200 transition-all duration-200">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleEditAudioUpload}
                        disabled={voiceUploading}
                        className="hidden"
                      />
                      <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                      <span className="text-[10px]">Attach Audio</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <button type="submit" className="w-1/2 h-10 flex items-center justify-center bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-all cursor-pointer">
                Save Changes
              </button>
              <button type="button" onClick={cancelEditTask} className="w-1/2 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-all cursor-pointer">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
