/**
 * LexAI — Core Application Logic
 */

const State = {
  user: null,
  sessions: JSON.parse(localStorage.getItem('lexai_sessions') || '[]'),
  currentSessionId: null,
  isProcessing: false
};

// --- AUTH LOGIC ---
function switchAuthTab(tab) {
  const isSignIn = tab === 'signin';
  document.getElementById('tab-signin').className = isSignIn ? 'flex-1 py-2 text-sm font-medium rounded-md bg-navy-800 text-gold-500' : 'flex-1 py-2 text-sm font-medium rounded-md text-slate-400';
  document.getElementById('tab-signup').className = !isSignIn ? 'flex-1 py-2 text-sm font-medium rounded-md bg-navy-800 text-gold-500' : 'flex-1 py-2 text-sm font-medium rounded-md text-slate-400';
}

function handleAuth() {
  const email = document.getElementById('auth-email').value;
  if(!email.includes('@')) return alert('Valid email required');
  State.user = { email, name: email.split('@')[0] };
  localStorage.setItem('lexai_user', JSON.stringify(State.user));
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
  renderSidebarHistory();
}

function handleSignout() {
  localStorage.removeItem('lexai_user');
  location.reload();
}

// --- CHAT LOGIC ---
function renderSidebarHistory() {
  const list = document.getElementById('chat-history-list');
  list.innerHTML = State.sessions.map(s => `
    <div class="sidebar-item ${s.id === State.currentSessionId ? 'active' : ''}" onclick="loadSession('${s.id}')">
      ⚖️ ${s.title}
    </div>
  `).join('');
}

async function sendMessage() {
  if (State.isProcessing) return;
  const input = document.getElementById('user-input');
  const query = input.value.trim();
  if (!query) return;

  input.value = '';
  State.isProcessing = true;

  if (!State.currentSessionId) {
    State.currentSessionId = Date.now().toString();
    State.sessions.unshift({ id: State.currentSessionId, title: query.slice(0, 30), messages: [] });
  }

  renderMessage('user', query);
  
  // Simulate Agent Pipeline
  await simulateAgentSteps();
  
  const response = `Based on multi-agent analysis of your query regarding "${query}", I have identified 3 critical risk factors and drafted a standard mitigation clause. <br><br> 1. **Regulatory Conflict**: IRC § 331 implications. <br> 2. **Liability Gap**: Section 8.2 requires indemnification carve-outs.`;
  
  renderMessage('ai', response);
  
  const session = State.sessions.find(s => s.id === State.currentSessionId);
  session.messages.push({ role: 'user', content: query }, { role: 'ai', content: response });
  localStorage.setItem('lexai_sessions', JSON.stringify(State.sessions));
  
  State.isProcessing = false;
  renderSidebarHistory();
}

async function simulateAgentSteps() {
  const container = document.getElementById('messages-container');
  const steps = ['Manager Agent routing...', 'Legal Research Agent searching...', 'Risk Agent validating...'];
  const panel = document.createElement('div');
  panel.className = 'p-4 bg-navy-900 border border-gold-600/20 rounded-xl mb-4 animate-pulse';
  container.appendChild(panel);
  
  for (let step of steps) {
    panel.innerHTML = `<span class="text-gold-500 text-xs font-bold">⚡ ${step}</span>`;
    await new Promise(r => setTimeout(r, 800));
  }
  panel.remove();
}

function renderMessage(role, content) {
  const container = document.getElementById('messages-container');
  const div = document.createElement('div');
  div.className = `chat-bubble ${role}`;
  div.innerHTML = content;
  container.appendChild(div);
  document.getElementById('messages-area').scrollTop = container.scrollHeight;
}

function handleInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// Auto-login check
if(localStorage.getItem('lexai_user')) {
  State.user = JSON.parse(localStorage.getItem('lexai_user'));
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
  renderSidebarHistory();
}
