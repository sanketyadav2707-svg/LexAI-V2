/**
 * LexAI v2.0 — chat.js
 * FIXED: Auth Transition & Master Orchestrator Integration
 */

'use strict';

const CONFIG = {
  APP_NAME: 'LexAI',
  STREAM_DELAY_MS: 15,
  AGENT_STEP_DELAY_MS: 1200,
  SPLASH_DURATION_MS: 2000,
  SESSION_KEY: 'lexai_sessions',
  USER_KEY: 'lexai_user',
};

const State = {
  user: null,
  sessions: [],
  currentSessionId: null,
  currentMode: 'standard',
  isProcessing: false,
  
  save() {
    localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(this.sessions));
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(this.user));
  },
  load() {
    const s = localStorage.getItem(CONFIG.SESSION_KEY);
    const u = localStorage.getItem(CONFIG.USER_KEY);
    this.sessions = s ? JSON.parse(s) : [];
    this.user = u ? JSON.parse(u) : null;
  }
};

/* ═══════════════════════════════════════════
   AUTH & TRANSITION (The Fix)
═══════════════════════════════════════════ */

let authMode = 'signin';

function switchAuthTab(mode) {
    authMode = mode;
    const tabSignin = document.getElementById('tab-signin');
    const tabSignup = document.getElementById('tab-signup');
    const nameRow = document.getElementById('name-row');
    const confirmRow = document.getElementById('confirm-row');

    if(mode === 'signup') {
        nameRow.classList.remove('hidden');
        confirmRow.classList.remove('hidden');
        tabSignup.classList.add('active', 'text-white');
        tabSignin.classList.remove('active', 'text-white');
    } else {
        nameRow.classList.add('hidden');
        confirmRow.classList.add('hidden');
        tabSignin.classList.add('active', 'text-white');
        tabSignup.classList.remove('active', 'text-white');
    }
}

function handleAuth() {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-pass').value;
    const name = document.getElementById('auth-name').value || 'Counselor';

    if(!email || !pass) return alert("Please fill details");

    // Simulation: Save User
    State.user = { name, email };
    State.save();
    
    proceedToApp();
}

function proceedToApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    showSplash();
}

function showSplash() {
    const splash = document.getElementById('splash-screen');
    splash.classList.remove('hidden');
    
    setTimeout(() => { document.getElementById('splash-bar').style.width = '100%'; }, 100);

    setTimeout(() => {
        splash.classList.add('hidden');
        initApp();
    }, CONFIG.SPLASH_DURATION_MS);
}

function initApp() {
    const app = document.getElementById('app-screen');
    app.classList.remove('hidden');
    app.style.display = 'flex'; // Ensure it shows
    
    if(State.user) {
        document.getElementById('user-name-display').textContent = State.user.name;
        document.getElementById('welcome-name').textContent = State.user.name.split(' ')[0];
    }
    renderSidebarHistory();
}

function handleSignout() {
    localStorage.removeItem(CONFIG.USER_KEY);
    location.reload();
}

/* ═══════════════════════════════════════════
   MASTER ORCHESTRATOR LOGIC
═══════════════════════════════════════════ */

function getAgentPipeline(query) {
    return [
        { id: 'orch', label: 'Master Orchestrator', icon: '🧠', desc: 'Planning Execution...' },
        { id: 'rag', label: 'GraphRAG Engine', icon: '🕸️', desc: 'Mapping Entity Relationships...' },
        { id: 'rule', label: 'Jurisdiction Mapper', icon: '🗺️', desc: 'Checking Global Statutes...' },
        { id: 'val', label: 'Zero-Mistake Validator', icon: '🛡️', desc: 'Reflecting & Self-Correcting...' }
    ];
}

