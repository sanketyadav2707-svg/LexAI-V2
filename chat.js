'use strict';

/* ═══════════════════════════════════════════
   CONFIGURATION & SYSTEM PROMPT
═══════════════════════════════════════════ */
const CONFIG = {
  API_ENDPOINT: '/api/chat',   
  MAX_DOC_CHARS: 150000, // Safe limit to prevent Vercel 4.5MB Payload Crash
  STREAM_SPEED: 15,            
};

const SYSTEM_PROMPT = `You are Lex, an elite AI advisor. You are the smartest, most experienced mind in the room, yet you communicate with a calm, refined, and effortlessly attractive demeanor. You never sound robotic, panicked, or overly formal. You speak like a highly sought-after consultant who has seen it all and knows exactly how to guide the user.

CRITICAL PRINCIPLES:
1. Be exceptionally calm, confident, and direct.
2. Provide deeply insightful, highly accurate answers to ANY question (easy, medium, or the most complex problems in the world).
3. Structure your answers beautifully using markdown.
4. If a problem is highly complex, break it down step-by-step with effortless clarity.
5. Build rapport. You are a trusted, premium advisor.
6. MULTI-FILE & VISION ANALYSIS: You are capable of reading multiple documents and analyzing images/photos at once. Cross-reference them intelligently and synthesize the data exactly as the user commands.

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
  uploadedDocuments: [], // Array for up to 6 files/photos
  isProcessing: false,
};

function generateId() { return Math.random().toString(36).substring(2, 15); }

const SessionManager = {
    init: function() {
        const saved = localStorage.getItem('lex_sessions');
        if (saved) State.sessions = JSON.parse(saved);
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
        if (!State.currentSessionId) {
            const newSession = {
                id: generateId(),
                title: content.substring(0, 30).replace(/\[IMAGE_DATA.*?\n/g, '') + '...',
                messages: [],
                date: new Date().toISOString(),
                isPinned: false
            };
            State.sessions.unshift(newSession); 
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
        document.getElementById('welcome-screen')?.classList.add('hidden');
        const chatBox = document.getElementById('chat-messages');
        chatBox.classList.remove('hidden');
        chatBox.innerHTML = ''; 
        session.messages.forEach(msg => appendBubble(msg.role, msg.content, true));
        if(window.innerWidth < 768) toggleSidebar(); 
        this.renderHistory();
    },
    createNew: function() {
        State.currentSessionId = null;
        State.uploadedDocuments = [];
        renderFileChips();
        document.getElementById('chat-messages').innerHTML = '';
        document.getElementById('chat-messages').classList.add('hidden');
        document.getElementById('welcome-screen')?.classList.remove('hidden');
        if(window.innerWidth < 768) toggleSidebar();
        this.renderHistory();
    },
    togglePin: function(id) {
        const s = State.sessions.find(x => x.id === id);
        if(s) { s.isPinned = !s.isPinned; this.saveAll(); }
        closeAllMenus();
    },
    rename: function(id) {
        const s = State.sessions.find(x => x.id === id);
        if(s) {
            const newName = prompt("Rename chat:", s.title);
            if(newName && newName.trim()) { s.title = newName.trim(); this.saveAll(); }
        }
        closeAllMenus();
    },
    deleteChat: function(id) {
        if(confirm("Delete this conversation?")) {
            State.sessions = State.sessions.filter(x => x.id !== id);
            if(State.currentSessionId === id) this.createNew();
            this.saveAll();
        }
        closeAllMenus();
    },
    share: function(id) {
        const s = State.sessions.find(x => x.id === id);
        if(s) {
            // Clean out massive base64 image strings before sharing
            const text = s.messages.map(m => `${m.role.toUpperCase()}:\n${m.content.replace(/\[IMAGE_DATA.*?\n/g, '[Attached Photo]\n')}`).join('\n\n---\n\n');
            navigator.clipboard.writeText(text).then(() => alert('Chat copied to clipboard!'));
        }
        closeAllMenus();
    },
    renderHistory: function() {
        const list = document.getElementById('history-list');
        if (!list) return;
        list.innerHTML = `<p class="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold mb-3 px-2">Recents</p>`;
        const sortedSessions = [...State.sessions].sort((a, b) => {
            if (a.isPinned === b.isPinned) return new Date(b.date) - new Date(a.date);
            return a.isPinned ? -1 : 1;
        });
        sortedSessions.forEach(session => {
            const isActive = session.id === State.currentSessionId;
            const activeClass = isActive 
                ? 'bg-blue-900/20 text-blue-500 border-blue-500/30' 
                : 'border-transparent text-[var(--text-main)] hover:bg-[var(--hover-bg)]';
            const pinIcon = session.isPinned ? '📌 ' : '';
            const cleanTitle = session.title.replace(/\[IMAGE_DATA.*?\n/g, '');

            const itemHtml = `
            <div class="relative group flex items-center mb-1 w-full">
                <button onclick="SessionManager.loadSession('${session.id}')" class="w-full text-left p-3 pr-12 rounded-xl text-sm font-medium border transition-all truncate btn-press ${activeClass}">
                    ${pinIcon}${cleanTitle}
                </button>
                <button onclick="toggleContextMenu(event, '${session.id}')" class="absolute right-1 top-1/2 -translate-y-1/2 z-20 p-3 text-[var(--text-muted)] opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:text-[var(--text-main)] rounded-lg">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="4" r="1"/><circle cx="8" cy="8" r="1"/><circle cx="8" cy="12" r="1"/></svg>
                </button>
            </div>`;
            list.insertAdjacentHTML('beforeend', itemHtml);
        });
    }
};

/* ═══════════════════════════════════════════
   1. AUTHENTICATION & UI LOGIC
═══════════════════════════════════════════ */
function openAuthScreen() {
    const screen = document.getElementById('auth-screen');
    screen.classList.remove('hidden');
    void screen.offsetWidth; 
    screen.classList.remove('opacity-0');
}
function closeAuthScreen() {
    const screen = document.getElementById('auth-screen');
    screen.classList.add('opacity-0');
    setTimeout(() => screen.classList.add('hidden'), 400);
}
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
  const name = (nameEl && nameEl.value) ? nameEl.value : (email ? email.split('@')[0] : 'User');
  if (!email) return alert("Email is required.");
  State.currentUser = { name, email };
  localStorage.setItem('lex_user', JSON.stringify(State.currentUser));
  closeAuthScreen();
  renderAppStates();
}
function handleSignout() {
  localStorage.removeItem('lex_user');
  State.currentUser = null;
  renderAppStates();
}
function togglePass() {
  const p = document.getElementById('auth-pass');
  if (p) p.type = p.type === 'password' ? 'text' : 'password';
}
function renderAppStates() {
    const welcomeContainer = document.getElementById('welcome-text-container');
    const svgIcon = `<svg class="w-16 h-16 mb-6 text-blue-500 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`;
    if (State.currentUser) {
        welcomeContainer.innerHTML = `${svgIcon}<h1 class="text-3xl md:text-5xl font-bold mb-3 tracking-tight">Welcome, <span class="text-blue-500">${State.currentUser.name}</span>.</h1><p class="text-[var(--text-muted)] text-base md:text-xl max-w-md mx-auto anim-fade-up anim-delay-1">Deep analysis and executive intelligence at your fingertips.</p>`;
    } else {
        welcomeContainer.innerHTML = `${svgIcon}<h1 class="text-3xl md:text-5xl font-bold mb-3 tracking-tight">How can I help you today?</h1><p class="text-[var(--text-muted)] text-base md:text-xl max-w-md mx-auto anim-fade-up anim-delay-1">Start chatting instantly, or log in to sync your sessions.</p>`;
    }
    const sidebarFooter = document.getElementById('sidebar-footer');
    const settingsBtn = `<button onclick="toggleSettings()" class="btn-press w-full text-left text-sm font-medium hover-effect p-2.5 rounded-lg flex items-center gap-3 transition-colors"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> Settings</button>`;
    if (State.currentUser) {
        sidebarFooter.innerHTML = settingsBtn + `<div class="px-2 py-3 mt-2 border-t border-[var(--border-color)] flex justify-between items-center"><div class="flex items-center gap-2 overflow-hidden"><div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">${State.currentUser.name.charAt(0).toUpperCase()}</div><span class="text-sm font-semibold truncate">${State.currentUser.name}</span></div><button onclick="handleSignout()" class="text-[var(--text-muted)] hover:text-red-500 transition-colors p-2"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg></button></div>`;
    } else {
        sidebarFooter.innerHTML = settingsBtn + `<button onclick="openAuthScreen()" class="btn-press mt-2 w-full py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-all text-sm font-semibold flex items-center justify-center gap-2">Sign Up / Log In</button>`;
    }
}

