/**
 * LexAI - Enterprise Legal Intelligence System
 * Logic Module v4.0.2 (Agentic Orchestration & HITL)
 */

// --- STATE MANAGEMENT ---
const State = {
    user: null,
    activeChat: null,
    isProcessing: false,
    history: [
        { id: 101, title: 'Delaware Merger Review', date: '2026-03-26T10:00:00', category: 'Today' },
        { id: 102, title: 'IP Liability Strategy', date: '2026-03-24T14:30:00', category: 'Previous 7 Days' },
        { id: 103, title: 'Tax-Exempt Filing Q3', date: '2025-10-15T09:00:00', category: 'October 2025' }
    ]
};

// --- DOM ELEMENTS ---
const authScreen = document.getElementById('auth-screen');
const appUI = document.getElementById('app-ui');
const loginForm = document.getElementById('login-form');
const messagesContainer = document.getElementById('messages-container');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const historyContainer = document.getElementById('chat-history-container');
const orchestratorPanel = document.getElementById('orchestrator-panel');

// --- AUTHENTICATION LOGIC ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Simulate Enterprise Auth API call
    authScreen.classList.add('opacity-0');
    setTimeout(() => {
        authScreen.classList.add('hidden');
        appUI.classList.remove('hidden');
        State.user = { name: "John Doe", role: "Counsel" };
        renderHistory();
    }, 500);
});

function handleLogout() {
    location.reload(); // Simple state reset for demo
}

// --- CHAT & AGENTIC WORKFLOW ---
async function handleSendMessage() {
    const text = chatInput.value.trim();
    if (!text || State.isProcessing) return;

    // Reset Input
    chatInput.value = '';
    document.getElementById('welcome-message')?.classList.add('hidden');
    
    // 1. Add User Message
    addMessage(text, 'user');

    // 2. Start Agentic Orchestration
    State.isProcessing = true;
    orchestratorPanel.classList.remove('hidden');
    
    try {
        await simulateAgentSequence();
        
        // 3. Add AI Response with Skeleton Loader
        const aiMessageId = addSkeletonResponse();
        
        // 4. Progressive Text Streaming
        await streamAIResponse(aiMessageId);
        
        // 5. Inject HITL (Human-In-The-Loop) Module
        injectHITLModule(aiMessageId);
        
    } finally {
        State.isProcessing = false;
        orchestratorPanel.classList.add('hidden');
        resetAgentSteps();
    }
}

async function simulateAgentSequence() {
    const steps = ['step-manager', 'step-tax', 'step-risk'];
    for (const stepId of steps) {
        const el = document.getElementById(stepId);
        el.classList.add('text-slate-900', 'animate-pulse-gold');
        el.querySelector('div').classList.add('border-slate-900', 'bg-white');
        
        await new Promise(r => setTimeout(r, 1200)); // Simulating logic processing
        
        el.classList.remove('animate-pulse-gold');
        el.classList.add('text-green-600');
        el.querySelector('div').innerHTML = '✓';
        el.querySelector('div').classList.replace('border-slate-900', 'border-green-600');
    }
}

function resetAgentSteps() {
    ['step-manager', 'step-tax', 'step-risk'].forEach(id => {
        const el = document.getElementById(id);
        el.className = "agent-step flex items-center gap-2 whitespace-nowrap text-xs font-medium text-slate-400";
        el.querySelector('div').className = "w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center";
        el.querySelector('div').innerText = id.includes('manager') ? '1' : (id.includes('tax') ? '2' : '3');
    });
}

