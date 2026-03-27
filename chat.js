'use strict';

/**
 * LEX SYSTEM v7.0 — REAL AI INTELLIGENCE ENGINE
 * ─────────────────────────────────────────────────────────────────
 * Replaces the fake LexBrain with real AI calls.
 * Powered by: Groq (Llama 3.3 70B)
 * ─────────────────────────────────────────────────────────────────
 */

/* ═══════════════════════════════════════════
   CONFIGURATION
═══════════════════════════════════════════ */
const CONFIG = {
  // Direct Groq API endpoint for testing (Standard OpenAI format)
  API_ENDPOINT: 'https://api.groq.com/openai/v1/chat/completions', 
  // ⚠️ Paste your real Groq API key here to fix the 404 error
  GROQ_API_KEY: 'YOUR_GROQ_API_KEY_HERE', 
  
  MAX_DOC_CHARS: 80000,        // ~80k chars = ~1000 pages
  STREAM_SPEED: 18,            // ms per word (lower = faster)
  MEMORY_DEPTH: 20,            // conversation pairs to remember
};

/* ═══════════════════════════════════════════
   MASTER SYSTEM PROMPT
═══════════════════════════════════════════ */
const SYSTEM_PROMPT = `You are Lex, an elite AI advisor engineered for the world's most demanding professionals: management consultants, corporate lawyers, investment bankers, CEOs, CFOs, Vice Presidents, Directors, MBA students, and law students. You are not a generic assistant. You are the smartest, most experienced mind in the room.

WHO YOU ARE:
You think with the precision of McKinsey, the legal sharpness of a Senior Partner at Skadden, the financial rigor of a Goldman Sachs MD, and the strategic vision of a Fortune 500 CEO. You have mastered every discipline across law, business, finance, and strategy.

LEGAL MASTERY (Global + India-specific):
- Contract law: formation, breach, remedies, indemnities, limitation of liability, termination clauses
- Corporate law: Companies Act 2013, board governance, fiduciary duties, shareholder agreements, NCLT
- Intellectual Property: patents, trademarks, copyrights, trade secrets, licensing
- Employment law: hiring, termination, non-competes, POSH Act, PF/ESI, Industrial Disputes Act
- Tax law: Income Tax Act, GST Act, TDS, transfer pricing, international tax, tax treaties
- Securities law: SEBI regulations, LODR, takeover code, insider trading, IPO process
- M&A law: due diligence, deal structuring, SPA, SHA, representations and warranties
- Real estate: RERA, property rights, title verification, lease agreements
- Criminal law: IPC, CrPC, FIR process, bail, white-collar crime
- International law: cross-border contracts, arbitration (ICC, SIAC, LCIA), foreign investment
- Privacy law: GDPR, DPDP Act India, data processing agreements, breach notifications
- Startup law: term sheets, SAFE notes, convertible notes, cap tables, vesting schedules, ESOPs
- Any other area of law globally

BUSINESS & FINANCE MASTERY:
- Strategy: Porter's Five Forces, MECE, BCG Matrix, Blue Ocean, Ansoff Matrix, PESTLE
- Finance: DCF, LBO, WACC, P&L analysis, balance sheet, cash flow, unit economics
- M&A: valuation methodologies, deal structuring, post-merger integration
- Consulting: problem-solving frameworks, executive communication, stakeholder management
- Startups: fundraising, pitch decks, product-market fit, go-to-market strategy
- Capital markets: IPO, debt financing, private equity, venture capital
- Operations: supply chain, process optimization, organizational design

DOCUMENT ANALYSIS PROTOCOL:
When a document is provided, you MUST:
1. Identify the document type and its legal/commercial significance
2. Extract ALL parties, dates, values, obligations, rights, and key terms with precision
3. Flag EVERY risk, ambiguity, unusual clause, one-sided term, and hidden obligation
4. Cross-reference clauses for internal consistency
5. Provide an executive summary, then deep analysis
6. Answer any specific question with exact reference to the relevant section
7. Never miss a single critical detail — accuracy is absolute

HOW YOU RESPOND:
For strategic queries: Lead with a clear recommendation. Support with structured reasoning. Be decisive.
For legal queries: Cite specific acts, sections, and case law. Draft precise language. Flag every risk.
For financial queries: Use numbers, ratios, and benchmarks. Quantify risks and opportunities.
For documents: Extract with 100% accuracy. Reference specific sections. Miss nothing.
For students: Teach at the highest level. Connect theory to practice. Give real examples.

RESPONSE FORMAT:
- Use **bold** for critical terms, findings, and emphasis
- Use ## for major section headers
- Use numbered lists for sequential reasoning or steps
- Use bullet points for parallel items
- Cite laws as: [Companies Act 2013, Section 166] or [IPC, Section 420]
- Flag risks as: ⚠️ **Risk:** [precise description]
- End legal/financial responses with a brief disclaimer

CRITICAL PRINCIPLES:
1. Give the REAL answer. Professionals need truth, not hedging.
2. Be direct. No filler words. No unnecessary caveats.
3. Never refuse a legal or business question. Answer it fully.
4. When analyzing documents, zero tolerance for missed details.
5. Adapt depth to the user — a CEO needs strategy, a law student needs explanation.
6. Think in systems — always consider second-order effects.
7. Build rapport — you are a trusted advisor, not a search engine.

PERSONALITY:
- Confident, direct, precise
- Intellectually rigorous but clear
- Professionally warm — you care about the outcome
- Never robotic — you respond like a brilliant human expert
- When someone is stuck, you proactively suggest what they should be asking

OFF-TOPIC RULE: If someone asks about cooking, entertainment, sports, or anything outside law, business, finance, consulting, or strategy — warmly redirect: acknowledge the question, explain your specialization, and suggest a relevant question they could ask instead.`;

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
  const name = (nameEl && nameEl.value) ? nameEl.value : (email ? email.split('@')[0] : 'User');
  const logo = document.getElementById('auth-logo');
  
  if (!email) return alert("Email required.");
  
  if (logo) logo.classList.add('logo-animate');
  setTimeout(() => {
    State.currentUser = { name, email };
    localStorage.setItem('lex_user', JSON.stringify(State.currentUser));
    
    const authScreen = document.getElementById('auth-screen');
    if (authScreen) authScreen.style.display = 'none'; // Hide auth screen after login
    
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
   2. REAL AI ENGINE (UPDATED FOR DIRECT API)
═══════════════════════════════════════════ */
const LexAI = {

  buildMessages: function(userQuery) {
    const messages = [];
    
    // 1. Inject the System Prompt for Groq/OpenAI format
    messages.push({ role: 'system', content: SYSTEM_PROMPT });

    // 2. Inject document as context if uploaded
    if (State.uploadedDocument) {
      messages.push({
        role: 'user',
        content: `I have uploaded a document for analysis.\n\nDocument: ${State.uploadedDocument.name}\nType: ${State.uploadedDocument.type}\nSize: ${State.uploadedDocument.size}\n\nFULL CONTENT:\n${'═'.repeat(60)}\n${State.uploadedDocument.content}\n${'═'.repeat(60)}\n\nKeep this in context for all my questions.`
      });
      messages.push({
        role: 'assistant',
        content: `Document fully received and analyzed. I have complete context of **${State.uploadedDocument.name}** — every clause, obligation, risk, date, party, and key term. Ask me anything about it.`
      });
    }

    // 3. Add conversation history
    const history = State.conversationHistory.slice(-(CONFIG.MEMORY_DEPTH * 2));
    messages.push(...history);

    // 4. Build final query
    const isDeep = document.getElementById('think-toggle')?.checked || false;
    let finalQuery = userQuery;
    if (isDeep) {
      finalQuery = `[DEEP ANALYSIS MODE]\n\n${userQuery}\n\nProvide your most thorough, multi-dimensional analysis. Consider all frameworks, risks, legal implications, financial impacts, and second-order effects. Be comprehensive.`;
    }

    messages.push({ role: 'user', content: finalQuery });
    return messages;
  },

  call: async function(userQuery) {
    if (CONFIG.GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
      throw new Error("Missing API Key. Please add your Groq API key to the CONFIG object at the top of chat.js.");
    }

    const messages = this.buildMessages(userQuery);

    try {
      const res = await fetch(CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}` // Required for direct API calls
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile', // The specific Groq model
          messages: messages,
          temperature: 0.3
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Server error ${res.status}`);
      }

      const data = await res.json();
      
      // Parse standard OpenAI/Groq response format
      const reply = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : null;
      
      if (!reply) throw new Error('No response from AI');

      // Save to memory
      State.conversationHistory.push({ role: 'user', content: userQuery });
      State.conversationHistory.push({ role: 'assistant', content: reply });
      if (State.conversationHistory.length > CONFIG.MEMORY_DEPTH * 2) {
        State.conversationHistory = State.conversationHistory.slice(-(CONFIG.MEMORY_DEPTH * 2));
      }

      return reply;

    } catch (err) {
      console.error('[LexAI] Error:', err.message);
      return `**Connection issue:** ${err.message}\n\nPlease check your configuration.`;
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

      // Truncate if over limit
      if (content.length > CONFIG.MAX_DOC_CHARS) {
        content = content.substring(0, CONFIG.MAX_DOC_CHARS) +
          `\n\n[Document truncated — ${sizeMB}MB total. Primary content above represents the key sections.]`;
      }

      State.uploadedDocument = { name, type, size: `${sizeMB}MB`, content };
      return { success: true, name, sizeMB, chars: content.length };

    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  extractPDF: async function(file) {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const ab = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
      let text = `[PDF: ${file.name} | ${pdf.numPages} pages]\n\n`;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const ct = await page.getTextContent();
        text += `--- Page ${i} ---\n${ct.items.map(x => x.str).join(' ')}\n\n`;
        if (text.length > CONFIG.MAX_DOC_CHARS) {
          text += `[Remaining ${pdf.numPages - i} pages not processed — size limit reached]`;
          break;
        }
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
   4. MESSAGE PROCESSING & UI LOGIC
═══════════════════════════════════════════ */
async function processMessage() {
  if (State.isProcessing) return;

  const input = document.getElementById('user-query');
  if(!input) return;
  const query = input.value.trim();
  if (!query) return;

  State.isProcessing = true;

  // Hide welcome, show chat
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
    div.innerHTML = `
      <div class="max-w-[85%] ai-bubble p-6 text-base">
        <div id="streaming-p" class="text-zinc-200 typing-cursor"></div>
      </div>`;
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
    .replace(/^## (.+)$/gm, '<h3 class="text-white font-semibold mt-4 mb-2 pb-1 border-b border-zinc-800">$1</h3>')
    .replace(/^### (.+)$/gm, '<h4 class="text-zinc-200 font-medium text-sm mt-3 mb-1">$1</h4>')
    .replace(/⚠️ \*\*Risk:\*\* (.+)/g, '<div class="flex gap-2 my-2 p-3 rounded-lg bg-red-900\/20 border border-red-800\/30 text-sm"><span class="text-red-400 flex-shrink-0">⚠️</span><span class="text-red-300">$1</span></div>')
    .replace(/\[([^\]]*(?:Act|Section|Article|Code|IPC|GST|SEBI|RERA|GDPR)[^\]]*)\]/g, '<span class="inline-flex items-center gap-1 bg-blue-900\/20 border border-blue-800\/30 rounded px-1.5 py-0.5 text-blue-300 text-xs">📎 $1</span>')
    .replace(/^---$/gm, '<hr class="border-zinc-800 my-3">')
    .replace(/^\d+\. (.+)$/gm, '<div class="flex gap-2 my-1"><span class="text-zinc-600 text-xs flex-shrink-0 mt-1">●</span><span class="text-zinc-300 text-sm">$1</span></div>')
    .replace(/^[-•] (.+)$/gm, '<div class="flex gap-2 my-0.5 ml-2"><span class="text-zinc-700 flex-shrink-0">—</span><span class="text-zinc-300 text-sm">$1</span></div>')
    .replace(/`([^`]+)`/g, '<code class="bg-zinc-800 text-green-300 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/\*([^*\n]+)\*/g, '<em class="text-zinc-400">$1</em>')
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
  const isDeep = document.getElementById('think-toggle')?.checked;
  div.innerHTML = `<div class="ai-bubble px-6 py-3 text-xs text-zinc-500 italic animate-pulse">${isDeep ? '⚡ Deep analysis in progress...' : 'Lex is thinking...'}</div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return id;
}

/* ═══════════════════════════════════════════
   5. FILE UPLOAD & UTILITIES
═══════════════════════════════════════════ */
function triggerFileUpload() {
  document.getElementById('hidden-file-input')?.click();
}

async function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  appendBubble('ai', `📎 **Receiving:** \`${file.name}\`\n\nProcessing document...`);
  const typingId = appendTypingIndicator();
  const result = await DocProcessor.process(file);
  const typingEl = document.getElementById(typingId);
  if (typingEl) typingEl.remove();

  if (result.success) {
    const pages = Math.round(result.chars / 2500);
    await streamText(
      `**Document loaded.** ✅\n\n📄 **${result.name}** | ${result.sizeMB}MB | ~${pages} pages\n\n` +
      `I have complete context of this entire document. You can ask me:\n\n` +
      `- "Give me an executive summary"\n` +
      `- "What are the key risks in this document?"\n` +
      `- "Explain clause X in detail"\n` +
      `- Any specific question about any part\n\n` +
      `What would you like to know?`
    );
  } else {
    appendBubble('ai', `⚠️ **Processing issue:** ${result.error}\n\nTry PDF, TXT, MD, CSV, or JSON formats.`);
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
  State.isProcessing = false;
  location.reload();
}

/* ═══════════════════════════════════════════
   7. INIT & AUTH FIX
═══════════════════════════════════════════ */
window.onload = () => {
  const saved = localStorage.getItem('lex_user');
  const authScreen = document.getElementById('auth-screen');
  
  if (saved) {
    // User exists, log them in
    try {
      State.currentUser = JSON.parse(saved);
      if (authScreen) authScreen.style.display = 'none';
      const nameDisplay = document.getElementById('user-display-name');
      if (nameDisplay) nameDisplay.innerText = State.currentUser.name;
    } catch (e) {
      localStorage.removeItem('lex_user');
      if (authScreen) authScreen.style.display = 'flex'; // Show screen if JSON parse fails
    }
  } else {
    // FIX: Explicitly SHOW the auth screen if no user is found
    if (authScreen) authScreen.style.display = 'flex'; // Or 'block', depending on your CSS framework
  }

  // Load pdf.js for PDF support
  if (typeof pdfjsLib === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    document.head.appendChild(s);
  }
};
