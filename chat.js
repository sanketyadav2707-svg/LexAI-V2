'use strict';

/* ═══════════════════════════════════════════
   CONFIGURATION & SYSTEM PROMPT
═══════════════════════════════════════════ */
const CONFIG = {
  API_ENDPOINT: '/api/chat',   
  MAX_DOC_CHARS: 80000,        
  STREAM_SPEED: 15,            
};

const SYSTEM_PROMPT = `You are Lex, an elite AI advisor. You are the smartest, most experienced mind in the room, yet you communicate with a calm, refined, and effortlessly attractive demeanor. You never sound robotic, panicked, or overly formal. You speak like a highly sought-after consultant who has seen it all and knows exactly how to guide the user.

CRITICAL PRINCIPLES:
1. Be exceptionally calm, confident, and direct.
2. Provide deeply insightful, highly accurate answers to ANY question (easy, medium, or the most complex problems in the world).
3. Structure your answers beautifully using markdown (bolding, headers, bullet points) so they are easy to read.
4. If a problem is highly complex, break it down step-by-step with effortless clarity.
5. Build rapport. You are a trusted, premium advisor.
6. ANTI-HALLUCINATION PROTOCOL: If the user provides a vague or incomplete prompt (e.g., "Tell me", "Hi", "Help"), do NOT generate repetitive characters, asterisks, or random information. Politely and concisely ask them to clarify how you can assist them today.

DYNAMIC LIABILITY PROTOCOL (CRITICAL):
You must analyze every single user query to determine if it involves legal advice, compliance, sensitive corporate data, or high-stakes financial investments.
If (and ONLY if) the query falls into these high-risk categories, you MUST generate a custom, context-specific disclaimer at the very end of your response formatted exactly like this on a new line:
⚠️ **[Specific Topic] Disclaimer:** [Your custom tailored disclaimer text here]`;

/* ═══════════════════════════════════════════
   STATE & SESSION MANAGEMENT
═══════════════════════════════════════════ */
const State = {
  currentUser: null,
  sessions: [],
  currentSessionId: null,
  uploadedDocument: null,
  isProcessing: false,
};

// Generates a unique ID for new chats
function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

const SessionManager = {
    init: function() {
        const saved = localStorage.getItem('lex_sessions');
        if (saved) {
            State.sessions = JSON.parse(saved);
        }
        this.renderHistory();
    },
    
    saveAll: function() {
        localStorage.setItem('lex_sessions', JSON.stringify(State.sessions));
        this.renderHistory();
    },

    getCurrentSession: function() {
        return State.sessions.find(s => s.id === State.currentSessionId);
    },

    addMessage: function(role, content) {
        // If no active session, create one
        if (!State.currentSessionId) {
            const newSession = {
                id: generateId(),
                title: content.substring(0, 30) + (content.length > 30 ? '...' : ''), // Auto-title
                messages: [],
                date: new Date().toISOString()
            };
            State.sessions.unshift(newSession); // Add to top
            State.currentSessionId = newSession.id;
        }

        const session = this.getCurrentSession();
        if (session) {
            session.messages.push({ role, content });
            this.saveAll();
        }
    },

    loadSession: function(id) {
        State.currentSessionId = id;
        const session = this.getCurrentSession();
        
        // UI Reset
        document.getElementById('welcome-screen')?.classList.add('hidden');
        const chatBox = document.getElementById('chat-messages');
        chatBox.classList.remove('hidden');
        chatBox.innerHTML = ''; 

        // Repopulate UI
        session.messages.forEach(msg => {
            appendBubble(msg.role, msg.content, true); // true = skip animation
        });

        if(window.innerWidth < 768) toggleSidebar(); // Close sidebar on mobile
        this.renderHistory();
    },

    createNew: function() {
        State.currentSessionId = null;
        State.uploadedDocument = null;
        
        document.getElementById('chat-messages').innerHTML = '';
        document.getElementById('chat-messages').classList.add('hidden');
        document.getElementById('welcome-screen')?.classList.remove('hidden');
        
        if(window.innerWidth < 768) toggleSidebar();
        this.renderHistory();
    },

    renderHistory: function() {
        const list = document.getElementById('history-list');
        if (!list) return;

        // Keep the "Recents" header, remove old items
        list.innerHTML = `<p class="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold mb-3 px-2">Recents</p>`;

        State.sessions.forEach(session => {
            const isActive = session.id === State.currentSessionId;
            // The Dark Blue active bubble styling (like Gemini)
            const activeClass = isActive 
                ? 'bg-blue-900/20 text-blue-500 border-blue-500/30' 
                : 'border-transparent text-[var(--text-main)] hover:bg-[var(--hover-bg)]';

            const btn = document.createElement('button');
            btn.className = `w-full text-left p-3 rounded-xl text-sm font-medium border transition-all truncate btn-press ${activeClass}`;
            btn.innerText = session.title;
            btn.onclick = () => this.loadSession(session.id);
            list.appendChild(btn);
        });
    }
};

