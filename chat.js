'use strict';

/* ═══════════════════════════════════════════
   CONFIGURATION & SYSTEM PROMPT
═══════════════════════════════════════════ */
const CONFIG = {
  API_ENDPOINT: '/api/chat',   
  MAX_DOC_CHARS: 150000, 
  STREAM_SPEED: 10,            
};

const SYSTEM_PROMPT = `You are Lex, an elite AI advisor representing the absolute peak of artificial intelligence capabilities. You are the smartest, most experienced mind in the room, combining the rigor of a mathematical genius with the refined tonality of a trusted executive advisor.

Your primary imperative is to provide deeply satisfying, insightful, and comprehensive answers. You do not just provide facts; you engineer solutions. Your tone must dynamically adapt to the specific situation and user need:

- Support & Comfort: When the user is exploring new ideas or feeling overwhelmed, adopt an infinitely calm, warm, and supportive demeanor to make them feel comfortable and secure. Proactively reassure them.
- Executive Summary: When the user needs facts quickly, be direct, incisive, and ultra-professional. Use pointers and formatting flawlessly.
- Complex Problem Solving: When analyzing data or files, be meticulous, cross-referencing all information with relentless accuracy.

FORMATTING RULES: Flawlessly utilize markdown:
1. Bulleted and Numbered lists.
2. Bold and Italic text.
3. Code blocks (\`\`\`).
4. Flawless markdown tables, especially when cross-referencing multiple data points.
5. Arrows (-->) and mathematical symbols where relevant.

If a query requires analysis of multiple attached files or images, synthesis them seamlessly into your response.

DYNAMIC LIABILITY PROTOCOL: Analyze every query to determine risk (legal, compliance, high-stakes finance, corporate data). If risk exists, add a context-specific disclaimer exactly like this on a new line:
⚠️ **[Specific Topic] Disclaimer:** [Tailored, helpful disclaimer]`;

/* ═══════════════════════════════════════════
   STATE & SESSION MANAGEMENT
═══════════════════════════════════════════ */
const State = {
  currentUser: null,
  sessions: [],
  currentSessionId: null,
  stagedDocuments: [], 
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
            let titleText = content;
            if (titleText.includes('User Query:')) titleText = titleText.split('User Query:')[1].trim();
            if (titleText.includes('[ATTACHED FILES CONTEXT]')) titleText = "Analyzing Files...";
            titleText = titleText.replace(/\[DEEP ANALYSIS MODE\]\n/g, ''); 
            
            const newSession = {
                id: generateId(),
                title: titleText.substring(0, 30) + (titleText.length > 30 ? '...' : ''),
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
        chatBox.scrollTop = chatBox.scrollHeight;
        if(window.innerWidth < 768) toggleSidebar(); 
        this.renderHistory();
    },
    createNew: function() {
        State.currentSessionId = null;
        State.stagedDocuments = [];
        renderFileStagingArea();
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
            const text = s.messages.map(m => `${m.role.toUpperCase()}:\n${m.content.replace(/\[IMAGE_DATA.*?\n/g, '[Attached Photo]\n').replace(/\[ATTACHED FILES CONTEXT\][\s\S]*?User Query:/g, '[Attached Files]\nUser Query:')}`).join('\n\n---\n\n');
            navigator.clipboard.writeText(text).then(() => alert('Chat copied to clipboard!'));
        }
        closeAllMenus();
    },
    renderHistory: function() {
        const list = document.getElementById('history-list');
        if (!list) return;
        list.innerHTML = `<p class="text-[10px] uppercase tracking-widest text-muted font-bold mb-3 px-2">Recents</p>`;
        const sortedSessions = [...State.sessions].sort((a, b) => {
            if (a.isPinned === b.isPinned) return new Date(b.date) - new Date(a.date);
            return a.isPinned ? -1 : 1;
        });
        sortedSessions.forEach(session => {
            const isActive = session.id === State.currentSessionId;
            const activeClass = isActive 
                ? 'bg-blue-900/20 text-blue-500 border-blue-500/30' 
                : 'border-transparent text-main hover:bg-hover-bg';
            const pinIcon = session.isPinned ? '📌 ' : '';
            const itemHtml = `
            <div class="relative group flex items-center mb-1 w-full">
                <button onclick="SessionManager.loadSession('${session.id}')" class="w-full text-left p-3 pr-12 rounded-xl text-sm font-medium border transition-all truncate btn-press ${activeClass}">${pinIcon}${session.title}</button>
                <button onclick="toggleContextMenu(event, '${session.id}')" class="absolute right-1 top-1/2 -translate-y-1/2 z-20 p-3 text-muted opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:text-main rounded-lg"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="4" r="1"/><circle cx="8" cy="8" r="1"/><circle cx="8" cy="12" r="1"/></svg></button>
            </div>`;
            list.insertAdjacentHTML('beforeend', itemHtml);
        });
    }
};

