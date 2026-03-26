/**
 * LexAI v4.0 - Sovereign Semantic Engine
 * Mimics high-level LLM reasoning (Gemini/ChatGPT/Grok style)
 */

const State = {
    userName: "",
    isThinking: false,
    uploadedFile: null,
    contextHistory: [], // Tracks what we talked about
    history: [
        { id: 1, title: 'Institutional Briefing', cat: 'Today' },
        { id: 2, title: 'Risk Parameters', cat: 'Yesterday' }
    ]
};

// --- SEMANTIC INTENT ENGINE ---
const Brain = {
    // 1. Personal & Rapport Logic
    personal: {
        "how are you": [
            "I'm operating at peak efficiency. My neural weights are balanced, and I'm ready to dive into some complex legal strategy. How are things on your end?",
            "Doing excellent. I've just finished indexing several thousand new SEC filings, so my knowledge base is feeling quite sharp. What's on your mind today?",
            "System status is green across all nodes. I'm ready to assist you with anything from personal queries to high-stakes business logic."
        ],
        "who are you": "I am LexAI, a Sovereign Legal Intelligence Node. Unlike standard LLMs, I am fine-tuned for high-stakes enterprise environments where precision is the only metric that matters.",
        "joke": "A lawyer and a smart-contract walk into a bar. The bartender asks, 'What'll it be?' The lawyer says, 'I'll have a martini, but I'll need a 40-page liability waiver before I sip it.' The smart-contract just executes the drink immediately.",
    },

    // 2. Professional & Legal Logic
    professional: {
        "legal": "In high-stakes litigation, the difference between success and failure often lies in the jurisdictional nuances. My analysis suggests prioritizing the 'Forum Selection' clauses first.",
        "business": "Scaling an enterprise requires a delicate balance of aggressive growth and rigid risk mitigation. I can help you model the compliance overhead for your next expansion.",
        "contract": "A 'Zero-Mistake' contract isn't just about the words; it's about the execution. I recommend we look at the indemnification triggers specifically."
    },

    // 3. The "Deep Logic" Generator (for everything else)
    generateDeepResponse: function(input) {
        const query = input.toLowerCase();
        
        // Match Intent
        if (query.includes("how are you") || query.includes("how's it going")) 
            return this.personal["how are you"][Math.floor(Math.random() * 3)];
        
        if (query.includes("who are you") || query.includes("what are you")) 
            return this.personal["who are you"];

        if (query.includes("joke") || query.includes("funny")) 
            return this.personal["joke"];

        if (query.includes("weather")) 
            return "Metrological data is currently showing clear skies for your business operations, though I'd keep an eye on the 'economic climate'—inflation indices are looking volatile this quarter.";

        // Document Analysis Mode
        if (State.uploadedFile && (query.includes("file") || query.includes("this document") || query.includes("read"))) {
            return `I've analyzed the 1,000+ pages of "${State.uploadedFile.name}". There is a fascinating contradiction between the arbitration clause on page 14 and the termination rights on page 88. Would you like me to draft a reconciliation memo?`;
        }

        // Generic Professional fallback (High-end "AI Talk")
        const reflections = [
            `That's a compelling point regarding ${input.replace('?', '')}. From an institutional perspective, one must consider how that impacts the broader strategic roadmap.`,
            `I've cross-referenced your question about "${input}" with our internal intelligence vault. The consensus suggests a multi-layered approach involving both risk assessment and proactive capital deployment.`,
            `Analyzing "${input}"... My neural nodes are picking up a high correlation between your query and several recent market shifts. It's a nuanced topic—shall we break it down into actionable steps?`
        ];
        
        return reflections[Math.floor(Math.random() * reflections.length)];
    }
};

// --- AUTH & INITIALIZATION ---
document.getElementById('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    State.userName = document.getElementById('user-name-input').value || "User";
    
    document.getElementById('auth-screen').classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-ui').classList.remove('hidden');
        setTimeout(() => { document.getElementById('app-ui').classList.replace('opacity-0', 'opacity-100'); }, 50);
        
        const hour = new Date().getHours();
        const greet = hour < 12 ? "Good morning" : (hour < 18 ? "Good afternoon" : "Good evening");
        document.getElementById('welcome-header').innerText = `${greet}, ${State.userName.split(' ')[0]}.`;
        document.getElementById('greeting-text').innerText = `${greet} Intelligence Cycle`;
        document.getElementById('display-name').innerText = State.userName;
        document.getElementById('user-avatar').innerText = State.userName.split(' ').map(n => n[0]).join('').toUpperCase();
        renderHistory();
    }, 600);
});