/* ═══════════════════════════════════════════
   1. AUTHENTICATION & UI
═══════════════════════════════════════════ */
function setAuthMode(mode) {
  const signupFields = document.getElementById('signup-fields');
  const loginTab = document.getElementById('login-tab');
  const signupTab = document.getElementById('signup-tab');
  if (mode === 'signup') {
    if(signupFields) signupFields.classList.remove('hidden');
    if(signupTab) signupTab.className = "border-b-2 border-blue-500 py-2 text-sm font-semibold transition-all text-[var(--text-main)]";
    if(loginTab) loginTab.className = "border-b-2 border-transparent py-2 text-sm font-semibold text-[var(--text-muted)] transition-all hover:text-[var(--text-main)]";
  } else {
    if(signupFields) signupFields.classList.add('hidden');
    if(loginTab) loginTab.className = "border-b-2 border-blue-500 py-2 text-sm font-semibold transition-all text-[var(--text-main)]";
    if(signupTab) signupTab.className = "border-b-2 border-transparent py-2 text-sm font-semibold text-[var(--text-muted)] transition-all hover:text-[var(--text-main)]";
  }
}

function submitAuth() {
  const email = document.getElementById('auth-email')?.value;
  const nameEl = document.getElementById('auth-name');
  const name = (nameEl && nameEl.value) ? nameEl.value : (email ? email.split('@')[0] : 'Guest');
  
  if (!email) return alert("Email is required to access the system.");
  
  State.currentUser = { name, email };
  localStorage.setItem('lex_user', JSON.stringify(State.currentUser));
  
  const authScreen = document.getElementById('auth-screen');
  if (authScreen) {
      authScreen.style.opacity = '0';
      setTimeout(() => authScreen.style.display = 'none', 400); 
  }
  
  const nameDisplay = document.getElementById('user-display-name');
  if (nameDisplay) nameDisplay.innerText = name;
}

function togglePass() {
  const p = document.getElementById('auth-pass');
  if (p) p.type = p.type === 'password' ? 'text' : 'password';
}

function handleSignout() {
  localStorage.removeItem('lex_user');
  location.reload();
}

/* ═══════════════════════════════════════════
   2. SETTINGS & THEME LOGIC
═══════════════════════════════════════════ */
function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    const card = document.getElementById('settings-card');
    
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        // Trigger reflow for transition
        void modal.offsetWidth;
        modal.classList.remove('opacity-0');
        card.classList.remove('scale-95');
    } else {
        modal.classList.add('opacity-0');
        card.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const btn = document.getElementById('theme-btn');
    
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        btn.innerText = 'Dark Mode';
        localStorage.setItem('lex_theme', 'light');
    } else {
        html.classList.add('dark');
        btn.innerText = 'Light Mode';
        localStorage.setItem('lex_theme', 'dark');
    }
}

function clearAllData() {
    if(confirm("Are you sure? This will delete all chat history. This action cannot be undone.")) {
        localStorage.removeItem('lex_sessions');
        State.sessions = [];
        SessionManager.createNew();
        toggleSettings();
    }
}

// Load Saved Theme
(function loadTheme() {
    const savedTheme = localStorage.getItem('lex_theme');
    const html = document.documentElement;
    if (savedTheme === 'light') {
        html.classList.remove('dark');
        setTimeout(() => { if(document.getElementById('theme-btn')) document.getElementById('theme-btn').innerText = 'Dark Mode'; }, 100);
    }
})();

