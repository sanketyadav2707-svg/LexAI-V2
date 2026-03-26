/**
 * LexAI v3.0 - Sovereign Intelligence Engine
 * Features: Heuristic Sentence Construction & Context-Aware Logic
 */

const State = {
    userName: "",
    isThinking: false,
    uploadedFile: null,
    history: [
        { id: 1, title: 'Strategic Review', cat: 'Today' },
        { id: 2, title: 'Liability Analysis', cat: 'Yesterday' }
    ]
};

// --- DYNAMIC INTELLIGENCE ENGINE (The "Brain") ---
const Brain = {
    // Variety of professional sentence starters
    openers: [
        "Analyzing the parameters of your query...",
        "Cross-referencing global data clusters regarding",
        "Based on real-time intelligence surrounding",
        "Evaluating the strategic implications of",
        "Synthesizing enterprise-grade data points on"
    ],
    // Professional conclusions
    closers: [
        "This aligns with our high-trust enterprise protocols.",
        "I recommend further deep-dive analysis into this sector.",
        "Our sovereign nodes suggest 98% confidence in this assessment.",
        "Shall I draft a formal brief regarding these findings?",
        "This is indexed in our high-priority intelligence vault."
    ],

    // Generates a unique response based on the user's actual input
    generateResponse: function(input) {
        const query = input.toLowerCase();
        
        // 1. Handle Greetings
        if (query.match(/(hi|hello|hey|morning|evening)/)) {
            return `Greetings, ${State.userName}. I am LexAI, your sovereign intelligence node. How can I assist with your legal or business strategy today?`;
        }

        // 2. Handle Weather/General Queries (With a Legal/Business Twist)
        if (query.includes("weather")) {
            return "Analyzing local meteorological data... While conditions vary, from a business perspective, I recommend monitoring how these patterns impact logistics and force majeure clauses in your active contracts.";
        }

        // 3. Handle File Queries
        if (State.uploadedFile && (query.includes("file") || query.includes("document"))) {
            return `Regarding the document "${State.uploadedFile.name}", my 1,000-page scan identifies several critical clauses that directly relate to your question. I suggest prioritizing the 'Risk Mitigation' section on page 412.`;
        }

        // 4. HEURISTIC ENGINE: Build a unique sentence for anything else
        // This picks a random opener, echoes the user's topic, and adds a random closer.
        const opener = this.openers[Math.floor(Math.random() * this.openers.length)];
        const closer = this.closers[Math.floor(Math.random() * this.closers.length)];
        
        // Extract a "Subject" (Last few words of the question)
        const words = input.split(' ');
        const subject = words.length > 2 ? words.slice(-2).join(' ') : "this matter";

        return `${opener} "${subject.replace(/[?!.]/g, '')}". ${closer}`;
    }
};

// --- AUTH & INITIALIZATION ---
document.getElementById('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    State.userName = document.getElementById('user-name-input').value || "Counsel";
    
    document.getElementById('auth-screen').classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-ui').classList.remove('hidden');
        setTimeout(() => { document.getElementById('app-ui').classList.replace('opacity-0', 'opacity-100'); }, 50);
        
        // Setup UI
        const hour = new Date().getHours();
        const greet = hour < 12 ? "Good morning" : (hour < 18 ? "Good afternoon" : "Good evening");
        document.getElementById('welcome-header').innerText = `${greet}, ${State.userName.split(' ')[0]}.`;
        document.getElementById('greeting-text').innerText = `${greet} Intelligence Cycle`;
        document.getElementById('display-name').innerText = State.userName;
        document.getElementById('user-avatar').innerText = State.userName.split(' ').map(n => n[0]).join('').toUpperCase();
        renderHistory();
    }, 600);
});

// --- CHAT CORE LOGIC ---
async function handleSendMessage() {
    const text = document.getElementById('chat-input').value.trim();
    if (!text || State.isThinking) return;

    document.getElementById('chat-input').value = '';
    document.getElementById('hero-state').classList.add('hidden');
    
    addMessage(text, 'user');

    // 1. Thinking Delay (2-3 seconds)
    State.isThinking = true;
    document.getElementById('ai-thinking').classList.remove('hidden');
    
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000)); 
    
    document.getElementById('ai-thinking').classList.add('hidden');

    // 2. Generate DYNAMIC response
    const dynamicResponse = Brain.generateResponse(text);

    // 3. Stream Response
    await streamResponse(dynamicResponse);
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
            <div class="mt-6 pt-4 border-t border-slate-800 flex gap-4">
                <button class="text-[10px] uppercase font-bold text-slate-500 hover:text-[#BF953F] transition-colors">Direct-to-Source Citation</button>
                <button class="text-[10px] uppercase font-bold text-slate-500 hover:text-[#BF953F] transition-colors">HITL Approval</button>
            </div>
        </div>
    `;
    list.appendChild(msg);

    const target = document.getElementById(id);
    
    // STREAMING LOGIC: NO AUTO-SCROLL as requested
    let i = 0;
    return new Promise(resolve => {
        const interval = setInterval(() => {
            target.innerHTML = fullText.substring(0, i) + '<span class="w-1 h-4 bg-[#BF953F] inline-block ml-1 animate-pulse"></span>';
            i += 3; // Speed of text
            if (i >= fullText.length + 3) {
                target.innerHTML = fullText;
                clearInterval(interval);
                resolve();
            }
        }, 15);
    });
}

// --- FILE UPLOAD (1000+ Page Indexing) ---
document.getElementById('file-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    State.uploadedFile = file;

    const progressDiv = document.getElementById('upload-progress');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('file-status');

    progressDiv.classList.remove('hidden');
    
    for (let i = 0; i <= 100; i += 2) {
        await new Promise(r => setTimeout(r, 30));
        progressBar.style.width = `${i}%`;
        document.getElementById('progress-percent').innerText = `${i}%`;
        if (i === 20) statusText.innerText = "Initializing OCR for 1,000+ pages...";
        if (i === 50) statusText.innerText = "Extracting semantic entities...";
        if (i === 80) statusText.innerText = "Correlating with active precedents...";
    }

    setTimeout(() => {
        progressDiv.classList.add('hidden');
        addMessage(`[INTELLIGENCE SYSTEM]: "${file.name}" has been fully ingested into the session memory. I am ready to answer questions based on its contents.`, 'ai');
    }, 500);
});

// --- SIDEBAR HISTORY ---
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
                        <svg class="w-4 h-4 text-slate-700 group-hover:text-[#BF953F]" fill="none" stroke="currentColor" viewBox="2 2 20 20"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                        <span class="text-sm text-slate-400 group-hover:text-slate-200 truncate">${item.title}</span>
                    </div>
                `).join('')}
            </div>
        `;
        nav.appendChild(div);
    });
}

// Listeners
document.getElementById('send-btn').addEventListener('click', handleSendMessage);
document.getElementById('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});