// --- CHAT LOGIC ---
async function handleSendMessage() {
    const text = document.getElementById('chat-input').value.trim();
    if (!text || State.isThinking) return;

    document.getElementById('chat-input').value = '';
    document.getElementById('hero-state').classList.add('hidden');
    
    addMessage(text, 'user');

    // "Thinking" phase (strictly 2.5 seconds)
    State.isThinking = true;
    const thinkingBox = document.getElementById('ai-thinking');
    thinkingBox.classList.remove('hidden');
    
    // Simulate complex "Agentic" reasoning steps
    const steps = ["Querying Vector DB...", "Analyzing Intent...", "Synthesizing Prose..."];
    let stepIdx = 0;
    const stepInterval = setInterval(() => {
        thinkingBox.innerHTML = `<span class="flex gap-1"><span class="w-1.5 h-1.5 bg-[#BF953F] rounded-full thinking-dot"></span></span> ${steps[stepIdx]}`;
        stepIdx = (stepIdx + 1) % steps.length;
    }, 800);

    await new Promise(r => setTimeout(r, 2500)); 
    
    clearInterval(stepInterval);
    thinkingBox.classList.add('hidden');
    thinkingBox.innerHTML = `<span class="flex gap-1"><span class="w-1.5 h-1.5 bg-[#BF953F] rounded-full thinking-dot"></span></span> LexAI is thinking...`;

    // Generate response using Semantic Engine
    const aiResponse = Brain.generateDeepResponse(text);

    // Stream Response (No Auto-Scroll)
    await streamResponse(aiResponse);
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
    if(role === 'user') msg.scrollIntoView({ behavior: 'smooth' });
}

async function streamResponse(fullText) {
    const id = 'ai-' + Date.now();
    const list = document.getElementById('message-list');
    const msg = document.createElement('div');
    msg.className = "flex justify-start animate-in fade-in duration-500";
    msg.innerHTML = `
        <div class="max-w-[90%] bg-[#0f172a] rounded-2xl px-6 py-6 border border-slate-800 shadow-2xl">
            <div id="${id}" class="text-[15px] leading-relaxed text-slate-300 min-h-[1.5em]"></div>
            <div class="mt-6 pt-4 border-t border-slate-800/50 flex gap-4">
                <button class="text-[10px] uppercase font-bold text-slate-500 hover:text-[#BF953F] transition-colors">Direct-to-Source Citation</button>
                <button class="text-[10px] uppercase font-bold text-slate-500 hover:text-[#BF953F] transition-colors">HITL Approval</button>
            </div>
        </div>
    `;
    list.appendChild(msg);

    const target = document.getElementById(id);
    let i = 0;
    return new Promise(resolve => {
        const interval = setInterval(() => {
            target.innerHTML = fullText.substring(0, i) + '<span class="w-1 h-4 bg-[#BF953F] inline-block ml-1 animate-pulse"></span>';
            i += 2; // Natural reading speed
            if (i >= fullText.length + 2) {
                target.innerHTML = fullText;
                clearInterval(interval);
                resolve();
            }
        }, 15);
    });
}

// --- FILE UPLOAD SIMULATION ---
document.getElementById('file-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    State.uploadedFile = file;

    const progressDiv = document.getElementById('upload-progress');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('file-status');

    progressDiv.classList.remove('hidden');
    
    for (let i = 0; i <= 100; i += 2) {
        await new Promise(r => setTimeout(r, 40));
        progressBar.style.width = `${i}%`;
        document.getElementById('progress-percent').innerText = `${i}%`;
        if (i === 30) statusText.innerText = "Building Semantic Map (1000+ Pages)...";
        if (i === 70) statusText.innerText = "Indexing Cross-References...";
    }

    setTimeout(() => {
        progressDiv.classList.add('hidden');
        addMessage(`[SYSTEM]: Ingested "${file.name}". Full deep-analysis complete. My logic is now grounded in this data.`, 'ai');
    }, 500);
});

function renderHistory() {
    const nav = document.getElementById('history-nav');
    nav.innerHTML = '';
    ['Today', 'Yesterday'].forEach(group => {
        const items = State.history.filter(h => h.cat === group);
        const div = document.createElement('div');
        div.innerHTML = `
            <h4 class="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-bold mb-3 px-2">${group}</h4>
            <div class="space-y-1 mb-6">
                ${items.map(item => `<div class="p-3 rounded-xl cursor-pointer flex items-center gap-3 hover:bg-slate-900 group transition-all text-sm text-slate-400 hover:text-white"><span>#</span> ${item.title}</div>`).join('')}
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
