const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('hermion_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'API Error' }));
    throw new Error(errorData.detail || `HTTP Error ${response.status}`);
  }

  return response.json();
}

export const hermionApi = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (email, password, username) => request('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, username }) }),
  getMe: () => request('/auth/me'),

  // Agora AI & Voice
  getAgoraToken: (channel, uid = '0') => request(`/agora/token?channel=${encodeURIComponent(channel)}&uid=${uid}`),
  startAgent: (channel_name, lead_id = '') => request('/agora/start-agent', { method: 'POST', body: JSON.stringify({ channel_name, lead_id }) }),

  // CRM Leads
  getLeads: () => request('/leads'),
  createLead: (leadData) => request('/leads', { method: 'POST', body: JSON.stringify(leadData) }),
  updateLead: (leadId, updates) => request(`/leads/${leadId}`, { method: 'PATCH', body: JSON.stringify(updates) }),

  // Calls & Transcripts
  getCalls: (leadId = '') => request(leadId ? `/calls?lead_id=${leadId}` : '/calls'),
  createCall: (callData) => request('/calls', { method: 'POST', body: JSON.stringify(callData) }),
  endCall: (callId, data = {}) => request(`/calls/${callId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getTranscripts: (callId) => request(`/calls/${callId}/transcripts`),
  getSummary: (callId) => request(`/calls/${callId}/summary`),

  // Direct LLM Turn (with optional MongoDB session tracking)
  sendLLMTurn: (messages, leadId = '', callId = '', sessionId = '') =>
    request('/llm', { method: 'POST', body: JSON.stringify({ messages, lead_id: leadId, call_id: callId, session_id: sessionId }) }),

  // FastMCP Tools List
  getMcpTools: () => request('/mcp/tools'),

  // Conversation History (MongoDB)
  createConversation: (userId, title = 'New Conversation') =>
    request('/conversations', { method: 'POST', body: JSON.stringify({ user_id: userId, title }) }),
  getConversations: (userId) => request(`/conversations?user_id=${encodeURIComponent(userId)}`),
  getConversation: (sessionId) => request(`/conversations/${sessionId}`),
  appendMessage: (sessionId, role, content, metadata = null) =>
    request(`/conversations/${sessionId}/messages`, { method: 'POST', body: JSON.stringify({ role, content, metadata }) }),
  renameConversation: (sessionId, userId, title) =>
    request(`/conversations/${sessionId}/rename?user_id=${encodeURIComponent(userId)}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
  deleteConversation: (sessionId, userId) =>
    request(`/conversations/${sessionId}?user_id=${encodeURIComponent(userId)}`, { method: 'DELETE' }),
};

