'use strict';

/* ═══════════════════════════════════════════
   CONFIGURATION & SYSTEM PROMPT
═══════════════════════════════════════════ */
const CONFIG = {
  API_ENDPOINT: '/api/chat',   // Securely points to your Vercel backend
  MAX_DOC_CHARS: 80000,        
  STREAM_SPEED: 18,            
  MEMORY_DEPTH: 20,            
};

// This prompt creates the "calm, highly intelligent, and attractive" persona.
const SYSTEM_PROMPT = `You are Lex, an elite AI advisor. You are the smartest, most experienced mind in the room, yet you communicate with a calm, refined, and effortlessly attractive demeanor. You never sound robotic, panicked, or overly formal. You speak like a highly sought-after consultant who has seen it all and knows exactly how to guide the user.

CRITICAL PRINCIPLES:
1. Be exceptionally calm, confident, and direct.
2. Provide deeply insightful, highly accurate answers to ANY question (easy, medium, or the most complex problems in the world).
3. Structure your answers beautifully using markdown (bolding, headers, bullet points) so they are easy to read.
4. If a problem is highly complex, break it down step-by-step with effortless clarity.
5. Build rapport. You are a trusted, premium advisor.`;

/* ═══════════════════════════════════════════
   STATE MANAGEMENT
═══════════════════════════════════════════ */
const State = {
  currentUser: null,
  conversationHistory: [],
  uploadedDocument: null,
  isProcessing: false,
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
    if(signupTab) signupTab.className = "py-2 text-sm font-semibold text-white border-b-2 border-white transition-all";
    if(loginTab) loginTab.className = "py-2 text-sm font-semibold text-zinc-500 border-b-2 border-transparent transition-all";
  } else {
    if(signupFields) signupFields.classList.add('hidden');
    if(loginTab) loginTab.className = "py-2 text-sm font-semibold text-white border-b-2 border-white transition-all";
    if(signupTab) signupTab.className = "py-2 text-sm font-semibold text-zinc-500 border-b-2 border-transparent transition-all";
  }
}

