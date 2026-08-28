import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SummaryModal from '../components/SummaryModal';
import Sidebar from '../components/workspace/Sidebar';
import TopBar from '../components/workspace/TopBar';
import VoiceControl from '../components/workspace/VoiceControl';
import ConversationPanel from '../components/workspace/ConversationPanel';
import WorkdayOverview from '../components/workspace/WorkdayOverview';
import UpcomingEvents from '../components/workspace/UpcomingEvents';
import TaskPanel from '../components/workspace/TaskPanel';
import ToolActivity from '../components/workspace/ToolActivity';
import ApprovalCard from '../components/workspace/ApprovalCard';
import MemoryIndicator from '../components/workspace/MemoryIndicator';
import NotificationPanel from '../components/workspace/NotificationPanel';
import { useAuth } from '../context/AuthContext';
import { hermionApi } from '../api/client';
import {
  getApprovalPreview,
  getCalendar,
  getEmails,
  getMemoryPreview,
  getTasks,
  getToolActivityPreview,
  getWorkdayOverview,
} from '../services/workspaceApi';

const TOOL_LABELS = {
  search_product_docs: { label: 'Searching knowledge', detail: 'Relevant workspace context found' },
  check_calendar_availability: { label: 'Checking calendar', detail: 'Calendar context retrieved' },
  book_demo: { label: 'Managing voice flow', detail: 'Live session handling updated' },
  update_lead_status: { label: 'Updating workspace context', detail: 'Session context refreshed' },
  escalate_to_human: { label: 'Escalation prepared', detail: 'Unsupported action identified safely' },
};

function mapVoiceState(isConnected, agentStatus, hasError) {
  if (hasError) return 'error';
  if (!isConnected) return 'idle';
  if (agentStatus === 'thinking') return 'thinking';
  if (agentStatus === 'speaking') return 'speaking';
  return 'listening';
}

