import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import WaveformCanvas from '../components/WaveformCanvas';
import TranscriptStream from '../components/TranscriptStream';
import SummaryModal from '../components/SummaryModal';
import { hermionApi } from '../api/client';

export default function LiveCallPage() {
  const [channelName, setChannelName] = useState('hermion-demo-channel');
  const [isConnected, setIsConnected] = useState(false);
  const [agentStatus, setAgentStatus] = useState('idle'); // idle | thinking | speaking
  const [transcripts, setTranscripts] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [currentCallId, setCurrentCallId] = useState('');
  const [currentAgentId, setCurrentAgentId] = useState('');
  const [sessionId] = useState(`live-call-${Date.now()}`);
  const [summary, setSummary] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  const startCall = async () => {
    try {
      const callRecord = await hermionApi.createCall({
        agora_channel_name: channelName,
        outcome: 'in_progress',
      });
      setCurrentCallId(callRecord.id);

      // Start Agora AI Agent session
      const agentSession = await hermionApi.startAgent(channelName, sessionId, callRecord.id);
      setCurrentAgentId(agentSession.agent_id || '');
      setIsConnected(true);

      // Welcome message turn
      setTranscripts([
        {
          speaker: 'hermion',
          text: "Hi, I'm HERMION, your intelligent voice work assistant. How can I help you today?",
        },
      ]);
    } catch (err) {
      console.error('Call initialization error:', err);
      // Fallback local mode
      setIsConnected(true);
      setCurrentCallId('call-local-' + Date.now());
      setCurrentAgentId('');
      setTranscripts([
        {
          speaker: 'hermion',
          text: "Hi, I'm HERMION, your intelligent voice work assistant. How can I help you today?",
        },
      ]);
    }
  };

  const endCall = async () => {
    setIsConnected(false);
    setAgentStatus('idle');

    if (currentCallId) {
      try {
        if (currentAgentId) {
          await hermionApi.stopAgent(currentAgentId, sessionId, currentCallId);
        } else {
          await hermionApi.endCall(currentCallId, { outcome: 'completed' });
        }
        // Fetch summary
        setTimeout(async () => {
          const sum = await hermionApi.getSummary(currentCallId);
          setSummary(sum);
          setShowSummary(true);
        }, 1200);
      } catch (err) {
        console.error('Error ending call:', err);
      }
    }
    setCurrentAgentId('');
  };

  const sendTurn = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !isConnected) return;

    const userText = userInput;
    setUserInput('');

    // Append prospect turn
    const newTranscripts = [...transcripts, { speaker: 'prospect', text: userText }];
    setTranscripts(newTranscripts);
    setAgentStatus('thinking');

    try {
      // Format history for backend
      const history = newTranscripts.map((t) => ({
        role: t.speaker === 'hermion' ? 'assistant' : 'user',
        content: t.text,
      }));

      const res = await hermionApi.sendLLMTurn(history, currentCallId, sessionId, currentAgentId, '');
      const choice = res.choices?.[0]?.message?.content || 'I understand. How else can I help?';
      const toolsUsed = res.x_executed_tools || [];

      setAgentStatus('speaking');
      setTimeout(() => {
        setTranscripts((prev) => [
          ...prev,
          {
            speaker: 'hermion',
            text: choice,
            tools_used: toolsUsed,
          },
        ]);
        setAgentStatus('idle');
      }, 1000);
    } catch (err) {
      console.error('Turn execution failed:', err);
      setAgentStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-body relative overflow-hidden">
      {/* Dynamic Background Aura */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] pointer-events-none transition-colors duration-1000 ${
        !isConnected ? 'bg-white/5' : agentStatus === 'speaking' ? 'bg-accent/20' : agentStatus === 'thinking' ? 'bg-highlight/20' : 'bg-blue-500/10'
      }`} />
      
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 flex flex-col gap-8 relative z-10 animate-fade-in-up">
        {/* Call Control Bar */}
        <div className="glass-panel p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          {/* Animated glow line at top */}
          <div className={`absolute top-0 left-0 h-1 transition-all duration-1000 ${
            isConnected ? 'w-full bg-gradient-to-r from-accent via-[#95FF29] to-accent' : 'w-0 bg-transparent'
          }`} />

          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner transition-all duration-500 ${
              isConnected ? 'bg-accent/20 border border-accent/40 shadow-[0_0_20px_rgba(106,227,1,0.3)]' : 'bg-surface border border-white/10 opacity-50'
            }`}>
              🎙️
            </div>
            <div>
              <h2 className="font-heading font-bold text-2xl text-white">Live Voice Session</h2>
              <div className="flex items-center gap-2 mt-1">
                {isConnected && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
                  </span>
                )}
                <p className="text-xs font-mono text-textMuted uppercase tracking-wider">
                  Agora Channel: <span className="text-white">{channelName}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isConnected ? (
              <button
                onClick={startCall}
                className="px-10 py-4 rounded-xl bg-accent text-black font-bold text-lg hover:bg-accentHover transition-all shadow-[0_0_30px_rgba(106,227,1,0.4)] hover:shadow-[0_0_50px_rgba(106,227,1,0.6)] hover:-translate-y-0.5"
              >
                Start Voice Session
              </button>
            ) : (
              <button
                onClick={endCall}
                className="px-10 py-4 rounded-xl bg-red-600/20 text-red-400 border border-red-500/50 font-bold text-lg hover:bg-red-600 hover:text-white transition-all shadow-[0_0_30px_rgba(220,38,38,0.2)] hover:shadow-[0_0_40px_rgba(220,38,38,0.5)]"
              >
                Stop Voice Session
              </button>
            )}
          </div>
        </div>

        {/* Audio Waveform Canvas */}
        <WaveformCanvas isConnected={isConnected} agentStatus={agentStatus} />

        {/* Live Transcript Stream */}
        <TranscriptStream transcripts={transcripts} />

        {/* Input Bar for Testing Voice/Text Turn */}
        {isConnected && (
          <form onSubmit={sendTurn} className="flex gap-4 p-4 rounded-3xl glass-panel shadow-2xl sticky bottom-6 animate-fade-in-up">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type a test turn to HERMION..."
              className="flex-1 px-6 py-4 rounded-2xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 font-body shadow-inner transition-all"
            />
            <button
              type="submit"
              disabled={agentStatus === 'thinking'}
              className="px-8 py-4 rounded-2xl bg-accent text-black font-bold hover:bg-accentHover transition-all shadow-[0_0_20px_rgba(106,227,1,0.3)] disabled:opacity-50 disabled:shadow-none disabled:hover:-translate-y-0 disabled:cursor-not-allowed hover:-translate-y-0.5"
            >
              Send Turn
            </button>
          </form>
        )}
      </main>

      {/* Post-session summary */}
      {showSummary && summary && (
        <SummaryModal summary={summary} onClose={() => setShowSummary(false)} />
      )}
    </div>
  );
}
