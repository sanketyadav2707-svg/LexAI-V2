'use strict';

/**
 * LEX CONVERSATIONAL BRAIN v3.0
 * Features: Social Intelligence, Mirroring, and File Handling
 */

const LexBrain = {
    // This function decides if the AI should be a friend or a consultant
    think: function(query, isDeep) {
        const input = query.toLowerCase().trim();
        
        // 1. Social Intelligence Layer (The "Human" side)
        if (this.isSmallTalk(input)) {
            return this.handleSocial(input);
        }

        // 2. Analytical Intelligence Layer (The "Professional" side)
        return this.handleAnalysis(input, isDeep);
    },

    isSmallTalk: function(input) {
        const socialCues = ['hi', 'hello', 'hey', 'how are you', 'whats up', 'who are you', 'good morning', 'good afternoon', 'thanks', 'thank you'];
        return socialCues.some(cue => input.startsWith(cue) || input === cue);
    },

    handleSocial: function(input) {
        const responses = {
            greetings: [
                "Hey! Good to see you. What's on your mind today?",
                "Hello! I was just waiting for you to drop by. How can I help?",
                "Hi there! Ready to dive into some work, or just checking in?"
            ],
            status: [
                "I'm doing great! Just processing a world of info and staying sharp. How are things with you?",
                "I'm excellent. Feeling very 'high-bandwidth' today. How are you holding up?",
                "Doing well, thanks for asking! Life in the cloud is pretty smooth. What about you?"
            ],
            appreciation: [
                "You're very welcome!",
                "Anytime. I've got your back.",
                "Glad I could help. What's next on the agenda?"
            ]
        };

        if (input.includes('how are you') || input.includes('whats up')) 
            return responses.status[Math.floor(Math.random() * responses.status.length)];
        
        if (input.includes('thanks') || input.includes('thank you'))
            return responses.appreciation[Math.floor(Math.random() * responses.appreciation.length)];

        return responses.greetings[Math.floor(Math.random() * responses.greetings.length)];
    },

    handleAnalysis: function(input, isDeep) {
        // More human-like professional responses (no "nuanced approach" nonsense)
        const openings = [
            "That's a solid point. Let's look at it this way:",
            "I see where you're going with this. Here's my take:",
            "Got it. Let's break this down strategically.",
            "Interesting. If we're looking at this from a high-level perspective..."
        ];

        const thoughts = [
            "Essentially, we need to balance the immediate risk with the long-term payoff.",
            "The data suggests that most people in your position prioritize efficiency here.",
            "It really comes down to how much leverage you want to maintain in this situation."
        ];

        const deepLayers = [
            "\n\nDigging deeper, I've noticed a pattern in similar cases that suggests a hidden opportunity here.",
            "\n\nIf we push the logic further, we might actually see a shift in the outcome by next quarter.",
            "\n\nI've also run a quick simulation on the variables you mentioned; it's looking promising but needs caution."
        ];

        let res = openings[Math.floor(Math.random() * openings.length)] + " " + 
                  thoughts[Math.floor(Math.random() * thoughts.length)];
        
        if (isDeep) res += deepLayers[Math.floor(Math.random() * deepLayers.length)];
        
        return res;
    }
};

/* ═══════════════════════════════════════════
   FILE ATTACHMENT SYSTEM
═══════════════════════════════════════════ */

function triggerFileUpload() {
    document.getElementById('hidden-file-input').click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        // Show a temporary message in the chat
        appendBubble('ai', `I've received your file: **${file.name}**. I'm scanning the contents now...`);
    }
}

/* ═══════════════════════════════════════════
   CORE UI FLOW (FIXED & POLISHED)
═══════════════════════════════════════════ */

let currentUser = null;

function submitAuth() {
    const email = document.getElementById('auth-email').value;
    const name = document.getElementById('auth-name').value || email.split('@')[0];
    if(!email) return alert("Please enter an email.");
    currentUser = { name, email };
    localStorage.setItem('lex_user', JSON.stringify(currentUser));
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('user-display-name').innerText = name;
}

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
        removeElement(typingId);
        const response = LexBrain.think(query, isDeep);
        streamText(response);
    }, isDeep ? 1500 : 600);
}

function streamText(fullText) {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'flex justify-start';
    div.innerHTML = `<div class="max-w-[80%] ai-bubble p-6 text-base"><p id="streaming-p" class="text-zinc-200 typing-cursor"></p></div>`;
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
    div.innerHTML = `<div class="max-w-[80%] ${role === 'user' ? 'user-bubble p-4 text-sm' : 'ai-bubble p-6 text-base'}"><p>${text}</p></div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function appendTypingIndicator() {
    const box = document.getElementById('chat-messages');
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.innerHTML = `<div class="flex justify-start"><div class="ai-bubble px-6 py-3 text-xs text-zinc-500 italic animate-pulse">Lex is thinking...</div></div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return id;
}

function removeElement(id) { document.getElementById(id)?.remove(); }
function autoResize(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
function handleInputKeydown(e) { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); processMessage(); } }
function togglePass() { const p = document.getElementById('auth-pass'); p.type = p.type === 'password' ? 'text' : 'password'; }
function setAuthMode(mode) { 
    document.getElementById('signup-fields').classList.toggle('hidden', mode === 'login');
    document.getElementById('login-tab').className = mode === 'login' ? 'active-tab py-1 text-sm font-semibold' : 'py-1 text-sm font-semibold text-zinc-500';
    document.getElementById('signup-tab').className = mode === 'signup' ? 'active-tab py-1 text-sm font-semibold' : 'py-1 text-sm font-semibold text-zinc-500';
}
function handleSignout() { localStorage.removeItem('lex_user'); location.reload(); }
function startNewChat() { location.reload(); }

window.onload = () => {
    const saved = localStorage.getItem('lex_user');
    if(saved) {
        currentUser = JSON.parse(saved);
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('user-display-name').innerText = currentUser.name;
    }
}
