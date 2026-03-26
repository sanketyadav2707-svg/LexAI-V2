'use strict';

const State = {
    user: null,
    sessions: [],
    currentSessionId: null,
    isDeepThinking: false,
    authMode: 'login' // 'login' or 'signup'
};

/* ═══════════════════════════════════════════
   AUTH LOGIC
═══════════════════════════════════════════ */

function toggleAuthMode() {
    State.authMode = State.authMode === 'login' ? 'signup' : 'login';
    const nameCont = document.getElementById('auth-name-container');
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleLink = document.getElementById('auth-toggle-link');
    const toggleText = document.getElementById('auth-toggle-text');

    if (State.authMode === 'signup') {
        nameCont.classList.remove('hidden');
        submitBtn.innerText = 'Create Account';
        toggleText.innerText = 'Already have an account?';
        toggleLink.innerText = 'Log In';
    } else {
        nameCont.classList.add('hidden');
        submitBtn.innerText = 'Continue';
        toggleText.innerText = "Don't have an account?";
        toggleLink.innerText = 'Sign Up';
    }
}

function togglePasswordVisibility() {
    const passInput = document.getElementById('auth-pass');
    passInput.type = passInput.type === 'password' ? 'text' : 'password';
}

function handleAuthSubmit() {
    const email = document.getElementById('auth-email').value;
    const name = document.getElementById('auth-name').value;
    if(!email) return alert("Enter email");
    
    State.user = { name: name || email.split('@')[0], email };
    localStorage.setItem('lexai_user', JSON.stringify(State.user));
    
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('user-name-span').innerText = State.user.name;
}

/* ═══════════════════════════════════════════
   UI TOGGLES
═══════════════════════════════════════════ */

function toggleDeepThinking() {
    State.isDeepThinking = !State.isDeepThinking;
    const dot = document.getElementById('toggle-dot');
    const btn = document.getElementById('deep-thinking-toggle');
    
    if (State.isDeepThinking) {
        dot.style.transform = 'translateX(16px)';
        btn.classList.replace('bg-zinc-700', 'bg-white');
        dot.classList.replace('bg-white', 'bg-black');
    } else {
        dot.style.transform = 'translateX(0px)';
        btn.classList.replace('bg-white', 'bg-zinc-700');
        dot.classList.replace('bg-black', 'bg-white');
    }
}

function startNewChat() {
    document.getElementById('welcome-view').classList.remove('hidden');
    document.getElementById('messages').classList.add('hidden');
    document.getElementById('messages').innerHTML = '';
}

/* ═══════════════════════════════════════════
   MESSAGING CORE
═══════════════════════════════════════════ */

function handleSend() {
    const input = document.getElementById('user-input');
    const query = input.value.trim();
    if (!query) return;

    // UI Switch
    document.getElementById('welcome-view').classList.add('hidden');
    document.getElementById('messages').classList.remove('hidden');

    appendMessage('user', query);
    input.value = '';
    
    // Simulate "Deep Thinking" delay
    if (State.isDeepThinking) {
        const thinkingId = appendThinking();
        setTimeout(() => {
            removeThinking(thinkingId);
            appendMessage('ai', "Based on deep analysis across global jurisdictions and business frameworks, here is the executive summary...");
        }, 2500);
    } else {
        appendMessage('ai', "Here is the summary of your requested analysis.");
    }
}

function appendMessage(role, text) {
    const container = document.getElementById('messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = role === 'user' ? 'flex justify-end' : 'flex justify-start';
    
    msgDiv.innerHTML = `
        <div class="max-w-[85%] ${role === 'user' ? 'chat-bubble-user p-3 rounded-2xl text-sm' : 'chat-bubble-ai text-sm'}">
            ${text}
        </div>
    `;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

function appendThinking() {
    const id = 'think-' + Date.now();
    const container = document.getElementById('messages');
    const div = document.createElement('div');
    div.id = id;
    div.innerHTML = `<span class="thinking-tag px-3 py-1 rounded-full animate-pulse">Thinking deeply...</span>`;
    container.appendChild(div);
    return id;
}

function removeThinking(id) {
    document.getElementById(id)?.remove();
}

function handleSignout() {
    localStorage.removeItem('lexai_user');
    location.reload();
}

window.onload = () => {
    const saved = localStorage.getItem('lexai_user');
    if(saved) {
        State.user = JSON.parse(saved);
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('user-name-span').innerText = State.user.name;
    }
}