function submitAuth() {
  const email = document.getElementById('auth-email')?.value;
  const nameEl = document.getElementById('auth-name');
  const name = (nameEl && nameEl.value) ? nameEl.value : (email ? email.split('@')[0] : 'Guest');
  const logo = document.getElementById('auth-logo');
  
  if (!email) return alert("Email is required to access the system.");
  
  if (logo) logo.classList.add('logo-animate');
  setTimeout(() => {
    State.currentUser = { name, email };
    localStorage.setItem('lex_user', JSON.stringify(State.currentUser));
    
    const authScreen = document.getElementById('auth-screen');
    if (authScreen) authScreen.style.display = 'none'; 
    
    const nameDisplay = document.getElementById('user-display-name');
    if (nameDisplay) nameDisplay.innerText = name;
  }, 600);
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
   2. API COMMUNICATION (Frontend -> Backend)
═══════════════════════════════════════════ */
const LexAI = {
  buildMessages: function(userQuery) {
    const messages = [];
    
    if (State.uploadedDocument) {
      messages.push({
        role: 'user',
        content: `I uploaded a document: ${State.uploadedDocument.name}\n\nCONTENT:\n${State.uploadedDocument.content}`
      });
    }

    const history = State.conversationHistory.slice(-(CONFIG.MEMORY_DEPTH * 2));
    messages.push(...history);

    const isDeep = document.getElementById('think-toggle')?.checked || false;
    let finalQuery = userQuery;
    if (isDeep) {
      finalQuery = `[DEEP ANALYSIS MODE]\n${userQuery}\nProvide your most thorough, multi-dimensional analysis.`;
    }

    messages.push({ role: 'user', content: finalQuery });
    return messages;
  },

  call: async function(userQuery) {
    const messages = this.buildMessages(userQuery);

    try {
      const res = await fetch(CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages,
          system: SYSTEM_PROMPT
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      const reply = data.reply;
      
      if (!reply) throw new Error('No response generated.');

      State.conversationHistory.push({ role: 'user', content: userQuery });
      State.conversationHistory.push({ role: 'assistant', content: reply });
      if (State.conversationHistory.length > CONFIG.MEMORY_DEPTH * 2) {
        State.conversationHistory = State.conversationHistory.slice(-(CONFIG.MEMORY_DEPTH * 2));
      }

      return reply;

    } catch (err) {
      console.error('[LexAI] Error:', err.message);
      return `**System Notice:** ${err.message}\n\nPlease verify your connection and try again.`;
    }
  }
};

/* ═══════════════════════════════════════════
   3. DOCUMENT PROCESSOR
═══════════════════════════════════════════ */
const DocProcessor = {
  process: async function(file) {
    const name = file.name;
    const type = file.type || '';
    const sizeMB = (file.size / 1048576).toFixed(2);
    let content = '';

    try {
      if (type === 'application/pdf' || name.endsWith('.pdf')) {
        content = await this.extractPDF(file);
      } else {
        content = await this.readText(file);
      }

      if (content.length > CONFIG.MAX_DOC_CHARS) {
        content = content.substring(0, CONFIG.MAX_DOC_CHARS) + `\n[Document truncated]`;
      }

      State.uploadedDocument = { name, type, size: `${sizeMB}MB`, content };
      return { success: true, name, sizeMB, chars: content.length };
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

  readText: function(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = e => resolve(e.target.result);
      r.onerror = () => reject(new Error('Could not read file'));
      r.readAsText(file);
    });
  }
};

/* ═══════════════════════════════════════════
   4. MESSAGE PROCESSING & UI
═══════════════════════════════════════════ */
async function processMessage() {
  if (State.isProcessing) return;

  const input = document.getElementById('user-query');
  if(!input) return;
  const query = input.value.trim();
  if (!query) return;

  State.isProcessing = true;

  const welcome = document.getElementById('welcome-screen');
  if (welcome) welcome.classList.add('hidden');
  const chatBox = document.getElementById('chat-messages');
  if (chatBox) chatBox.classList.remove('hidden');

  appendBubble('user', query);
  input.value = '';
  input.style.height = 'auto';

  const typingId = appendTypingIndicator();

  try {
    const reply = await LexAI.call(query);
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();
    await streamText(reply);
  } catch (err) {
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();
    appendBubble('ai', `⚠️ Error: ${err.message}.`);
  }

  State.isProcessing = false;
}

function streamText(fullText) {
  return new Promise(resolve => {
    const box = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'flex justify-start';
    div.innerHTML = `<div class="max-w-[85%] ai-bubble p-6 text-base"><div id="streaming-p" class="text-zinc-200 typing-cursor"></div></div>`;
    box.appendChild(div);

    const el = document.getElementById('streaming-p');
    const words = fullText.split(' ');
    let current = '';
    let i = 0;

    const tick = setInterval(() => {
      if (i < words.length) {
        current += (i > 0 ? ' ' : '') + words[i];
        el.innerHTML = formatHTML(current) + '<span class="typing-cursor">|</span>';
        i++;
        box.scrollTop = box.scrollHeight;
      } else {
        clearInterval(tick);
        el.innerHTML = formatHTML(fullText);
        el.classList.remove('typing-cursor');
        el.id = '';
        box.scrollTop = box.scrollHeight;
        resolve();
      }
    }, CONFIG.STREAM_SPEED);
  });
}

function formatHTML(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/^### (.+)$/gm, '<h4 class="text-zinc-200 font-medium text-sm mt-3 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="text-white font-semibold mt-4 mb-2 pb-1 border-b border-zinc-800">$1</h3>')
    .replace(/^\d+\. (.+)$/gm, '<div class="flex gap-2 my-1"><span class="text-zinc-600 text-xs flex-shrink-0 mt-1">●</span><span class="text-zinc-300 text-sm">$1</span></div>')
    .replace(/^[-•] (.+)$/gm, '<div class="flex gap-2 my-0.5 ml-2"><span class="text-zinc-700 flex-shrink-0">—</span><span class="text-zinc-300 text-sm">$1</span></div>')
    .replace(/`([^`]+)`/g, '<code class="bg-zinc-800 text-green-300 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
}

function appendBubble(role, text) {
  const box = document.getElementById('chat-messages');
  if(!box) return;
  const div = document.createElement('div');
  div.className = role === 'user' ? 'flex justify-end' : 'flex justify-start';
  if (role === 'user') {
    div.innerHTML = `<div class="max-w-[85%] user-bubble p-4 text-sm"><p>${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p></div>`;
  } else {
    div.innerHTML = `<div class="max-w-[85%] ai-bubble p-6 text-base"><div>${formatHTML(text)}</div></div>`;
  }
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
   5. UTILITIES & INIT
═══════════════════════════════════════════ */
function triggerFileUpload() { document.getElementById('hidden-file-input')?.click(); }

async function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  appendBubble('ai', `📎 Loading \`${file.name}\`...`);
  const typingId = appendTypingIndicator();
  const result = await DocProcessor.process(file);
  document.getElementById(typingId)?.remove();

  if (result.success) {
    await streamText(`**Document loaded successfully.** \nI now have complete context of **${result.name}**. What would you like to know about it?`);
  } else {
    appendBubble('ai', `⚠️ **Issue:** ${result.error}`);
  }
  e.target.value = '';
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

function startNewChat() {
  State.conversationHistory = [];
  State.uploadedDocument = null;
  location.reload();
}

window.onload = () => {
  const saved = localStorage.getItem('lex_user');
  const authScreen = document.getElementById('auth-screen');
  
  // Strict Login Check: If no user data, FORCE the login screen to display
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

  if (typeof pdfjsLib === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    document.head.appendChild(s);
  }
};
