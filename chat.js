/**
 * LexAI v2.0 - Sovereign Legal Intelligence Logic
 */

const State = {
    userName: "",
    isThinking: false,
    history: [
        { id: 1, title: 'Corporate Structuring', cat: 'Today' },
        { id: 2, title: 'Risk Assessment v4', cat: 'Yesterday' }
    ]
};

// --- DOM ELEMENTS ---
const authScreen = document.getElementById('auth-screen');
const appUI = document.getElementById('app-ui');
const authForm = document.getElementById('auth-form');
const chatInput = document.getElementById('chat-input');
const messageList = document.getElementById('message-list');
const thinkingIndicator = document.getElementById('ai-thinking');

// --- INITIALIZATION & AUTH ---
authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    State.userName = document.getElementById('user-name-input').value;
    
    // UI Transitions
    authScreen.classList.add('opacity-0', 'scale-110');
    setTimeout(() => {
        authScreen.classList.add('hidden');
        appUI.classList.remove('hidden');
        setTimeout(() => {
            appUI.classList.replace('opacity-0', 'opacity-100');
            initApp();
        }, 50);
    }, 700);
});

function initApp() {
    updateGreeting();
    renderProfile();
    renderHistory();
    
    // Dynamic Greeting Header
    const hour = new Date().getHours();
    let greet = "Good evening";
    if (hour < 12) greet = "Good morning";
    else if (hour < 18) greet = "Good afternoon";
    
    document.getElementById('welcome-header').innerText = `${greet}, ${State.userName.split(' ')[0]}.`;
}

function updateGreeting() {
    const hour = new Date().getHours();
    const msg = hour < 12 ? "Morning Session Active" : (hour < 18 ? "Afternoon Intelligence Cycle" : "Evening Sovereignty Mode");
    document.getElementById('greeting-text').innerText = msg;
}

function renderProfile() {
    document.getElementById('display-name').innerText = State.userName;
    document.getElementById('user-avatar').innerText = State.userName.split(' ').map(n => n[0]).join('');
}

// --- FILE UPLOAD SIMULATION (1000+ Pages) ---
document.getElementById('file-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const progressDiv = document.getElementById('upload-progress');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('file-status');
    const percentText = document.getElementById('progress-percent');

    progressDiv.classList.remove('hidden');
    
    // Simulate high-speed enterprise indexing
    for (let i = 0; i <= 100; i += 2) {
        await new Promise(r => setTimeout(r, 40));
        progressBar.style.width = `${i}%`;
        percentText.innerText = `${i}%`;
        if (i === 30) statusText.innerText = "Extracting semantic layers...";
        if (i === 60) statusText.innerText = "Analyzing 1,000+ pages of precedent...";
        if (i === 90) statusText.innerText = "Applying risk vectors...";
    }

    setTimeout(() => {
        progressDiv.classList.add('hidden');
        addMessage(`System: Analyzed "${file.name}" (1,402 pages). I am ready to cross-reference this with your query.`, 'ai', true);
    }, 500);
});

// --- CHAT CORE LOGIC ---
async function handleSendMessage() {
    const text = chatInput.value.trim();
    if (!text || State.isThinking) return;

    chatInput.value = '';
    document.getElementById('hero-state').classList.add('hidden');
    
    addMessage(text, 'user');

    // 2-3 Second "Thinking" delay
    State.isThinking = true;
    thinkingIndicator.classList.remove('hidden');
    
    await new Promise(r => setTimeout(r, 2500)); 
    
    thinkingIndicator.classList.add('hidden');
    await streamResponse();
    State.isThinking = false;
}

function addMessage(text, role, isSystem = false) {
    const msg = document.createElement('div');
    msg.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`;
    
    const contentClass = role === 'user' 
        ? 'bg-gold text-white font-medium shadow-xl' 
        : (isSystem ? 'bg-slate-900 border border-gold/30 text-gold' : 'dark-card text-slate-200');

    msg.innerHTML = `
        <div class="max-w-[80%] rounded-2xl px-6 py-4 ${contentClass}">
            <p class="text-[15px] leading-relaxed">${text}</p>
        </div>
    `;
    messageList.appendChild(msg);
}

async function streamResponse() {
    const id = 'ai-' + Date.now();
    const msg = document.createElement('div');
    msg.className = "flex justify-start animate-in fade-in duration-500";
    msg.innerHTML = `
        <div class="max-w-[90%] dark-card rounded-2xl px-6 py-6 border-slate-800">
            <div id="${id}" class="text-[15px] leading-relaxed text-slate-300"></div>
            <div class="mt-6 pt-4 border-t border-slate-800 flex gap-4">
                <button class="text-[10px] uppercase font-bold text-slate-500 hover:text-gold transition-colors">Verify Source</button>
                <button class="text-[10px] uppercase font-bold text-slate-500 hover:text-gold transition-colors">Export Brief</button>
            </div>
        </div>
    `;
    messageList.appendChild(msg);

    const target = document.getElementById(id);
    const fullText = "Based on my real-time analysis of the uploaded documentation and current Delaware Case Law, the liability exposure is mitigated by Clause 4.2. However, the 'Zero-Mistake' principle suggests we adjust the indemnification window to 24 months. I have cross-referenced this with 4,000+ similar filings in our private database.";
    
    // STREAMING WITHOUT AUTO-SCROLL (as requested)
    let i = 0;
    return new Promise(resolve => {
        const interval = setInterval(() => {
            target.innerText = fullText.substring(0, i);
            i += 4;
            if (i >= fullText.length) {
                target.innerText = fullText;
                clearInterval(interval);
                resolve();
            }
        }, 15);
    });
}

// --- SIDEBAR HISTORY ---
function renderHistory() {
    const nav = document.getElementById('history-nav');
    const groups = ['Today', 'Yesterday'];
    
    groups.forEach(group => {
        const div = document.createElement('div');
        div.innerHTML = `
            <h4 class="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-bold mb-3 px-2">${group}</h4>
            <div class="space-y-1">
                ${State.history.map(item => `
                    <div class="sidebar-item p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all group">
                        <svg class="w-4 h-4 text-slate-700 group-hover:text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                        <span class="text-sm text-slate-400 group-hover:text-slate-200 truncate font-medium">${item.title}</span>
                    </div>
                `).join('')}
            </div>
        `;
        nav.appendChild(div);
    });
}

// --- EVENT LISTENERS ---
document.getElementById('send-btn').addEventListener('click', handleSendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});
