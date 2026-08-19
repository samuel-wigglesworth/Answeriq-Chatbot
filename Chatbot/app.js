/* ── app.js — AnswerIQ Subjective Answer Chatbot ─────────────────── */

// ─── Constants ──────────────────────────────────────────────────────
const DEFAULT_API_URL = 'http://localhost:5000/evaluate';

// ─── State ──────────────────────────────────────────────────────────
let sessionHistory = JSON.parse(localStorage.getItem('sb_history') || '[]');
let currentApiKey  = localStorage.getItem('sb_api_key') || '';
let currentApiUrl  = localStorage.getItem('sb_api_url') || '';

// ─── DOM refs ────────────────────────────────────────────────────────
const questionInput    = document.getElementById('question_input');
const referenceInput   = document.getElementById('reference_answer');
const userAnswerInput  = document.getElementById('user_answer_1');
const submitBtn        = document.getElementById('submit-btn');
const resetBtn         = document.getElementById('reset-btn');
const clearHistBtn     = document.getElementById('clear-hist-btn');
const scoreSection     = document.getElementById('score-section');
const errorBanner      = document.getElementById('error-banner');
const errorText        = document.getElementById('error-text');
const warningBanner    = document.getElementById('warning-banner');
const charCount        = document.getElementById('char-count');
const historySection   = document.getElementById('history-section');
const historyList      = document.getElementById('history-list');
const chatSection      = document.getElementById('chat-section');
const chatMessages     = document.getElementById('chat-messages');
const chatForm         = document.getElementById('chat-form');
const chatInput        = document.getElementById('chat-input');

// Score ring elements
const ringFill        = document.getElementById('ring-fill');
const scoreNumber     = document.getElementById('score-number');
const scoreGrade      = document.getElementById('score-grade');
const scoreSubtitle   = document.getElementById('score-subtitle');
const breakdownGrid   = document.getElementById('breakdown-grid');
const suggestionList  = document.getElementById('suggestion-list');
const missingSection  = document.getElementById('missing-section');
const missingTags     = document.getElementById('missing-tags');

// Settings modal
const settingsBtn       = document.getElementById('settings-btn');
const settingsModal     = document.getElementById('settings-modal');
const apiKeyInput       = document.getElementById('api-key-input');
const apiUrlInput       = document.getElementById('api-url-input');
const saveSettingsBtn   = document.getElementById('save-settings-btn');
const cancelSettingsBtn = document.getElementById('cancel-settings-btn');

// Ring geometry
const RING_R  = 44;
const RING_C  = 2 * Math.PI * RING_R;

// ─── Init ────────────────────────────────────────────────────────────
(function init() {
  ringFill.setAttribute('stroke-dasharray', RING_C);
  ringFill.setAttribute('stroke-dashoffset', RING_C);

  const metaUrl = document.querySelector('meta[name="evaluate-api-url"]')?.content?.trim();
  if (metaUrl && metaUrl !== '__EVALUATE_API_URL__') {
    currentApiUrl = metaUrl;
  }
  if (!currentApiUrl) currentApiUrl = DEFAULT_API_URL;

  renderHistory();
  checkApiWarning();
})();

function getApiUrl() {
  return (currentApiUrl || DEFAULT_API_URL).replace(/\/$/, '');
}

function checkApiWarning() {
  if (!getApiUrl()) {
    showWarning('No evaluator API URL set. Click ⚙ Settings and add your Python/Lambda endpoint.');
  } else {
    hideWarning();
  }
}

// ─── Char counter ────────────────────────────────────────────────────
userAnswerInput.addEventListener('input', () => {
  const len = userAnswerInput.value.length;
  charCount.textContent = `${len} character${len !== 1 ? 's' : ''}`;
});

// ─── Settings ────────────────────────────────────────────────────────
settingsBtn.addEventListener('click', () => {
  apiKeyInput.value = currentApiKey;
  apiUrlInput.value = currentApiUrl;
  settingsModal.classList.add('open');
});
cancelSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('open'));
settingsModal.addEventListener('click', e => {
  if (e.target === settingsModal) settingsModal.classList.remove('open');
});
saveSettingsBtn.addEventListener('click', () => {
  currentApiKey = apiKeyInput.value.trim();
  currentApiUrl = apiUrlInput.value.trim() || DEFAULT_API_URL;
  localStorage.setItem('sb_api_key', currentApiKey);
  localStorage.setItem('sb_api_url', currentApiUrl);
  settingsModal.classList.remove('open');
  checkApiWarning();
});

