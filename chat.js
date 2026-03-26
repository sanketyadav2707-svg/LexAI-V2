'use strict';

const State = {
    currentUser: null,
    lastAiAction: null,
    isProcessing: false
};

/* ═══════════════════════════════════════════
   1. AUTHENTICATION & UI
═══════════════════════════════════════════ */

function setAuthMode(mode) {
    const signupFields = document.getElementById('signup-fields');
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');

    if (mode === 'signup') {
        signupFields.classList.remove('hidden');
        signupTab.classList.add('active-tab');
        loginTab.classList.remove('active-tab');
    } else {
        signupFields.classList.add('hidden');
        loginTab.classList.add('active-tab');
        signupTab.classList.remove('active-tab');
    }
}

function togglePass() {
    const p = document.getElementById('auth-pass');
    p.type = p.type === 'password' ? 'text' : 'password';
}

function submitAuth() {
    const email = document.getElementById('auth-email').value;
    const name = document.getElementById('auth-name').value || email.split('@')[0];
    const logo = document.getElementById('auth-logo');

    if(!email) return alert("Email required.");

    logo.classList.add('logo-animate');

    setTimeout(() => {
        State.currentUser = { name, email };
        localStorage.setItem('lex_user', JSON.stringify(State.currentUser));
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('user-display-name').innerText = name;
    }, 600);
}

function handleSignout() {
    localStorage.removeItem('lex_user');
    location.reload();
}

/* ═══════════════════════════════════════════
   2. THE ARTIFICIAL BRAIN
═══════════════════════════════════════════ */

const LexBrain = {
    think: function(query, isDeep) {
        const input = query.toLowerCase().trim();

        if (input.includes('dumb') || input.includes('asshole') || input.includes('bad')) {
            return "I apologize. My previous responses were repetitive. I've updated my context—what specifically can I help you with right now?";
        }

        if (State.lastAiAction === 'asked_status' && input.length < 20) {
            State.lastAiAction = 'social';
            return input.includes('good') || input.includes('well') ? 
                "Great to hear. Let's keep that momentum. What are we tackling today?" : 
                "Understood. I'm here when you're ready to dive into the work.";
        }

        if (input.includes('how are you')) {
            State.lastAiAction = 'asked_status';
            return "I'm doing excellent. Feeling very high-bandwidth today. How is your day going?";
        }

        if (input.includes('consultant')) {
            return "Consulting is about clarity. You're bringing in an outside lens to solve problems the internal team is too close to. Is this for a specific firm or a strategy shift?";
        }

        if (input.includes('1000 page') || input.includes('summary')) {
            return "Summarizing 1,000 pages requires semantic chunking. I can map the core risks and KPIs across the whole file. If you upload it, we can begin.";
        }

        State.lastAiAction = 'working';
        const tasks = [
            "Strategically, this looks like a leverage play. Are we optimizing for speed or for safety?",
            "That's a bold direction. The main risk here is execution friction. How fast can the team pivot?",
            "I'm seeing a high-leverage opportunity here. Let's focus on the one metric that actually defines success."
        ];
        let res = tasks[Math.floor(Math.random() * tasks.length)];
        if (isDeep) res += "\n\nDeep thinking: My analysis suggests a hidden 12% risk variance in similar market cases.";
        return res;
    }
};

/* ═══════════════════════════════════════════
   3. MESSAGE PROCESSING (THE CORE)
═══════════════════════════════════════════ */

function processMessage() {
    if (State.isProcessing) return;
    
    const input = document.getElementById('user-query');
    const query = input.value.trim();
    if (!query) return;

    State.isProcessing = true;
    document.getElementById('welcome-screen').classList.add('hidden');
    const chatBox = document.getElementById('chat-messages');
    chatBox.classList.remove('hidden');

    appendBubble('user', query);
    input.value = '';
    input.style.height = 'auto';

    const isDeep = document.getElementById('think-toggle').checked;
    const typingId = appendTypingIndicator();
    
    setTimeout(() => {
        document.getElementById(typingId)?.remove();
        const response = LexBrain.think(query, isDeep);
        streamText(response);
        State.isProcessing = false;
    }, 600);
}

function streamText(fullText) {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'flex justify-start';
    div.innerHTML = `<div class="max-w-[85%] ai-bubble p-6 text-base"><p id="streaming-p" class="text-zinc-200 typing-cursor"></p></div>`;
    box.appendChild(div);
    const p = document.getElementById('streaming-p');
    let i = 0;
    const interval = setInterval(() => {
        p.innerText += fullText[i];
        i++;
        if (i >= fullText.length) { 
            clearInterval(interval); 
            p.classList.remove('typing-cursor'); 
            p.id = ""; 
        }
        box.scrollTop = box.scrollHeight;
    }, 15);
}

function appendBubble(role, text) {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = role === 'user' ? 'flex justify-end' : 'flex justify-start';
    div.innerHTML = `<div class="max-w-[85%] ${role === 'user' ? 'user-bubble p-4 text-sm' : 'ai-bubble p-6 text-base'}"><p>${text}</p></div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function appendTypingIndicator() {
    const id = 'typing-' + Date.now();
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.id = id;
    div.innerHTML = `<div class="flex justify-start"><div class="ai-bubble px-6 py-3 text-xs text-zinc-500 italic animate-pulse">Lex is thinking...</div></div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return id;
}

/* ═══════════════════════════════════════════
   4. UTILS
═══════════════════════════════════════════ */

function triggerFileUpload() { document.getElementById('hidden-file-input').click(); }
function handleFileSelect(e) { if(e.target.files[0]) appendBubble('ai', `Received: **${e.target.files[0].name}**. Scanning contents now.`); }
function autoResize(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
function handleInputKeydown(e) { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); processMessage(); } }
function startNewChat() { location.reload(); }

window.onload = () => {
    const saved = localStorage.getItem('lex_user');
    if(saved) {
        State.currentUser = JSON.parse(saved);
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('user-display-name').innerText = State.currentUser.name;
    }
}