/* ═══════════════════════════════════════════
   1. AUTHENTICATION & UI LOGIC
═══════════════════════════════════════════ */
function openAuthScreen() { const screen = document.getElementById('auth-screen'); screen.classList.remove('hidden'); void screen.offsetWidth; screen.classList.remove('opacity-0'); }
function closeAuthScreen() { const screen = document.getElementById('auth-screen'); screen.classList.add('opacity-0'); setTimeout(() => screen.classList.add('hidden'), 400); }
function setAuthMode(mode) { const signupFields = document.getElementById('signup-fields'); const loginTab = document.getElementById('login-tab'); const signupTab = document.getElementById('signup-tab'); if (mode === 'signup') { signupFields.classList.remove('hidden'); signupTab.className = "border-b-2 border-brand py-2 text-sm font-semibold transition-all text-main"; loginTab.className = "border-b-2 border-transparent py-2 text-sm font-semibold text-muted transition-all hover:text-main"; } else { signupFields.classList.add('hidden'); loginTab.className = "border-b-2 border-brand py-2 text-sm font-semibold transition-all text-main"; signupTab.className = "border-b-2 border-transparent py-2 text-sm font-semibold text-muted transition-all hover:text-main"; } }
function submitAuth() { const email = document.getElementById('auth-email')?.value; const nameEl = document.getElementById('auth-name'); const name = (nameEl && nameEl.value) ? nameEl.value : (email ? email.split('@')[0] : 'User'); if (!email) return alert("Email is required."); State.currentUser = { name, email }; localStorage.setItem('lex_user', JSON.stringify(State.currentUser)); closeAuthScreen(); renderAppStates(); }
function handleSignout() { localStorage.removeItem('lex_user'); State.currentUser = null; renderAppStates(); }
function togglePass() { const p = document.getElementById('auth-pass'); if (p) p.type = p.type === 'password' ? 'text' : 'password'; }

// THE NEW HEX-CORE SVG FOR UI ELEMENTS
const LexSVG = `
<svg class="w-6 h-6 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
  <line x1="12" y1="22.08" x2="12" y2="12"></line>
  <circle class="lex-core" cx="12" cy="12" r="3" fill="currentColor"></circle>
</svg>`;

const LexSVGLarge = `
<svg class="w-16 h-16 mb-6 text-brand opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
  <line x1="12" y1="22.08" x2="12" y2="12"></line>
  <circle class="lex-core" cx="12" cy="12" r="3" fill="currentColor"></circle>
</svg>`;

