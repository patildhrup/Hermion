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
        { name: 'search_product_docs', description: 'Product knowledge Qdrant vector search' },
        { name: 'search_pricing', description: 'Real-time tier and pricing limit lookup' },
        { name: 'search_objection_playbook', description: 'Proven objection handling playbooks' },
        { name: 'check_calendar_availability', description: 'Live Google/Calendly slot checker' },
        { name: 'book_demo', description: 'Automated CRM booking & email confirmation' },
        { name: 'update_lead_status', description: 'Mid-call qualification score updater' },
        { name: 'escalate_to_human', description: 'Warm handoff to human SDR' },
      ]));
  }, []);

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-body">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#6AE301]/40 bg-[#6AE301]/10 text-[#6AE301] text-xs font-mono mb-8 animate-pulse">
          <span>⚡</span> EchoSphere Hackathon — Real-Time Voice Sales Agent
        </div>

        <h1 className="font-heading font-black text-5xl md:text-7xl lg:text-8xl tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-[#E0E0E0] to-[#888] max-w-5xl">
          Voice-Native AI Sales Rep That Closes Deals On Live Calls
        </h1>

        <p className="mt-8 text-lg md:text-xl text-[#AAA] max-w-3xl font-light leading-relaxed">
          HERMION gets on live Agora RTC voice calls with prospects, qualifies them, answers product and pricing questions grounded in Qdrant vector docs, handles objections, and books demos — under 300ms latency.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-5">
          <Link
            to="/call"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#6AE301] text-black font-bold text-lg hover:bg-[#80F318] transition-all shadow-[0_0_30px_rgba(106,227,1,0.4)] hover:scale-105"
          >
            🎙️ Talk to HERMION Live
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#1E1E1E] text-white font-semibold text-lg border border-[#333] hover:border-[#6AE301]/50 hover:bg-[#252525] transition-all"
          >
            📊 Launch CRM Dashboard
          </Link>
        </div>

        {/* FastMCP Tools Section */}
        <section className="mt-24 w-full text-left">
          <div className="flex items-center justify-between mb-8 border-b border-[#262626] pb-4">
            <div>
              <h2 className="font-heading font-bold text-2xl text-white">FastMCP Tool Protocol Integration</h2>
              <p className="text-xs font-mono text-[#888]">Live Model Context Protocol server mounted at /mcp</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#6AE301]/20 text-[#6AE301] font-mono text-xs border border-[#6AE301]/30">
              7 Active MCP Tools
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#181818] border border-[#2A2A2A] hover:border-[#6AE301]/40 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#6AE301] font-mono text-sm">⚡</span>
                  <span className="font-mono text-sm font-bold text-white group-hover:text-[#6AE301] transition-colors">
                    {tool.name}
                  </span>
                </div>
                <p className="text-xs text-[#999] leading-relaxed">
                  {tool.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222] py-8 text-center text-xs font-mono text-[#666]">
        HERMION AI Sales Engine • Built for Agora Conversational AI Hackathon
      </footer>
    </div>
  );
}