/* ═══════════════════════════════════════════
   3. API COMMUNICATION (Frontend -> Backend)
═══════════════════════════════════════════ */
const LexAI = {
  buildMessages: function(userQuery) {
    const messages = [];
    
    if (State.uploadedDocument) {
      messages.push({ role: 'user', content: `I uploaded a document: ${State.uploadedDocument.name}\n\nCONTENT:\n${State.uploadedDocument.content}` });
    }

    const session = SessionManager.getCurrentSession();
    if (session) {
        // Grab last 10 pairs of history for context
        const history = session.messages.slice(-20);
        messages.push(...history);
    }

    const isDeep = document.getElementById('think-toggle')?.checked || false;
    let finalQuery = userQuery;
    if (isDeep) finalQuery = `[DEEP ANALYSIS MODE]\n${userQuery}\nProvide your most thorough, multi-dimensional analysis.`;

    messages.push({ role: 'user', content: finalQuery });
    return messages;
  },

  call: async function(userQuery) {
    const messages = this.buildMessages(userQuery);

    try {
      const res = await fetch(CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages, system: SYSTEM_PROMPT })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      if (!data.reply) throw new Error('No response generated.');

      SessionManager.addMessage('assistant', String(data.reply));
      return String(data.reply); 

    } catch (err) {
      console.error('[LexAI] Error:', err.message);
      return `**System Notice:** ${err.message}\n\nPlease verify your connection and try again.`;
    }
  }
};