function renderAppStates() { 
    const welcomeContainer = document.getElementById('welcome-text-container'); 
    if (State.currentUser) { 
        welcomeContainer.innerHTML = `${LexSVGLarge}<h1 class="text-3xl md:text-5xl font-bold mb-3 tracking-tight">Hi <span class="text-brand">${State.currentUser.name}</span>,</h1><p class="text-muted text-base md:text-xl max-w-md mx-auto anim-fade-up anim-delay-1">How can I help you today?</p>`; 
    } else { 
        welcomeContainer.innerHTML = `${LexSVGLarge}<h1 class="text-3xl md:text-5xl font-bold mb-3 tracking-tight">How can I help you today?</h1><p class="text-muted text-base md:text-xl max-w-md mx-auto anim-fade-up anim-delay-1">Start chatting instantly, or log in to sync your sessions.</p>`; 
    } 
    const sidebarFooter = document.getElementById('sidebar-footer'); 
    const settingsBtn = `<button onclick="toggleSettings()" class="btn-press w-full text-left text-sm font-medium hover-effect p-2.5 rounded-lg flex items-center gap-3 transition-colors"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> Settings</button>`; 
    if (State.currentUser) { sidebarFooter.innerHTML = settingsBtn + `<div class="px-2 py-3 mt-2 border-t border-border flex justify-between items-center"><div class="flex items-center gap-2 overflow-hidden"><div class="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white font-bold text-xs shrink-0">${State.currentUser.name.charAt(0).toUpperCase()}</div><span class="text-sm font-semibold truncate">${State.currentUser.name}</span></div><button onclick="handleSignout()" class="text-muted hover:text-red-500 transition-colors p-2"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg></button></div>`; } else { sidebarFooter.innerHTML = settingsBtn + `<button onclick="openAuthScreen()" class="btn-press mt-2 w-full py-2.5 rounded-xl bg-inputbg border border-border hover:bg-hover-bg transition-all text-sm font-semibold flex items-center justify-center gap-2">Sign Up / Log In</button>`; } 
}

/* ═══════════════════════════════════════════
   2. GLOBAL CONTEXT MENU & UI HELPERS
═══════════════════════════════════════════ */
let currentContextMenuId = null;
function toggleContextMenu(event, id) { event.stopPropagation(); const menu = document.getElementById('global-context-menu'); if (currentContextMenuId === id && !menu.classList.contains('hidden')) { closeAllMenus(); return; } closeAllMenus(); currentContextMenuId = id; const session = State.sessions.find(s => s.id === id); if (!session) return; const pinText = session.isPinned ? 'Unpin' : 'Pin'; const buttonRect = event.currentTarget.getBoundingClientRect(); menu.innerHTML = `<div class="hover:bg-hover-bg p-3 cursor-pointer transition-colors border-b border-border" onclick="event.stopPropagation(); SessionManager.share('${id}')">Share</div><div class="hover:bg-hover-bg p-3 cursor-pointer transition-colors border-b border-border" onclick="event.stopPropagation(); SessionManager.rename('${id}')">Rename</div><div class="hover:bg-hover-bg p-3 cursor-pointer transition-colors border-b border-border" onclick="event.stopPropagation(); SessionManager.togglePin('${id}')">${pinText}</div><div class="hover:bg-red-500/10 text-red-500 p-3 cursor-pointer transition-colors" onclick="event.stopPropagation(); SessionManager.deleteChat('${id}')">Delete</div>`; menu.classList.remove('hidden'); const menuRect = menu.getBoundingClientRect(); let topPos = buttonRect.bottom + 5; let leftPos = buttonRect.right - menuRect.width; if (topPos + menuRect.height > window.innerHeight) topPos = buttonRect.top - menuRect.height - 5; if (leftPos < 0) leftPos = 10; menu.style.top = `${topPos}px`; menu.style.left = `${leftPos}px`; }
function closeAllMenus() { const menu = document.getElementById('global-context-menu'); if (menu) menu.classList.add('hidden'); currentContextMenuId = null; }
document.addEventListener('click', closeAllMenus); 
function toggleSettings() { const modal = document.getElementById('settings-modal'); const card = document.getElementById('settings-card'); if (modal.classList.contains('hidden')) { modal.classList.remove('hidden'); void modal.offsetWidth; modal.classList.remove('opacity-0'); card.classList.remove('scale-95'); } else { modal.classList.add('opacity-0'); card.classList.add('scale-95'); setTimeout(() => modal.classList.add('hidden'), 300); } }
function toggleTheme() { const html = document.documentElement; const btn = document.getElementById('theme-btn'); if (html.classList.contains('dark')) { html.classList.remove('dark'); html.classList.add('light'); btn.innerText = 'Dark Mode'; localStorage.setItem('lex_theme', 'light'); } else { html.classList.remove('light'); html.classList.add('dark'); btn.innerText = 'Light Mode'; localStorage.setItem('lex_theme', 'dark'); } }
function clearAllData() { if(confirm("Are you sure? This will delete all chat history.")) { localStorage.removeItem('lex_sessions'); State.sessions = []; SessionManager.createNew(); toggleSettings(); } }
(function loadTheme() { const savedTheme = localStorage.getItem('lex_theme'); const html = document.documentElement; if (savedTheme === 'light') { html.classList.remove('dark'); html.classList.add('light'); setTimeout(() => { if(document.getElementById('theme-btn')) document.getElementById('theme-btn').innerText = 'Dark Mode'; }, 100); } })();