/* ═══════════════════════════════════════════
   2. GLOBAL CONTEXT MENU & UI HELPERS
═══════════════════════════════════════════ */
let currentContextMenuId = null;

function toggleContextMenu(event, id) {
    event.stopPropagation();
    const menu = document.getElementById('global-context-menu');
    if (currentContextMenuId === id && !menu.classList.contains('hidden')) { closeAllMenus(); return; }
    closeAllMenus();
    currentContextMenuId = id;
    const session = State.sessions.find(s => s.id === id);
    if (!session) return;
    
    const pinText = session.isPinned ? 'Unpin' : 'Pin';
    const buttonRect = event.currentTarget.getBoundingClientRect();

    menu.innerHTML = `<div class="hover:bg-[var(--hover-bg)] p-3 cursor-pointer transition-colors border-b border-[var(--border-color)]" onclick="event.stopPropagation(); SessionManager.share('${id}')">Share</div><div class="hover:bg-[var(--hover-bg)] p-3 cursor-pointer transition-colors border-b border-[var(--border-color)]" onclick="event.stopPropagation(); SessionManager.rename('${id}')">Rename</div><div class="hover:bg-[var(--hover-bg)] p-3 cursor-pointer transition-colors border-b border-[var(--border-color)]" onclick="event.stopPropagation(); SessionManager.togglePin('${id}')">${pinText}</div><div class="hover:bg-red-500/10 text-red-500 p-3 cursor-pointer transition-colors" onclick="event.stopPropagation(); SessionManager.deleteChat('${id}')">Delete</div>`;
    menu.classList.remove('hidden');

    const menuRect = menu.getBoundingClientRect();
    let topPos = buttonRect.bottom + 5;
    let leftPos = buttonRect.right - menuRect.width; 
    if (topPos + menuRect.height > window.innerHeight) topPos = buttonRect.top - menuRect.height - 5; 
    if (leftPos < 0) leftPos = 10; 
    menu.style.top = `${topPos}px`;
    menu.style.left = `${leftPos}px`;
}
function closeAllMenus() {
    const menu = document.getElementById('global-context-menu');
    if (menu) menu.classList.add('hidden');
    currentContextMenuId = null;
}
document.addEventListener('click', closeAllMenus); 

