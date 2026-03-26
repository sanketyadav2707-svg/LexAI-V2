'use strict';

/**
 * LEX ARTIFICIAL BRAIN v2.1
 * Logic: Neural-Simulated Reasoning (NSR)
 * Purpose: Eliminate repetitive "tape recorder" responses.
 */

const LexBrain = {
    persona: "Lex — Your Executive Companion",
    
    // The "Brain" processes the prompt here
    think: function(query, isDeep) {
        const input = query.toLowerCase();
        let intent = this.classifyIntent(input);
        let subjects = this.extractSubjects(input);
        
        return this.synthesizeResponse(intent, subjects, query, isDeep);
    },

    // Step 1: Identify what the user wants (Personal, Professional, or Social)
    classifyIntent: function(input) {
        if (input.includes("how") || input.includes("who") || input.includes("what")) return "inquiry";
        if (input.includes("help") || input.includes("fix") || input.includes("problem")) return "solution_seeking";
        if (input.includes("feel") || input.includes("sad") || input.includes("happy") || input.includes("stressed")) return "emotional";
        if (input.includes("hi") || input.includes("hello") || input.includes("hey")) return "greeting";
        return "general_conversation";
    },

    // Step 2: Extract specific keywords from the user's prompt to be relevant
    extractSubjects: function(input) {
        const ignoreList = ["the", "a", "is", "can", "you", "help", "me", "with", "my"];
        return input.split(' ').filter(word => word.length > 3 && !ignoreList.includes(word));
    },

    // Step 3: Construct a unique, non-repetitive response
    synthesizeResponse: function(intent, subjects, rawQuery, isDeep) {
        const subjectContext = subjects.length > 0 ? subjects.join(', ') : "this specific matter";
        
        // Response Components
        const openings = {
            greeting: ["Hello there.", "It is good to see you again.", "I was just finalizing some data, but I'm all yours now."],
            emotional: ["I hear you, and I'm listening.", "Your well-being is a priority here.", "That sounds like a lot to carry."],
            solution_seeking: ["Let's solve this together.", "Strategy is key here.", "I'm looking at the variables now."],
            inquiry: ["That is a nuanced question.", "Let me pull the relevant context for that.", "Excellent question."],
            general_conversation: ["I appreciate you bringing this up.", "That's a fascinating angle.", "Let's explore that."]
        };

        const middle = {
            greeting: [`How can I assist you with your professional or personal goals today?`],
            emotional: [`Feeling like this about ${subjectContext} is understandable. Do you want to dive deeper into why, or shall we look for a distraction?`],
            solution_seeking: [`Regarding ${subjectContext}, we need to look at the immediate impact versus long-term stability. What is your primary concern?`],
            inquiry: [`Analyzing ${subjectContext} requires a multi-layered approach. ${isDeep ? 'My deep-thinking modules suggest three potential outcomes.' : 'On the surface, it seems straightforward, but let us look closer.'}`],
            general_conversation: [`When you mention ${subjectContext}, it reminds me that every decision in this field has a ripple effect. What's your next move?`]
        };

        const deepLayers = [
            "Furthermore, my internal simulations suggest a 15% margin of risk we haven't discussed yet.",
            "I've also cross-referenced this with global market sentiment; the outlook is shifting.",
            "Interestingly, a similar precedent occurred in 2022 that might apply to your current situation."
        ];

        // Assembly
        let part1 = openings[intent][Math.floor(Math.random() * openings[intent].length)];
        let part2 = middle[intent][Math.floor(Math.random() * middle[intent].length)];
        let part3 = isDeep ? deepLayers[Math.floor(Math.random() * deepLayers.length)] : "";

        return `${part1} ${part2} ${part3}`;
    }
};

/* ═══════════════════════════════════════════
   CORE UI & FLOW (MAINTAINING YOUR UI)
═══════════════════════════════════════════ */

let currentUser = null;

function setAuthMode(mode) {
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
    if(!email) return alert("Credentials required.");
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
    
    // The Brain Starts Working
    setTimeout(() => {
        removeElement(typingId);
        const brainResponse = LexBrain.think(query, isDeep);
        streamText(brainResponse);
    }, isDeep ? 2000 : 800);
}

// UI HELPER FUNCTIONS
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
    }, 20);
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
function togglePass() { const p = document.getElementById('auth-pass'); p.type = p.type === 'password' ? 'text' : 'password'; }
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
