import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { hermionApi } from '../api/client';

export default function LandingPage() {
  const [tools, setTools] = useState([]);

  useEffect(() => {
    hermionApi.getMcpTools()
      .then(res => setTools(res || []))
      .catch(() => setTools([
        { name: 'start_voice_session', description: 'Initialize a real-time Agora voice conversation' },
        { name: 'stream_transcript', description: 'Maintain live transcript updates across the session' },
        { name: 'interrupt_and_resume', description: 'Handle natural interruptions and turn-taking' },
        { name: 'maintain_session_context', description: 'Preserve current conversation context per session' },
        { name: 'route_to_backend_agent', description: 'Forward transcript turns to the FastAPI agent layer' },
        { name: 'speak_mock_response', description: 'Return a simple test assistant reply for voice playback' },
        { name: 'secure_credentials', description: 'Keep Agora and model credentials server-side via env vars' },
      ]));
  }, []);

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-body relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-highlight/5 blur-[100px] rounded-full pointer-events-none" />

      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center relative z-10 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-mono mb-10 shadow-[0_0_15px_rgba(106,227,1,0.2)] animate-pulse-glow">
          <span className="text-sm">⚡</span> Real-Time Voice Workplace Assistant
        </div>

        <h1 className="font-heading font-black text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white via-[#E0E0E0] to-[#888] max-w-5xl drop-shadow-2xl">
          Your Intelligent Voice Work Assistant for <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-[#95FF29]">Real-Time Conversations</span>
        </h1>

        <p className="mt-10 text-lg md:text-xl text-textMuted max-w-3xl font-light leading-relaxed">
          HERMION is a voice-first workplace assistant built on Agora real-time conversation flows. It starts and stops live voice sessions, shows transcript and listening state, handles interruptions naturally, and routes each turn through the FastAPI backend.
        </p>

        {/* CTA buttons */}
        <div className="mt-12 flex flex-col sm:flex-row items-center gap-6">
          <Link
            to="/call"
            className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-accent text-black font-bold text-lg hover:bg-accentHover transition-all duration-300 shadow-[0_0_40px_rgba(106,227,1,0.4)] hover:shadow-[0_0_60px_rgba(106,227,1,0.6)] hover:-translate-y-1"
          >
            🎙️ Talk to HERMION Live
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-10 py-5 rounded-2xl glass-card text-white font-semibold text-lg hover:bg-white/10 transition-all duration-300 hover:-translate-y-1"
          >
            📊 Open Voice Workspace
          </Link>
        </div>

        {/* FastMCP Tools Section */}
        <section className="mt-32 w-full text-left">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 border-b border-glassBorder pb-6 gap-4">
            <div>
              <h2 className="font-heading font-bold text-3xl text-white mb-2">FastMCP Tool Protocol Integration</h2>
              <p className="text-sm font-mono text-textMuted">Live Model Context Protocol server mounted at <code className="bg-black/30 px-2 py-1 rounded text-accent">/mcp</code></p>
            </div>
            <span className="px-4 py-2 rounded-full bg-accent/20 text-accent font-mono text-xs font-bold border border-accent/40 shadow-[0_0_15px_rgba(106,227,1,0.2)]">
              {tools.length} Active MCP Tools
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, idx) => (
              <div
                key={idx}
                className="glass-card p-6 group cursor-default hover:-translate-y-1"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20 group-hover:bg-accent group-hover:text-black transition-colors duration-300 text-accent">
                    ⚡
                  </div>
                  <span className="font-mono text-sm font-bold text-white group-hover:text-accent transition-colors duration-300">
                    {tool.name}
                  </span>
                </div>
                <p className="text-sm text-textMuted leading-relaxed">
                  {tool.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-glassBorder mt-20 py-10 text-center text-xs font-mono text-textMuted bg-black/40 backdrop-blur-md">
        <p className="opacity-60">HERMION Voice Workspace • Real-time workplace assistant powered by Agora</p>
      </footer>
    </div>
  );
}