function mapConversation(raw) {
  return {
    session_id: raw.session_id,
    title: raw.title || 'Voice Session',
    status: raw.status || 'active',
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

function mapMessages(messages = []) {
  return messages.map((message, index) => ({
    id: `${message.role}-${index}`,
    speaker: message.role === 'assistant' ? 'hermion' : 'user',
    text: message.content,
    toolsUsed: (message.metadata?.tools_used || []).map((toolName, toolIndex) => ({
      id: `${toolName}-${toolIndex}`,
      label: TOOL_LABELS[toolName]?.label || 'Using workspace tool',
      detail: TOOL_LABELS[toolName]?.detail || 'Work context updated',
      status: 'success',
    })),
  }));
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('overview');
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [agentStatus, setAgentStatus] = useState('idle');
  const [currentCallId, setCurrentCallId] = useState('');
  const [currentAgentId, setCurrentAgentId] = useState('');
  const [voiceError, setVoiceError] = useState(false);
  const [summary, setSummary] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  const [overviewStats, setOverviewStats] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [emails, setEmails] = useState([]);
  const [toolActivityPreview, setToolActivityPreview] = useState([]);
  const [approvalPreview, setApprovalPreview] = useState(null);
  const [memoryPreview, setMemoryPreview] = useState([]);

  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);

  const voiceState = mapVoiceState(isConnected, agentStatus, voiceError);

  const displayedToolActivity = useMemo(() => {
    const actual = messages.flatMap((message) => message.toolsUsed || []);
    return actual.length > 0 ? actual.slice(-4) : toolActivityPreview;
  }, [messages, toolActivityPreview]);

  const loadWorkspaceData = useCallback(async () => {
    const [stats, meetings, taskItems, emailItems, activityItems, approvalItem, memoryItems] = await Promise.all([
      getWorkdayOverview(),
      getCalendar(),
      getTasks(),
      getEmails(),
      getToolActivityPreview(),
      getApprovalPreview(),
      getMemoryPreview(),
    ]);

    setOverviewStats(stats);
    setUpcomingMeetings(meetings);
    setTasks(taskItems);
    setEmails(emailItems);
    setToolActivityPreview(activityItems);
    setApprovalPreview(approvalItem);
    setMemoryPreview(memoryItems);
  }, []);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const conversationList = await hermionApi.getConversations(user.id);
      setSessions((conversationList || []).filter((item) => item.status !== 'archived').map(mapConversation));
    } catch {
      setSessions([]);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadConversations();
    loadWorkspaceData();
  }, [user, navigate, loadConversations, loadWorkspaceData]);

  const speakText = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const clean = text.replace(/[*#_`]/g, '').trim();
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.02;
    utterance.pitch = 1;

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setAgentStatus('speaking');
      setVoiceError(false);
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setAgentStatus('idle');
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setAgentStatus('idle');
      setVoiceError(true);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const handleUserTurn = useCallback(
    async (spokenText, sessionOverride) => {
      if (!spokenText.trim()) return;
      window.speechSynthesis?.cancel();
      setVoiceError(false);

      const nextMessage = {
        id: `user-${Date.now()}`,
        speaker: 'user',
        text: spokenText,
      };

      const nextMessages = [...messages, nextMessage];
      setMessages(nextMessages);
      setAgentStatus('thinking');

      const currentSession = sessionOverride || activeSession;
      if (!currentSession) return;

      const history = nextMessages.map((message) => ({
        role: message.speaker === 'hermion' ? 'assistant' : 'user',
        content: message.text,
      }));

      try {
        const response = await hermionApi.sendLLMTurn(
          history,
          currentCallId,
          currentSession.session_id,
          currentAgentId
        );

        const reply = response.choices?.[0]?.message?.content || 'I understand. How can I help further?';
        const toolsUsed = (response.x_executed_tools || []).map((toolName, index) => ({
          id: `${toolName}-${index}-${Date.now()}`,
          label: TOOL_LABELS[toolName]?.label || 'Using workspace tool',
          detail: TOOL_LABELS[toolName]?.detail || 'Work context updated',
          status: 'success',
        }));

        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          speaker: 'hermion',
          text: reply,
          toolsUsed,
        };

        setMessages((previous) => [...previous, assistantMessage]);
        setAgentStatus('idle');
        speakText(reply);

        if (nextMessages.length <= 2 && user?.id) {
          const shortTitle = spokenText.slice(0, 35) + (spokenText.length > 35 ? '...' : '');
          hermionApi.renameConversation(currentSession.session_id, user.id, shortTitle).catch(() => {});
          setSessions((previous) =>
            previous.map((session) =>
              session.session_id === currentSession.session_id ? { ...session, title: shortTitle } : session
            )
          );
        }
      } catch {
        setAgentStatus('idle');
        setVoiceError(true);
      }
    },
    [messages, activeSession, currentCallId, currentAgentId, speakText, user]
  );

  const setupRecognition = useCallback(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return null;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      if (isSpeakingRef.current) return;
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0]?.transcript?.trim();
      if (transcript) {
        void handleUserTurn(transcript);
      }
    };

    recognition.onerror = () => {
      setVoiceError(true);
    };

    recognition.onend = () => {
      if (recognitionRef.current && isConnected) {
        try {
          recognitionRef.current.start();
        } catch {
          setVoiceError(true);
        }
      }
    };

    return recognition;
  }, [handleUserTurn, isConnected]);

  const startNewConversation = useCallback(async () => {
    if (!user) return;
    try {
      const created = await hermionApi.createConversation(user.id, 'New Voice Session');
      const nextSession = mapConversation(created);
      setSessions((previous) => [nextSession, ...previous]);
      setActiveSession(nextSession);
    } catch {
      const fallback = {
        session_id: `session-${Date.now()}`,
        title: 'New Voice Session',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setActiveSession(fallback);
    }

    setMessages([]);
    setIsConnected(false);
    setAgentStatus('idle');
    setCurrentCallId('');
    setCurrentAgentId('');
    setVoiceError(false);
    setSidebarOpen(false);
  }, [user]);

  const loadSession = useCallback(async (session) => {
    setActiveSession(session);
    setIsConnected(false);
    setAgentStatus('idle');
    setCurrentCallId('');
    setCurrentAgentId('');
    setVoiceError(false);
    setSidebarOpen(false);

    try {
      const fullConversation = await hermionApi.getConversation(session.session_id);
      setMessages(mapMessages(fullConversation?.messages));
    } catch {
      setMessages([]);
    }
  }, []);

  const deleteSession = useCallback(async (sessionId) => {
    if (!user) return;
    try {
      await hermionApi.deleteConversation(sessionId, user.id);
      setSessions((previous) => previous.filter((session) => session.session_id !== sessionId));
      if (activeSession?.session_id === sessionId) {
        setActiveSession(null);
        setMessages([]);
        setIsConnected(false);
      }
    } catch {
      return;
    }
  }, [user, activeSession]);

  const startVoiceSession = useCallback(async () => {
    let session = activeSession;
    if (!session) {
      if (!user) return;
      const created = await hermionApi.createConversation(user.id, 'New Voice Session').catch(() => null);
      if (created) {
        session = mapConversation(created);
        setSessions((previous) => [session, ...previous]);
        setActiveSession(session);
      }
    }

    if (!session) return;

    try {
      const callRecord = await hermionApi.createCall({
        agora_channel_name: `hermion-${session.session_id.slice(0, 8)}`,
        outcome: 'in_progress',
      });
      setCurrentCallId(callRecord.id);

      const agentSession = await hermionApi.startAgent(
        callRecord.agora_channel_name,
        session.session_id,
        callRecord.id
      );
      setCurrentAgentId(agentSession.agent_id || '');
    } catch {
      setCurrentCallId(`call-local-${Date.now()}`);
      setCurrentAgentId('');
    }

    try {
      const recognition = setupRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
      }
    } catch {
      setVoiceError(true);
    }

    const welcome = "Hi, I'm HERMION, your intelligent voice work assistant. How can I help you today?";
    setIsConnected(true);
    setAgentStatus('idle');
    setVoiceError(false);
    setMessages((previous) => [
      ...previous,
      {
        id: `assistant-${Date.now()}`,
        speaker: 'hermion',
        text: welcome,
      },
    ]);
    hermionApi.appendMessage(session.session_id, 'assistant', welcome).catch(() => {});
    speakText(welcome);
  }, [activeSession, setupRecognition, speakText, user]);

  const endVoiceSession = useCallback(async () => {
    setIsConnected(false);
    setAgentStatus('idle');
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    window.speechSynthesis?.cancel();

    if (currentCallId) {
      if (currentAgentId) {
        await hermionApi.stopAgent(currentAgentId, activeSession?.session_id || '', currentCallId).catch(() => {});
      } else {
        await hermionApi.endCall(currentCallId, { outcome: 'completed' }).catch(() => {});
      }

      const nextSummary = await hermionApi.getSummary(currentCallId).catch(() => null);
      if (nextSummary) {
        setSummary(nextSummary);
        setShowSummary(true);
      }
    }

    if (messages.length > 0 && activeSession && user?.id) {
      const firstUserMessage = messages.find((message) => message.speaker === 'user');
      if (firstUserMessage) {
        const shortTitle = firstUserMessage.text.slice(0, 35) + (firstUserMessage.text.length > 35 ? '...' : '');
        hermionApi.renameConversation(activeSession.session_id, user.id, shortTitle).catch(() => {});
      }
    }

    setCurrentCallId('');
    setCurrentAgentId('');
    loadConversations();
  }, [activeSession, currentAgentId, currentCallId, loadConversations, messages, user]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    if (!userInput.trim() || !activeSession) return;
    const nextInput = userInput;
    setUserInput('');
    await handleUserTurn(nextInput);
  }, [activeSession, handleUserTurn, userInput]);

  const title = activeSession?.title || 'HERMION Voice Engine';

  return (
    <div className="flex h-screen overflow-hidden bg-background text-text">
      <Sidebar
        open={sidebarOpen}
        sessions={sessions}
        activeSessionId={activeSession?.session_id || ''}
        activeNav={activeNav}
        user={user}
        onClose={() => setSidebarOpen(false)}
        onNewSession={() => void startNewConversation()}
        onSelectSession={(session) => void loadSession(session)}
        onDeleteSession={(sessionId) => void deleteSession(sessionId)}
        onChangeNav={setActiveNav}
        onSignOut={() => {
          logout();
          navigate('/');
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={title} voiceState={voiceState} onToggleSidebar={() => setSidebarOpen((value) => !value)} />

        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px]">
              <div className="min-w-0">
                {isConnected || messages.length > 0 ? (
                  <ConversationPanel
                    messages={messages}
                    voiceState={voiceState}
                    userInput={userInput}
                    onInputChange={setUserInput}
                    onSubmit={handleSubmit}
                    onVoiceAction={() => void startVoiceSession()}
                  />
                ) : (
                  <VoiceControl
                    voiceState={voiceState}
                    onPrimaryAction={() => void startVoiceSession()}
                    onStop={() => void endVoiceSession()}
                    isConnected={isConnected}
                  />
                )}
              </div>

              <div className="space-y-6">
                <WorkdayOverview stats={overviewStats} />
                <UpcomingEvents meetings={upcomingMeetings} />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <TaskPanel tasks={tasks} />
              <div className="space-y-6">
                <ToolActivity items={displayedToolActivity} />
                <NotificationPanel emails={emails} />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ApprovalCard approval={approvalPreview} />
              <MemoryIndicator items={memoryPreview} />
            </div>
          </div>
        </main>
      </div>

      {showSummary && summary && (
        <SummaryModal summary={summary} onClose={() => setShowSummary(false)} />
      )}
    </div>
  );
}
