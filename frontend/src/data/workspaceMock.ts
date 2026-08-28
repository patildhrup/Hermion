import type {
  ApprovalRequest,
  Email,
  Meeting,
  Memory,
  Task,
  ToolExecution,
  WorkdayStat,
} from '../types/workspace';

export const workdayOverviewMock: WorkdayStat[] = [
  { id: 'meetings', label: 'Meetings', value: 3, icon: '📅' },
  { id: 'tasks', label: 'Tasks', value: 5, icon: '✅' },
  { id: 'emails', label: 'Important Emails', value: 7, icon: '📧' },
  { id: 'overdue', label: 'Overdue', value: 2, icon: '⚠️' },
];

export const upcomingMeetingsMock: Meeting[] = [
  {
    id: 'meeting-1',
    title: 'Product Review',
    team: 'Engineering Team',
    startTime: '2:00 PM',
    dateLabel: 'Today',
  },
  {
    id: 'meeting-2',
    title: 'Engineering Sync',
    team: 'Development Team',
    startTime: '4:30 PM',
    dateLabel: 'Today',
  },
  {
    id: 'meeting-3',
    title: 'API Migration Planning',
    team: 'Platform Team',
    startTime: '10:00 AM',
    dateLabel: 'Tomorrow',
  },
];

export const taskMock: Task[] = [
  {
    id: 'task-1',
    title: 'Review API documentation',
    priority: 'high',
    dueDate: 'Today',
    status: 'today',
    completed: false,
  },
  {
    id: 'task-2',
    title: 'Prepare product meeting',
    priority: 'medium',
    dueDate: 'Today',
    status: 'in_progress',
    completed: false,
  },
  {
    id: 'task-3',
    title: 'Fix authentication issue',
    priority: 'high',
    dueDate: 'Tomorrow',
    status: 'in_progress',
    completed: false,
  },
  {
    id: 'task-4',
    title: 'Send deployment summary',
    priority: 'low',
    dueDate: 'Yesterday',
    status: 'completed',
    completed: true,
  },
  {
    id: 'task-5',
    title: 'Resolve overdue migration notes',
    priority: 'high',
    dueDate: 'Yesterday',
    status: 'overdue',
    completed: false,
  },
];

export const emailMock: Email[] = [
  { id: 'email-1', subject: 'Deployment Update', sender: 'Engineering Team', importance: 'important' },
  { id: 'email-2', subject: 'Roadmap Review Notes', sender: 'Product Ops', importance: 'important' },
];

export const toolActivityPreviewMock: ToolExecution[] = [
  {
    id: 'tool-1',
    label: 'Checking calendar',
    detail: 'Preview of tool activity state in the interface',
    status: 'success',
  },
  {
    id: 'tool-2',
    label: 'Searching documents',
    detail: '4 relevant documents found',
    status: 'success',
  },
];

export const approvalPreviewMock: ApprovalRequest = {
  id: 'approval-1',
  title: 'HERMION wants to send an email',
  actionLabel: 'Approve & Send',
  recipient: 'Engineering Team',
  subject: 'Deployment Update',
  message: 'The deployment has been delayed while we complete final voice workflow testing.',
};

export const memoryPreviewMock: Memory[] = [
  {
    id: 'memory-1',
    kind: 'stored',
    text: 'Remembering: API migration is scheduled for Friday.',
  },
  {
    id: 'memory-2',
    kind: 'retrieved',
    text: 'Using previous context from your API migration discussion.',
  },
];

