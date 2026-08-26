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
      await hermionApi.startAgent(channelName);
      setIsConnected(true);

      // Welcome message turn
      setTranscripts([
        {
          speaker: 'hermion',
          text: 'Hi there! I am HERMION from EchoSphere AI. What brings you to our platform today, and how big is your sales team?',
        },
      ]);
    } catch (err) {
      console.error('Call initialization error:', err);
      // Fallback local mode
      setIsConnected(true);
      setCurrentCallId('call-local-' + Date.now());
      setTranscripts([
        {
          speaker: 'hermion',
          text: 'Hi there! I am HERMION from EchoSphere AI. What brings you to our platform today, and how big is your sales team?',
        },
      ]);
    }
  };

  const endCall = async () => {
    setIsConnected(false);
    setAgentStatus('idle');

    if (currentCallId) {
      try {
        await hermionApi.endCall(currentCallId, { outcome: 'completed' });
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

      const res = await hermionApi.sendLLMTurn(history, '', currentCallId);
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
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-body">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        {/* Call Control Bar */}
        <div className="p-6 rounded-2xl bg-[#181818] border border-[#2A2A2A] flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#6AE301]/20 border border-[#6AE301]/40 flex items-center justify-center text-2xl">
              🎙️
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl text-white">Live Voice Call Session</h2>
              <p className="text-xs font-mono text-[#888]">Agora Real-Time Voice Channel: {channelName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isConnected ? (
              <button
                onClick={startCall}
                className="px-8 py-3.5 rounded-xl bg-[#6AE301] text-black font-bold text-base hover:bg-[#80F318] transition-all shadow-[0_0_20px_rgba(106,227,1,0.3)] hover:scale-105"
              >
                Connect Call
              </button>
            ) : (
              <button
                onClick={endCall}
                className="px-8 py-3.5 rounded-xl bg-red-600 text-white font-bold text-base hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)]"
              >
                End Call
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
          <form onSubmit={sendTurn} className="flex gap-3">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Speak or type your turn to HERMION (e.g. 'How much does your Pro plan cost?')..."
              className="flex-1 px-5 py-4 rounded-2xl bg-[#181818] border border-[#2D2D2D] text-white focus:outline-none focus:border-[#6AE301] font-body"
            />
            <button
              type="submit"
              disabled={agentStatus === 'thinking'}
              className="px-8 py-4 rounded-2xl bg-[#6AE301] text-black font-bold hover:bg-[#80F318] transition-all disabled:opacity-50"
            >
              Send Turn
            </button>
          </form>
        )}
      </main>

      {/* Post Call Intelligence Modal */}
      {showSummary && summary && (
        <SummaryModal summary={summary} onClose={() => setShowSummary(false)} />
      )}
    </div>
  );
}