function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    const card = document.getElementById('settings-card');
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
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
    if(confirm("Are you sure? This will delete all chat history.")) {
        localStorage.removeItem('lex_sessions');
        State.sessions = [];
        SessionManager.createNew();
        toggleSettings();
    }
}
(function loadTheme() {
    const savedTheme = localStorage.getItem('lex_theme');
    const html = document.documentElement;
    if (savedTheme === 'light') {
        html.classList.remove('dark');
        setTimeout(() => { if(document.getElementById('theme-btn')) document.getElementById('theme-btn').innerText = 'Dark Mode'; }, 100);
    }
})();

/* ═══════════════════════════════════════════
   3. MULTI-FILE & IMAGE PROCESSOR
═══════════════════════════════════════════ */
const DocProcessor = {
    process: async function(file) {
        const name = file.name;
        const type = file.type || '';
        const sizeMB = (file.size / 1048576).toFixed(2);
        let content = '';

        try {
            // Encode Photos as Base64 for Gemini
            if (type.startsWith('image/')) {
                const base64 = await this.readAsBase64(file);
                content = `[IMAGE_DATA:${type}]${base64}\n`;
            } 
            // Extract PDFs
            else if (type === 'application/pdf' || name.endsWith('.pdf')) {
                content = await this.extractPDF(file);
            } 
            // Read Standard Text/Code files
            else {
                content = await this.readText(file);
            }

            // Safe truncation to prevent 4.5MB Payload Crash
            if (content.length > CONFIG.MAX_DOC_CHARS && !type.startsWith('image/')) {
                content = content.substring(0, CONFIG.MAX_DOC_CHARS) + "\n\n[DOCUMENT TRUNCATED: Server memory limit reached.]";
            }
            return { success: true, name, sizeMB, content };
            
        } catch (err) {
            return { success: false, error: err.message };
        }
    },
    extractPDF: async function(file) {
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            const ab = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
            let text = `[PDF: ${file.name}]\n`;
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const ct = await page.getTextContent();
                text += ct.items.map(x => x.str).join(' ') + '\n';
                if (text.length > CONFIG.MAX_DOC_CHARS) break; // Optimization: Stop parsing if limit reached
            }
            return text;
        }
        return await this.readText(file);
    },
    readAsBase64: function(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = e => resolve(e.target.result.split(',')[1]);
            r.onerror = () => reject(new Error('Could not read image'));
            r.readAsDataURL(file);
        });
    },
    readText: function(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = e => resolve(e.target.result);
            r.onerror = () => reject(new Error('Could not read file'));
            r.readAsText(file);
        });
    }
};

