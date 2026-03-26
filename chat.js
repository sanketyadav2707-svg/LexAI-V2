'use strict';

const State = {
    currentUser: null,
    lastAiAction: null
};

/* ═══════════════════════════════════════════
   1. AUTHENTICATION & TOGGLES
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
    if(!email) return alert("Email required.");
    
    State.currentUser = { name, email };
    localStorage.setItem('lex_user', JSON.stringify(State.currentUser));
    
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('user-display-name').innerText = name;
}

function handleSignout() {
    localStorage.removeItem('lex_user');
    location.reload();
}

/* ═══════════════════════════════════════════
   2. CONVERSATIONAL BRAIN
═══════════════════════════════════════════ */

const LexBrain = {
    think: function(query, isDeep) {
        const input = query.toLowerCase().trim();
        
        // Social Threading
        if (State.lastAiAction === 'asked_status') {
            State.lastAiAction = 'social';
            return this.handleSocialFollowup(input);
        }

        if (this.isSmallTalk(input)) {
            if (input.includes('how are you')) {
                State.lastAiAction = 'asked_status';
                return "I'm doing great, honestly. Just keeping the gears turning. How's your day going?";
            }
            return "Hey! I'm here. What can we tackle today?";
        }

        // Strategy/Work
        State.lastAiAction = 'working';
        return this.handleTask(query, isDeep);
    },

    isSmallTalk: function(input) {
        return input.length < 15 || ['hi', 'hello', 'hey', 'good', 'thanks', 'cool'].some(k => input.includes(k));
    },

    handleSocialFollowup: function(input) {
        if (['good', 'great', 'well', 'fine'].some(w => input.includes(w))) {
            return "Glad to hear that. It's always better to start from a clear headspace. Ready to dive into work?";
        }
        return "Understood. I'm here when you're ready to get down to business.";
    },

    handleTask: function(query, isDeep) {
        const q = query.toLowerCase();
        let res = "";
        if (q.includes('legal') || q.includes('contract') || q.includes('nda')) {
            res = "Analyzing the legal framework... The core risk here is usually the liability cap. We should ensure it scales reasonably with the contract value.";
        } else {
            res = "That's an interesting strategy. From an executive perspective, I'd focus on how this impacts your scalability. What's your immediate goal?";
        }
        if (isDeep) res += "\n\nDeep analysis suggests a 12% risk variance we haven't accounted for yet.";
        return res;
    }
};

/* ═══════════════════════════════════════════
   3. UI CONTROLS
═══════════════════════════════════════════ */

function processMessage() {
    const input = document.getElementById('user-query');
    const query = input.value.trim();
    if (!query) return;

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
        if (i >= fullText.length) { clearInterval(interval); p.classList.remove('typing-cursor'); p.id = ""; }
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

function triggerFileUpload() { document.getElementById('hidden-file-input').click(); }
function handleFileSelect(e) { if(e.target.files[0]) appendBubble('ai', `File received: **${e.target.files[0].name}**. I'm scanning it now.`); }
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