// --- UI COMPONENTS ---
function addMessage(text, role) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`;
    
    msgDiv.innerHTML = `
        <div class="max-w-[80%] rounded-2xl p-5 ${role === 'user' ? 'navy-deep text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-800 shadow-sm'}">
            <p class="text-sm leading-relaxed">${text}</p>
        </div>
    `;
    messagesContainer.appendChild(msgDiv);
    scrollChat();
}

function addSkeletonResponse() {
    const id = 'ai-' + Date.now();
    const skeleton = document.createElement('div');
    skeleton.id = id;
    skeleton.className = "flex justify-start";
    skeleton.innerHTML = `
        <div class="max-w-[90%] w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div class="flex items-center gap-2 mb-4">
                <div class="w-6 h-6 rounded-full gold-gradient animate-pulse"></div>
                <span class="text-[10px] font-black uppercase tracking-tighter text-slate-400">LexAI Intelligence Core</span>
            </div>
            <div class="space-y-3">
                <div class="h-4 w-3/4 skeleton rounded"></div>
                <div class="h-4 w-1/2 skeleton rounded"></div>
            </div>
        </div>
    `;
    messagesContainer.appendChild(skeleton);
    scrollChat();
    return id;
}

async function streamAIResponse(containerId) {
    const container = document.getElementById(containerId).querySelector('.space-y-3');
    container.innerHTML = `<div id="stream-text" class="text-sm leading-relaxed text-slate-700"></div>`;
    const target = document.getElementById('stream-text');
    
    const responseText = `Based on Section 402 of the Delaware General Corporation Law and recent precedents in *Lexington v. Global*, the proposed liability clause requires a "Zero-Mistake" carve-out for intentional misconduct. Our Risk Agent identified a 14.2% tax exposure in the current draft. 
    
    <div class="mt-4 p-3 bg-slate-50 border-l-4 border-slate-900 rounded text-xs italic text-slate-500 flex flex-col gap-2">
        <span>Source: <a href="#" class="text-blue-600 underline font-medium">DE Corp. Law § 402(b)</a></span>
        <span>Verified by: Multi-Agent Consensus (99.8% Confidence)</span>
    </div>`;

    // Progressive streaming effect
    let i = 0;
    return new Promise(resolve => {
        const interval = setInterval(() => {
            target.innerHTML = responseText.substring(0, i) + '<span class="inline-block w-1 h-4 ml-1 bg-slate-400 animate-pulse"></span>';
            i += 3;
            if (i >= responseText.length) {
                clearInterval(interval);
                target.innerHTML = responseText; // Final render to fix HTML tags
                resolve();
            }
        }, 10);
    });
}

function injectHITLModule(containerId) {
    const parent = document.getElementById(containerId).querySelector('.max-w-\\[90%\\]');
    const hitl = document.createElement('div');
    hitl.className = "mt-6 pt-6 border-t border-slate-100 flex items-center justify-between gap-4";
    hitl.innerHTML = `
        <div class="text-[11px] text-slate-400 font-medium">HUMAN-IN-THE-LOOP APPROVAL REQUIRED</div>
        <div class="flex gap-2">
            <button class="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">Edit Draft</button>
            <button class="px-3 py-1.5 text-xs font-bold navy-deep text-white rounded-md hover:opacity-90 shadow-sm transition-all" onclick="this.innerHTML='Finalized ✓'; this.disabled=true;">Approve & Execute</button>
        </div>
        <div class="flex gap-1 ml-auto">
             <button class="p-1 hover:bg-slate-100 rounded text-slate-400" title="Relevant">👍</button>
             <button class="p-1 hover:bg-slate-100 rounded text-slate-400" title="Needs Correction">👎</button>
        </div>
    `;
    parent.appendChild(hitl);
    scrollChat();
}

// --- HISTORY LOGIC ---
function renderHistory() {
    historyContainer.innerHTML = '';
    const categories = ['Today', 'Previous 7 Days', 'October 2025'];
    
    categories.forEach(cat => {
        const items = State.history.filter(h => h.category === cat);
        if (items.length === 0) return;

        const catDiv = document.createElement('div');
        catDiv.innerHTML = `
            <h3 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">${cat}</h3>
            <div class="space-y-1">
                ${items.map(item => `
                    <div class="group flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors" onclick="loadChat(${item.id})">
                        <svg class="w-4 h-4 text-slate-600 group-hover:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                        <span class="text-sm truncate font-medium">${item.title}</span>
                    </div>
                `).join('')}
            </div>
        `;
        historyContainer.appendChild(catDiv);
    });
}

// --- HELPERS ---
function scrollChat() {
    const win = document.getElementById('chat-window');
    win.scrollTo({ top: win.scrollHeight, behavior: 'smooth' });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('w-0');
    sidebar.classList.toggle('opacity-0');
    sidebar.classList.toggle('pointer-events-none');
}

function createNewChat() {
    messagesContainer.innerHTML = '';
    document.getElementById('welcome-message').classList.remove('hidden');
    document.getElementById('current-chat-title').innerText = "New Analysis Session";
}

// Event Listeners
sendBtn.addEventListener('click', handleSendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});