// ─── Submit ──────────────────────────────────────────────────────────
submitBtn.addEventListener('click', () => runEvaluation(userAnswerInput.value.trim()));

chatForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  userAnswerInput.value = text;
  charCount.textContent = `${text.length} character${text.length !== 1 ? 's' : ''}`;
  runEvaluation(text);
  chatInput.value = '';
});

async function runEvaluation(userAns) {
  clearErrors();

  const question  = questionInput.value.trim();
  const reference = referenceInput.value.trim();

  if (!question)  return showError('Please enter a question (Field A).');
  if (!reference) return showError('Please enter the reference answer (Field B).');
  if (!userAns)   return showError('Please type your answer before submitting.');

  chatSection.classList.remove('hidden');
  addChatMessage('user', userAns);
  addChatMessage('bot', 'Evaluating your answer with Python context matching…', 'typing');

  setLoading(true);
  scoreSection.classList.remove('visible');

  try {
    const result = await evaluateAnswer(question, reference, userAns);
    removeTypingMessage();
    renderResult(result, question, userAns);
    renderChatResult(result);
    saveToHistory(question, userAns, result.score);
  } catch (err) {
    removeTypingMessage();
    addChatMessage('bot', `Error: ${err.message || 'Evaluation failed.'}`);
    showError('Error: ' + (err.message || 'Something went wrong. Is the Python server running?'));
  } finally {
    setLoading(false);
  }
}

// ─── Reset ───────────────────────────────────────────────────────────
resetBtn.addEventListener('click', () => {
  questionInput.value   = '';
  referenceInput.value  = '';
  userAnswerInput.value = '';
  charCount.textContent = '0 characters';
  scoreSection.classList.remove('visible');
  resetChat();
  clearErrors();
  questionInput.focus();
});

// ─── Clear History ────────────────────────────────────────────────────
clearHistBtn && clearHistBtn.addEventListener('click', () => {
  sessionHistory = [];
  localStorage.removeItem('sb_history');
  renderHistory();
});

// ─── Python Evaluator API ─────────────────────────────────────────────
async function evaluateAnswer(question, reference, userAnswer) {
  const url = getApiUrl();
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      reference_answer: reference,
      user_answer_1: userAnswer,
      gemini_api_key: currentApiKey || undefined,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return data;
}

// ─── Chat UI ──────────────────────────────────────────────────────────
function resetChat() {
  chatMessages.innerHTML = '';
  chatSection.classList.add('hidden');
}

