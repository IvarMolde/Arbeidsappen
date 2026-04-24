import type { GeneratedContent, DesignProfile, Oppgave, FagTekst } from '@/types'

export function generateHtml(content: GeneratedContent, design: DesignProfile): string {
  const { fagTekster, oppgaver, wordList, company, level, motherTongue } = content

  const levelColors: Record<string, string> = {
    A1: '#16a34a',
    A2: '#2563eb',
    B1: '#7c3aed',
  }
  const levelColor = levelColors[level] || '#2563eb'

  const primaryColor = design.primaryColor || '#1a56db'
  const secondaryColor = design.secondaryColor || '#e1effe'
  const accentColor = design.accentColor || '#f59e0b'

  const allSections: string[] = []

  // Word list section
  allSections.push(`
    <section class="card wordlist-section" id="section-ordliste">
      <div class="section-header">
        <span class="section-icon">📖</span>
        <h2>Ordliste / Vocabulary</h2>
        <span class="level-badge">${level}</span>
      </div>
      <div class="wordlist-grid">
        ${wordList.map((item, i) => `
          <div class="word-card" style="animation-delay: ${i * 0.05}s">
            <div class="word-norwegian">${item.norwegian}</div>
            <div class="word-translation">${item.translation}</div>
            <div class="word-explanation">${item.explanation}</div>
          </div>
        `).join('')}
      </div>
    </section>
  `)

  // Fagtekster with oppgaver
  fagTekster.forEach((tekst, tIdx) => {
    const tekOppgaver = oppgaver[tIdx] || []

    allSections.push(`
      <section class="card text-section" id="section-tekst-${tIdx + 1}">
        <div class="section-header">
          <span class="section-icon">📝</span>
          <h2>Fagtekst ${tIdx + 1}: ${escHtml(tekst.title)}</h2>
        </div>
        <div class="fagtext-body">${escHtml(tekst.content).replace(/\n/g, '<br>')}</div>
        ${tekst.vocabulary.length > 0 ? `
          <div class="inline-vocab">
            <h4>🔑 Nøkkelord i denne teksten</h4>
            <div class="vocab-chips">
              ${tekst.vocabulary.map(v => `
                <div class="vocab-chip" title="${escHtml(v.explanation)}">
                  <span class="chip-no">${escHtml(v.norwegian)}</span>
                  <span class="chip-arrow">→</span>
                  <span class="chip-tr">${escHtml(v.translation)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </section>
    `)

    if (tekOppgaver.length > 0) {
      allSections.push(`
        <section class="card tasks-section" id="section-oppgaver-${tIdx + 1}">
          <div class="section-header">
            <span class="section-icon">✏️</span>
            <h2>Oppgaver til Fagtekst ${tIdx + 1}</h2>
          </div>
          ${tekOppgaver.map((o, oIdx) => renderOppgave(o, oIdx, tIdx)).join('')}
        </section>
      `)
    }
  })

  const logoHtml = design.logoUrl
    ? `<img src="${design.logoUrl}" alt="${escHtml(design.companyName)} logo" class="company-logo">`
    : `<div class="company-logo-placeholder">${design.companyName.charAt(0)}</div>`

  return `<!DOCTYPE html>
<html lang="no">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Norskopplæring – ${escHtml(company.name)} – Nivå ${level}</title>
<style>
  :root {
    --primary: ${primaryColor};
    --secondary: ${secondaryColor};
    --accent: ${accentColor};
    --level-color: ${levelColor};
    --text: #1e293b;
    --text-muted: #64748b;
    --bg: #f8fafc;
    --card-bg: #ffffff;
    --border: #e2e8f0;
    --radius: 12px;
    --shadow: 0 2px 8px rgba(0,0,0,0.08);
    --shadow-hover: 0 8px 24px rgba(0,0,0,0.14);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.7;
    font-size: 16px;
  }

  /* HERO HEADER */
  .hero {
    background: linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 70%, var(--accent)) 100%);
    color: white;
    padding: 2.5rem 1.5rem;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute; inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    pointer-events: none;
  }
  .hero-inner { position: relative; max-width: 700px; margin: 0 auto; }
  .company-logo { height: 60px; max-width: 200px; object-fit: contain; margin-bottom: 1rem; filter: brightness(0) invert(1); }
  .company-logo-placeholder {
    width: 60px; height: 60px; border-radius: 12px;
    background: rgba(255,255,255,0.2); margin: 0 auto 1rem;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.8rem; font-weight: 800; color: white;
  }
  .hero h1 { font-size: clamp(1.4rem, 4vw, 2rem); font-weight: 800; margin-bottom: 0.5rem; }
  .hero-meta { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin-top: 1rem; }
  .meta-badge {
    background: rgba(255,255,255,0.2); backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.3);
    padding: 0.35rem 0.9rem; border-radius: 99px;
    font-size: 0.85rem; font-weight: 600;
  }

  /* NAV */
  .nav-bar {
    background: white; border-bottom: 1px solid var(--border);
    padding: 0.75rem 1.5rem; position: sticky; top: 0; z-index: 100;
    display: flex; gap: 0.5rem; overflow-x: auto;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .nav-btn {
    background: none; border: 1px solid var(--border); color: var(--text);
    padding: 0.4rem 0.9rem; border-radius: 99px; font-size: 0.82rem;
    cursor: pointer; white-space: nowrap; transition: all 0.2s;
  }
  .nav-btn:hover { background: var(--primary); color: white; border-color: var(--primary); }

  /* MAIN LAYOUT */
  .main { max-width: 820px; margin: 0 auto; padding: 1.5rem 1rem 4rem; }

  /* CARDS */
  .card {
    background: var(--card-bg); border-radius: var(--radius);
    border: 1px solid var(--border); box-shadow: var(--shadow);
    padding: 1.75rem; margin-bottom: 1.5rem;
    animation: fadeUp 0.4s ease both;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .section-header {
    display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;
    padding-bottom: 0.75rem; border-bottom: 2px solid var(--secondary);
  }
  .section-icon { font-size: 1.4rem; }
  .section-header h2 { font-size: 1.15rem; font-weight: 700; color: var(--primary); flex: 1; }
  .level-badge {
    background: var(--level-color); color: white;
    padding: 0.2rem 0.7rem; border-radius: 99px; font-size: 0.8rem; font-weight: 700;
  }

  /* WORD LIST */
  .wordlist-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
  .word-card {
    background: var(--secondary); border-radius: 8px; padding: 0.85rem;
    border-left: 3px solid var(--primary); animation: fadeUp 0.4s ease both;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .word-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-hover); }
  .word-norwegian { font-weight: 700; font-size: 1rem; color: var(--primary); }
  .word-translation { font-size: 0.9rem; color: var(--text-muted); margin-top: 0.2rem; font-style: italic; }
  .word-explanation { font-size: 0.82rem; color: var(--text-muted); margin-top: 0.3rem; }

  /* FAGTEKST */
  .fagtext-body {
    background: #f8faff; border-left: 4px solid var(--primary);
    padding: 1.25rem 1.5rem; border-radius: 0 8px 8px 0;
    font-size: 1rem; line-height: 1.8; color: var(--text);
    margin-bottom: 1rem;
  }
  .inline-vocab { margin-top: 1rem; }
  .inline-vocab h4 { font-size: 0.9rem; font-weight: 700; margin-bottom: 0.6rem; color: var(--text-muted); }
  .vocab-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .vocab-chip {
    display: flex; align-items: center; gap: 0.4rem;
    background: white; border: 1px solid var(--border);
    padding: 0.3rem 0.7rem; border-radius: 99px; font-size: 0.82rem;
    cursor: help; transition: background 0.2s;
  }
  .vocab-chip:hover { background: var(--secondary); }
  .chip-no { font-weight: 700; color: var(--primary); }
  .chip-arrow { color: var(--text-muted); }
  .chip-tr { color: var(--text-muted); font-style: italic; }

  /* TASKS */
  .task-block { margin-bottom: 1.75rem; }
  .task-header {
    display: flex; align-items: center; gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .task-number {
    background: var(--primary); color: white;
    width: 2rem; height: 2rem; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 0.9rem; flex-shrink: 0;
  }
  .task-title { font-weight: 700; font-size: 1rem; }
  .task-instruction { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem; }
  .task-type-badge {
    display: inline-block; background: var(--secondary); color: var(--primary);
    padding: 0.2rem 0.6rem; border-radius: 99px; font-size: 0.75rem;
    font-weight: 600; margin-bottom: 0.75rem;
  }

  /* SUBTASK */
  .subtask { margin-bottom: 1rem; padding: 0.85rem 1rem; background: var(--bg); border-radius: 8px; border: 1px solid var(--border); }
  .subtask-letter { font-weight: 800; color: var(--accent); margin-right: 0.5rem; }
  .subtask-question { font-size: 0.95rem; margin-bottom: 0.5rem; }

  /* Multiple choice */
  .mc-options { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; }
  .mc-option {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.6rem 0.9rem; border-radius: 8px;
    border: 2px solid var(--border); cursor: pointer;
    transition: all 0.2s; background: white;
  }
  .mc-option:hover { border-color: var(--primary); background: var(--secondary); }
  .mc-option.correct { border-color: #16a34a; background: #f0fdf4; }
  .mc-option.incorrect { border-color: #dc2626; background: #fef2f2; }
  .mc-option.disabled { pointer-events: none; }
  .mc-dot {
    width: 1.1rem; height: 1.1rem; border-radius: 50%;
    border: 2px solid currentColor; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }

  /* Fill in blank */
  .fib-container { display: flex; flex-wrap: wrap; gap: 0.3rem; align-items: center; line-height: 2; }
  .fib-input {
    border: none; border-bottom: 2px solid var(--primary);
    padding: 0.1rem 0.3rem; font-size: 0.95rem;
    background: transparent; outline: none; min-width: 80px;
    color: var(--text); font-family: inherit;
  }
  .fib-input.correct { border-color: #16a34a; color: #16a34a; }
  .fib-input.incorrect { border-color: #dc2626; color: #dc2626; }

  /* Sort words */
  .sort-bank { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
  .sort-word {
    background: var(--secondary); border: 1.5px dashed var(--primary);
    padding: 0.3rem 0.75rem; border-radius: 99px; cursor: grab;
    font-size: 0.9rem; user-select: none; transition: all 0.2s;
  }
  .sort-word:hover { background: var(--primary); color: white; }
  .sort-word.used { opacity: 0.3; pointer-events: none; }
  .sort-answer { min-height: 2.5rem; display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; background: white; border: 1.5px dashed var(--border); border-radius: 8px; padding: 0.4rem; }
  .sort-answer .sort-word { cursor: pointer; }

  /* True/False */
  .tf-buttons { display: flex; gap: 0.75rem; margin-top: 0.5rem; }
  .tf-btn {
    flex: 1; padding: 0.6rem; border-radius: 8px; border: 2px solid var(--border);
    cursor: pointer; font-weight: 700; font-size: 0.9rem; transition: all 0.2s;
    background: white;
  }
  .tf-btn:hover { transform: translateY(-1px); }
  .tf-btn.sant:hover { border-color: #16a34a; background: #f0fdf4; color: #16a34a; }
  .tf-btn.usant:hover { border-color: #dc2626; background: #fef2f2; color: #dc2626; }
  .tf-btn.selected-correct { border-color: #16a34a; background: #f0fdf4; color: #16a34a; }
  .tf-btn.selected-incorrect { border-color: #dc2626; background: #fef2f2; color: #dc2626; }

  /* Text input */
  .free-input {
    width: 100%; padding: 0.7rem 0.9rem; border-radius: 8px;
    border: 1.5px solid var(--border); font-family: inherit;
    font-size: 0.95rem; resize: vertical; min-height: 80px;
    outline: none; transition: border-color 0.2s;
  }
  .free-input:focus { border-color: var(--primary); }

  /* Check button */
  .check-btn {
    background: var(--primary); color: white; border: none;
    padding: 0.5rem 1.2rem; border-radius: 8px; cursor: pointer;
    font-size: 0.9rem; font-weight: 600; margin-top: 0.75rem;
    transition: all 0.2s;
  }
  .check-btn:hover { background: color-mix(in srgb, var(--primary) 80%, black); transform: translateY(-1px); }

  .feedback {
    margin-top: 0.5rem; padding: 0.5rem 0.75rem; border-radius: 6px;
    font-size: 0.88rem; font-weight: 600; display: none;
  }
  .feedback.correct { background: #f0fdf4; color: #15803d; display: block; }
  .feedback.incorrect { background: #fef2f2; color: #dc2626; display: block; }

  /* PROGRESS */
  .progress-bar { position: fixed; bottom: 0; left: 0; right: 0; height: 6px; background: var(--border); z-index: 200; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); transition: width 0.5s ease; }

  /* SCORE */
  .score-display {
    position: fixed; bottom: 1.5rem; right: 1.5rem;
    background: white; border: 2px solid var(--primary);
    border-radius: 12px; padding: 0.75rem 1rem;
    box-shadow: var(--shadow-hover); font-weight: 700; font-size: 0.9rem;
    color: var(--primary); z-index: 200;
  }

  /* PRINT */
  @media print {
    .nav-bar, .progress-bar, .score-display, .check-btn { display: none !important; }
    .card { break-inside: avoid; box-shadow: none; border: 1px solid #ccc; }
    body { background: white; }
    .hero { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }

  /* RESPONSIVE */
  @media (max-width: 600px) {
    .hero { padding: 1.75rem 1rem; }
    .card { padding: 1.25rem; }
    .wordlist-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
    .tf-buttons { flex-direction: column; }
    .hero h1 { font-size: 1.3rem; }
  }
</style>
</head>
<body>

<div class="hero">
  <div class="hero-inner">
    ${logoHtml}
    <h1>Norskopplæring – ${escHtml(company.name)}</h1>
    <div class="hero-meta">
      <span class="meta-badge">Nivå ${level}</span>
      <span class="meta-badge">Morsmål: ${escHtml(motherTongue)}</span>
      <span class="meta-badge">${fagTekster.length} fagtekster</span>
    </div>
  </div>
</div>

<nav class="nav-bar" aria-label="Navigasjon">
  <button class="nav-btn" onclick="scrollToSection('section-ordliste')">📖 Ordliste</button>
  ${fagTekster.map((t, i) => `
    <button class="nav-btn" onclick="scrollToSection('section-tekst-${i + 1}')">📝 Tekst ${i + 1}</button>
    <button class="nav-btn" onclick="scrollToSection('section-oppgaver-${i + 1}')">✏️ Oppg. ${i + 1}</button>
  `).join('')}
</nav>

<main class="main">
  ${allSections.join('\n')}
</main>

<div class="progress-bar"><div class="progress-fill" id="progress" style="width:0%"></div></div>
<div class="score-display" id="scoreDisplay">🎯 <span id="scoreText">0 / 0</span></div>

<script>
// Navigation
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Progress tracking
let correct = 0, total = 0;

function updateScore(isCorrect) {
  total++;
  if (isCorrect) correct++;
  document.getElementById('scoreText').textContent = correct + ' / ' + total;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  document.getElementById('progress').style.width = pct + '%';
}

// Multiple choice
function checkMC(btn, answer, taskId) {
  const container = btn.closest('.mc-options');
  if (container.dataset.answered) return;
  container.dataset.answered = 'true';

  const isCorrect = btn.dataset.value === answer;
  btn.classList.add(isCorrect ? 'correct' : 'incorrect');

  if (!isCorrect) {
    container.querySelectorAll('.mc-option').forEach(b => {
      if (b.dataset.value === answer) b.classList.add('correct');
    });
  }

  container.querySelectorAll('.mc-option').forEach(b => b.classList.add('disabled'));

  const fb = document.getElementById('fb-' + taskId);
  if (fb) {
    fb.textContent = isCorrect ? '✅ Riktig!' : '❌ Feil. Riktig svar: ' + answer;
    fb.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');
  }
  updateScore(isCorrect);
}

// True/False
function checkTF(btn, correct_answer, taskId) {
  const container = btn.closest('.tf-buttons');
  if (container.dataset.answered) return;
  container.dataset.answered = 'true';

  const isCorrect = btn.dataset.value === correct_answer;
  btn.classList.add(isCorrect ? 'selected-correct' : 'selected-incorrect');
  container.querySelectorAll('.tf-btn').forEach(b => b.style.pointerEvents = 'none');

  const fb = document.getElementById('fb-' + taskId);
  if (fb) {
    fb.textContent = isCorrect ? '✅ Riktig!' : '❌ Feil. Riktig svar: ' + correct_answer;
    fb.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');
  }
  updateScore(isCorrect);
}

// Fill in blank
function checkFIB(btn, taskId, answers) {
  const container = btn.closest('.subtask');
  const inputs = container.querySelectorAll('.fib-input');
  let allCorrect = true;
  inputs.forEach((input, i) => {
    const correct = (answers[i] || '').toLowerCase().trim();
    const val = input.value.toLowerCase().trim();
    const ok = val === correct;
    input.classList.remove('correct', 'incorrect');
    input.classList.add(ok ? 'correct' : 'incorrect');
    if (!ok) allCorrect = false;
  });
  const fb = document.getElementById('fb-' + taskId);
  if (fb) {
    fb.textContent = allCorrect ? '✅ Riktig!' : '❌ Sjekk svarene dine. Riktig: ' + answers.join(', ');
    fb.className = 'feedback ' + (allCorrect ? 'correct' : 'incorrect');
  }
  updateScore(allCorrect);
}

// Sort words
function initSortWords() {
  document.querySelectorAll('.sort-bank').forEach(bank => {
    bank.querySelectorAll('.sort-word').forEach(word => {
      word.addEventListener('click', function() {
        const taskId = bank.dataset.task;
        const answerEl = document.getElementById('sort-answer-' + taskId);
        if (!answerEl || word.classList.contains('used')) return;
        word.classList.add('used');
        const clone = word.cloneNode(true);
        clone.classList.remove('used');
        clone.addEventListener('click', function() {
          word.classList.remove('used');
          clone.remove();
        });
        answerEl.appendChild(clone);
      });
    });
  });
}

function checkSort(btn, taskId, correctAnswer) {
  const answerEl = document.getElementById('sort-answer-' + taskId);
  if (!answerEl) return;
  const words = Array.from(answerEl.querySelectorAll('.sort-word')).map(w => w.textContent.trim());
  const isCorrect = words.join(' ').toLowerCase() === correctAnswer.toLowerCase();
  const fb = document.getElementById('fb-' + taskId);
  if (fb) {
    fb.textContent = isCorrect ? '✅ Riktig rekkefølge!' : '❌ Feil. Riktig: ' + correctAnswer;
    fb.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');
  }
  updateScore(isCorrect);
}

document.addEventListener('DOMContentLoaded', function() {
  initSortWords();
});
</script>
</body>
</html>`
}

function renderOppgave(o: Oppgave, oIdx: number, tIdx: number): string {
  const typeLabels: Record<string, string> = {
    leseforstaelse: 'Leseforståelse',
    fyll_inn_blank: 'Fyll inn blankt',
    sorter_ord: 'Sorter ordene',
    riktig_pastand: 'Finn riktig påstand',
    setningsstruktur: 'Setningsstruktur',
    multiple_choice: 'Flervalg',
    sant_usant: 'Sant / Usant',
    match_ord: 'Match ordene',
  }

  const subTasksHtml = o.subTasks.map((st) => {
    const taskId = `t${tIdx}-o${oIdx}-${st.letter}`
    return renderSubTask(st, taskId, o.type)
  }).join('')

  return `
    <div class="task-block">
      <div class="task-header">
        <div class="task-number">${o.number}</div>
        <div>
          <div class="task-title">${escHtml(o.title)}</div>
          <span class="task-type-badge">${typeLabels[o.type] || o.type}</span>
        </div>
      </div>
      <p class="task-instruction">${escHtml(o.instruction)}</p>
      ${subTasksHtml}
    </div>
  `
}

function renderSubTask(st: { letter: string; question: string; options?: string[]; answer: string }, taskId: string, type: string): string {
  const letterLabel = `<span class="subtask-letter">${st.letter})</span>`

  if (type === 'multiple_choice' || type === 'leseforstaelse' || type === 'riktig_pastand') {
    const opts = st.options || [st.answer, 'Alternativ B', 'Alternativ C']
    return `
      <div class="subtask">
        ${letterLabel}<span class="subtask-question">${escHtml(st.question)}</span>
        <div class="mc-options">
          ${opts.map(opt => `
            <div class="mc-option" data-value="${escHtml(opt)}" onclick="checkMC(this, '${escHtml(st.answer)}', '${taskId}')">
              <div class="mc-dot"></div>
              <span>${escHtml(opt)}</span>
            </div>
          `).join('')}
        </div>
        <div id="fb-${taskId}" class="feedback"></div>
      </div>`
  }

  if (type === 'sant_usant') {
    return `
      <div class="subtask">
        ${letterLabel}<span class="subtask-question">${escHtml(st.question)}</span>
        <div class="tf-buttons">
          <button class="tf-btn sant" data-value="Sant" onclick="checkTF(this, '${escHtml(st.answer)}', '${taskId}')">✅ Sant</button>
          <button class="tf-btn usant" data-value="Usant" onclick="checkTF(this, '${escHtml(st.answer)}', '${taskId}')">❌ Usant</button>
        </div>
        <div id="fb-${taskId}" class="feedback"></div>
      </div>`
  }

  if (type === 'fyll_inn_blank') {
    const parts = st.question.split('___')
    const answers = [st.answer]
    const fibHtml = parts.map((part, i) =>
      i < parts.length - 1
        ? `${escHtml(part)}<input class="fib-input" type="text" data-index="${i}" placeholder="..." autocomplete="off">`
        : escHtml(part)
    ).join('')
    return `
      <div class="subtask">
        ${letterLabel}
        <div class="fib-container">${fibHtml}</div>
        <button class="check-btn" onclick="checkFIB(this, '${taskId}', ${JSON.stringify(answers)})">Sjekk svar</button>
        <div id="fb-${taskId}" class="feedback"></div>
      </div>`
  }

  if (type === 'sorter_ord') {
    const words = st.question.split(' ')
    const shuffled = [...words].sort(() => Math.random() - 0.5)
    return `
      <div class="subtask">
        ${letterLabel}<span class="subtask-question">Sett ordene i riktig rekkefølge:</span>
        <div class="sort-bank" data-task="${taskId}">
          ${shuffled.map(w => `<div class="sort-word">${escHtml(w)}</div>`).join('')}
        </div>
        <div class="sort-answer" id="sort-answer-${taskId}"></div>
        <button class="check-btn" onclick="checkSort(this, '${taskId}', '${escHtml(st.answer)}')">Sjekk rekkefølge</button>
        <div id="fb-${taskId}" class="feedback"></div>
      </div>`
  }

  // Default: free text / setningsstruktur / match_ord
  return `
    <div class="subtask">
      ${letterLabel}<span class="subtask-question">${escHtml(st.question)}</span>
      <textarea class="free-input" placeholder="Skriv svaret ditt her..."></textarea>
    </div>`
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
