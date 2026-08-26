import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WaveformCanvas from '../components/WaveformCanvas';
import SummaryModal from '../components/SummaryModal';
import LeadCard from '../components/LeadCard';
import { hermionApi } from '../api/client';

// â”€â”€â”€ Icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
);
const IconChat = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
);
const IconMic = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/></svg>
);
const IconPanelRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v12a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18V6zM10.5 6h10.5M10.5 12h10.5M10.5 18h10.5"/></svg>
);
const IconSidebar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"/></svg>
);
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
);
const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>
);
const IconSend = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>
);
const IconPhone = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
);

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Layout state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);

  // Conversation history (MongoDB)
  const [conversations, setConversations] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  // Voice engine state
  const [transcripts, setTranscripts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [agentStatus, setAgentStatus] = useState('idle');
  const [userInput, setUserInput] = useState('');
  const [currentCallId, setCurrentCallId] = useState('');

  // CRM state (for right panel)
  const [leads, setLeads] = useState([]);
  const [calls, setCalls] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [panelTab, setPanelTab] = useState('leads'); // leads | tools | calls

  const transcriptEndRef = useRef(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadConversations();
    loadCrm();
  }, [user]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const loadConversations = async () => {
    if (!user) return;
    try {
      const convs = await hermionApi.getConversations(user.id);
      // Show only active ones
      setConversations((convs || []).filter(c => c.status !== 'archived'));
    } catch (e) {
      console.error('Load conversations:', e);
      setConversations([]);
    }
  };

  const loadCrm = async () => {
    try {
      const [leadsData, callsData] = await Promise.all([hermionApi.getLeads(), hermionApi.getCalls()]);
      setLeads(leadsData || []);
      setCalls(callsData || []);
    } catch (e) {
      console.error('Load CRM:', e);
    }
  };

  const newConversation = async () => {
    try {
      const conv = await hermionApi.createConversation(user.id, 'New Voice Session');
      setConversations(prev => [conv, ...prev]);
      setActiveSession(conv);
      setTranscripts([]);
      setIsConnected(false);
      setAgentStatus('idle');
    } catch (e) {
      // Fallback: local session without MongoDB
      const local = { session_id: 'local-' + Date.now(), title: 'New Voice Session', messages: [] };
      setActiveSession(local);
      setTranscripts([]);
      setIsConnected(false);
    }
  };

  const deleteConversation = async (sessionId) => {
    try {
      await hermionApi.deleteConversation(sessionId, user.id);
      setConversations(prev => prev.filter(c => c.session_id !== sessionId));
      if (activeSession?.session_id === sessionId) {
        setActiveSession(null);
        setTranscripts([]);
      }
    } catch (e) {
      console.error('Delete conversation:', e);
    }
  };

  const loadSession = async (conv) => {
    setActiveSession(conv);
    setIsConnected(false);
    setAgentStatus('idle');
    // Reload messages from MongoDB
    try {
      const full = await hermionApi.getConversation(conv.session_id);
      const msgs = (full?.messages || []).map(m => ({
        speaker: m.role === 'assistant' ? 'hermion' : 'prospect',
        text: m.content,
        tools_used: m.metadata?.tools_used || [],
      }));
      setTranscripts(msgs);
    } catch (e) {
      setTranscripts([]);
    }
  };

  // ─── Voice Synthesis (TTS) & Recognition (STT) ──────────────────────────
  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);

  const speakText = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Clean text for speech
    const clean = text.replace(/[*#_`]/g, '').trim();
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick best available English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Jenny')) && v.lang.startsWith('en')) ||
                           voices.find(v => v.lang.startsWith('en'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setAgentStatus('speaking');
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setAgentStatus('idle');
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setAgentStatus('idle');
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const setupRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition not supported in this browser.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      // Don't listen to own voice if agent is speaking
      if (isSpeakingRef.current) return;

      const lastResultIndex = event.results.length - 1;
      const transcriptText = event.results[lastResultIndex][0].transcript.trim();
      if (transcriptText) {
        handleUserSpokenTurn(transcriptText);
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') {
        console.warn('Speech recognition error:', e.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart recognition if still connected
      if (recognitionRef.current && isConnected) {
        try { recognitionRef.current.start(); } catch (err) {}
      }
    };

    return recognition;
  }, [isConnected]);

  // ─── Voice Engine ──────────────────────────────────────────────────────────
  const handleUserSpokenTurn = async (spokenText) => {
    if (!spokenText.trim()) return;

    // Stop speaking if interrupted
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    setTranscripts(prev => {
      const newTs = [...prev, { speaker: 'prospect', text: spokenText }];
      executeTurnWithHistory(newTs);
      return newTs;
    });
  };

  const executeTurnWithHistory = async (historyTranscripts) => {
    setAgentStatus('thinking');
    try {
      const history = historyTranscripts.map(t => ({
        role: t.speaker === 'hermion' ? 'assistant' : 'user',
        content: t.text,
      }));
      const res = await hermionApi.sendLLMTurn(history, '', currentCallId, activeSession?.session_id || '');
      const reply = res.choices?.[0]?.message?.content || 'I understand. How can I help further?';
      const toolsUsed = res.x_executed_tools || [];

      setTranscripts(prev => [...prev, { speaker: 'hermion', text: reply, tools_used: toolsUsed }]);
      if (toolsUsed.length > 0) setPanelOpen(true);
      speakText(reply);
    } catch (e) {
      console.error('Turn error:', e);
      setAgentStatus('idle');
    }
  };

  const startCall = async () => {
    let session = activeSession;
    if (!session) {
      try {
        session = await hermionApi.createConversation(user?.id || 'demo-user', 'New Voice Session');
        setConversations(prev => [session, ...prev]);
        setActiveSession(session);
      } catch (err) {
        session = { session_id: 'local-' + Date.now(), title: 'New Voice Session', messages: [] };
        setActiveSession(session);
      }
    }

    try {
      const callRecord = await hermionApi.createCall({
        agora_channel_name: `hermion-${session.session_id?.slice(0, 8) || 'demo'}`,
        outcome: 'in_progress',
      });
      setCurrentCallId(callRecord.id);
      await hermionApi.startAgent(callRecord.agora_channel_name);
    } catch (e) {
      setCurrentCallId('call-local-' + Date.now());
    }

    setIsConnected(true);

    // Start microphone speech recognition
    try {
      const rec = setupRecognition();
      if (rec) {
        recognitionRef.current = rec;
        rec.start();
      }
    } catch (err) {
      console.warn('Microphone activation notice:', err);
    }

    const welcome = { speaker: 'hermion', text: "Hi there! I'm HERMION from EchoSphere AI. How can I help your sales team today?" };
    setTranscripts(prev => [...prev, welcome]);
    speakText(welcome.text);

    // Save welcome message to MongoDB session
    if (session?.session_id && !session.session_id.startsWith('local')) {
      hermionApi.appendMessage(session.session_id, 'assistant', welcome.text).catch(() => {});
    }
  };

  const endCall = async () => {
    setIsConnected(false);
    setAgentStatus('idle');
    isSpeakingRef.current = false;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }

    if (currentCallId) {
      try {
        await hermionApi.endCall(currentCallId, { outcome: 'completed' });
        setTimeout(async () => {
          const sum = await hermionApi.getSummary(currentCallId);
          setSummary(sum);
          setShowSummary(true);
        }, 1200);
      } catch (e) { console.error(e); }
    }
    // Rename session based on first user turn
    const firstUser = transcripts.find(t => t.speaker === 'prospect');
    if (firstUser && activeSession && !activeSession.session_id?.startsWith('local')) {
      const newTitle = firstUser.text.slice(0, 40) + (firstUser.text.length > 40 ? '...' : '');
      hermionApi.renameConversation(activeSession.session_id, user.id, newTitle).catch(() => {});
      setConversations(prev => prev.map(c =>
        c.session_id === activeSession.session_id ? { ...c, title: newTitle } : c
      ));
    }
    loadCrm();
  };

  const sendTurn = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    const userText = userInput;
    setUserInput('');

    // Stop previous speech if any
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    const newTs = [...transcripts, { speaker: 'prospect', text: userText }];
    setTranscripts(newTs);
    executeTurnWithHistory(newTs);
  };

  // â”€â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const Sidebar = () => (
    <aside className={`flex-shrink-0 flex flex-col h-full bg-surface/80 border-r border-glassBorder backdrop-blur-xl transition-all duration-300 overflow-hidden ${sidebarOpen ? 'w-64' : 'w-0'}`}>
      <div className="p-4 flex flex-col h-full min-w-64">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-6 px-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent to-[#95FF29] flex items-center justify-center text-black font-black text-sm shadow-[0_0_12px_rgba(106,227,1,0.5)]">H</div>
          <span className="font-heading font-black text-base text-white">HERMION</span>
        </div>

        {/* New Conversation */}
        <button
          onClick={newConversation}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-accent/10 text-accent border border-accent/20 hover:bg-accent hover:text-black font-bold text-sm transition-all duration-300 mb-4 group"
        >
          <IconPlus />
          New Voice Session
        </button>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          <p className="text-[10px] font-mono text-textMuted uppercase tracking-wider px-2 mb-2">Recent Sessions</p>
          {conversations.length === 0 ? (
            <div className="px-3 py-4 text-center text-textMuted/50 text-xs font-mono">
              No sessions yet.<br/>Start a new voice session.
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.session_id}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                  activeSession?.session_id === conv.session_id
                    ? 'bg-white/10 border border-white/10'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
                onClick={() => loadSession(conv)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-textMuted/60 flex-shrink-0"><IconChat /></span>
                  <span className="text-sm text-white/80 truncate">{conv.title || 'Voice Session'}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.session_id); }}
                  className="opacity-0 group-hover:opacity-100 text-textMuted hover:text-red-400 flex-shrink-0 ml-1 p-0.5 transition-all"
                >
                  <IconTrash />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bottom: Profile + Logout */}
        <div className="pt-3 border-t border-glassBorder space-y-1 mt-3">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent/40 to-accent/10 border border-accent/30 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
              {(user?.username || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white font-semibold truncate">{user?.username || user?.email?.split('@')[0]}</p>
              <p className="text-[10px] text-textMuted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-textMuted hover:text-red-400 hover:bg-red-500/10 text-sm font-medium transition-all duration-200"
          >
            <IconLogout />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );

  // â”€â”€â”€ Right Context Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const ContextPanel = () => (
    <aside className={`flex-shrink-0 flex flex-col h-full bg-surface/80 border-l border-glassBorder backdrop-blur-xl transition-all duration-300 overflow-hidden ${panelOpen ? 'w-80' : 'w-0'}`}>
      <div className="min-w-80 flex flex-col h-full">
        {/* Panel Header */}
        <div className="p-4 border-b border-glassBorder flex items-center justify-between">
          <span className="text-sm font-bold text-white">Context Panel</span>
          <div className="flex gap-1">
            {['leads', 'calls', 'tools'].map(tab => (
              <button key={tab} onClick={() => setPanelTab(tab)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all ${panelTab === tab ? 'bg-accent text-black' : 'text-textMuted hover:text-white'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {panelTab === 'leads' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-textMuted uppercase tracking-wide mb-1">Total Leads</p>
                  <p className="text-2xl font-black text-white">{leads.length}</p>
                </div>
                <div className="bg-black/30 rounded-xl p-3 border border-accent/20">
                  <p className="text-[10px] text-textMuted uppercase tracking-wide mb-1">Demos Booked</p>
                  <p className="text-2xl font-black text-accent">{leads.filter(l => l.status === 'demo_booked').length}</p>
                </div>
              </div>
              {leads.slice(0, 5).map(lead => (
                <div key={lead.id} className="bg-black/30 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white">{lead.name}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${lead.status === 'demo_booked' ? 'bg-accent/20 text-accent' : 'bg-white/10 text-textMuted'}`}>
                      {lead.status}
                    </span>
                  </div>
                  <p className="text-xs text-textMuted">{lead.company}</p>
                  <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${lead.qualification_score || 0}%` }} />
                  </div>
                  <p className="text-[10px] text-textMuted mt-1 text-right">{lead.qualification_score || 0}/100</p>
                </div>
              ))}
            </>
          )}

          {panelTab === 'calls' && (
            <div className="space-y-3">
              {calls.length === 0 ? (
                <div className="text-center py-8 text-textMuted text-xs font-mono opacity-50">No call history yet.</div>
              ) : calls.map(call => (
                <div key={call.id} className="bg-black/30 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-white">#{call.id?.slice(0, 8)}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${call.outcome === 'completed' ? 'bg-accent/20 text-accent' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {call.outcome || 'completed'}
                    </span>
                  </div>
                  <p className="text-[11px] text-textMuted">{call.started_at ? new Date(call.started_at).toLocaleString() : 'Recent'}</p>
                </div>
              ))}
            </div>
          )}

          {panelTab === 'tools' && (
            <div className="space-y-3">
              <p className="text-xs text-textMuted font-mono">FastMCP tools will appear here when executed during a live session.</p>
              {transcripts.filter(t => t.tools_used?.length > 0).flatMap((t, i) =>
                t.tools_used.map((tool, j) => (
                  <div key={`${i}-${j}`} className="bg-accent/5 border border-accent/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-accent text-sm">âš¡</span>
                      <span className="text-xs font-mono font-bold text-accent">{tool}</span>
                    </div>
                    <p className="text-[11px] text-textMuted">Called during this session</p>
                  </div>
                ))
              )}
              {transcripts.every(t => !t.tools_used?.length) && (
                <div className="text-center py-8 text-textMuted/50 text-xs font-mono">
                  Tools are auto-called by HERMION during conversations.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );

  // â”€â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="h-screen bg-background text-text flex overflow-hidden font-body">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* Top Bar */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-glassBorder bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="p-2 rounded-lg text-textMuted hover:text-white hover:bg-white/10 transition-all"
              title="Toggle Sidebar"
            >
              <IconSidebar />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">{activeSession?.title || 'HERMION Voice Engine'}</span>
              {isConnected && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-textMuted hidden sm:block px-2.5 py-1 bg-white/5 rounded-full border border-white/5">
              {agentStatus === 'speaking' ? 'ðŸŸ¢ Speaking' : agentStatus === 'thinking' ? 'ðŸŸ¡ Thinking' : isConnected ? 'ðŸ”µ Listening' : 'âš« Idle'}
            </span>
            {/* Right Panel Toggle Button */}
            <button
              onClick={() => setPanelOpen(v => !v)}
              className={`p-2 rounded-lg transition-all ${panelOpen ? 'bg-accent text-black' : 'text-textMuted hover:text-white hover:bg-white/10'}`}
              title="Toggle Context Panel"
            >
              <IconPanelRight />
            </button>
          </div>
        </header>

        {/* Voice Engine Center */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {!activeSession ? (
            /* Welcome State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-accent to-[#95FF29] flex items-center justify-center text-black font-black text-4xl shadow-[0_0_50px_rgba(106,227,1,0.5)] mb-8 animate-float">
                H
              </div>
              <h1 className="font-heading font-black text-3xl md:text-4xl text-white mb-4">
                Welcome to HERMION
              </h1>
              <p className="text-textMuted max-w-md text-base leading-relaxed mb-10">
                Your real-time AI voice sales agent. Start a new session to begin a live voice call with instant MCP tool support.
              </p>
              <button
                onClick={newConversation}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-accent text-black font-bold text-lg hover:bg-accentHover transition-all shadow-[0_0_40px_rgba(106,227,1,0.4)] hover:shadow-[0_0_60px_rgba(106,227,1,0.6)] hover:-translate-y-1"
              >
                <IconPlus />
                Start New Session
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Waveform + Status */}
              <div className="px-6 pt-6">
                <div className={`relative w-full flex flex-col items-center p-6 rounded-2xl border transition-all duration-500 ${
                  isConnected
                    ? 'border-accent/30 bg-accent/5 shadow-[0_0_60px_rgba(106,227,1,0.1)]'
                    : 'border-white/5 bg-white/[0.02]'
                }`}>
                  <WaveformCanvas isConnected={isConnected} agentStatus={agentStatus} />
                  <div className="mt-4 flex items-center gap-4">
                    {!isConnected ? (
                      <button onClick={startCall}
                        className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-accent text-black font-bold hover:bg-accentHover transition-all shadow-[0_0_30px_rgba(106,227,1,0.4)] hover:-translate-y-0.5">
                        <IconPhone /> Connect Live Call
                      </button>
                    ) : (
                      <button onClick={endCall}
                        className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/40 font-bold hover:bg-red-600 hover:text-white transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                        âœ• End Call
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Transcript Chat Area */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                {transcripts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-textMuted/40 text-sm font-mono text-center">
                    <div className="text-4xl mb-3 opacity-30">ðŸ’¬</div>
                    Connect to a call and start speaking to see the transcript here...
                  </div>
                ) : (
                  transcripts.map((t, idx) => {
                    const isAgent = t.speaker === 'hermion';
                    return (
                      <div key={idx} className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[75%] ${isAgent ? 'items-start' : 'items-end'} flex flex-col gap-1`}>
                          <span className="text-[10px] font-mono text-textMuted/50 uppercase tracking-wider px-2">
                            {isAgent ? 'HERMION AI' : 'You'}
                          </span>
                          <div className={`px-5 py-3.5 rounded-3xl text-sm leading-relaxed shadow-lg ${
                            isAgent
                              ? 'bg-surface/80 text-white border border-white/10 rounded-tl-sm'
                              : 'bg-accent/90 text-black font-semibold rounded-tr-sm shadow-[0_4px_20px_rgba(106,227,1,0.25)]'
                          }`}>
                            {t.text}
                          </div>
                          {t.tools_used?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 px-2 mt-1">
                              {t.tools_used.map((tool, i) => (
                                <span key={i} className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                                  âš¡ {tool}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={transcriptEndRef} />
              </div>

              {/* Input Bar */}
              <div className="px-6 pb-6 pt-2 flex-shrink-0">
                <form onSubmit={sendTurn} className="flex items-center gap-3 p-3 rounded-2xl bg-surface/80 border border-glassBorder backdrop-blur-md shadow-xl">
                  <div className="p-2 text-textMuted/50">
                    <IconMic />
                  </div>
                  <input
                    type="text"
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    placeholder={isConnected ? "Type your message to HERMION..." : "Start a call first, then type here..."}
                    disabled={!isConnected && transcripts.length === 0}
                    className="flex-1 bg-transparent text-white placeholder:text-textMuted/40 text-sm outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!userInput.trim() || agentStatus === 'thinking'}
                    className="p-2.5 rounded-xl bg-accent text-black hover:bg-accentHover transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <IconSend />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Context Panel */}
      <ContextPanel />

      {/* Summary Modal */}
      {showSummary && summary && (
        <SummaryModal summary={summary} onClose={() => { setShowSummary(false); loadConversations(); }} />
      )}
    </div>
  );
}
