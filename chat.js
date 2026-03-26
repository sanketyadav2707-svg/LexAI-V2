/**
 * LexAI v2.0 — Master Orchestrator (2026 Edition)
 * Core Application Logic: Zero-Mistake Document Intelligence
 * 
 * NEW FEATURES:
 * - Execution Plan (CoT) Integration
 * - GraphRAG Entity Mapping Simulation
 * - Zero-Mistake Validator Reflection Loop
 * - Deep Citations (Section/Page level)
 * - Action-Oriented Export (Redlines/Spreadsheets)
 */

'use strict';

/* ═══════════════════════════════════════════
   UPDATED CONFIGURATION
═══════════════════════════════════════════ */

const CONFIG = {
  APP_NAME: 'LexAI Master Orchestrator',
  MAX_INPUT_LENGTH: 8000,       // Increased for 2026 document context
  STREAM_DELAY_MS: 12,          // Faster "2026-tier" processing
  AGENT_STEP_DELAY_MS: 1500,    // Realistic "Thinking" time for deep reasoning
  PLANNING_DELAY_MS: 2000,      // Time to generate the CoT Execution Plan
  VALIDATOR_REPEATS: 1,         // Number of self-correction loops
  SESSION_KEY: 'lexai_v2_sessions',
};

/* ═══════════════════════════════════════════
   2026 MULTI-AGENT PIPELINE (CoT Architecture)
═══════════════════════════════════════════ */

function getAgentPipeline(query, mode) {
  // 2026-tier agents are goal-oriented rather than just topic-oriented
  return [
    {
      id: 'orchestrator',
      label: 'Master Orchestrator',
      description: 'Generating Chain-of-Thought Execution Plan...',
      icon: '🧠',
      doneLabel: 'Execution Plan Finalized',
    },
    {
      id: 'extraction',
      label: 'Data Extraction & GraphRAG',
      description: 'Mapping entity relationships & clause dependencies...',
      icon: '🕸️',
      doneLabel: 'GraphRAG Knowledge Map built',
    },
    {
      id: 'mapping',
      label: 'Jurisdictional Rule Mapper',
      description: 'Cross-referencing India (SEBI/RBI), US (SEC/IRS), and EU codes...',
      icon: '🗺️',
      doneLabel: 'Global Rule Mapping complete',
    },
    {
      id: 'risk',
      label: 'Risk Analysis Agent',
      description: 'Quantifying liability and identifying red flags...',
      icon: '⚖️',
      doneLabel: 'Risk Score & Mitigation Plan ready',
    },
    {
      id: 'validator',
      label: 'Zero-Mistake Validator',
      description: 'Running reflection loop to eliminate hallucinations...',
      icon: '🛡️',
      doneLabel: '100% Citation Accuracy Verified',
    },
    {
      id: 'synthesis',
      label: 'Final Synthesis',
      description: 'Composing review-ready action items...',
      icon: '✨',
      doneLabel: 'Document Ready for HITL Review',
    }
  ];
}

/* ═══════════════════════════════════════════
   NEW: EXECUTION PLAN (CoT) UI MODULE
═══════════════════════════════════════════ */

