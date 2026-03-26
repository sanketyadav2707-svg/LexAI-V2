/**
 * LexAI v2.5 - Dynamic Intelligence Engine
 */

const State = {
    userName: "",
    isThinking: false,
    uploadedFile: null,
    history: [
        { id: 1, title: 'Delaware Merger Review', cat: 'Today' },
        { id: 2, title: 'IP Liability Strategy', cat: 'Yesterday' }
    ]
};

// --- DATABASE OF INTELLIGENT RESPONSES ---
const ResponseLibrary = {
    greetings: ["Hello", "Hi", "Greetings", "Hey"],
    templates: {
        greeting: (name) => `Good to see you, ${name.split(' ')[0]}. I am standing by for legal analysis. You can upload complex filings or ask me to draft specific clauses.`,
        fileAnalysis: (filename) => `I have completed a deep-scan of **${filename}**. My analysis suggests three high-risk areas in the liability section. Would you like me to generate a mitigation brief?`,
        legalDraft: "Based on standard enterprise precedents, I recommend a 'Zero-Mistake' indemnity clause. I've adjusted the lookback period to 36 months to ensure maximum protection under current regulatory shifts.",
        default: "That is an insightful query. Analyzing our internal database of 14,000+ legal precedents... I recommend focusing on the jurisdictional carve-outs to minimize exposure."
    }
};

// --- AUTH & INITIALIZATION ---
const authForm = document.getElementById('auth-form');
authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    State.userName = document.getElementById('user-name-input').value;
    document.getElementById('auth-screen').classList.add('opacity-0', 'scale-95', 'pointer-events-none');
    setTimeout(() => {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-ui').classList.remove('hidden');
        setTimeout(() => { document.getElementById('app-ui').classList.replace('opacity-0', 'opacity-100'); }, 50);
        initApp();
    }, 600);
});

function initApp() {
    // Time-based greeting
    const hour = new Date().getHours();
    const greet = hour < 12 ? "Good morning" : (hour < 18 ? "Good afternoon" : "Good evening");
    document.getElementById('welcome-header').innerText = `${greet}, ${State.userName.split(' ')[0]}.`;
    document.getElementById('greeting-text').innerText = `${greet} Intelligence Cycle`;
    
    // Profile
    document.getElementById('display-name').innerText = State.userName;
    document.getElementById('user-avatar').innerText = State.userName.split(' ').map(n => n[0]).join('');
    
    renderHistory();
}

// --- CORE CHAT LOGIC ---
async function handleSendMessage() {
    const text = document.getElementById('chat-input').value.trim();
    if (!text || State.isThinking) return;

    // UI Updates
    document.getElementById('chat-input').value = '';
    document.getElementById('hero-state').classList.add('hidden');
    
    addMessage(text, 'user');

    // 1. Simulate "Thinking" (2-3 seconds)
    State.isThinking = true;
    document.getElementById('ai-thinking').classList.remove('hidden');
    
    await new Promise(r => setTimeout(r, 2500)); 
    
    document.getElementById('ai-thinking').classList.add('hidden');

    // 2. Determine Dynamic Response
    let responseText = "";
    const lowerText = text.toLowerCase();

    if (ResponseLibrary.greetings.some(g => lowerText.includes(g.toLowerCase()))) {
        responseText = ResponseLibrary.templates.greeting(State.userName);
    } else if (State.uploadedFile && lowerText.includes("file")) {
        responseText = ResponseLibrary.templates.fileAnalysis(State.uploadedFile.name);
    } else if (lowerText.includes("draft") || lowerText.includes("clause")) {
        responseText = ResponseLibrary.templates.legalDraft;
    } else {
        responseText = ResponseLibrary.templates.default;
    }

    // 3. Stream Response
    await streamResponse(responseText);
    State.isThinking = false;
}