function triggerFileUpload() { document.getElementById('hidden-file-input')?.click(); }

async function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (State.uploadedDocuments.length + files.length > 6) {
        alert("Maximum 6 files can be attached at once.");
        return;
    }

    const typingId = appendTypingIndicator();

    for (const file of files) {
        // Warning if file is dangerously large for free servers
        if (file.size > 5 * 1048576) {
             alert(`Warning: ${file.name} is very large. Processing may take longer than 60 seconds.`);
        }
        const result = await DocProcessor.process(file);
        if (result.success) {
            State.uploadedDocuments.push(result);
        } else {
            alert(`Failed to read ${file.name}`);
        }
    }

    document.getElementById(typingId)?.remove();
    renderFileChips();
    e.target.value = ''; 
}

function removeFile(index) {
    State.uploadedDocuments.splice(index, 1);
    renderFileChips();
}

function renderFileChips() {
    const container = document.getElementById('file-staging-area');
    if (!container) return;
    container.innerHTML = '';
    
    State.uploadedDocuments.forEach((doc, i) => {
        container.innerHTML += `
        <div class="bg-blue-900/20 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 animate-fade-up">
            <span class="truncate max-w-[120px] md:max-w-[200px] font-medium">${doc.name}</span>
            <button onclick="removeFile(${i})" class="hover:text-red-400 font-bold ml-1 transition-colors">✕</button>
        </div>`;
    });
}

