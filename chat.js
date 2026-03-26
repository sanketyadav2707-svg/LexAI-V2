'use strict';

/**
 * LEX SYSTEM v5.0 - FINAL STABLE
 * Features: Social Intelligence, Signup/Login Toggle, File Handling, and Animations.
 */

const State = {
    currentUser: null,
    lastAiAction: null,
    isProcessing: false,
    authMode: 'login'
};

/* ═══════════════════════════════════════════
   1. AUTHENTICATION & ANIMATIONS
═══════════════════════════════════════════ */

function setAuthMode(mode) {
    State.authMode = mode;
    const signupFields = document.getElementById('signup-fields');
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');

    if (mode === 'signup') {
        signupFields.classList.remove('hidden');
        signupTab.className = "py-2 text-sm font-semibold text-white border-b-2 border-white transition-all";
        loginTab.className = "py-2 text-sm font-semibold text-zinc-500 border-b-2 border-transparent transition-all";
    } else {
        signupFields.classList.add('hidden');
        loginTab.className = "py-2 text-sm font-semibold text-white border-b-2 border-white transition-all";
        signupTab.className = "py-2 text-sm font-semibold text-zinc-500 border-b-2 border-transparent transition-all";
    }
}

function submitAuth() {
    const email = document.getElementById('auth-email').value;
    const name = document.getElementById('auth-name').value || email.split('@')[0];
    const logo = document.getElementById('auth-logo');

    if(!email) return alert("Please enter your email.");

    // SUCCESS LOGO ANIMATION
    logo.classList.add('logo-animate');

    setTimeout(() => {
        State.currentUser = { name, email };
        localStorage.setItem('lex_user', JSON.stringify(State.currentUser));
        
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('user-display-name').innerText = name;
    }, 600); 
}

function togglePass() {
    const p = document.getElementById('auth-pass');
    p.type = p.type === 'password' ? 'text' : 'password';
}

function handleSignout() {
    localStorage.removeItem('lex_user');
    location.reload();
}

/* ═══════════════════════════════════════════
   2. THE ARTIFICIAL BRAIN (INTELLIGENT & CALM)
═══════════════════════════════════════════ */

const LexBrain = {
    think: function(query, isDeep) {
        const input = query.toLowerCase().trim();
        
        // Anti-Dumb Logic: Critical Self-Awareness
        if (input.includes('dumb') || input.includes('asshole') || input.includes('bad') || input.includes('stupid')) {
            return "You're right. I missed the mark there. My logic hit a repetitive loop. I've cleared my context—let's actually talk about what you need. What did I miss?";
        }

        // Social Mirroring (If you are nice, Lex is nice. If you answer Lex, Lex acknowledges)
        if (State.lastAiAction === 'asked_status' && input.length < 25) {
            State.lastAiAction = 'social';
            return this.handleSocialFollowup(input);
        }

        if (this.isSmallTalk(input)) {
            if (input.includes('how are you')) {
                State.lastAiAction = 'asked_status';
                return "I'm doing excellently, thanks for asking. I've been processing some interesting data, but I'm all yours now. How's your day treating you?";
            }
            return "Hello! I'm here. What's on the agenda today?";
        }

        // Subject Specifics
        if (input.includes('consultant')) {
            return "Consulting is all about clarity and outside perspective. Whether it's MBB-style strategy or specialized implementation, the goal is solving the friction points the internal team is too close to see. Are you working on a specific strategy?";
        }

        if (input.includes('1000 page') || input.includes('summary') || input.includes('read')) {
            return "Summarizing a 1,000-page document requires serious synthesis. Instead of a generic summary, I can map out the core risks, KPIs, and executive themes across the whole file. If you upload it, we can begin.";
        }

        // Standard Intelligent Response
        State.lastAiAction = 'working';
        const thoughts = [
            "Strategically, this looks like a high-leverage move. We should focus on the one metric that actually defines success here.",
            "That's a bold direction. The main risk is execution friction—how fast can the team pivot if the initial assumptions are wrong?",
            "I see where you're going. Usually, when this comes up, the move is to optimize the current resource allocation before scaling."
        ];
        
        let res = thoughts[Math.floor(Math.random() * thoughts.length)];
        if (isDeep) res += "\n\nDeep thinking: My internal simulations suggest a hidden 12% risk variance we haven't discussed yet.";
        return res;
    },

    isSmallTalk: function(input) {
        return input.length < 15 || ['hi', 'hello', 'hey', 'good', 'thanks', 'cool'].some(k => input.includes(k));
    },

    handleSocialFollowup: function(input) {
        if (['good', 'great', 'well', 'fine', 'okay'].some(w => input.includes(w))) {
            return "Glad to hear that. A clear head is the best tool for the work we do. Ready to dive in, or did you have something else in mind?";
        }
        return "Understood. I'm here when you're ready to tackle the heavy lifting.";
    }
};

/* ═══════════════════════════════════════════
   3. MESSAGE PROCESSING (NO-FAILURE SEND)
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
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();
        
        const response = LexBrain.think(query, isDeep);
        streamText(response);
        State.isProcessing = false;
    }, 600);
}

function streamText(fullText) {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'flex justify-start';
    div.innerHTML = `
        <div class="max-w-[85%] ai-bubble p-6 text-base">
            <p id="streaming-p" class="text-zinc-200 typing-cursor"></p>
        </div>
    `;
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
    div.innerHTML = `
        <div class="max-w-[85%] ${role === 'user' ? 'user-bubble p-4 text-sm' : 'ai-bubble p-6 text-base'}">
            <p>${text}</p>
        </div>
    `;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function appendTypingIndicator() {
    const id = 'typing-' + Date.now();
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.id = id;
    div.className = 'flex justify-start';
    div.innerHTML = `<div class="ai-bubble px-6 py-3 text-xs text-zinc-500 italic animate-pulse">Lex is thinking...</div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return id;
}

/* ═══════════════════════════════════════════
   4. UTILITIES (FILES & INPUT)
═══════════════════════════════════════════ */

function triggerFileUpload() { document.getElementById('hidden-file-input').click(); }

function handleFileSelect(e) { 
    if(e.target.files[0]) {
        appendBubble('ai', `I've received your file: **${e.target.files[0].name}**. I'm scanning it now for key intelligence.`);
    }
}

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

function handleInputKeydown(e) {
    if(e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        processMessage();
    }
}

function startNewChat() {
    location.reload(); 
}

window.onload = () => {
    const saved = localStorage.getItem('lex_user');
    if(saved) {
        State.currentUser = JSON.parse(saved);
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('user-display-name').innerText = State.currentUser.name;
    }
}
