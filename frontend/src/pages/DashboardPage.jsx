import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import LeadCard from '../components/LeadCard';
import SummaryModal from '../components/SummaryModal';
import { hermionApi } from '../api/client';

export default function DashboardPage() {
  const [leads, setLeads] = useState([]);
  const [calls, setCalls] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [activeTab, setActiveTab] = useState('leads');
  const [summary, setSummary] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [showAddLead, setShowAddLead] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const leadsData = await hermionApi.getLeads();
      setLeads(leadsData || []);
      const callsData = await hermionApi.getCalls();
      setCalls(callsData || []);
    } catch (err) {
      console.error('Error loading CRM data:', err);
    }
  };

  const handleUpdateStatus = async (leadId, status, score) => {
    try {
      await hermionApi.updateLead(leadId, { status, qualification_score: score });
      loadData();
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!newLeadName || !newLeadCompany) return;

    try {
      await hermionApi.createLead({
        name: newLeadName,
        company: newLeadCompany,
        status: 'new',
        qualification_score: 50,
      });
      setNewLeadName('');
      setNewLeadCompany('');
      setShowAddLead(false);
      loadData();
    } catch (err) {
      console.error('Failed to create lead:', err);
    }
  };

  const handleViewSummary = async (callId) => {
    try {
      const sum = await hermionApi.getSummary(callId);
      setSummary(sum);
      setShowSummary(true);
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-body">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Metric Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-[#181818] border border-[#2A2A2A]">
            <span className="text-xs font-mono text-[#888] uppercase block">Total Leads</span>
            <span className="font-heading font-black text-3xl text-white mt-1 block">
              {leads.length}
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-[#181818] border border-[#2A2A2A]">
            <span className="text-xs font-mono text-[#888] uppercase block">Demos Booked</span>
            <span className="font-heading font-black text-3xl text-[#6AE301] mt-1 block">
              {leads.filter((l) => l.status === 'demo_booked').length}
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-[#181818] border border-[#2A2A2A]">
            <span className="text-xs font-mono text-[#888] uppercase block">Total AI Calls</span>
            <span className="font-heading font-black text-3xl text-white mt-1 block">
              {calls.length}
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-[#181818] border border-[#2A2A2A]">
            <span className="text-xs font-mono text-[#888] uppercase block">Avg Qual Score</span>
            <span className="font-heading font-black text-3xl text-[#F2D42C] mt-1 block">
              {leads.length
                ? Math.round(
                    leads.reduce((acc, curr) => acc + (curr.qualification_score || 0), 0) /
                      leads.length
                  )
                : 0}
              /100
            </span>
          </div>
        </div>

        {/* Action Header & Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#262626] pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'leads'
                  ? 'bg-[#6AE301] text-black font-bold'
                  : 'bg-[#1A1A1A] text-[#AAA] hover:text-white'
              }`}
            >
              Leads Overview
            </button>
            <button
              onClick={() => setActiveTab('calls')}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'calls'
                  ? 'bg-[#6AE301] text-black font-bold'
                  : 'bg-[#1A1A1A] text-[#AAA] hover:text-white'
              }`}
            >
              Call History & Transcripts
            </button>
          </div>

          {activeTab === 'leads' && (
            <button
              onClick={() => setShowAddLead(!showAddLead)}
              className="px-5 py-2.5 rounded-xl bg-[#242424] text-white font-medium text-sm hover:bg-[#333] border border-[#333] transition-all"
            >
              + Add Lead
            </button>
          )}
        </div>

        {/* Add Lead Form Drawer */}
        {showAddLead && (
          <form onSubmit={handleAddLead} className="p-6 rounded-2xl bg-[#181818] border border-[#333] flex flex-col md:flex-row gap-4 items-end animate-fade-in">
            <div className="flex-1">
              <label className="block text-xs font-mono text-[#AAA] mb-1">Lead Name</label>
              <input
                type="text"
                required
                value={newLeadName}
                onChange={(e) => setNewLeadName(e.target.value)}
                placeholder="Sarah Connor"
                className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-[#333] text-white focus:outline-none focus:border-[#6AE301]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-mono text-[#AAA] mb-1">Company</label>
              <input
                type="text"
                required
                value={newLeadCompany}
                onChange={(e) => setNewLeadCompany(e.target.value)}
                placeholder="Cyberdyne Systems"
                className="w-full px-4 py-2.5 rounded-xl bg-[#121212] border border-[#333] text-white focus:outline-none focus:border-[#6AE301]"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#6AE301] text-black font-bold hover:bg-[#80F318] transition-all"
            >
              Save Lead
            </button>
          </form>
        )}

        {/* Leads Tab Content */}
        {activeTab === 'leads' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leads.length === 0 ? (
              <div className="col-span-full py-16 text-center text-[#666] font-mono">
                No leads recorded yet. Click '+ Add Lead' or start a call session.
              </div>
            ) : (
              leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onViewCalls={() => {
                    setSelectedLead(lead);
                    setActiveTab('calls');
                  }}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))
            )}
          </div>
        )}

        {/* Calls Tab Content */}
        {activeTab === 'calls' && (
          <div className="space-y-4">
            {calls.length === 0 ? (
              <div className="py-16 text-center text-[#666] font-mono">
                No call history available yet.
              </div>
            ) : (
              calls.map((call) => (
                <div
                  key={call.id}
                  className="p-5 rounded-2xl bg-[#181818] border border-[#2A2A2A] flex flex-col md:flex-row items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#242424] flex items-center justify-center text-lg">
                      📞
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-white">Call #{call.id.slice(0, 8)}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222] text-[#888]">
                          Channel: {call.agora_channel_name || 'default'}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-[#888] mt-1">
                        Started: {call.started_at ? new Date(call.started_at).toLocaleString() : 'Recent'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-mono uppercase px-3 py-1 rounded-full ${
                        call.outcome === 'completed'
                          ? 'bg-[#6AE301]/20 text-[#6AE301]'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {call.outcome || 'completed'}
                    </span>
                    <button
                      onClick={() => handleViewSummary(call.id)}
                      className="px-4 py-2 rounded-xl bg-[#242424] text-white text-xs font-semibold hover:bg-[#333] border border-[#333] transition-all"
                    >
                      View AI Intelligence Summary
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Summary Modal */}
      {showSummary && summary && (
        <SummaryModal summary={summary} onClose={() => setShowSummary(false)} />
      )}
    </div>
  );
}