/* ═══════════════════════════════════════════
   4. API COMMUNICATION (Frontend -> Backend)
═══════════════════════════════════════════ */
const LexAI = {
  buildMessages: function(userQuery) {
    const messages = [];
    
    // Inject all attached files seamlessly
    if (State.uploadedDocuments.length > 0) {
        let docContext = "I have attached the following documents/images for analysis:\n\n";
        State.uploadedDocuments.forEach((doc, i) => {
            docContext += `--- ATTACHMENT ${i+1}: ${doc.name} ---\n${doc.content}\n\n`;
        });
        messages.push({ role: 'user', content: docContext });
    }

    const session = SessionManager.getCurrentSession();
    if (session) {
        const history = session.messages.slice(-20);
        messages.push(...history);
    }

    const isDeep = document.getElementById('think-toggle')?.checked || false;
    let finalQuery = userQuery;
    if (isDeep) finalQuery = `[DEEP ANALYSIS MODE]\n${userQuery}\nProvide your most thorough, multi-dimensional analysis.`;

    if (finalQuery.trim()) {
        messages.push({ role: 'user', content: finalQuery });
    }
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
   5. UI RENDERING & STREAMING
═══════════════════════════════════════════ */
const LexSVG = `<svg class="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`;

async function processMessage() {
  if (State.isProcessing) return;

  const input = document.getElementById('user-query');
  if(!input) return;
  const query = input.value.trim();
  
  if (!query && State.uploadedDocuments.length === 0) return; 

  State.isProcessing = true;
  document.getElementById('welcome-screen')?.classList.add('hidden');
  document.getElementById('chat-messages').classList.remove('hidden');

  const displayQuery = query || `[Uploaded ${State.uploadedDocuments.length} attachment(s) for analysis]`;
  appendBubble('user', displayQuery);
  SessionManager.addMessage('user', displayQuery);
  
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

  State.uploadedDocuments = [];
  renderFileChips();
  State.isProcessing = false;
}

function streamText(fullText) {
  return new Promise(resolve => {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'flex justify-start w-full anim-fade-up';
    
    div.innerHTML = `<div class="flex items-start gap-4 max-w-[95%] md:max-w-[85%] w-full"><div class="mt-4 flex-shrink-0">${LexSVG}</div><div class="ai-bubble p-4 md:p-6 text-base w-full break-words shadow-sm"><div id="streaming-p" class="typing-cursor w-full"></div></div></div>`;
    box.appendChild(div);

    const el = document.getElementById('streaming-p');
    const textToStream = String(fullText);
    let i = 0; const chunkSize = 3; 

    const tick = setInterval(() => {
      if (i < textToStream.length) {
        i += chunkSize;
        el.innerHTML = formatHTML(textToStream.substring(0, i)) + '<span class="typing-cursor">|</span>';
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
  
  // Hide massive image strings from the UI Chat Bubble
  const cleanText = text.replace(/\[IMAGE_DATA.*?\n/g, '[Attached Photo]\n');

  const div = document.createElement('div');
  const animClass = skipAnimation ? '' : 'anim-fade-up';
  
  if (role === 'user') {
    div.className = `flex justify-end w-full ${animClass}`;
    div.innerHTML = `<div class="max-w-[90%] md:max-w-[85%] user-bubble p-3 md:p-4 text-sm break-words shadow-sm"><p>${cleanText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p></div>`;
  } else {
    div.className = `flex justify-start w-full ${animClass}`;
    div.innerHTML = `<div class="flex items-start gap-4 max-w-[95%] md:max-w-[85%] w-full"><div class="mt-4 flex-shrink-0">${LexSVG}</div><div class="ai-bubble p-4 md:p-6 text-base w-full break-words shadow-sm"><div>${formatHTML(String(cleanText))}</div></div></div>`;
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
  div.innerHTML = `<div class="flex items-center gap-4 max-w-[95%] md:max-w-[85%] w-full"><div class="ai-thinking-logo flex-shrink-0">${LexSVG}</div></div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return id;
}

/* ═══════════════════════════════════════════
   6. UTILITIES & INIT
═══════════════════════════════════════════ */
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

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full', 'hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        setTimeout(() => sidebar.classList.add('hidden'), 300);
    }
    closeAllMenus();
}

window.onload = () => {
  const saved = localStorage.getItem('lex_user');
  if (saved) {
    try { State.currentUser = JSON.parse(saved); } 
    catch (e) { localStorage.removeItem('lex_user'); }
  }

  renderAppStates();
  SessionManager.init(); 

  if (typeof pdfjsLib === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    document.head.appendChild(s);
  }
};
