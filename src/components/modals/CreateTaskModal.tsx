import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { db, storage } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/image';

export const CreateTaskModal: React.FC = () => {
  const {
    showCreateTaskModal,
    setShowCreateTaskModal,
    taskForm,
    setTaskForm,
    assignableUsers,
    departmentsList,
    submitCreateTask
  } = useApp();

  const [assignmentType, setAssignmentType] = useState<'individual' | 'department'>('individual');
  const [taskTitlePreview, setTaskTitlePreview] = useState<string>('...');
  const [voiceState, setVoiceState] = useState<'idle' | 'recording' | 'finished'>('idle');
  const [imageUploading, setImageUploading] = useState(false);
  const [voiceUploading, setVoiceUploading] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Fetch count of existing tasks to preview the auto task number
  useEffect(() => {
    if (showCreateTaskModal) {
      const fetchTaskCount = async () => {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dateKeyPrefix = `${dd}${mm}`;

        try {
          const docRef = doc(db, 'settings', 'task_counter');
          const docSnap = await getDoc(docRef);
          let currentNumber = 0;
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.datePrefix === dateKeyPrefix) {
              currentNumber = data.currentNumber || 0;
            }
          }
          setTaskTitlePreview(`${dateKeyPrefix}-${currentNumber + 1}`);
        } catch (_) {
          setTaskTitlePreview(`${dateKeyPrefix}-1`);
        }
      };
      fetchTaskCount();
    }
  }, [showCreateTaskModal]);

  if (!showCreateTaskModal) return null;

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageUploading(true);
      const compressedBlob = await compressImage(file);
      const storageRef = ref(storage, `tasks/images/${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}.jpg`);
      await uploadBytes(storageRef, compressedBlob);
      const url = await getDownloadURL(storageRef);
      setTaskForm((prev: any) => ({ ...prev, taskImageUrl: url }));
    } catch (err) {
      console.error(err);
    } finally {
      setImageUploading(false);
    }
  };

  // Start Voice Recording
  const startRecording = async () => {
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
            setTaskForm((prev: any) => ({ ...prev, taskVoiceUrl: base64data }));
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

  // Stop Voice Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && voiceState === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // Cancel Voice Recording / Delete Audio
  const deleteVoiceRecord = () => {
    if (mediaRecorderRef.current && voiceState === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setTaskForm((prev: any) => ({ ...prev, taskVoiceUrl: '' }));
    setVoiceState('idle');
    audioChunksRef.current = [];
  };

  // Handle Audio File Upload/Attachment
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setVoiceUploading(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setTaskForm((prev: any) => ({ ...prev, taskVoiceUrl: base64data }));
        setVoiceState('finished');
        setVoiceUploading(false);
      };
    } catch (err) {
      console.error(err);
      setVoiceUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 flex items-start sm:items-center justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 my-auto shadow-2xl relative space-y-5 text-left">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h3 className="text-lg font-bold">Create New Task / Work Order</h3>
            <p className="text-xs text-slate-400">
              Task Number: <span className="font-semibold text-brand-400">{taskTitlePreview}</span>
            </p>
          </div>
          <button onClick={() => setShowCreateTaskModal(false)} className="text-slate-400 hover:text-slate-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (isCreatingTask) return;
            setIsCreatingTask(true);
            try {
              await submitCreateTask();
            } finally {
              setIsCreatingTask(false);
            }
          }}
          className="space-y-4 text-left"
        >
          {/* Target Assignment Mode Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Dispatch Target</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAssignmentType('individual');
                  setTaskForm({ ...taskForm, assignedDepartmentId: '' });
                }}
                className={`py-2 rounded-lg transition-all ${
                  assignmentType === 'individual'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                👤 Individual Personnel
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssignmentType('department');
                  setTaskForm({ ...taskForm, assignedTo: '' });
                }}
                className={`py-2 rounded-lg transition-all ${
                  assignmentType === 'department'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🏢 Department Group
              </button>
            </div>
          </div>

          {/* Task Type & Target Assignee Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Task Urgency</label>
              <select
                value={taskForm.taskType}
                onChange={(e) => setTaskForm({ ...taskForm, taskType: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-brand-500 text-sm"
              >
                <option value="Normal">🟢 Normal</option>
                <option value="Medium">🟡 Medium</option>
                <option value="High">🟠 High</option>
                <option value="Urgent">🔴 Urgent</option>
              </select>
            </div>
            
            {assignmentType === 'individual' ? (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Assignee</label>
                <select
                  value={taskForm.assignedTo}
                  onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                  required={assignmentType === 'individual'}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-brand-500 text-sm"
                >
                  <option value="">-- Choose User --</option>
                  {assignableUsers.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.name} {u.departmentName ? `(${u.departmentName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 font-bold text-emerald-400">Target Department</label>
                <select
                  value={taskForm.assignedDepartmentId}
                  onChange={(e) => setTaskForm({ ...taskForm, assignedDepartmentId: e.target.value })}
                  required={assignmentType === 'department'}
                  className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500 text-sm font-semibold"
                >
                  <option value="">-- Choose Department --</option>
                  {departmentsList.map((d) => (
                    <option key={d.departmentId} value={d.departmentId}>
                      🏢 {d.departmentName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Preset Task Templates */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Task Template Presets</label>
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'field_dispatch') {
                  setTaskForm({
                    ...taskForm,
                    taskType: 'Urgent',
                    taskMessage: 'Field Service Dispatch: Perform immediate site inspection, complete safety checklist, and take photo verification.',
                    checklist: [
                      { itemId: '1', title: 'Conduct initial site safety check', completed: false },
                      { itemId: '2', title: 'Complete field service work order log', completed: false },
                      { itemId: '3', title: 'Capture site photos and customer signature', completed: false }
                    ]
                  });
                } else if (val === 'inventory_audit') {
                  setTaskForm({
                    ...taskForm,
                    taskType: 'High',
                    taskMessage: 'Inventory & Stock Audit: Verify stock balances across all warehouse racks and submit count log.',
                    checklist: [
                      { itemId: '1', title: 'Scan rack barcodes and count boxes', completed: false },
                      { itemId: '2', title: 'Log stock variance report', completed: false }
                    ]
                  });
                } else if (val === 'maintenance') {
                  setTaskForm({
                    ...taskForm,
                    taskType: 'Medium',
                    taskMessage: 'Scheduled Maintenance: Perform routine equipment check and clean filters.',
                    checklist: [
                      { itemId: '1', title: 'Inspect machinery oil & filter levels', completed: false },
                      { itemId: '2', title: 'Update maintenance log sheet', completed: false }
                    ]
                  });
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500 font-semibold"
            >
              <option value="">-- Choose Standard Template (Optional) --</option>
              <option value="field_dispatch">⚡ Standard Field Service Dispatch</option>
              <option value="inventory_audit">📦 Inventory & Warehouse Audit</option>
              <option value="maintenance">🔧 Scheduled Equipment Maintenance</option>
            </select>
          </div>

          {/* Task Message / Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Task Message / Instructions</label>
            <textarea
              value={taskForm.taskMessage || ''}
              onChange={(e) => setTaskForm({ ...taskForm, taskMessage: e.target.value })}
              placeholder="Enter detailed task instructions or work order details here..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-brand-500 text-sm resize-none"
            />
          </div>

          {/* Checklist Item Builder */}
          <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Work Order Checklist ({taskForm.checklist?.length || 0})</span>
              <button
                type="button"
                onClick={() => {
                  const currentList = taskForm.checklist || [];
                  setTaskForm({
                    ...taskForm,
                    checklist: [...currentList, { itemId: Date.now().toString(), title: '', completed: false }]
                  });
                }}
                className="text-[10px] bg-brand-600/20 text-brand-400 hover:bg-brand-600/40 px-2 py-0.5 rounded font-bold transition-all"
              >
                + Add Sub-Item
              </button>
            </div>
            {taskForm.checklist && taskForm.checklist.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {taskForm.checklist.map((item: any, idx: number) => (
                  <div key={item.itemId || idx} className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                    <input
                      type="text"
                      placeholder="Checklist step / action..."
                      value={item.title}
                      onChange={(e) => {
                        const updated = [...taskForm.checklist];
                        updated[idx].title = e.target.value;
                        setTaskForm({ ...taskForm, checklist: updated });
                      }}
                      className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = taskForm.checklist.filter((_: any, i: number) => i !== idx);
                        setTaskForm({ ...taskForm, checklist: updated });
                      }}
                      className="text-rose-500 text-xs px-1 hover:text-rose-400 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reminder Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Set Reminder Alarm</label>
              <select
                value={taskForm.reminderHours || 'none'}
                onChange={(e) => setTaskForm({ ...taskForm, reminderHours: e.target.value })}
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
            {taskForm.reminderHours === 'custom' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Custom Hours</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 1.5 or 5"
                  value={taskForm.reminderHoursCustom || ''}
                  onChange={(e) => setTaskForm({ ...taskForm, reminderHoursCustom: e.target.value })}
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
              {taskForm.taskImageUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 p-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2 truncate">
                    <img src={taskForm.taskImageUrl} alt="Preview" className="w-8 h-8 object-cover rounded" />
                    <span className="text-[10px] text-slate-400 truncate">Image added</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTaskForm((prev: any) => ({ ...prev, taskImageUrl: '' }))}
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
                        onChange={handleImageUpload}
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
                        onChange={handleImageUpload}
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
              ) : taskForm.taskVoiceUrl ? (
                <div className="relative rounded-lg border border-slate-800 bg-slate-950 p-2 flex items-center justify-between">
                  <audio src={taskForm.taskVoiceUrl} controls className="h-6 w-[80%] text-xs" />
                  <button
                    type="button"
                    onClick={deleteVoiceRecord}
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
                    onClick={stopRecording}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded-lg transition-colors"
                  >
                    Stop
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={startRecording}
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
                      onChange={handleAudioUpload}
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

          <button
            type="submit"
            disabled={imageUploading || voiceUploading || isCreatingTask}
            className="w-full h-11 flex items-center justify-center bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-600/20"
          >
            {isCreatingTask ? 'Creating...' : imageUploading || voiceUploading ? 'Processing Attachments...' : 'Create Task'}
          </button>
        </form>
      </div>
    </div>
  );
};
