'use strict';

const State = {
    currentUser: null,
    lastAiAction: null,
    authMode: 'login'
};

/* ═══════════════════════════════════════════
   1. AUTHENTICATION & UI FIXES
═══════════════════════════════════════════ */

function setAuthMode(mode) {
    State.authMode = mode;
    const signupFields = document.getElementById('signup-fields');
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const continueBtn = document.getElementById('auth-continue-btn');

    if (mode === 'signup') {
        signupFields.classList.remove('hidden');
        setTimeout(() => {
            signupFields.style.opacity = '1';
            signupFields.style.transform = 'translateY(0)';
        }, 10);
        signupTab.classList.add('active-tab');
        signupTab.style.color = "#FFF";
        loginTab.classList.remove('active-tab');
        loginTab.style.color = "#71717a"; // zinc-500
        continueBtn.innerText = "Create Account";
    } else {
        signupFields.style.opacity = '0';
        signupFields.style.transform = 'translateY(8px)';
        setTimeout(() => signupFields.classList.add('hidden'), 300);
        loginTab.classList.add('active-tab');
        loginTab.style.color = "#FFF";
        signupTab.classList.remove('active-tab');
        signupTab.style.color = "#71717a";
        continueBtn.innerText = "Continue";
    }
}

function submitAuth() {
    const email = document.getElementById('auth-email').value;
    const name = document.getElementById('auth-name').value || email.split('@')[0];
    const logo = document.getElementById('auth-logo');

    if(!email || email.length < 5) return alert("Valid email required.");

    // SUCCESS ANIMATION
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

/* ═══════════════════════════════════════════
   2. THE IMPROVED BRAIN (SUBJECT AWARENESS)
═══════════════════════════════════════════ */

const LexBrain = {
    think: function(query, isDeep) {
        const input = query.toLowerCase().trim();
        
        // Critical Performance Check
        if (input.includes('dumb') || input.includes('asshole') || input.includes('shitty')) {
            return "I apologize. I got stuck in a repetitive loop. I've cleared that logic path. Let's restart: What specifically can I help you with right now?";
        }

        // Contextual Awareness
        if (input.includes('consultant') || input.includes('consulting')) {
            return "Consulting is about providing that high-level objective lens. Whether you're navigating a restructure or a digital transformation, the goal is clarity. Are we looking at a specific firm or a strategy?";
        }

        if (input.includes('1000 page') || input.includes('summary')) {
            return "Summarizing 1,000 pages isn't just about shortening text—it's about finding the needle in the haystack. If you upload it, I'll map the KPIs and risks across the whole document. Ready?";
        }

        if (this.isSmallTalk(input)) {
            if (input.includes('how are you')) {
                State.lastAiAction = 'asked_status';
                return "I'm doing great. Much better now that we're talking. How is your day going?";
            }
            return "Hey. I'm here. What's on the agenda?";
        }

        // Dynamic Feedback
        if (State.lastAiAction === 'asked_status' && input.length < 15) {
            State.lastAiAction = 'social';
            return "Glad to hear that. A clear mind makes for better strategy. What are we tackling first?";
        }

        return this.handleTask(input, isDeep);
    },

    isSmallTalk: function(input) {
        return input.length < 12 || ['hi', 'hello', 'hey', 'good', 'fine'].some(k => input.includes(k));
    },

    handleTask: function(input, isDeep) {
        // Prevent repeating "Scalability"
        const strategyLines = [
            "This moves us into a competitive territory. We need to look at the resource overhead vs the payoff.",
            "That's a bold move. Usually, the risk here lies in the execution speed. How fast can we pivot if this fails?",
            "I'm seeing a potential for high leverage here. We should focus on the one metric that defines success for this."
        ];
        
        let res = strategyLines[Math.floor(Math.random() * strategyLines.length)];
        if (isDeep) res += "\n\nDeep Thinking: My analysis of current market patterns suggests a 15% efficiency gap we could exploit here.";
        return res;
    }
};

/* ═══════════════════════════════════════════
   3. UI MESSAGING PIPELINE
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

// Ensure your existing streamText, appendBubble, and appendTypingIndicator functions are below this point
