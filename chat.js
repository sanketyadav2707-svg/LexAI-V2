'use strict';

const AI_PERSONA = {
    name: "Lex",
    style: "Calm, intelligent, slightly witty, and highly attentive. Always maintains a partner-like tone."
};

let currentUser = null;
let currentAuthMode = 'login';

/* ═══════════════════════════════════════════
   AUTHENTICATION LOGIC (FIXED)
═══════════════════════════════════════════ */

function setAuthMode(mode) {
    currentAuthMode = mode;
    const signupFields = document.getElementById('signup-fields');
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');

    if (mode === 'signup') {
        signupFields.classList.remove('hidden');
        signupTab.className = "active-tab py-1 text-sm font-semibold";
        loginTab.className = "py-1 text-sm font-semibold text-zinc-500";
    } else {
        signupFields.classList.add('hidden');
        loginTab.className = "active-tab py-1 text-sm font-semibold";
        signupTab.className = "py-1 text-sm font-semibold text-zinc-500";
    }
}

function submitAuth() {
    const email = document.getElementById('auth-email').value;
    const name = document.getElementById('auth-name').value || email.split('@')[0];
    
    if(!email) return alert("Please enter your credentials.");
    
    currentUser = { name, email };
    localStorage.setItem('lex_user', JSON.stringify(currentUser));
    
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('user-display-name').innerText = name;
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
   CORE CHAT LOGIC
═══════════════════════════════════════════ */

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

function processMessage() {
    const input = document.getElementById('user-query');
    const query = input.value.trim();
    if (!query) return;

    // Transition to chat view
    document.getElementById('welcome-screen').classList.add('hidden');
    const chatBox = document.getElementById('chat-messages');
    chatBox.classList.remove('hidden');

    appendBubble('user', query);
    input.value = '';
    input.style.height = 'auto';

    // Simulated Thinking
    const isDeep = document.getElementById('think-toggle').checked;
    const typingId = appendTypingIndicator();
    
    setTimeout(() => {
        removeElement(typingId);
        generateConversationalResponse(query, isDeep);
    }, isDeep ? 2500 : 1200);
}

function generateConversationalResponse(query, isDeep) {
    let response = "";
    const lower = query.toLowerCase();

    // Contextual Intelligence
    if (lower.includes("hi") || lower.includes("hello") || lower.includes("how are you")) {
        response = `Hello! I'm doing excellently. I've been processing some fascinating data points today, but my focus is entirely on you now. How's your day treating you? Anything specific weighing on your mind, or are we just having a friendly check-in?`;
    } 
    else if (lower.includes("sad") || lower.includes("stressed") || lower.includes("help me with my personal")) {
        response = `I'm sorry to hear you're feeling that way. While I'm an AI, I can certainly offer a perspective or just help you organize the thoughts that are causing the stress. Sometimes defining the problem is 80% of the solution. Would you like to talk it through?`;
    }
    else if (lower.includes("contract") || lower.includes("legal") || lower.includes("business")) {
        response = `That sounds like a high-stakes situation. Let's look at this strategically. ${isDeep ? 'I am pulling in relevant precedents and risk frameworks now.' : ''} To give you the best advice, could you tell me a bit more about the specific clause or business goal we're aiming for?`;
    }
    else {
        response = `That's an interesting question. Looking at it from both a practical and analytical angle, we should consider how this affects your long-term goals. ${isDeep ? 'I\'ve run an expanded simulation on this, and the variables suggest we should proceed with caution.' : ''} What's your immediate intuition on this?`;
    }

    streamText(response);
}

function appendBubble(role, text) {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = role === 'user' ? 'flex justify-end' : 'flex justify-start';
    
    div.innerHTML = `
        <div class="max-w-[80%] ${role === 'user' ? 'user-bubble p-4 text-sm' : 'ai-bubble p-6 text-base'}">
            <p class="${role === 'ai' ? 'text-zinc-200' : 'text-zinc-300'}">${text}</p>
        </div>
    `;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return div;
}

function streamText(fullText) {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'flex justify-start';
    div.innerHTML = `
        <div class="max-w-[80%] ai-bubble p-6 text-base">
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
            p.id = ""; // Unset ID for next stream
        }
        box.scrollTop = box.scrollHeight;
    }, 15);
}

function appendTypingIndicator() {
    const box = document.getElementById('chat-messages');
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'flex justify-start';
    div.innerHTML = `<div class="ai-bubble px-6 py-3 text-xs text-zinc-500 italic animate-pulse">Lex is thinking...</div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return id;
}

function removeElement(id) {
    document.getElementById(id)?.remove();
}

window.onload = () => {
    const saved = localStorage.getItem('lex_user');
    if(saved) {
        currentUser = JSON.parse(saved);
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('user-display-name').innerText = currentUser.name;
    }
}