function addMessage(text, role) {
    const list = document.getElementById('message-list');
    const msg = document.createElement('div');
    msg.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`;
    
    msg.innerHTML = `
        <div class="max-w-[80%] rounded-2xl px-6 py-4 ${role === 'user' ? 'bg-[#BF953F] text-white shadow-xl' : 'bg-[#0f172a] border border-slate-800 text-slate-200'}">
            <p class="text-[15px] leading-relaxed">${text}</p>
        </div>
    `;
    list.appendChild(msg);
    // User messages DO scroll into view
    if(role === 'user') msg.scrollIntoView({ behavior: 'smooth' });
}

async function streamResponse(fullText) {
    const id = 'ai-' + Date.now();
    const list = document.getElementById('message-list');
    const msg = document.createElement('div');
    msg.className = "flex justify-start animate-in fade-in duration-500";
    msg.innerHTML = `
        <div class="max-w-[90%] bg-[#0f172a] rounded-2xl px-6 py-6 border border-slate-800 shadow-2xl">
            <div id="${id}" class="text-[15px] leading-relaxed text-slate-300"></div>
            <div class="mt-6 pt-4 border-t border-slate-700/50 flex gap-4">
                <button class="text-[10px] uppercase font-bold text-slate-500 hover:text-[#BF953F] transition-colors">Direct-to-Source Citation</button>
                <button class="text-[10px] uppercase font-bold text-slate-500 hover:text-[#BF953F] transition-colors">HITL Approval</button>
            </div>
        </div>
    `;
    list.appendChild(msg);

    const target = document.getElementById(id);
    
    // STREAMING LOGIC: We do NOT call scrollIntoView here so the user stays where they are
    let i = 0;
    return new Promise(resolve => {
        const interval = setInterval(() => {
            target.innerHTML = fullText.substring(0, i) + '<span class="w-1 h-4 bg-[#BF953F] inline-block ml-1 animate-pulse"></span>';
            i += 3;
            if (i >= fullText.length) {
                target.innerHTML = fullText;
                clearInterval(interval);
                resolve();
            }
        }, 20);
    });
}

// --- FILE UPLOAD (Simulating 1000+ Pages) ---
document.getElementById('file-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    State.uploadedFile = file;

    const progressDiv = document.getElementById('upload-progress');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('file-status');

    progressDiv.classList.remove('hidden');
    
    for (let i = 0; i <= 100; i += 5) {
        await new Promise(r => setTimeout(r, 60));
        progressBar.style.width = `${i}%`;
        if (i === 20) statusText.innerText = "OCR Indexing... (Page 450/1200)";
        if (i === 50) statusText.innerText = "Cross-referencing Global Statutes...";
        if (i === 80) statusText.innerText = "Finalizing Risk Vectors...";
    }

    setTimeout(() => {
        progressDiv.classList.add('hidden');
        addMessage(`[SYSTEM]: Analysis of "${file.name}" complete. 1,402 pages indexed. Query system is now grounded in this document.`, 'ai');
    }, 500);
});

// --- UI HELPERS ---
function renderHistory() {
    const nav = document.getElementById('history-nav');
    nav.innerHTML = '';
    const groups = ['Today', 'Yesterday'];
    groups.forEach(group => {
        const items = State.history.filter(h => h.cat === group);
        const div = document.createElement('div');
        div.innerHTML = `
            <h4 class="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-bold mb-3 px-2">${group}</h4>
            <div class="space-y-1 mb-6">
                ${items.map(item => `
                    <div class="p-3 rounded-xl cursor-pointer flex items-center gap-3 hover:bg-slate-900 group transition-all">
                        <svg class="w-4 h-4 text-slate-700 group-hover:text-[#BF953F]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                        <span class="text-sm text-slate-400 group-hover:text-slate-200 truncate">${item.title}</span>
                    </div>
                `).join('')}
            </div>
        `;
        nav.appendChild(div);
    });
}

document.getElementById('send-btn').addEventListener('click', handleSendMessage);
document.getElementById('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});