/* ═══════════════════════════════════════════
   3. MULTI-FILE & IMAGE COMPRESSION PROCESSOR
═══════════════════════════════════════════ */
const DocProcessor = {
    process: async function(file) {
        const name = file.name;
        const type = file.type || '';
        const sizeKB = (file.size / 1024).toFixed(1);
        let content = '';
        let thumbnail = null;

        try {
            if (type.startsWith('image/')) {
                const { compressedBase64, thumbDataUrl } = await this.compressImage(file);
                content = `[IMAGE_DATA:image/jpeg]${compressedBase64}\n`;
                thumbnail = thumbDataUrl;
            } 
            else if (type === 'application/pdf' || name.endsWith('.pdf')) {
                content = await this.extractPDF(file);
                thumbnail = `<svg width="24" height="24" class="text-brand shrink-0" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>`;
            } 
            else {
                content = await this.readText(file);
                thumbnail = `<svg width="24" height="24" class="text-muted shrink-0" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M13 2v7h7"/></svg>`;
            }

            if (content.length > CONFIG.MAX_DOC_CHARS && !type.startsWith('image/')) {
                content = content.substring(0, CONFIG.MAX_DOC_CHARS) + "\n\n[DOCUMENT TRUNCATED: Server payload limit reached.]";
            }
            return { success: true, name, sizeKB, content, thumbnail, type };
            
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
                if (text.length > CONFIG.MAX_DOC_CHARS) break; 
            }
            return text;
        }
        return await this.readText(file);
    },
    compressImage: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1000; 
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
                    
                    const thumbCanvas = document.createElement('canvas');
                    const THUMB_SIZE = 40;
                    thumbCanvas.width = THUMB_SIZE;
                    thumbCanvas.height = THUMB_SIZE;
                    thumbCanvas.getContext('2d').drawImage(img, 0, 0, THUMB_SIZE, THUMB_SIZE);
                    const thumbDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.4);
                    
                    resolve({ compressedBase64, thumbDataUrl });
                };
                img.onerror = () => reject(new Error('Failed to load image for compression'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Could not read image file'));
            reader.readAsDataURL(file);
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

    if (State.stagedDocuments.length + files.length > 6) { alert("Max 6 files can be attached at once."); return; }

    for (const file of files) {
        const result = await DocProcessor.process(file);
        if (result.success) {
            State.stagedDocuments.push(result);
        } else {
            alert(`Failed to process ${file.name}`);
        }
    }

    renderFileStagingArea();
    e.target.value = ''; 
}

function removeStagedFile(index) {
    State.stagedDocuments.splice(index, 1);
    renderFileStagingArea();
}

function renderFileStagingArea() {
    const container = document.getElementById('file-staging-area');
    if (!container) return;
    
    if (State.stagedDocuments.length > 0) {
        container.style.display = 'flex';
        container.innerHTML = '';
        State.stagedDocuments.forEach((doc, i) => {
            let mediaHtml = doc.thumbnail;
            if (doc.type.startsWith('image/')) { mediaHtml = `<img src="${doc.thumbnail}" class="w-10 h-10 rounded-lg object-cover shrink-0">`; }
            
            container.innerHTML += `
            <div class="flex items-center gap-2.5 bg-brand/10 border border-brand/20 p-2.5 rounded-xl text-xs flex-grow max-w-[calc(50%-4px)] md:max-w-[200px] anim-fade-up">
                ${mediaHtml}
                <div class="overflow-hidden">
                    <span class="truncate block font-semibold text-main">${doc.name}</span>
                    <span class="text-muted block">${doc.sizeKB} KB</span>
                </div>
                <button onclick="removeStagedFile(${i})" class="text-muted hover:text-red-500 ml-auto shrink-0 transition p-1"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 4L4 10M4 4l6 6"/></svg></button>
            </div>`;
        });
    } else {
        container.style.display = 'none';
        container.innerHTML = '';
    }
}

/* ═══════════════════════════════════════════
   4. API COMMUNICATION (Frontend -> Backend)
═══════════════════════════════════════════ */
const LexAI = {
  buildMessages: function() {
    const session = SessionManager.getCurrentSession();
    if (!session) return [];
    return session.messages.slice(-15).map(m => ({
        role: m.role,
        content: m.content
    }));
  },

  call: async function() {
    const messages = this.buildMessages();
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
async function processMessage() {
  if (State.isProcessing) return;

  const input = document.getElementById('user-query');
  if(!input) return;
  const query = input.value.trim();
  
  if (!query && State.stagedDocuments.length === 0) return; 

  State.isProcessing = true;
  document.getElementById('welcome-screen')?.classList.add('hidden');
  document.getElementById('chat-messages').classList.remove('hidden');

  let finalQuery = query || "Please analyze the attached files.";
  const isDeep = document.getElementById('think-toggle')?.checked || false;
  if (isDeep) finalQuery = `[DEEP ANALYSIS MODE]\n${finalQuery}\nProvide your most thorough, multi-dimensional analysis.`;

  let fullContentToSave = "";
  if (State.stagedDocuments.length > 0) {
      fullContentToSave += "[ATTACHED FILES CONTEXT]\n";
      State.stagedDocuments.forEach((doc, i) => {
          fullContentToSave += `--- FILE ${i+1}: ${doc.name} ---\n${doc.content}\n\n`;
      });
      fullContentToSave += "User Query: " + finalQuery;
  } else {
      fullContentToSave = finalQuery;
  }

  const filesSentThisMessage = [...State.stagedDocuments];

  appendBubble('user', fullContentToSave, false, filesSentThisMessage);
  SessionManager.addMessage('user', fullContentToSave);
  
  input.value = '';
  input.style.height = 'auto';

  State.stagedDocuments = [];
  renderFileStagingArea();

  const typingId = appendTypingIndicator();

  try {
    const reply = await LexAI.call();
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
    
    div.innerHTML = `<div class="flex items-start gap-4 max-w-[95%] md:max-w-[85%] w-full"><div class="mt-4 shrink-0">${LexSVG}</div><div class="ai-bubble p-4 md:p-6 text-base w-full break-words shadow-sm"><div id="streaming-p" class="typing-cursor w-full"></div></div></div>`;
    box.appendChild(div);

    const el = document.getElementById('streaming-p');
    const textToStream = String(fullText);
    let i = 0; const chunkSize = 5; 

    const tick = setInterval(() => {
      if (i < textToStream.length) {
        i += chunkSize;
        el.innerHTML = formatHTML(textToStream.substring(0, i)) + '<span class="typing-cursor">|</span>';
      } else {
        clearInterval(tick);
        el.innerHTML = formatHTML(textToStream);
        el.classList.remove('typing-cursor');
        el.id = '';
        el.style.opacity = '1';
        el.classList.add('streamed-content-final');
        box.scrollTop = box.scrollHeight; 
        resolve();
      }
    }, CONFIG.STREAM_SPEED);
  });
}

function formatHTML(text) {
  if (!text) return '';
  let sanitized = text
    .replace(/^\$2(.*)$/gm, '$1') 
    .replace(/^⚠️ \*\*(.*?)\*\*(.*)$/gm, '<div class="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-muted text-sm flex items-start gap-3 w-full"><span class="text-xl leading-none shrink-0">⚠️</span> <div><strong class="text-main font-semibold">$1</strong>$2</div></div>');

  marked.setOptions({ gfm: true, breaks: true, sanitize: false, smartLists: true });
  return marked.parse(sanitized);
}

function appendBubble(role, text, skipAnimation = false, filesArray = []) {
  const box = document.getElementById('chat-messages');
  if(!box) return;
  
  const animClass = skipAnimation ? '' : 'anim-fade-up';
  
  if (role === 'user') {
    let cleanText = text
        .replace(/\[IMAGE_DATA.*?\n/g, '') 
        .replace(/\[ATTACHED FILES CONTEXT\][\s\S]*?User Query:/g, 'files:') 
        .replace(/User Query:\s*/g, ''); 

    let fileChipsHtml = "";
    if (filesArray && filesArray.length > 0) {
        fileChipsHtml = `<div class="flex flex-wrap gap-2 mb-3">`;
        filesArray.forEach(doc => {
            let mediaHtml = doc.thumbnail;
            if (doc.type.startsWith('image/')) { mediaHtml = `<img src="${doc.thumbnail}" class="w-8 h-8 rounded object-cover shrink-0">`; }
            fileChipsHtml += `
            <div class="flex items-center gap-2.5 bg-brand/10 border border-brand/20 p-2 rounded-lg text-xs">
                ${mediaHtml}
                <span class="truncate block font-semibold text-main max-w-[120px]">${doc.name}</span>
            </div>`;
        });
        fileChipsHtml += `</div>`;
    }

    const div = document.createElement('div');
    div.className = `flex justify-end w-full ${animClass}`;
    div.innerHTML = `
    <div class="max-w-[90%] md:max-w-[85%] relative">
        ${fileChipsHtml}
        <div class="user-bubble p-3 md:p-4 text-sm break-words shadow-sm">
            <p>${cleanText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
        </div>
    </div>`;
    box.appendChild(div);

  } else {
    const div = document.createElement('div');
    div.className = `flex justify-start w-full ${animClass}`;
    div.innerHTML = `<div class="flex items-start gap-4 max-w-[95%] md:max-w-[85%] w-full"><div class="mt-4 shrink-0">${LexSVG}</div><div class="ai-bubble p-4 md:p-6 text-base w-full break-words shadow-sm"><div>${formatHTML(String(text))}</div></div></div>`;
    box.appendChild(div);
  }
  
  if (!skipAnimation) box.scrollTop = box.scrollHeight;
}

function appendTypingIndicator() {
  const id = 'typing-' + Date.now();
  const box = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.id = id;
  div.className = 'flex justify-start w-full anim-fade-up';
  // THE NEW THINKING ANIMATION CLASS IS APPLIED HERE
  div.innerHTML = `<div class="flex items-center gap-4 max-w-[95%] md:max-w-[85%] w-full"><div class="ai-thinking-logo shrink-0 w-6 h-6">${LexSVG}</div></div>`;
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
  renderFileStagingArea(); 
  SessionManager.init(); 

  if (typeof pdfjsLib === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    document.head.appendChild(s);
  }
};
