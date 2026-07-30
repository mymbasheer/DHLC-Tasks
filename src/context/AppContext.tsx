import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  auth, 
  db, 
  storage,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  writeBatch,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteDoc,
  deleteObject,
  signInWithPopup,
  GoogleAuthProvider,
  runTransaction,
  signInWithCredential
} from '../firebase';
import { requestNotificationPermission, setupMessageListener } from '../firebase-messaging';
import { 
  User, 
  Task, 
  Invitation, 
  Comment,
  Department
} from '../types';
import { compressImage } from '../utils/image';

export interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface AppContextType {
  loading: boolean;
  user: any; // User details or current auth user
  userRole: string;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  authForm: { name: string; email: string; password: string };
  setAuthForm: React.Dispatch<React.SetStateAction<{ name: string; email: string; password: string }>>;
  inviteToken: string;
  setInviteToken: (t: string) => void;
  invitedData: Invitation | null;
  setInvitedData: (d: Invitation | null) => void;
  impersonatedUserUid: string;
  showTaskDetailsModal: boolean;
  setShowTaskDetailsModal: (b: boolean) => void;
  activeDetailTask: Task | null;
  setActiveDetailTask: (t: Task | null) => void;
  currentDetailTask: Task | null;
  newCommentText: string;
  setNewCommentText: (s: string) => void;
  newCommentVoiceUrl: string;
  setNewCommentVoiceUrl: (s: string) => void;
  newCommentImageUrl: string;
  setNewCommentImageUrl: (s: string) => void;
  voiceRecordingState: 'idle' | 'recording' | 'finished';
  setVoiceRecordingState: (s: 'idle' | 'recording' | 'finished') => void;
  commentUploading: boolean;
  currentTab: string;
  setCurrentTab: (t: string) => void;
  toast: ToastState;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  myTasks: Task[];
  createdTasks: Task[];
  performanceRecords: any[];
  activeReminderAlarm: Task | null;
  setActiveReminderAlarm: (t: Task | null) => void;
  stopAlarmSound: () => void;
  masterTasks: Task[];
  activeBroadcast: any | null;
  setActiveBroadcast: (b: any | null) => void;
  sendBroadcast: (text: string, voiceUrl: string) => Promise<void>;
  broadcastVoiceRecordingState: 'idle' | 'recording' | 'finished';
  broadcastVoiceUrl: string;
  setBroadcastVoiceUrl: (url: string) => void;
  startBroadcastVoiceRecord: () => Promise<void>;
  stopBroadcastVoiceRecord: () => void;
  cancelBroadcastVoiceRecord: () => void;
  showBroadcastModal: boolean;
  setShowBroadcastModal: (show: boolean) => void;
  forceAppUpdate: () => Promise<void>;
  usersList: User[];
  departmentsList: Department[];
  createDepartment: (departmentName: string, description?: string) => Promise<void>;
  deleteDepartment: (departmentId: string) => Promise<void>;
  
  todayDateKey: string;
  setTodayDateKey: (d: string) => void;
  
  // Forms & Modal triggers
  taskForm: any;
  setTaskForm: React.Dispatch<React.SetStateAction<any>>;
  inviteForm: { name: string; email: string; role: string; mobileNumber: string };
  setInviteForm: React.Dispatch<React.SetStateAction<{ name: string; email: string; role: string; mobileNumber: string }>>;
  newTaskTypeForm: { typeName: string };
  setNewTaskTypeForm: React.Dispatch<React.SetStateAction<{ typeName: string }>>;
  
  showCreateTaskModal: boolean;
  setShowCreateTaskModal: (b: boolean) => void;
  
  generatedLink: string;
  setGeneratedLink: (s: string) => void;
  
  isTaskEditMode: boolean;
  setIsTaskEditMode: (b: boolean) => void;
  editTaskForm: any;
  setEditTaskForm: React.Dispatch<React.SetStateAction<any>>;
  
  reportFilters: { status: string; assigneeId: string; departmentId: string; dateFrom: string; dateTo: string };
  setReportFilters: React.Dispatch<React.SetStateAction<{ status: string; assigneeId: string; departmentId: string; dateFrom: string; dateTo: string }>>;
  
  // Computed Properties & Methods
  assignableUsers: User[];
  filteredMasterTasks: Task[];
  filteredMyTasks: Task[];
  tasksGroupedByStaff: { user: any; tasks: Task[] }[];
  filteredReportTasks: Task[];
  allActiveTasks: Task[];
  
  getTaskTitle: (id: string) => string;
  userRoleName: (role: string) => string;
  taskStatusName: (status: string) => string;
  taskStatusClass: (status: string) => string;
  
  // Handlers
  loginSubmit: () => Promise<void>;
  registerSubmit: () => Promise<void>;
  registerWithGoogle: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  validateInviteToken: (t: string) => Promise<void>;
  submitCreateTask: () => Promise<void>;
  cycleStatus: (task: Task) => Promise<void>;
  generateInvite: () => Promise<void>;
  impersonateUser: (uid: string) => Promise<void>;
  openTaskDetails: (task: Task) => void;
  startVoiceRecord: () => Promise<void>;
  stopVoiceRecord: () => void;
  cancelVoiceRecord: () => void;
  handleCommentImageUpload: (file: File) => Promise<void>;
  addComment: () => Promise<void>;
  transferTask: (uid: string, reason: string) => Promise<void>;
  updateTaskStatus: (task: Task, status: string) => Promise<void>;
  markTaskAsRead: (task: Task) => Promise<void>;
  hasUnreadComments: (task: Task) => boolean;
  addCustomTaskType: (typeName?: string) => Promise<void>;
  removeCustomTaskType: (id: string) => Promise<void>;
  updateUserRights: (uid: string, name: string, email: string, role: string, mobileNumber?: string, departmentId?: string, departmentName?: string) => Promise<void>;
  toggleUserStatus: (uid: string, status: 'Active' | 'Suspended') => Promise<void>;
  startEditTask: () => void;
  cancelEditTask: () => void;
  deleteTask: (id: string) => Promise<void>;
  deleteSelectedTasks: (taskIds: string[]) => Promise<void>;
  resetSelectedTasksData: (taskIds: string[]) => Promise<void>;
  updateTaskDetails: () => Promise<void>;
  deleteUser: (uid: string) => Promise<void>;
  deleteInvite: (token: string) => Promise<void>;
  triggerNextTaskPopup: (id: string) => void;
  playNotificationSound: () => void;
  newCommentVideoUrl: string;
  setNewCommentVideoUrl: (url: string) => void;
  commentVideoUploading: boolean;
  handleCommentVideoUpload: (file: File) => Promise<void>;
  isDarkMode: boolean;
  toggleTheme: () => void;
  assignmentNotification: { task: Task, type: 'new' | 'transfer' | 'message', authorName?: string } | null;
  setAssignmentNotification: (val: { task: Task, type: 'new' | 'transfer' | 'message', authorName?: string } | null) => void;
  showCustomConfirm: (message: string, title?: string) => Promise<boolean>;
  showCustomPrompt: (message: string, defaultValue?: string, placeholder?: string) => Promise<string | null>;
  customDialog: any;
  resetPerformanceLeaderboard: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ref to hold all active Firestore listener unsubscribers so logout can tear them down
  const activeUnsubsRef = React.useRef<(() => void)[]>([]);
  // Flag set to true immediately when logout starts — silences all snapshot error/callbacks
  const isLoggingOutRef = React.useRef(false);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState('');

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' as any });
  const [inviteToken, setInviteToken] = useState('');
  const [invitedData, setInvitedData] = useState<Invitation | null>(null);
  const [impersonatedUserUid, setImpersonatedUserUid] = useState('');
  
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [activeDetailTask, setActiveDetailTask] = useState<Task | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentVoiceUrl, setNewCommentVoiceUrl] = useState('');
  const [newCommentImageUrl, setNewCommentImageUrl] = useState('');
  const [voiceRecordingState, setVoiceRecordingState] = useState<'idle' | 'recording' | 'finished'>('idle');
  const [commentUploading, setCommentUploading] = useState(false);
  const [newCommentVideoUrl, setNewCommentVideoUrl] = useState('');
  const [commentVideoUploading, setCommentVideoUploading] = useState(false);
  const [assignmentNotification, setAssignmentNotification] = useState<{ task: Task, type: 'new' | 'transfer' | 'message', authorName?: string } | null>(null);
  
  const [currentTab, setCurrentTab] = useState('tasks');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newVal = !prev;
      localStorage.setItem('theme', newVal ? 'dark' : 'light');
      return newVal;
    });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
  
  // Firestore realtime data states
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [createdTasks, setCreatedTasks] = useState<Task[]>([]);
  const [performanceRecords, setPerformanceRecords] = useState<any[]>([]);
  const [activeReminderAlarm, setActiveReminderAlarm] = useState<Task | null>(null);
  const [masterTasks, setMasterTasks] = useState<Task[]>([]);
  const [activeBroadcast, setActiveBroadcast] = useState<any | null>(null);
  const [broadcastVoiceRecordingState, setBroadcastVoiceRecordingState] = useState<'idle' | 'recording' | 'finished'>('idle');
  const [broadcastVoiceUrl, setBroadcastVoiceUrl] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [usersList, setUsersList] = useState<User[]>([]);
  
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);
  
  // Media recorder ref
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const lastCommentsCountCacheRef = useRef<Record<string, number>>({});
  const previousTaskIdsRef = useRef<Set<string> | null>(null);
  
  // Dates and Filters
  const [todayDateKey, setTodayDateKey] = useState(new Date().toISOString().split('T')[0]);

  // Department CRUD operations
  const createDepartment = async (departmentName: string, description?: string) => {
    if (!departmentName.trim()) {
      showToast('Department name is required', 'error');
      return;
    }
    try {
      const departmentId = 'dept_' + Math.random().toString(36).substr(2, 9);
      const newDepartment: Department = {
        departmentId,
        departmentName: departmentName.trim(),
        description: description?.trim() || '',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'departments', departmentId), newDepartment);
      showToast(`Department "${departmentName}" created successfully!`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to create department: ${err.message || err}`, 'error');
    }
  };

  const deleteDepartment = async (departmentId: string) => {
    if (!await showCustomConfirm('Are you sure you want to delete this department? Users in this department will be unassigned.')) return;
    try {
      await deleteDoc(doc(db, 'departments', departmentId));
      showToast('Department deleted successfully', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to delete department: ${err.message || err}`, 'error');
    }
  };

  
  // Forms states
  const [taskForm, setTaskForm] = useState<any>({
    taskTitle: '',
    taskType: 'Normal',
    assignedTo: '',
    assignedDepartmentId: '',
    urgency: 'Medium',
    dueDate: new Date().toISOString().slice(0, 16),
    taskMessage: '',
    taskImageUrl: '',
    taskVoiceUrl: '',
    reminderHours: 'none',
    reminderHoursCustom: ''
  });
  
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Staff', mobileNumber: '' });
  const [newTaskTypeForm, setNewTaskTypeForm] = useState({ typeName: '' });
  
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  
  const [isTaskEditMode, setIsTaskEditMode] = useState(false);
  const [editTaskForm, setEditTaskForm] = useState<any>({});
  
  const [reportFilters, setReportFilters] = useState({ status: '', assigneeId: '', departmentId: '', dateFrom: '', dateTo: '' });

  // Custom Dialog States
  const [customDialog, setCustomDialog] = useState<any>(null);

  const showCustomConfirm = (message: string, title = 'Confirm Action'): Promise<boolean> => {
    return new Promise((resolve) => {
      setCustomDialog({
        isOpen: true,
        title,
        message,
        type: 'confirm',
        onResolve: (val: any) => {
          setCustomDialog(null);
          resolve(!!val);
        }
      });
    });
  };

  const showCustomPrompt = (message: string, defaultValue = '', placeholder = ''): Promise<string | null> => {
    return new Promise((resolve) => {
      setCustomDialog({
        isOpen: true,
        title: 'Input Required',
        message,
        type: 'prompt',
        defaultValue,
        placeholder,
        onResolve: (val: any) => {
          setCustomDialog(null);
          resolve(val);
        }
      });
    });
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const userRoleName = (role: string) => {
    const roles: Record<string, string> = {
      'Owner': 'Administrator',
      'Admin': 'Administrator',
      'User': 'Personnel',
      'Pending': 'Pending / Unassigned'
    };
    return roles[role] || role;
  };

  const validateInviteToken = async (token: string) => {
    try {
      const inviteQuery = query(collection(db, 'invitations'), where('inviteToken', '==', token));
      const snap = await getDocs(inviteQuery);
      if (snap.empty) {
        showToast('Invalid or expired invitation link', 'error');
        setInviteToken('');
        setAuthMode('login');
        return;
      }
      const docData = snap.docs[0].data() as Invitation;
      if (docData.status !== 'Pending' || new Date(docData.expiresAt) < new Date()) {
        showToast('This invitation has expired or has already been used', 'error');
        setInviteToken('');
        setAuthMode('login');
        return;
      }
      setInvitedData(docData);
      setAuthForm({ name: docData.name || '', email: docData.email, password: '' });
    } catch (err) {
      console.error(err);
      showToast('Error validating invite token', 'error');
    }
  };

  // Impersonated task check or general sync
  const currentDetailTask = activeDetailTask ? (
    masterTasks.find(t => t.taskId === activeDetailTask.taskId) || 
    myTasks.find(t => t.taskId === activeDetailTask.taskId) || 
    activeDetailTask
  ) : null;

  // Realtime lists and cleanups
  useEffect(() => {
    // Check invite token on page load
    const urlParams = new URLSearchParams(window.location.search);
    let token = urlParams.get('token');
    if (!token) {
      const hashMatch = window.location.hash.match(/[?&]token=([^&]+)/);
      if (hashMatch) token = hashMatch[1];
    }
    if (token) {
      setInviteToken(token);
      setAuthMode('register');
      validateInviteToken(token);
    }

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        // Fetch or bootstrap user info
        const userRef = doc(db, 'users', currentUser.uid);
        let userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          // Check if any Admin exists in the database. The 1st user to sign in becomes Admin automatically.
          const usersSnap = await getDocs(collection(db, 'users'));
          const hasAdmin = usersSnap.docs.some(d => d.data()?.role === 'Admin' || d.data()?.role === 'Owner');

          if (!hasAdmin) {
            const firstAdminUser: User = {
              uid: currentUser.uid,
              name: currentUser.displayName || authForm.name || 'Admin',
              email: currentUser.email || authForm.email || '',
              role: 'Admin',
              permissions: { canCreateTasks: true, canManageUsers: true },
              status: 'Active'
            };
            await setDoc(userRef, firstAdminUser);
            setUser({ ...currentUser, ...firstAdminUser });
            setUserRole('Admin');
            showToast(`Welcome, ${firstAdminUser.name}! You are registered as System Admin.`, 'success');
          } else if (invitedData) {
            if (currentUser.email && currentUser.email.toLowerCase() !== invitedData.email.toLowerCase()) {
               showToast(`Google Account email (${currentUser.email}) does not match invitation email (${invitedData.email})`, 'error');
               await signOut(auth);
               setLoading(false);
               return;
            }
            const newUser: User = {
              uid: currentUser.uid,
              name: authForm.name || 'New Personnel',
              email: currentUser.email || authForm.email || '',
              role: invitedData.assignedRole === 'Admin' ? 'Admin' : 'User',
              permissions: {
                canCreateTasks: true,
                canManageUsers: invitedData.assignedRole === 'Admin'
              },
              status: 'Active'
            };
            await setDoc(userRef, newUser);
            
            // Mark invitation as used
            const inviteQuery = query(collection(db, 'invitations'), where('inviteToken', '==', inviteToken));
            const snap = await getDocs(inviteQuery);
            if (!snap.empty) {
              const inviteDocRef = doc(db, 'invitations', snap.docs[0].id);
              const batch = writeBatch(db);
              batch.update(inviteDocRef, { status: 'Used' });
              await batch.commit();
            }
 
            setUser({ ...currentUser, ...newUser });
            setUserRole(newUser.role);
            setInvitedData(null);
            setInviteToken('');
            setAuthMode('login');
            showToast('Registration complete! Welcome aboard.', 'success');
          } else {
            try {
              const newUser: User = {
                uid: currentUser.uid,
                name: currentUser.displayName || authForm.name || 'New Personnel',
                email: currentUser.email || authForm.email || '',
                role: 'Pending',
                permissions: {
                  canCreateTasks: false,
                  canManageUsers: false
                },
                status: 'Active'
              };
              await setDoc(userRef, newUser);
              setUser({ ...currentUser, ...newUser });
              setUserRole(newUser.role);
              playNotificationSound();
              showToast('Registration successful! Awaiting role assignment by Admin.', 'success');
            } catch (err: any) {
              console.error("Self-registration setDoc failed:", err);
              showToast(`Registration failed: ${err.message}`, 'error');
            }
          }
        } else {
          const data = userDoc.data() as User;
          let normalizedRole = data.role;
          if (data.role === 'Owner') {
            normalizedRole = 'Admin';
          } else if (['Account_Incharge', 'Office_Staff', 'Field_Staff', 'Cash_Collector'].includes(data.role)) {
            normalizedRole = 'User';
          }
          let name = data.name;
          if (name === 'System Owner' && currentUser.displayName) {
            name = currentUser.displayName;
          }
          const normalizedData = { ...data, name, role: normalizedRole };
          setUser({ ...currentUser, ...normalizedData });
          setUserRole(normalizedRole);
          
          // Request notification permissions and setup FCM token
          requestNotificationPermission(currentUser.uid);
          setupMessageListener();
        }
      } else {
        setUser(null);
        setUserRole('');
      }
      setLoading(false);
    });

    return () => {
      unsubAuth();
    };
  }, [invitedData, inviteToken]);

  // Realtime Database listeners block
  useEffect(() => {
    if (!user) {
      setMyTasks([]);
      setCreatedTasks([]);
      setPerformanceRecords([]);
      setUsersList([]);
      setMasterTasks([]);
      return;
    }

    const activeUid = impersonatedUserUid || user.uid;
    const unsubs: (() => void)[] = [];

    // 0. Departments listener
    unsubs.push(onSnapshot(collection(db, 'departments'), (snap) => {
      if (isLoggingOutRef.current || !auth.currentUser) return;
      const depts = snap.docs.map(d => ({ departmentId: d.id, ...d.data() }) as Department);
      setDepartmentsList(depts);
    }));

    // 1. My Tasks (assigned to user OR user's department)
    const userDepartmentId = user?.departmentId;
    let myTasksQuery = query(collection(db, 'tasks'), where('assignedTo', '==', activeUid));
    unsubs.push(onSnapshot(myTasksQuery, (snap) => {
      let directTasks = snap.docs.map(doc => ({ ...doc.data() as Task, taskId: doc.id }));
      
      // If user is in a department, fetch department tasks as well
      if (userDepartmentId) {
        getDocs(query(collection(db, 'tasks'), where('assignedDepartmentId', '==', userDepartmentId))).then((deptSnap) => {
          const deptTasks = deptSnap.docs.map(doc => ({ ...doc.data() as Task, taskId: doc.id }));
          const taskMap = new Map<string, Task>();
          directTasks.forEach(t => taskMap.set(t.taskId, t));
          deptTasks.forEach(t => taskMap.set(t.taskId, t));
          const mergedTasks = Array.from(taskMap.values());
          setMyTasks(mergedTasks);
        }).catch(err => {
          console.error("Dept tasks fetch error:", err);
          setMyTasks(directTasks);
        });
      } else {
        setMyTasks(directTasks);
      }

      const newTasks = directTasks;
      
      // Auto rollover incomplete past tasks to today
      const getLocalDateString = (d = new Date()) => {
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
      };
      const todayStr = getLocalDateString();

      newTasks.forEach(async (task) => {
        if (task.status !== 'Completed' && task.dateKey && task.dateKey < todayStr) {
          try {
            const taskRef = doc(db, 'tasks', task.taskId);
            await setDoc(taskRef, {
              dateKey: todayStr,
              dueDate: todayStr + 'T' + (task.dueDate ? task.dueDate.split('T')[1] : '12:00'),
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (err) {
            console.error("Auto rollover failed for task:", task.taskId, err);
          }
        }
      });
      
      // Real-time Assignment/Transfer Notification popups
      if (previousTaskIdsRef.current !== null) {
        newTasks.forEach(task => {
          if (!previousTaskIdsRef.current!.has(task.taskId)) {
            // Task is newly assigned
            playNotificationSound();
            const isTransfer = task.transferHistory && task.transferHistory.length > 0;
            setAssignmentNotification({
              task,
              type: isTransfer ? 'transfer' : 'new'
            });
          }
        });
      }

      // Real-time new message notification popup
      newTasks.forEach(task => {
        const cachedCountForPopup = lastCommentsCountCacheRef.current[task.taskId + '_popup'];
        const newComments = task.comments || [];
        if (cachedCountForPopup !== undefined && newComments.length > cachedCountForPopup) {
          const lastComment = newComments[newComments.length - 1];
          if (lastComment.authorId !== activeUid) {
            setAssignmentNotification({
              task,
              type: 'message',
              authorName: lastComment.authorName
            });
          }
        }
        lastCommentsCountCacheRef.current[task.taskId + '_popup'] = newComments.length;
      });
      
      // Save current task IDs set
      previousTaskIdsRef.current = new Set(newTasks.map(t => t.taskId));

      newTasks.forEach(task => {
        const cachedCount = lastCommentsCountCacheRef.current[task.taskId];
        const newComments = task.comments || [];
        if (cachedCount !== undefined && newComments.length > cachedCount) {
          const lastComment = newComments[newComments.length - 1];
          if (lastComment.authorId !== activeUid) {
            playNotificationSound();
            showToast(`New message from ${lastComment.authorName} on "${task.taskTitle}"`, 'success');
          }
        }
        lastCommentsCountCacheRef.current[task.taskId] = newComments.length;
      });
    }));

    // 1.5 Tasks Created By Me
    const createdTasksQuery = query(collection(db, 'tasks'), where('createdBy', '==', activeUid));
    unsubs.push(onSnapshot(createdTasksQuery, (snap) => {
      const newTasks = snap.docs.map(doc => {
        const data = doc.data() as Task;
        return { ...data, taskId: doc.id };
      });
      
      // Auto rollover incomplete past tasks to today
      const getLocalDateString = (d = new Date()) => {
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
      };
      const todayStr = getLocalDateString();

      newTasks.forEach(async (task) => {
        if (task.status !== 'Completed' && task.dateKey && task.dateKey < todayStr) {
          try {
            const taskRef = doc(db, 'tasks', task.taskId);
            await setDoc(taskRef, {
              dateKey: todayStr,
              dueDate: todayStr + 'T' + (task.dueDate ? task.dueDate.split('T')[1] : '12:00'),
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (err) {
            console.error("Auto rollover failed for task:", task.taskId, err);
          }
        }
      });

      setCreatedTasks(newTasks);
    }));

    // 7. Users list — read caller's role from Firestore inside callback to avoid stale closure
    const usersQuery = collection(db, 'users');
    unsubs.push(onSnapshot(usersQuery, async (snap) => {
      // Guard: silently ignore if logging out or already signed out
      if (isLoggingOutRef.current || !auth.currentUser) return;

      const allUsers = snap.docs
        .map(doc => {
          const data = doc.data() as User;
          let normalizedRole = data.role;
          if (data.role === 'Owner') {
            normalizedRole = 'Admin';
          } else if (['Account_Incharge', 'Office_Staff', 'Field_Staff', 'Cash_Collector'].includes(data.role)) {
            normalizedRole = 'User';
          }
          let name = data.name;
          if (name === 'Owner' || name === 'System Owner') {
            name = 'Admin';
          }
          return { ...data, name, role: normalizedRole };
        })
        .filter(u => 
          u.role !== 'Owner' && 
          u.email?.toLowerCase() !== 'mymbasheer@gmail.com' && 
          u.name !== 'Owner' && 
          u.name !== 'System Owner' && 
          u.name !== 'M. Basheer'
        );
      
      // Re-read the current user's role directly from Firestore to avoid stale closure
      let callerRole = userRole;
      try {
        const callerDoc = await getDoc(doc(db, 'users', activeUid));
        if (callerDoc.exists()) {
          const cData = callerDoc.data() as User;
          callerRole = cData.role === 'Owner' ? 'Admin' : (['Account_Incharge', 'Office_Staff', 'Field_Staff', 'Cash_Collector'].includes(cData.role) ? 'User' : cData.role);
        }
      } catch (_) { /* fall back to context userRole */ }

      // Guard again after the async getDoc (user may have logged out during await)
      if (!auth.currentUser) return;

      let filteredList: User[] = [];
      if (callerRole === 'Admin') {
        filteredList = allUsers;
      } else {
        filteredList = allUsers.filter(u => u.role !== 'Pending');
      }
      
      if (callerRole === 'Admin') {
        const pendingUsers = filteredList.filter(u => u.role === 'Pending');
        pendingUsers.forEach(u => {
          const wasListed = usersList.some(prevUser => prevUser.uid === u.uid);
          if (!wasListed && usersList.length > 0) {
            playNotificationSound();
            showToast(`New user registered: ${u.name || u.email}. Role/rights assignment required.`, 'info');
          }
        });
      }
      
      setUsersList(filteredList);
      
      const currentDetails = allUsers.find(u => u.uid === activeUid);
      if (currentDetails && user) {
        setUser((prev: any) => ({ ...prev, ...currentDetails }));
      }
    }, (err) => {
      // Suppress permission errors that fire during/after logout — not a real error
      if (isLoggingOutRef.current || !auth.currentUser) return;
      console.error("Firestore users snapshot failed:", err);
      showToast(`Error loading personnel: ${err.message}`, 'error');
    }));

    // 8. Master tasks
    const masterTasksQuery = collection(db, 'tasks');
    
    if (masterTasksQuery) {
      unsubs.push(onSnapshot(masterTasksQuery, (snap) => {
        const newTasks = snap.docs.map(doc => {
          const data = doc.data() as Task;
          return { ...data, taskId: doc.id };
        });
        
        // Auto rollover incomplete past tasks to today
        const getLocalDateString = (d = new Date()) => {
          const offset = d.getTimezoneOffset();
          const localDate = new Date(d.getTime() - (offset * 60 * 1000));
          return localDate.toISOString().split('T')[0];
        };
        const todayStr = getLocalDateString();
        
        newTasks.forEach(async (task) => {
          const cachedCount = lastCommentsCountCacheRef.current[task.taskId];
          const newComments = task.comments || [];
          if (cachedCount !== undefined && newComments.length > cachedCount) {
            const lastComment = newComments[newComments.length - 1];
            if (lastComment.authorId !== activeUid) {
              playNotificationSound();
              showToast(`New message from ${lastComment.authorName} on "${task.taskTitle}"`, 'success');
            }
          }
          lastCommentsCountCacheRef.current[task.taskId] = newComments.length;

          // Perform rollover if needed
          if (task.status !== 'Completed' && task.dateKey && task.dateKey < todayStr) {
            try {
              const taskRef = doc(db, 'tasks', task.taskId);
              await setDoc(taskRef, {
                dateKey: todayStr,
                dueDate: todayStr + 'T' + (task.dueDate ? task.dueDate.split('T')[1] : '12:00'),
                updatedAt: new Date().toISOString()
              }, { merge: true });
            } catch (err) {
              console.error("Auto rollover failed for task:", task.taskId, err);
            }
          }
        });
        setMasterTasks(newTasks);
      }));
    }
    unsubs.push(onSnapshot(collection(db, 'performance_records'), (snap) => {
      setPerformanceRecords(snap.docs.map(doc => doc.data()));
    }));

    // Auto-cleanup of completed tasks older than 30 days
    const runCompletedTasksCleanup = async () => {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

        const q = query(collection(db, 'tasks'), where('status', '==', 'Completed'));
        const snap = await getDocs(q);
        
        for (const d of snap.docs) {
          const task = d.data() as Task;
          if (task.completedAt && task.completedAt < thirtyDaysAgoStr) {
            const urlsToDelete: string[] = [];
            if (task.comments) {
              task.comments.forEach(c => {
                if (c.imageUrl && c.imageUrl.includes('firebasestorage.googleapis.com')) urlsToDelete.push(c.imageUrl);
                if (c.voiceUrl && c.voiceUrl.includes('firebasestorage.googleapis.com')) urlsToDelete.push(c.voiceUrl);
              });
            }
            
            for (const url of urlsToDelete) {
              try {
                const storageRef = ref(storage, url);
                await deleteObject(storageRef);
              } catch (err) {
                console.error("Failed to delete storage file:", url, err);
              }
            }

            await deleteDoc(doc(db, 'tasks', task.taskId));
            console.log(`Auto-cleaned completed task: ${task.taskId}`);
          }
        }
      } catch (err) {
        console.error("Auto-cleanup routine failed:", err);
      }
    };
    
    runCompletedTasksCleanup();

    // 13. Broadcasts listener
    unsubs.push(onSnapshot(collection(db, 'broadcasts'), (snap) => {
      const allBroadcasts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      if (allBroadcasts.length > 0) {
        // Find the newest broadcast
        allBroadcasts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const newest = allBroadcasts[0];
        
        const dismissedId = localStorage.getItem('fj-dismissed-broadcast-id');
        if (dismissedId !== newest.id && newest.createdBy !== user?.uid) {
          setActiveBroadcast(newest);
          startAlarmSound();
        }
      }
    }));

    // Store refs so logout() can kill listeners before signOut()
    activeUnsubsRef.current = unsubs;

    return () => {
      unsubs.forEach(unsub => unsub());
      activeUnsubsRef.current = [];
    };
  }, [user?.uid, userRole, impersonatedUserUid]);

  // Auth actions
  const loginSubmit = async () => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
      showToast('Login successful', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const registerSubmit = async () => {
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
    } catch (err: any) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const registerWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Google Sign Up failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Google Sign In failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      // Mark logout in progress FIRST — this silences all Firestore snapshot callbacks
      // and error handlers immediately, before any async operations
      isLoggingOutRef.current = true;
      // Unsubscribe ALL Firestore listeners before signing out
      activeUnsubsRef.current.forEach(unsub => unsub());
      activeUnsubsRef.current = [];
      previousTaskIdsRef.current = null;
      setAssignmentNotification(null);
      await signOut(auth);
      setImpersonatedUserUid('');
      showToast('Logged out successfully', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Sign out failed', 'error');
    } finally {
      isLoggingOutRef.current = false;
      setLoading(false);
    }
  };

  // Create task (Admin/Owner)
  const submitCreateTask = async () => {
    try {
      const taskId = 'task_' + Math.random().toString(36).substr(2, 9);
      const assignee = usersList.find(u => u.uid === taskForm.assignedTo);
      const assigneeName = assignee ? assignee.name : (taskForm.assignedTo ? 'Unknown' : '');
      const assignedDept = departmentsList.find(d => d.departmentId === taskForm.assignedDepartmentId);
      const assignedDeptName = assignedDept ? assignedDept.departmentName : '';

      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dateKeyPrefix = `${dd}${mm}`;

      let taskNumber = 1;
      const counterRef = doc(db, 'settings', 'task_counter');
      try {
        await runTransaction(db, async (transaction) => {
          const counterSnap = await transaction.get(counterRef);
          if (!counterSnap.exists()) {
            transaction.set(counterRef, { currentNumber: 1, datePrefix: dateKeyPrefix });
            taskNumber = 1;
          } else {
            const data = counterSnap.data();
            if (data.datePrefix === dateKeyPrefix) {
              taskNumber = (data.currentNumber || 0) + 1;
            } else {
              taskNumber = 1; // Reset for new day
            }
            transaction.update(counterRef, { currentNumber: taskNumber, datePrefix: dateKeyPrefix });
          }
        });
      } catch (err) {
        console.error("Error updating task counter with transaction, falling back:", err);
        try {
          const counterSnap = await getDoc(counterRef);
          if (counterSnap.exists() && counterSnap.data().datePrefix === dateKeyPrefix) {
            taskNumber = (counterSnap.data().currentNumber || 0) + 1;
          } else {
            taskNumber = 1;
          }
          await setDoc(counterRef, { currentNumber: taskNumber, datePrefix: dateKeyPrefix }, { merge: true });
        } catch (_) {
          taskNumber = Math.floor(Date.now() / 100000);
        }
      }
      const taskTitle = `${dateKeyPrefix}-${taskNumber}`;

      let reminderAt = '';
      if (taskForm.reminderHours && taskForm.reminderHours !== 'none') {
        const hours = taskForm.reminderHours === 'custom' ? parseFloat(taskForm.reminderHoursCustom || '0') : parseFloat(taskForm.reminderHours);
        if (hours > 0) {
          reminderAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        }
      }

      // Capture GPS Location
      let createdLocation = null;
      try {
        const pos = await new Promise<GeolocationPosition | null>((resolve) => {
          if (!navigator.geolocation) {
            resolve(null);
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (p) => resolve(p),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 5000 }
          );
        });
        if (pos) {
          let city = 'Unknown Location';
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&accept-language=en`);
            if (res.ok) {
              const data = await res.json();
              city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || data.address?.county || 'Unknown Location';
            }
          } catch (err) {
            console.error("OSM CreatedLocation Reverse Geocoding failed:", err);
          }

          createdLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: new Date().toISOString(),
            cityName: city
          };
        }
      } catch (e) {
        console.error("Failed to capture geolocation: ", e);
      }

      // Build comments list if message, image, or voice is provided
      const initialComments: Comment[] = [];
      if (taskForm.taskMessage || taskForm.taskImageUrl || taskForm.taskVoiceUrl) {
        initialComments.push({
          commentId: 'comm_' + Math.random().toString(36).substr(2, 9),
          authorId: user.uid,
          authorName: user.displayName || user.name || 'System User',
          authorRole: userRole,
          text: taskForm.taskMessage || '',
          imageUrl: taskForm.taskImageUrl || '',
          voiceUrl: taskForm.taskVoiceUrl || '',
          createdAt: new Date().toISOString()
        });
      }

      const newTask: Task = {
        taskId,
        taskTitle,
        taskType: taskForm.taskType,

        assignedTo: taskForm.assignedTo || '',
        assignedToName: assigneeName,
        assignedDepartmentId: taskForm.assignedDepartmentId || '',
        assignedDepartmentName: assignedDeptName,
        createdBy: user.uid,
        status: 'Pending',
        urgency: (() => {
          const urgencyMap: Record<string, string> = {
            Urgent: 'High',
            High: 'High',
            Medium: 'Medium',
            Normal: 'Low',
            Regular: 'Low'
          };
          return urgencyMap[taskForm.taskType] || 'Medium';
        })() as any,
        dueDate: taskForm.dueDate || new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        comments: initialComments,
        lastReadTimestamps: {
          [user.uid]: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        dateKey: taskForm.dueDate ? taskForm.dueDate.split('T')[0] : new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString(),
        createdLocation: createdLocation,
        reminderAt,
        reminderAlerted: false,
        reminderHours: taskForm.reminderHours || 'none',
        reminderHoursCustom: taskForm.reminderHoursCustom || '',
        lastReminderAlertedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'tasks', taskId), newTask);
      showToast('Task created successfully', 'success');
      setShowCreateTaskModal(false);
      
      // Reset form
      setTaskForm({
        taskTitle: '',
        taskType: 'Normal',
        assignedTo: '',
        assignedDepartmentId: '',
        urgency: 'Medium',
        dueDate: new Date().toISOString().slice(0, 16),
        taskMessage: '',
        taskImageUrl: '',
        taskVoiceUrl: '',
        reminderHours: 'none',
        reminderHoursCustom: ''
      });
    } catch (err) {
      console.error(err);
      showToast('Error creating task', 'error');
    }
  };

  const generateInvite = async () => {
    try {
      const token = 'invite_' + Math.random().toString(36).substr(2, 16);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const newInvitation: Invitation = {
        inviteToken: token,
        email: inviteForm.email,
        name: inviteForm.name,
        assignedRole: inviteForm.role,
        createdBy: user.uid,
        expiresAt: expiresAt.toISOString(),
        status: 'Pending',
        mobileNumber: inviteForm.mobileNumber
      };

      await setDoc(doc(db, 'invitations', token), newInvitation);
      setGeneratedLink(`${window.location.origin}/?token=${token}`);
      showToast('Invitation link generated', 'success');
      setInviteForm({ name: '', email: '', role: 'Staff', mobileNumber: '' });
    } catch (err) {
      console.error(err);
      showToast('Error generating invitation', 'error');
    }
  };

  const impersonateUser = async (userUid: string) => {
    if (!userUid) {
      setImpersonatedUserUid('');
      setUserRole(user?.role || 'Admin');
      showToast('Reset impersonation to Owner', 'success');
      return;
    }
    const targetUserDoc = await getDoc(doc(db, 'users', userUid));
    if (targetUserDoc.exists()) {
      const userData = targetUserDoc.data() as User;
      setImpersonatedUserUid(userUid);
      setUserRole(userData.role);
      showToast(`Impersonating ${userData.name} (${userRoleName(userData.role)})`, 'success');
    }
  };

  const openTaskDetails = (task: Task) => {
    setActiveDetailTask(task);
    setShowTaskDetailsModal(true);
    setNewCommentText('');
    setNewCommentVoiceUrl('');
    setNewCommentImageUrl('');
    setVoiceRecordingState('idle');
    markTaskAsRead(task);

    // Geolocation capture when opening/accessing task
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            // Reverse Geocoding via OSM Nominatim (free API, no key needed)
            let city = 'Unknown Location';
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&accept-language=en`);
              if (res.ok) {
                const data = await res.json();
                city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || data.address?.county || 'Unknown Location';
              }
            } catch (err) {
              console.error("OSM Reverse Geocoding failed:", err);
            }

            const gpsLoc = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              timestamp: new Date().toISOString(),
              userId: user?.uid || '',
              userName: user?.name || user?.displayName || 'Unknown User',
              cityName: city
            };
            const taskRef = doc(db, 'tasks', task.taskId);
            const updates: any = {
              lastOpenedLocation: gpsLoc
            };
            if (task.assignedTo === user?.uid) {
              updates.assigneeOpenLocation = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                timestamp: new Date().toISOString(),
                cityName: city
              };
            }
            await setDoc(taskRef, updates, { merge: true });
          },
          (err) => {
            console.error("Geolocation denied or error on open:", err);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    } catch (e) {
      console.error("Failed to capture geolocation on open:", e);
    }
  };

  const startVoiceRecord = async () => {
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
        let type = mediaRecorder.mimeType;
        if (!type) {
          type = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm';
        }
        const audioBlob = new Blob(audioChunksRef.current, { type });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setNewCommentVoiceUrl(base64data);
          setVoiceRecordingState('finished');
          showToast('Voice message processed instantly!', 'success');
        };
      };
      mediaRecorder.start();
      setVoiceRecordingState('recording');
      showToast('Recording voice note...', 'success');
    } catch (err) {
      console.error(err);
      showToast('Could not access microphone.', 'error');
    }
  };

  const stopVoiceRecord = () => {
    if (mediaRecorderRef.current && voiceRecordingState === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      showToast('Processing recording...', 'success');
    }
  };

  const cancelVoiceRecord = () => {
    if (mediaRecorderRef.current && voiceRecordingState === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setNewCommentVoiceUrl('');
    setVoiceRecordingState('idle');
    audioChunksRef.current = [];
  };

  const handleCommentImageUpload = async (file: File) => {
    try {
      setCommentUploading(true);
      const compressedBlob = await compressImage(file);
      const fileRef = ref(storage, `comments/${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}.jpg`);
      await uploadBytes(fileRef, compressedBlob);
      const imageUrl = await getDownloadURL(fileRef);
      setNewCommentImageUrl(imageUrl);
      showToast('Image uploaded successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to upload image', 'error');
    } finally {
      setCommentUploading(false);
    }
  };

  const handleCommentVideoUpload = async (file: File) => {
    try {
      setCommentVideoUploading(true);
      const fileRef = ref(storage, `comments_video/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const videoUrl = await getDownloadURL(fileRef);
      setNewCommentVideoUrl(videoUrl);
      showToast('Video uploaded successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to upload video', 'error');
    } finally {
      setCommentVideoUploading(false);
    }
  };


  const addComment = async () => {
    if (!currentDetailTask) return;
    if (!newCommentText && !newCommentVoiceUrl && !newCommentImageUrl && !newCommentVideoUrl) return;
    try {
      const taskRef = doc(db, 'tasks', currentDetailTask.taskId);
      const comments = currentDetailTask.comments || [];
      const newComment = {
        commentId: 'c_' + Math.random().toString(36).substr(2, 9),
        authorId: user.uid,
        authorName: impersonatedUserUid ? (usersList.find(u => u.uid === impersonatedUserUid)?.name || 'Impersonated User') : (user.displayName || user.name || 'Admin'),
        authorRole: userRole,
        text: newCommentText,
        voiceUrl: newCommentVoiceUrl,
        imageUrl: newCommentImageUrl,
        videoUrl: newCommentVideoUrl,
        createdAt: new Date().toISOString()
      };
      comments.push(newComment);
      await setDoc(taskRef, { comments }, { merge: true });
      
      setNewCommentText('');
      setNewCommentVoiceUrl('');
      setNewCommentImageUrl('');
      setNewCommentVideoUrl('');
      setVoiceRecordingState('idle');
      showToast('Comment posted', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error posting comment', 'error');
    }
  };

  const transferTask = async (newAssigneeId: string, reason: string) => {
    if (!currentDetailTask || !newAssigneeId) return;
    try {
      const taskRef = doc(db, 'tasks', currentDetailTask.taskId);
      const assignee = usersList.find(u => u.uid === newAssigneeId);
      
      let assigneeName = 'Admin';
      if (assignee) {
        assigneeName = assignee.name;
      }

      const transferLogs = currentDetailTask.transferHistory || [];
      transferLogs.push({
        fromId: currentDetailTask.assignedTo,
        fromName: currentDetailTask.assignedToName,
        toId: newAssigneeId,
        toName: assigneeName,
        timestamp: new Date().toISOString(),
        reason: reason || ''
      });

      // Post system comment to notify task creator/admin
      const comments = currentDetailTask.comments || [];
      const systemComment = {
        commentId: 'comm_sys_' + Math.random().toString(36).substr(2, 9),
        authorId: user.uid,
        authorName: 'System Log',
        authorRole: 'System',
        text: `Task transferred from ${currentDetailTask.assignedToName} to ${assigneeName}. Reason: ${reason || 'No reason specified'}`,
        createdAt: new Date().toISOString()
      };
      comments.push(systemComment);

      await setDoc(taskRef, {
        assignedTo: newAssigneeId,
        assignedToName: assigneeName,
        transferHistory: transferLogs,
        comments
      }, { merge: true });

      showToast(`Task transferred to ${assigneeName}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to transfer task', 'error');
    }
  };

  const updateTaskStatus = async (task: Task, statusVal: string) => {
    try {
      const taskRef = doc(db, 'tasks', task.taskId);
      const completedAt = statusVal === 'Completed' ? new Date().toISOString() : null;
      await setDoc(taskRef, { status: statusVal, completedAt, updatedAt: new Date().toISOString() }, { merge: true });
      showToast(`Task status updated to ${taskStatusName(statusVal)}`, 'success');
      if (statusVal === 'Completed') {
        recordTaskCompletionPerformance(task);
        triggerNextTaskPopup(task.taskId);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update status', 'error');
    }
  };

  const cycleStatus = async (task: Task) => {
    let nextStatus = 'Pending';
    if (task.status === 'Pending') nextStatus = 'In_Progress';
    else if (task.status === 'In_Progress') nextStatus = 'Completed';
    else if (task.status === 'Completed') nextStatus = 'Pending';
    await updateTaskStatus(task, nextStatus);
  };

  const markTaskAsRead = async (task: Task) => {
    if (!task || !user) return;
    try {
      const activeUid = impersonatedUserUid || user.uid;
      const taskRef = doc(db, 'tasks', task.taskId);
      const lastReadTimestamps = task.lastReadTimestamps || {};
      lastReadTimestamps[activeUid] = new Date().toISOString();
      await setDoc(taskRef, { lastReadTimestamps }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  const hasUnreadComments = (task: Task) => {
    if (!task || !task.comments || task.comments.length === 0 || !user) return false;
    const activeUid = impersonatedUserUid || user.uid;
    const lastRead = task.lastReadTimestamps?.[activeUid];
    if (!lastRead) return true;
    return task.comments.some(c => c.authorId !== activeUid && c.createdAt > lastRead);
  };


  const addCustomTaskType = async (typeName?: string) => {
    const val = typeName ?? newTaskTypeForm.typeName;
    if (!val.trim()) return;
    try {
      const typeId = 'tt_' + Math.random().toString(36).substr(2, 9);
      const newType = { typeId, typeName: val.trim() };
      await setDoc(doc(db, 'task_types', typeId), newType);
      setNewTaskTypeForm({ typeName: '' });
      showToast('Task type added successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to add task type', 'error');
    }
  };

  const removeCustomTaskType = async (typeId: string) => {
    try {
      await deleteDoc(doc(db, 'task_types', typeId));
      showToast('Task type removed successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to remove task type', 'error');
    }
  };

  const updateUserRights = async (userUid: string, name: string, email: string, role: string, mobileNumber?: string, departmentId?: string, departmentName?: string) => {
    try {
      const userRef = doc(db, 'users', userUid);
      let finalPermissions = {
        canCreateTasks: false,
        canManageUsers: false
      };
      if (role === 'Admin') {
        finalPermissions = {
          canCreateTasks: true,
          canManageUsers: true
        };
      } else if (role === 'User') {
        finalPermissions = {
          canCreateTasks: true,
          canManageUsers: false
        };
      }
      await setDoc(userRef, {
        name,
        email,
        role,
        permissions: finalPermissions,
        mobileNumber: mobileNumber || '',
        departmentId: departmentId || '',
        departmentName: departmentName || '',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showToast('User rights updated successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update user rights', 'error');
    }
  };

  const toggleUserStatus = async (userUid: string, currentStatus: 'Active' | 'Suspended') => {
    try {
      const nextStatus = currentStatus === 'Suspended' ? 'Active' : 'Suspended';
      const userRef = doc(db, 'users', userUid);
      await setDoc(userRef, {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showToast(`User status updated to ${nextStatus}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update user status', 'error');
    }
  };




  const startEditTask = () => {
    if (!currentDetailTask) return;
    setIsTaskEditMode(true);
    const form = JSON.parse(JSON.stringify(currentDetailTask));
    const firstComment = form.comments && form.comments.length > 0 ? form.comments[0] : null;
    form.taskMessage = firstComment?.text || '';
    form.taskImageUrl = firstComment?.imageUrl || '';
    form.taskVoiceUrl = firstComment?.voiceUrl || '';
    setEditTaskForm(form);
  };

  const cancelEditTask = () => {
    setIsTaskEditMode(false);
    setEditTaskForm({});
  };

  const deleteTask = async (taskId: string) => {
    console.log("[deleteTask] Started for taskId:", taskId);
    const confirmed = await showCustomConfirm('Are you sure you want to delete this task? This action cannot be undone.');
    console.log("[deleteTask] Dialog confirmation result:", confirmed);
    if (!confirmed) {
      console.log("[deleteTask] User cancelled deletion");
      return;
    }
    try {
      console.log("[deleteTask] Executing deleteDoc in Firestore...");
      await deleteDoc(doc(db, 'tasks', taskId));
      console.log("[deleteTask] deleteDoc success");
      showToast('Task deleted successfully', 'success');
      setShowTaskDetailsModal(false);
    } catch (err: any) {
      console.error("[deleteTask] Error deleting task document:", err);
      showToast(`Failed to delete task: ${err.message || err}`, 'error');
    }
  };

  const deleteSelectedTasks = async (taskIds: string[]) => {
    if (!taskIds || taskIds.length === 0) return;
    if (!await showCustomConfirm(`Are you sure you want to delete ${taskIds.length} selected task(s)? This action cannot be undone.`)) return;
    try {
      const batch = writeBatch(db);
      taskIds.forEach((id) => {
        batch.delete(doc(db, 'tasks', id));
      });
      await batch.commit();
      showToast('Selected tasks deleted successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete selected tasks', 'error');
    }
  };

  const resetSelectedTasksData = async (taskIds: string[]) => {
    if (!taskIds || taskIds.length === 0) return;
    if (!await showCustomConfirm(`Are you sure you want to reset/empty data for ${taskIds.length} selected task(s)?`)) return;
    try {
      const batch = writeBatch(db);
      for (const id of taskIds) {
        const taskRef = doc(db, 'tasks', id);
        const taskDoc = await getDoc(taskRef);
        if (taskDoc.exists()) {
          const taskData = taskDoc.data() as Task;
          const firstComment = taskData.comments && taskData.comments.length > 0 ? [taskData.comments[0]] : [];
          batch.update(taskRef, {
            status: 'Pending',
            comments: firstComment,
            updatedAt: new Date().toISOString()
          });
        }
      }
      await batch.commit();
      showToast('Selected tasks data reset successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to reset selected tasks', 'error');
    }
  };

  const updateTaskDetails = async () => {
    try {
      const taskRef = doc(db, 'tasks', editTaskForm.taskId);
      const assignee = usersList.find(u => u.uid === editTaskForm.assignedTo);
      const assigneeName = assignee ? assignee.name : 'Unknown';

      const commentsCopy = [...(editTaskForm.comments || [])];
      if (commentsCopy.length > 0) {
        commentsCopy[0] = {
          ...commentsCopy[0],
          text: editTaskForm.taskMessage || '',
          imageUrl: editTaskForm.taskImageUrl || '',
          voiceUrl: editTaskForm.taskVoiceUrl || '',
          createdAt: commentsCopy[0].createdAt || new Date().toISOString()
        };
      } else {
        commentsCopy.push({
          commentId: 'comm_' + Math.random().toString(36).substr(2, 9),
          authorId: user.uid,
          authorName: user.displayName || user.name || 'System User',
          authorRole: userRole,
          text: editTaskForm.taskMessage || '',
          imageUrl: editTaskForm.taskImageUrl || '',
          voiceUrl: editTaskForm.taskVoiceUrl || '',
          createdAt: new Date().toISOString()
        });
      }

      let reminderAt = editTaskForm.reminderAt || '';
      let reminderAlerted = editTaskForm.reminderAlerted || false;
      if (editTaskForm.reminderHours !== undefined) {
        if (editTaskForm.reminderHours === 'none') {
          reminderAt = '';
          reminderAlerted = false;
        } else {
          const hours = editTaskForm.reminderHours === 'custom' ? parseFloat(editTaskForm.reminderHoursCustom || '0') : parseFloat(editTaskForm.reminderHours);
          if (hours > 0) {
            reminderAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
            reminderAlerted = false;
          }
        }
      }

      const updates = {
        taskTitle: editTaskForm.taskTitle,
        taskType: editTaskForm.taskType,
        assignedTo: editTaskForm.assignedTo,
        assignedToName: assigneeName,
        urgency: editTaskForm.urgency,
        dueDate: editTaskForm.dueDate,
        dateKey: editTaskForm.dueDate ? editTaskForm.dueDate.split('T')[0] : editTaskForm.dateKey,

        comments: commentsCopy,
        updatedAt: new Date().toISOString(),
        reminderAt,
        reminderAlerted,
        reminderHours: editTaskForm.reminderHours || 'none',
        reminderHoursCustom: editTaskForm.reminderHoursCustom || '',
        lastReminderAlertedAt: new Date().toISOString()
      };

      await setDoc(taskRef, updates, { merge: true });
      showToast('Task updated successfully', 'success');
      setIsTaskEditMode(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to update task details', 'error');
    }
  };

  const deleteUser = async (userUid: string) => {
    if (!await showCustomConfirm('Are you sure you want to delete this personnel? They will lose access immediately.')) return;
    try {
      await deleteDoc(doc(db, 'users', userUid));
      showToast('Personnel deleted successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete personnel', 'error');
    }
  };

  const deleteInvite = async (inviteTokenVal: string) => {
    if (!await showCustomConfirm('Are you sure you want to revoke/delete this invitation link?')) return;
    try {
      const inviteQuery = query(collection(db, 'invitations'), where('inviteToken', '==', inviteTokenVal));
      const snap = await getDocs(inviteQuery);
      if (!snap.empty) {
        await deleteDoc(doc(db, 'invitations', snap.docs[0].id));
        showToast('Invitation link revoked and deleted', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to delete invitation', 'error');
    }
  };

  const resetPerformanceLeaderboard = async () => {
    if (!user || user.email !== 'mymbasheer@gmail.com') {
      showToast('Only an Administrator can reset the leaderboard.', 'error');
      return;
    }
    if (!await showCustomConfirm('Are you sure you want to completely RESET the Performance Leaderboard? This will delete all completed task records and cannot be undone.')) return;
    try {
      const snap = await getDocs(collection(db, 'performance_records'));
      const batch = writeBatch(db);
      snap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      showToast('Performance Leaderboard reset successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to reset leaderboard', 'error');
    }
  };




  const triggerNextTaskPopup = (completedTaskId: string) => {
    const nextTask = filteredMyTasks.find(t => t.taskId !== completedTaskId && (t.status === 'Pending' || t.status === 'In_Progress'));
    if (nextTask) {
      openTaskDetails(nextTask);
      showToast(`Next Task: "${nextTask.taskTitle}"`, 'success');
    } else {
      setShowTaskDetailsModal(false);
      showToast('All assigned tasks for today completed!', 'success');
    }
  };

  const playNotificationSound = () => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.type = 'sine';
      osc2.type = 'sine';
      
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc2.frequency.setValueAtTime(783.99, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      
      osc1.stop(ctx.currentTime + 0.45);
      osc2.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Audio Context blocked:", e);
    }
  };

  const recordTaskCompletionPerformance = async (task: Task) => {
    try {
      const recordId = 'perf_' + Math.random().toString(36).substr(2, 9);
      const now = new Date();
      const createdAt = new Date(task.createdAt);
      const durationHours = Math.max(0.1, (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const onTime = dueDate ? now <= dueDate : true;

      const performanceRecord = {
        recordId,
        taskId: task.taskId,
        taskTitle: task.taskTitle,
        userId: task.assignedTo,
        userName: task.assignedToName || 'Unknown User',
        createdAt: task.createdAt,
        completedAt: now.toISOString(),
        dueDate: task.dueDate || '',
        durationHours: Number(durationHours.toFixed(2)),
        onTime
      };

      await setDoc(doc(db, 'performance_records', recordId), performanceRecord);
    } catch (e) {
      console.error("Failed to record performance:", e);
    }
  };

  const [, setAlarmPlaying] = useState(false);
  const alarmIntervalRef = useRef<any>(null);

  const startAlarmSound = () => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      setAlarmPlaying(true);

      alarmIntervalRef.current = setInterval(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        
        // Differentiate sound pattern: Broadcast uses high-pitched rapid triple burst (880Hz x 3), Reminder uses low dual tone chime (440Hz/554Hz)
        const isBroadcast = activeBroadcast !== null;
        if (isBroadcast) {
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.35, ctx.currentTime);
          // Rapid vibration pattern for broadcast
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 100]);
          }
        } else {
          osc.frequency.setValueAtTime(554.37, ctx.currentTime);
          gain.gain.setValueAtTime(0.20, ctx.currentTime);
          // Standard pulse vibration for reminder
          if (navigator.vibrate) {
            navigator.vibrate([300, 100, 300]);
          }
        }
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }, 700);
    } catch (e) {
      console.warn("Alarm audio blocked:", e);
    }
  };

  const stopAlarmSound = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    setAlarmPlaying(false);
  };

  // Background check for repeating reminders
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const now = new Date();
      const allTasks = [...myTasks, ...masterTasks];
      
      const dueReminder = allTasks.find(t => {
        if (t.status === 'Completed' || !t.reminderHours || t.reminderHours === 'none') return false;
        
        // Only notify if assignedTo current user or createdBy current user
        if (t.assignedTo !== user.uid && t.createdBy !== user.uid) return false;
        
        const hours = t.reminderHours === 'custom' ? parseFloat(t.reminderHoursCustom || '0') : parseFloat(t.reminderHours);
        if (isNaN(hours) || hours <= 0) return false;

        const baseTimeStr = t.lastReminderAlertedAt || t.createdAt;
        const baseTime = new Date(baseTimeStr);
        if (isNaN(baseTime.getTime())) return false;

        const diffMs = now.getTime() - baseTime.getTime();
        const intervalMs = hours * 60 * 60 * 1000;
        return diffMs >= intervalMs;
      });

      if (dueReminder && !activeReminderAlarm) {
        setActiveReminderAlarm(dueReminder);
        startAlarmSound();
        try {
          const taskRef = doc(db, 'tasks', dueReminder.taskId);
          await setDoc(taskRef, { lastReminderAlertedAt: now.toISOString() }, { merge: true });
        } catch (e) {
          console.error(e);
        }
      }
    }, 10000); // Check every 10 seconds

    return () => {
      clearInterval(interval);
      stopAlarmSound();
    };
  }, [myTasks, masterTasks, user, activeReminderAlarm]);

  // Auto-cleanup completed tasks older than 30 days
  useEffect(() => {
    if (!user) return;
    const cleanup = async () => {
      try {
        const allTasks = [...myTasks, ...masterTasks];
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        for (const t of allTasks) {
          if (t.status === 'Completed' && t.completedAt) {
            const compDate = new Date(t.completedAt);
            if (!isNaN(compDate.getTime()) && compDate < thirtyDaysAgo) {
              await deleteDoc(doc(db, 'tasks', t.taskId));
            }
          }
        }
      } catch (err) {
        console.error("Auto-delete completed tasks older than 30 days failed:", err);
      }
    };
    cleanup();
    const interval = setInterval(cleanup, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [myTasks, masterTasks, user]);

  const sendBroadcast = async (text: string, voiceUrl: string) => {
    try {
      const broadcastId = 'bc_' + Math.random().toString(36).substr(2, 9);
      const newBroadcast = {
        id: broadcastId,
        text,
        voiceUrl,
        createdBy: user.uid,
        createdByName: user.name || 'Admin',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'broadcasts', broadcastId), newBroadcast);
      showToast('Broadcast sent successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to send broadcast', 'error');
    }
  };

  const startBroadcastVoiceRecord = async () => {
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
      mediaRecorder.onstop = async () => {
        let type = mediaRecorder.mimeType;
        if (!type) {
          type = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm';
        }
        const audioBlob = new Blob(audioChunksRef.current, { type });
        const ext = type.includes('mp4') ? 'mp4' : 'webm';
        const fileRef = ref(storage, `broadcasts/${Date.now()}_voice.${ext}`);
        await uploadBytes(fileRef, audioBlob, { contentType: type });
        const voiceUrl = await getDownloadURL(fileRef);
        setBroadcastVoiceUrl(voiceUrl);
        setBroadcastVoiceRecordingState('finished');
        showToast('Broadcast voice instruction recorded successfully', 'success');
      };
      mediaRecorder.start();
      setBroadcastVoiceRecordingState('recording');
      showToast('Recording broadcast note...', 'success');
    } catch (err) {
      console.error(err);
      showToast('Could not access microphone.', 'error');
    }
  };

  const stopBroadcastVoiceRecord = () => {
    if (mediaRecorderRef.current && broadcastVoiceRecordingState === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      showToast('Processing recording...', 'success');
    }
  };

  const cancelBroadcastVoiceRecord = () => {
    if (mediaRecorderRef.current && broadcastVoiceRecordingState === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setBroadcastVoiceUrl('');
    setBroadcastVoiceRecordingState('idle');
    audioChunksRef.current = [];
  };



  const getTaskTitle = (id: string) => {
    const t = masterTasks.find(x => x.taskId === id) || myTasks.find(x => x.taskId === id);
    return t ? t.taskTitle : 'Unknown Task';
  };

  const taskStatusName = (status: string) => {
    const statuses: Record<string, string> = {
      'Pending': 'Pending',
      'In_Progress': 'In Progress',
      'Completed': 'Completed'
    };
    return statuses[status] || status;
  };

  const taskStatusClass = (status: string) => {
    const classes: Record<string, string> = {
      'Pending': 'bg-slate-800 text-slate-400 border border-slate-700',
      'In_Progress': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      'Completed': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    };
    return classes[status] || '';
  };

  // Computeds
  const assignableUsers = (() => {
    if (!user) return [];
    return usersList.filter(u => u.role !== 'Pending');
  })();

  const filteredMasterTasks = masterTasks.filter(task => {
    return task.dateKey === todayDateKey;
  });

  const filteredMyTasks = myTasks.filter(task => task.dateKey === todayDateKey);

  const tasksGroupedByStaff = (() => {
    const tasks = filteredMasterTasks;
    const groups: { user: any; tasks: Task[] }[] = [];
    const users = [...usersList];
    
    const activeUid = impersonatedUserUid || user?.uid;
    const currentUserObj = usersList.find(u => u.uid === activeUid);
    if (!currentUserObj && user) {
      users.push({
        uid: user.uid,
        name: user.displayName || user.name || 'Admin',
        email: user.email,
        role: userRole,
        permissions: { canCreateTasks: true },
        status: 'Active'
      });
    }
    
    for (const u of users) {
      const userTasks = tasks.filter(t => t.assignedTo === u.uid);
      groups.push({
        user: u,
        tasks: userTasks
      });
    }
    
    const unassignedTasks = tasks.filter(t => !users.some(u => u.uid === t.assignedTo));
    if (unassignedTasks.length > 0) {
      groups.push({
        user: { uid: '', name: 'Unassigned / External', role: '' },
        tasks: unassignedTasks
      });
    }
    
    return groups;
  })();

  const filteredReportTasks = masterTasks.filter(task => {
    if (reportFilters.status && task.status !== reportFilters.status) return false;
    if (reportFilters.assigneeId && task.assignedTo !== reportFilters.assigneeId) return false;
    if (reportFilters.departmentId && task.assignedDepartmentId !== reportFilters.departmentId) return false;
    if (reportFilters.dateFrom) {
      const from = new Date(reportFilters.dateFrom);
      const taskDate = new Date(task.createdAt);
      if (taskDate < from) return false;
    }
    if (reportFilters.dateTo) {
      const to = new Date(reportFilters.dateTo);
      to.setHours(23, 59, 59, 999);
      const taskDate = new Date(task.createdAt);
      if (taskDate > to) return false;
    }
    return true;
  }).sort((a, b) => b.taskTitle.localeCompare(a.taskTitle));



  const allActiveTasks = (userRole === 'Admin') ? 
    masterTasks.filter(t => t.status !== 'Completed') :
    myTasks.filter(t => t.status !== 'Completed');



  const forceAppUpdate = async () => {
    showToast('Checking for updates & clearing app cache...', 'success');
    if ('serviceWorker' in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.unregister();
        }
      } catch (e) {
        console.error("SW Unregister error:", e);
      }
    }
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      } catch (e) {
        console.error("Cache storage clear error:", e);
      }
    }
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <AppContext.Provider value={{
      loading,
      user,
      userRole,
      authMode,
      setAuthMode,
      mobileMenuOpen,
      setMobileMenuOpen,
      authForm,
      setAuthForm,
      inviteToken,
      setInviteToken,
      invitedData,
      setInvitedData,
      impersonatedUserUid,
      showTaskDetailsModal,
      setShowTaskDetailsModal,
      activeDetailTask,
      setActiveDetailTask,
      currentDetailTask,
      newCommentText,
      setNewCommentText,
      newCommentVoiceUrl,
      setNewCommentVoiceUrl,
      newCommentImageUrl,
      setNewCommentImageUrl,
      voiceRecordingState,
      setVoiceRecordingState,
      commentUploading,
      currentTab,
      setCurrentTab,
      toast,
      showToast,
      assignmentNotification,
      setAssignmentNotification,
      myTasks,
      createdTasks,
      performanceRecords,
      activeReminderAlarm,
      setActiveReminderAlarm,
      stopAlarmSound,
      activeBroadcast,
      setActiveBroadcast,
      sendBroadcast,
      broadcastVoiceRecordingState,
      broadcastVoiceUrl,
      setBroadcastVoiceUrl,
      startBroadcastVoiceRecord,
      stopBroadcastVoiceRecord,
      cancelBroadcastVoiceRecord,
      showBroadcastModal,
      setShowBroadcastModal,
      masterTasks,
      usersList,
      departmentsList,
      createDepartment,
      deleteDepartment,


      todayDateKey,
      setTodayDateKey,
      taskForm,
      setTaskForm,
      inviteForm,
      setInviteForm,

      newTaskTypeForm,
      setNewTaskTypeForm,
      showCreateTaskModal,
      setShowCreateTaskModal,

      generatedLink,
      setGeneratedLink,
      isTaskEditMode,
      setIsTaskEditMode,
      editTaskForm,
      setEditTaskForm,

      reportFilters,
      setReportFilters,
      assignableUsers,
      filteredMasterTasks,
      filteredMyTasks,
      tasksGroupedByStaff,
      filteredReportTasks,

      getTaskTitle,
      userRoleName,
      taskStatusName,
      taskStatusClass,
      loginSubmit,
      registerSubmit,
      registerWithGoogle,
      loginWithGoogle,
      logout,
      validateInviteToken,
      submitCreateTask,
      cycleStatus,

      generateInvite,
      impersonateUser,
      openTaskDetails,
      startVoiceRecord,
      stopVoiceRecord,
      cancelVoiceRecord,
      handleCommentImageUpload,
      addComment,
      transferTask,
      updateTaskStatus,
      markTaskAsRead,
      hasUnreadComments,

      addCustomTaskType,
      removeCustomTaskType,
      updateUserRights,
      toggleUserStatus,

      startEditTask,
      cancelEditTask,
      deleteTask,
      deleteSelectedTasks,
      resetSelectedTasksData,
      updateTaskDetails,

      deleteUser,
      deleteInvite,

      newCommentVideoUrl,
      setNewCommentVideoUrl,
      commentVideoUploading,
      handleCommentVideoUpload,
      isDarkMode,
      toggleTheme,
      triggerNextTaskPopup,
      playNotificationSound,

      forceAppUpdate,
      allActiveTasks,
      showCustomConfirm,
      showCustomPrompt,
      customDialog,
      resetPerformanceLeaderboard
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