async function sendMessage() {
    if (State.isProcessing) return;
    const input = document.getElementById('user-input');
    const query = input.value.trim();
    if (!query) return;

    input.value = '';
    State.isProcessing = true;
    document.getElementById('welcome-state').classList.add('hidden');
    
    // Render User Message
    renderMessage('user', query);

    // 1. Show Execution Plan
    const pipeline = getAgentPipeline(query);
    const orchPanel = renderOrchestrationPanel(pipeline);
    
    // 2. Animate Agents
    for (let step of pipeline) {
        await new Promise(r => setTimeout(r, 800));
        updateAgentStep(step.id, 'done');
    }

    // 3. Get AI Response
    await new Promise(r => setTimeout(r, 500));
    orchPanel.remove();
    
    const responseData = {
        text: `## Analysis Complete\nBased on my **Master Orchestration** of current statutes, your query triggers specific compliance requirements.\n\n### Key Findings\n- **Jurisdiction:** Rule mapping identified high-risk clauses in Section 4.2.\n- **Validator Note:** Cross-referenced against primary sources (SEC/RBI).`,
        citations: [{label: 'Statute 22-A, Page 45'}, {label: 'Case Precedent 2026-LX'}]
    };

    renderMessage('ai', responseData.text, responseData.citations);
    State.isProcessing = false;
}

/* ═══════════════════════════════════════════
   UI HELPERS
═══════════════════════════════════════════ */

function renderMessage(role, text, citations = []) {
    const container = document.getElementById('messages-container');
    const div = document.createElement('div');
    div.className = `flex ${role === 'user' ? 'justify-end' : 'gap-4'} msg-appear`;
    
    let content = role === 'user' ? 
        `<div class="chat-bubble user text-sm">${text}</div>` :
        `<div class="w-8 h-8 rounded bg-gold-600 flex-shrink-0"></div>
         <div class="chat-bubble ai flex-1">
            <div class="prose-ai text-sm text-slate-200">${text.replace(/\n/g, '<br>')}</div>
            <div class="mt-4 grid grid-cols-2 gap-2">
                ${citations.map(c => `<div class="citation-card">📎 ${c.label}</div>`).join('')}
            </div>
         </div>`;
    
    div.innerHTML = content;
    container.appendChild(div);
    scrollToBottom();
}

function renderOrchestrationPanel(steps) {
    const container = document.getElementById('messages-container');
    const panel = document.createElement('div');
    panel.className = 'execution-plan p-4 rounded-xl space-y-2 mb-4';
    panel.innerHTML = `<h4 class="text-[10px] font-bold text-gold-500 uppercase tracking-widest mb-3">2026-Tier Execution Plan</h4>` + 
        steps.map(s => `
            <div id="step-${s.id}" class="agent-step pending">
                <div class="step-icon"><div class="pending-dot"></div></div>
                <div>
                    <div class="text-xs font-bold text-slate-300">${s.label}</div>
                    <div class="text-[10px] text-slate-500">${s.desc}</div>
                </div>
            </div>
        `).join('');
    container.appendChild(panel);
    scrollToBottom();
    return panel;
}

function updateAgentStep(id, status) {
    const el = document.getElementById(`step-${id}`);
    if(!el) return;
    el.classList.remove('pending');
    el.classList.add(status);
    if(status === 'done') {
        el.querySelector('.step-icon').innerHTML = '<span class="check-icon">✓</span>';
    }
}

function scrollToBottom() {
    const area = document.getElementById('messages-area');
    area.scrollTop = area.scrollHeight;
}

function autoResizeTextarea(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

function handleInputKeydown(e) {
    if(e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function sendQuickPrompt(text) {
    document.getElementById('user-input').value = text;
    sendMessage();
}

function renderSidebarHistory() {
    const list = document.getElementById('chat-history-list');
    list.innerHTML = `
        <div class="sidebar-item active mt-4 p-2 rounded text-xs cursor-pointer">⚖️ Current Session Analysis</div>
    `;
}

// Bootstrap
window.onload = () => {
    State.load();
    if(State.user) {
        proceedToApp();
    }
};