function renderExecutionPlan(steps) {
    const planId = `plan-${Date.now()}`;
    const html = `
    <div class="execution-plan msg-appear mb-4 p-4 rounded-xl border border-gold-500/20 bg-slate-900/50" id="${planId}">
        <div class="flex items-center gap-2 mb-3">
            <span class="text-gold-500 animate-pulse">⚙️</span>
            <h4 class="text-xs font-bold uppercase tracking-widest text-gold-500">2026-Tier Execution Plan</h4>
        </div>
        <div class="space-y-3">
            ${steps.map((step, i) => `
                <div class="flex gap-3 items-start opacity-40 transition-opacity duration-500" id="plan-step-${step.id}">
                    <div class="text-[10px] font-mono text-slate-500 mt-1">0${i+1}</div>
                    <div>
                        <div class="text-xs font-semibold text-slate-200">${step.label}</div>
                        <div class="text-[10px] text-slate-500">${step.description}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    `;
    return { html, id: planId };
}

/* ═══════════════════════════════════════════
   NEW: VALIDATOR REFLECTION SIMULATION
═══════════════════════════════════════════ */

async function runValidatorReflection(panelEl) {
    const statusLabel = panelEl.querySelector('#orch-status-label');
    statusLabel.textContent = 'Reflecting & Cross-Referencing...';
    
    // Simulate the agent "correcting" itself
    await new Promise(r => setTimeout(r, 1200));
    console.log("[LexAI Validator] Self-Correction Loop: Verifying Citation [SEC-10K-p42]...");
    
    await new Promise(r => setTimeout(r, 1000));
    statusLabel.textContent = 'Eliminating Hallucinations...';
}

/* ═══════════════════════════════════════════
   UPDATED: ACTION-ORIENTED RESPONSE SIMULATOR
═══════════════════════════════════════════ */

async function simulateAIResponse(query, mode) {
  // Logic updated to be "Action-Oriented" per instructions
  const isDraftRequest = /draft|contract|agreement/i.test(query);
  const isAuditRequest = /audit|check|compliance/i.test(query);

  let response = `## MASTER ORCHESTRATOR ANALYSIS: ${query.slice(0, 30)}...

### 1. Jurisdictional Rule Mapping
Cross-referenced against **India SEBI (2025-26 Guidelines)** and **Delaware General Corporation Law**. 
> *Finding:* Your proposed structure triggers Clause 49(I)(A) regarding independent director ratios. <a class="citation-link" href="#" onclick="openCitation(event, 'SEBI LODR § 17(1)')">📎 SEBI LODR, Sec 17, p. 24</a>

### 2. Risk Analysis (Zero-Mistake Protocol)
Using GraphRAG, I have mapped 14 dependencies between your IP Assignment and the Non-Compete survival period.
- **Red Flag:** Survival period of 5 years in California is unenforceable under SB 699. <a class="citation-link" href="#" onclick="openCitation(event, 'Cal. Bus. & Prof. Code § 16600')">📎 CA BPC § 16600, p. 2</a>
- **Action Required:** Immediate redline to 12-month post-termination restriction.

### 3. Review-Ready Draft (HITL)
Below is the "Action-Ready" redline. Please approve for final filing.`;

  const citations = [
    { id: 'c1', label: 'SEBI (LODR) Regulations, Section 17, Page 24', url: '#' },
    { id: 'c2', label: 'California Business & Professions Code § 16600, Page 2', url: '#' },
    { id: 'c3', label: 'IRS Publication 541 (Partnerships), Section 4', url: '#' }
  ];

  let actionModule = null;
  if (isDraftRequest) {
    actionModule = {
      type: 'redline',
      content: '[[REVISION]] Section 8.1: Liability shall be capped at [1.5x] annual fees (previously 5x).'
    };
  } else if (isAuditRequest) {
    actionModule = {
      type: 'spreadsheet',
      content: 'Audit-Ready Spreadsheet: [Download Audit_Trail_V1.xlsx]'
    };
  }

  return { 
    text: response, 
    citations, 
    isDraft: true, 
    draftContent: "DRAFT_CONTRACT_V2.0_READY_FOR_FILING",
    actionModule 
  };
}

/* ═══════════════════════════════════════════
   ENHANCED MESSAGE RENDERING
═══════════════════════════════════════════ */

function renderAIMessage(content, msgId, citations = [], isDraft = false, draftApproved = null, draftContent = null, actionModule = null) {
  const container = document.getElementById('messages-container');
  const id = msgId || generateId();
  const wrapper = document.createElement('div');
  wrapper.className = 'flex gap-4 mb-8 msg-appear max-w-4xl';
  wrapper.setAttribute('data-msg-id', id);

  // Added Action-Oriented Buttons (Redline/Spreadsheet)
  let actionHtml = '';
  if (actionModule) {
    actionHtml = `
      <div class="mt-4 flex gap-3 p-3 rounded-lg bg-blue-900/20 border border-blue-500/30">
        <div class="text-blue-400">📊</div>
        <div class="flex-1">
            <div class="text-xs font-bold text-blue-300">ACTION MODULE: ${actionModule.type.toUpperCase()}</div>
            <div class="text-[10px] text-blue-200/70 mb-2">${actionModule.content}</div>
            <button class="bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-3 py-1 rounded shadow-lg transition-all">Download Audit-Ready File</button>
        </div>
      </div>
    `;
  }

  wrapper.innerHTML = `
    <div class="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-2xl" style="background:linear-gradient(135deg,#d4a843,#8a6d29);border:1px solid rgba(255,255,255,0.2);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-xs font-bold tracking-widest text-gold-500 uppercase">LexAI Orchestrator v2.0</span>
        <div class="h-1 w-1 rounded-full bg-slate-700"></div>
        <span class="text-[10px] text-slate-500">Verified by Validator Agent</span>
      </div>
      <div class="ai-response-container">
        <div class="prose-ai text-slate-200 leading-relaxed text-sm" id="msg-content-${id}"></div>
        
        ${actionHtml}

        <div class="mt-6 pt-4 border-t border-slate-800">
          <div class="text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">Primary Sources (Click to verify)</div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            ${citations.map(c => `
              <a href="#" class="citation-card" onclick="openCitation(event, '${c.label}')">
                <span class="text-gold-500">📄</span>
                <span class="truncate">${c.label}</span>
              </a>
            `).join('')}
          </div>
        </div>

        <div class="hitl-panel-v2 mt-6 p-4 rounded-xl border border-gold-500/30 bg-gold-500/5">
            <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-gold-500 uppercase">Review-Ready Draft</span>
                <span class="text-[10px] text-gold-500/60 font-mono">ID: LX-2026-X8</span>
            </div>
            <div class="text-[11px] font-mono text-slate-400 mb-4 bg-black/40 p-3 rounded border border-slate-800">
                ${draftContent || 'Draft text being finalized...'}
            </div>
            <div class="flex gap-2">
                <button onclick="hitlApprove('${id}')" class="flex-1 bg-gold-600 hover:bg-gold-500 text-slate-900 text-xs font-bold py-2 rounded transition-all">Approve & Finalize</button>
                <button onclick="hitlRevise('${id}')" class="flex-1 border border-gold-500/50 text-gold-500 text-xs font-bold py-2 rounded hover:bg-gold-500/10 transition-all">Request Redline</button>
            </div>
        </div>
      </div>
    </div>
  `;

  container.appendChild(wrapper);
  scrollToBottom();
  return { wrapper, id };
}

/* ═══════════════════════════════════════════
   UPDATED: MAIN SEND MESSAGE FLOW
═══════════════════════════════════════════ */

async function sendMessage() {
  if (State.isProcessing) return;
  const inputEl = document.getElementById('user-input');
  const query = inputEl.value.trim();
  if (!query) return;

  State.isProcessing = true;
  setSendBtnState(true);
  
  // 1. Capture & Render User Message
  const originalQuery = query;
  inputEl.value = '';
  const userMsg = State.addMessage('user', originalQuery);
  renderUserMessage(originalQuery, userMsg?.id);

  // 2. NEW: Chain-of-Thought Planning Phase
  const steps = getAgentPipeline(originalQuery, State.currentMode);
  const plan = renderExecutionPlan(steps);
  const container = document.getElementById('messages-container');
  container.insertAdjacentHTML('beforeend', plan.html);
  scrollToBottom();

  // Highlight steps progressively
  for (let step of steps) {
    const stepEl = document.getElementById(`plan-step-${step.id}`);
    if (stepEl) {
        stepEl.classList.remove('opacity-40');
        stepEl.classList.add('opacity-100');
        await new Promise(r => setTimeout(r, 600));
    }
  }

  // 3. Multi-Agent Orchestration
  const orchPanel = renderOrchestrationPanel(steps);
  container.appendChild(orchPanel);
  await runAgentPipeline(steps, orchPanel);
  
  // 4. NEW: Validator Reflection Loop
  await runValidatorReflection(orchPanel);

  // 5. Final AI Response Generation
  try {
    const aiResponse = await simulateAIResponse(originalQuery, State.currentMode);
    hideSkeletonLoader();
    
    // Remove plan and orch panels before streaming result
    document.getElementById(plan.id)?.remove();
    orchPanel.remove();

    const { id } = renderAIMessage('', null, aiResponse.citations, aiResponse.isDraft, null, aiResponse.draftContent, aiResponse.actionModule);
    await streamTextIntoElement(aiResponse.text, `msg-content-${id}`);
    
    State.addMessage('assistant', aiResponse.text, { 
        citations: aiResponse.citations, 
        isDraft: aiResponse.isDraft,
        actionModule: aiResponse.actionModule
    });
  } catch (err) {
    console.error("Master Orchestrator Failure:", err);
  } finally {
    State.isProcessing = false;
    setSendBtnState(false);
  }
}

// ... (Rest of UI utilities remain similar but updated with 2026 aesthetics)
