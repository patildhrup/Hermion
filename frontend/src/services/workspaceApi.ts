import {
  approvalPreviewMock,
  emailMock,
  memoryPreviewMock,
  taskMock,
  toolActivityPreviewMock,
  upcomingMeetingsMock,
  workdayOverviewMock,
} from '../data/workspaceMock';
import type {
  ApprovalRequest,
  Email,
  Meeting,
  Memory,
  Session,
  Task,
  ToolExecution,
  WorkdayStat,
} from '../types/workspace';

export async function createSession(payload: { title: string }): Promise<Session> {
  return Promise.resolve({
    session_id: `mock-${Date.now()}`,
    title: payload.title,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export async function getSessions(): Promise<Session[]> {
  return Promise.resolve([]);
}

export async function getTasks(): Promise<Task[]> {
  return Promise.resolve(taskMock);
}

export async function getCalendar(): Promise<Meeting[]> {
  return Promise.resolve(upcomingMeetingsMock);
}

export async function getEmails(): Promise<Email[]> {
  return Promise.resolve(emailMock);
}

export async function getDocuments(): Promise<Array<{ id: string; title: string }>> {
  return Promise.resolve([]);
}

export async function createVoiceSession(): Promise<{ status: string }> {
  return Promise.resolve({ status: 'ready' });
}

export async function getWorkdayOverview(): Promise<WorkdayStat[]> {
  return Promise.resolve(workdayOverviewMock);
}

export async function getToolActivityPreview(): Promise<ToolExecution[]> {
  return Promise.resolve(toolActivityPreviewMock);
}

export async function getApprovalPreview(): Promise<ApprovalRequest> {
  return Promise.resolve(approvalPreviewMock);
}

export async function getMemoryPreview(): Promise<Memory[]> {
  return Promise.resolve(memoryPreviewMock);
}
