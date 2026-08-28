export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
}

export interface Session {
  session_id: string;
  title: string;
  status: 'active' | 'archived' | 'completed';
  created_at?: string;
  updated_at?: string;
  messages?: Message[];
}

export interface Message {
  id?: string;
  speaker: 'hermion' | 'user';
  text: string;
  timestamp?: string;
  toolsUsed?: ToolExecution[];
}

export interface Meeting {
  id: string;
  title: string;
  team: string;
  startTime: string;
  dateLabel: string;
}

export interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  status: 'today' | 'in_progress' | 'completed' | 'overdue';
  completed: boolean;
}

export interface Email {
  id: string;
  subject: string;
  sender: string;
  importance: 'normal' | 'important';
}

export interface ToolExecution {
  id: string;
  label: string;
  detail: string;
  status: 'pending' | 'running' | 'success' | 'failed';
}

export interface ApprovalRequest {
  id: string;
  title: string;
  actionLabel: string;
  recipient: string;
  subject: string;
  message: string;
}

export interface Memory {
  id: string;
  kind: 'stored' | 'retrieved';
  text: string;
}

export interface WorkdayStat {
  id: string;
  label: string;
  value: number;
  icon: string;
}