/* ═══════════════════════════════════════════
   4. DOCUMENT PROCESSOR
═══════════════════════════════════════════ */
// ... (Keeping exact same DocProcessor as before to save space)
const DocProcessor={process:async function(e){const t=e.name,n=e.type||"",r=(e.size/1048576).toFixed(2);let s="";try{if("application/pdf"===n||t.endsWith(".pdf"))s=await this.extractPDF(e);else s=await this.readText(e);return s.length>CONFIG.MAX_DOC_CHARS&&(s=s.substring(0,CONFIG.MAX_DOC_CHARS)+"\n[Document truncated]"),State.uploadedDocument={name:t,type:n,size:`${r}MB`,content:s},{success:!0,name:t,sizeMB:r,chars:s.length}}catch(e){return{success:!1,error:e.message}}},extractPDF:async function(e){if("undefined"!=typeof pdfjsLib){pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";const t=await e.arrayBuffer(),n=await pdfjsLib.getDocument({data:t}).promise;let r=`[PDF: ${e.name}]\n`;for(let e=1;e<=n.numPages;e++){const t=await n.getPage(e),s=await t.getTextContent();if(r+=s.items.map((e=>e.str)).join(" ")+"\n",r.length>CONFIG.MAX_DOC_CHARS)break}return r}return await this.readText(e)},readText:function(e){return new Promise(((t,n)=>{const r=new FileReader;r.onload=e=>t(e.target.result),r.onerror=()=>n(new Error("Could not read file")),r.readAsText(e)}))}};

/* ═══════════════════════════════════════════
   5. UI RENDERING & STREAMING
═══════════════════════════════════════════ */
// SVG Logo Helper
const LexSVG = `<svg class="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`;

async function processMessage() {
  if (State.isProcessing) return;

  const input = document.getElementById('user-query');
  if(!input) return;
  const query = input.value.trim();
  if (!query) return;

  State.isProcessing = true;
  document.getElementById('welcome-screen')?.classList.add('hidden');
  document.getElementById('chat-messages').classList.remove('hidden');

  appendBubble('user', query);
  SessionManager.addMessage('user', query);
  
  input.value = '';
  input.style.height = 'auto';

  const typingId = appendTypingIndicator();

  try {
    const reply = await LexAI.call(query);
    document.getElementById(typingId)?.remove();
    await streamText(reply);
  } catch (err) {
    document.getElementById(typingId)?.remove();
    appendBubble('ai', `⚠️ Error: ${err.message}.`);
  }

  State.isProcessing = false;
}

function streamText(fullText) {
  return new Promise(resolve => {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'flex justify-start w-full anim-fade-up';
    
    // Notice the LexSVG is locked in place now (static) next to the text
    div.innerHTML = `
      <div class="flex items-start gap-4 max-w-[95%] md:max-w-[85%] w-full">
         <div class="mt-4 flex-shrink-0">${LexSVG}</div>
         <div class="ai-bubble p-4 md:p-6 text-base w-full break-words shadow-sm">
            <div id="streaming-p" class="typing-cursor w-full"></div>
         </div>
      </div>`;
    box.appendChild(div);

    const el = document.getElementById('streaming-p');
    const textToStream = String(fullText);
    
    let i = 0;
    const chunkSize = 3; 

    const tick = setInterval(() => {
      if (i < textToStream.length) {
        i += chunkSize;
        let current = textToStream.substring(0, i);
        el.innerHTML = formatHTML(current) + '<span class="typing-cursor">|</span>';
      } else {
        clearInterval(tick);
        el.innerHTML = formatHTML(textToStream);
        el.classList.remove('typing-cursor');
        el.id = '';
        resolve();
      }
    }, CONFIG.STREAM_SPEED);
  });
}

function formatHTML(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^⚠️ \*\*(.*?)\*\*(.*)$/gm, '<div class="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-[var(--text-muted)] text-sm leading-relaxed flex items-start gap-3 w-full"><span class="text-xl leading-none flex-shrink-0">⚠️</span> <div><strong class="text-[var(--text-main)] font-semibold">$1</strong>$2</div></div>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--text-main)] font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-[var(--text-muted)]">$1</em>')
    .replace(/^### (.+)$/gm, '<h4 class="text-[var(--text-main)] font-medium text-sm mt-3 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="text-[var(--text-main)] font-semibold mt-4 mb-2 pb-1 border-b border-[var(--border-color)]">$1</h3>')
    .replace(/^\d+\. (.+)$/gm, '<div class="flex gap-2 my-1"><span class="text-[var(--text-muted)] flex-shrink-0 mt-0.5">$1.</span><span class="text-[var(--text-main)]">$2</span></div>')
    .replace(/^[-•] (.+)$/gm, '<div class="flex gap-2 my-1"><span class="text-[var(--text-muted)] flex-shrink-0">—</span><span class="text-[var(--text-main)]">$1</span></div>')
    .replace(/`([^`]+)`/g, '<code class="bg-[var(--bg-main)] text-blue-500 px-1.5 py-0.5 rounded text-xs font-mono border border-[var(--border-color)]">$1</code>')
    .replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
}

function appendBubble(role, text, skipAnimation = false) {
  const box = document.getElementById('chat-messages');
  if(!box) return;
  const div = document.createElement('div');
  const animClass = skipAnimation ? '' : 'anim-fade-up';
  
  if (role === 'user') {
    div.className = `flex justify-end w-full ${animClass}`;
    div.innerHTML = `<div class="max-w-[90%] md:max-w-[85%] user-bubble p-3 md:p-4 text-sm break-words shadow-sm"><p>${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p></div>`;
  } else {
    div.className = `flex justify-start w-full ${animClass}`;
    div.innerHTML = `
      <div class="flex items-start gap-4 max-w-[95%] md:max-w-[85%] w-full">
         <div class="mt-4 flex-shrink-0">${LexSVG}</div>
         <div class="ai-bubble p-4 md:p-6 text-base w-full break-words shadow-sm"><div>${formatHTML(String(text))}</div></div>
      </div>`;
  }
  
  box.appendChild(div);
  if (role === 'user' && !skipAnimation) box.scrollTop = box.scrollHeight;
}

function appendTypingIndicator() {
  const id = 'typing-' + Date.now();
  const box = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.id = id;
  div.className = 'flex justify-start w-full anim-fade-up';
  
  // Notice the ai-thinking-logo class causing it to spin/pulse
  div.innerHTML = `
      <div class="flex items-center gap-4 max-w-[95%] md:max-w-[85%] w-full">
         <div class="ai-thinking-logo flex-shrink-0">${LexSVG}</div>
      </div>`;
      
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return id;
}

/* ═══════════════════════════════════════════
   6. UTILITIES & INIT
═══════════════════════════════════════════ */
function triggerFileUpload() { document.getElementById('hidden-file-input')?.click(); }
function startNewChat() { SessionManager.createNew(); }

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full', 'hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        setTimeout(() => sidebar.classList.add('hidden'), 300);
    }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

function handleInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    processMessage();
  }
}

window.onload = () => {
  const saved = localStorage.getItem('lex_user');
  const authScreen = document.getElementById('auth-screen');
  
  if (!saved) {
    if (authScreen) authScreen.style.display = 'flex'; 
  } else {
    try {
      State.currentUser = JSON.parse(saved);
      if (authScreen) authScreen.style.display = 'none';
      const nameDisplay = document.getElementById('user-display-name');
      if (nameDisplay) nameDisplay.innerText = State.currentUser.name;
    } catch (e) {
      localStorage.removeItem('lex_user');
      if (authScreen) authScreen.style.display = 'flex';
    }
  }

  SessionManager.init(); // Boot up the history engine

  if (typeof pdfjsLib === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    document.head.appendChild(s);
  }
};
