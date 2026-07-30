export interface UserPermissions {
  canCreateTasks: boolean;
  canManageUsers?: boolean;
}

export interface Department {
  departmentId: string;
  departmentName: string;
  description?: string;
  createdAt: string;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  role: string;
  permissions: UserPermissions;
  status: 'Active' | 'Suspended';
  updatedAt?: string;
  mobileNumber?: string;
  departmentId?: string;
  departmentName?: string;
}

export interface Comment {
  commentId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  text?: string;
  voiceUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
}

export interface TransferLog {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  timestamp: string;
  reason?: string;
}

export interface Task {
  taskId: string;
  taskTitle: string;
  taskType: string;
  assignedTo: string;
  assignedToName: string;
  assignedDepartmentId?: string;
  assignedDepartmentName?: string;
  createdBy: string;
  status: 'Pending' | 'In_Progress' | 'Completed';
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: string;
  comments: Comment[];
  lastReadTimestamps: Record<string, string>;
  createdAt: string;
  dateKey: string;
  updatedAt: string;
  completedAt?: string | null;
  transferHistory?: TransferLog[];
  createdLocation?: { latitude: number; longitude: number; accuracy?: number; timestamp: string; cityName?: string } | null;
  assigneeOpenLocation?: { latitude: number; longitude: number; accuracy?: number; timestamp: string; cityName?: string } | null;
  lastOpenedLocation?: { latitude: number; longitude: number; accuracy?: number; timestamp: string; userId: string; userName: string; cityName?: string } | null;
  reminderAt?: string;
  reminderAlerted?: boolean;
  reminderHours?: string;
  reminderHoursCustom?: string;
  lastReminderAlertedAt?: string;
  taskMessage?: string;
  taskVoiceUrl?: string;
  taskImageUrl?: string;
}




export interface TaskType { typeId: string; typeName: string; }  
export interface Invitation { inviteToken: string; email: string; name: string; assignedRole: string; expiresAt: string; status: 'Pending' | 'Used'; mobileNumber?: string; createdBy?: string; } 