function addChatMessage(role, text, extraClass = '') {
  const div = document.createElement('div');
  div.className = `chat-msg chat-msg-${role} ${extraClass}`;
  div.innerHTML = `
    <div class="chat-avatar">${role === 'bot' ? '✦' : 'You'}</div>
    <div class="chat-bubble">${esc(text).replace(/\n/g, '<br>')}</div>
  `;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function removeTypingMessage() {
  const typing = chatMessages.querySelector('.typing');
  if (typing) typing.remove();
}

function renderChatResult(result) {
  const score = Math.max(0, Math.min(10, parseInt(result.score) || 0));
  const suggestions = (result.suggestions || []).map((s, i) => `${i + 1}. ${s}`).join('\n');
  const missing = (result.missing_points || []).filter(Boolean);

  let text = `Score: ${score}/10 — ${result.grade || gradeFromScore(score)}\n\n`;
  text += result.summary || '';
  if (result.similarity != null) {
    text += `\n\nContext similarity: ${(result.similarity * 100).toFixed(1)}%`;
  }
  if (missing.length) {
    text += `\n\nMissing key points: ${missing.join(', ')}`;
  }
  text += `\n\nSuggestions:\n${suggestions}`;

  addChatMessage('bot', text);
}

// ─── Render Result ────────────────────────────────────────────────────
function renderResult(result, question, userAnswer) {
  const score = Math.max(0, Math.min(10, parseInt(result.score) || 0));

  const offset = RING_C - (RING_C * score / 10);
  ringFill.style.strokeDashoffset = offset;

  let strokeColor, numberColor;
  if (score >= 8) {
    strokeColor = 'url(#grad-green)';
    numberColor = '#34d399';
  } else if (score >= 5) {
    strokeColor = 'url(#grad-amber)';
    numberColor = '#fbbf24';
  } else {
    strokeColor = 'url(#grad-red)';
    numberColor = '#f87171';
  }
  ringFill.style.stroke = strokeColor;
  scoreNumber.style.color = numberColor;
  scoreNumber.textContent = score;

  scoreGrade.textContent    = result.grade || gradeFromScore(score);
  scoreSubtitle.textContent = result.summary || '';

  breakdownGrid.innerHTML = (result.breakdown || []).map(b => `
    <div class="breakdown-item">
      <span class="breakdown-name">${esc(b.name)}</span>
      <span class="breakdown-score">${esc(b.score)}</span>
    </div>
  `).join('');

  suggestionList.innerHTML = (result.suggestions || []).map((s, i) => `
    <li class="suggestion-item" style="animation-delay:${i * 0.09}s">
      <span class="suggestion-bullet">→</span>
      <span>${esc(s)}</span>
    </li>
  `).join('');

  const missing = (result.missing_points || []).filter(m => m && m.trim());
  if (missing.length) {
    missingTags.innerHTML = missing.map(m => `<span class="missing-tag">${esc(m)}</span>`).join('');
    missingSection.classList.remove('hidden');
  } else {
    missingSection.classList.add('hidden');
  }

  scoreSection.classList.add('visible');
  scoreSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ─── History ──────────────────────────────────────────────────────────
function saveToHistory(question, answer, score) {
  const entry = {
    id:       Date.now(),
    question: question.slice(0, 120),
    answer:   answer.slice(0, 200),
    score:    parseInt(score) || 0,
    time:     new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  sessionHistory.unshift(entry);
  if (sessionHistory.length > 20) sessionHistory.pop();
  localStorage.setItem('sb_history', JSON.stringify(sessionHistory));
  renderHistory();
}

function renderHistory() {
  if (!historySection) return;
  if (sessionHistory.length === 0) {
    historySection.classList.add('hidden');
    return;
  }
  historySection.classList.remove('hidden');
  historyList.innerHTML = sessionHistory.map(entry => {
    const color = entry.score >= 8 ? '#10b981' : entry.score >= 5 ? '#f59e0b' : '#ef4444';
    return `
      <div class="history-item" onclick="reloadEntry(${entry.id})" title="Click to reload">
        <div class="history-score" style="background:${color}22;color:${color};border:1px solid ${color}44">
          ${entry.score}/10
        </div>
        <div class="history-q">${esc(entry.question)}</div>
        <div class="history-time">${esc(entry.time)}</div>
      </div>`;
  }).join('');
}

function reloadEntry(id) {
  const entry = sessionHistory.find(e => e.id === id);
  if (!entry) return;
  questionInput.value    = entry.question;
  userAnswerInput.value  = entry.answer;
  charCount.textContent  = `${entry.answer.length} characters`;
  scoreSection.classList.remove('visible');
  questionInput.scrollIntoView({ behavior: 'smooth' });
}

// ─── UI Helpers ───────────────────────────────────────────────────────
function setLoading(on) {
  submitBtn.disabled = on;
  submitBtn.innerHTML = on
    ? `<span class="spinner"></span> Evaluating…`
    : `<span>✦</span> Evaluate My Answer`;
}

function showError(msg) {
  errorText.textContent = msg;
  errorBanner.classList.remove('hidden');
  errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showWarning(msg) {
  warningBanner.querySelector('.alert-text').textContent = msg;
  warningBanner.classList.remove('hidden');
}

function hideWarning() { warningBanner.classList.add('hidden'); }

function clearErrors() {
  errorBanner.classList.add('hidden');
  errorText.textContent = '';
}

function gradeFromScore(score) {
  if (score >= 9) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Satisfactory';
  if (score >= 3) return 'Needs Improvement';
  return 'Poor';
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
