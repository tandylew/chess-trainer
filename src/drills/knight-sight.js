import {
  allSquares, randomChoice, speakableSquare,
  knightShortestPath, knightDistance, isKnightMove,
} from '../utils/chess.js';
import { speak, cancelSpeech, createRecognizer, normalizeSquareSpeech } from '../utils/speech.js';

const TOTAL = 10;
const FEEDBACK_MS = 2000;
const MIN_DIST = 2;
const MAX_DIST = 5;

function pickQuestion() {
  const squares = allSquares();
  for (let i = 0; i < 200; i++) {
    const start = randomChoice(squares);
    const target = randomChoice(squares);
    if (start === target) continue;
    const d = knightDistance(start, target);
    if (d >= MIN_DIST && d <= MAX_DIST) {
      return { start, target, distance: d, path: knightShortestPath(start, target) };
    }
  }
  // Fallback: any non-trivial pair
  const start = 'a1', target = 'h8';
  return { start, target, distance: knightDistance(start, target), path: knightShortestPath(start, target) };
}

function parseAnswer(text) {
  const t = (text || '').trim().toLowerCase();
  if (!t) return { type: 'invalid' };
  if (/^\d+$/.test(t)) return { type: 'count', count: parseInt(t, 10) };
  const tokens = t.split(/[\s,\-]+|\bto\b/g).map(s => s.trim()).filter(Boolean);
  if (tokens.length && tokens.every(s => /^[a-h][1-8]$/.test(s))) {
    return { type: 'path', squares: tokens };
  }
  return { type: 'invalid' };
}

function validatePath(squares, start, target) {
  if (squares.length < 2) return { ok: false, reason: 'path too short' };
  if (squares[0] !== start) return { ok: false, reason: `path must start at ${start}` };
  if (squares[squares.length - 1] !== target) return { ok: false, reason: `path must end at ${target}` };
  for (let i = 1; i < squares.length; i++) {
    if (!isKnightMove(squares[i - 1], squares[i])) {
      return { ok: false, reason: `${squares[i - 1]}→${squares[i]} is not a knight move` };
    }
  }
  return { ok: true, moves: squares.length - 1 };
}

export default class KnightSightDrill {
  constructor(container) {
    this.container = container;
    this._timer = null;
    this._stopped = false;
    this._recognizer = null;
    this._listening = false;
  }

  start() {
    this._stopped = false;
    this.correct = 0;
    this.answered = 0;
    this._render();
    this._next();
  }

  stop() {
    this._stopped = true;
    clearTimeout(this._timer);
    this._timer = null;
    cancelSpeech();
    this._stopListening();
    this.container.innerHTML = '';
  }

  _render() {
    const srAvailable = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    this.container.innerHTML = `
      <div class="drill-prompt" aria-live="polite"></div>
      <div class="drill-input-row">
        <input class="drill-input" type="text" inputmode="text"
               autocapitalize="off" autocomplete="off" spellcheck="false"
               placeholder="e.g. 3  or  c3-e4-g5" />
        ${srAvailable ? `<button class="btn mic-btn" data-mic aria-label="Speak answer">🎤</button>` : ''}
        <button class="btn btn-primary" data-submit>Submit</button>
      </div>
      ${srAvailable ? '' : '<div class="drill-note">Speech input unavailable — type your answer.</div>'}
      <div class="drill-feedback" aria-live="polite"></div>
      <div class="drill-tally"></div>
    `;
    this.promptEl = this.container.querySelector('.drill-prompt');
    this.inputEl = this.container.querySelector('.drill-input');
    this.feedbackEl = this.container.querySelector('.drill-feedback');
    this.tallyEl = this.container.querySelector('.drill-tally');

    this.container.querySelector('[data-submit]').addEventListener('click', () => this._submit());
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._submit();
    });
    const micBtn = this.container.querySelector('[data-mic]');
    if (micBtn) micBtn.addEventListener('click', () => this._toggleListening(micBtn));

    this._updateTally();
  }

  _updateTally() {
    this.tallyEl.textContent = `${this.correct}/${this.answered} correct`;
  }

  _next() {
    if (this._stopped) return;
    if (this.answered >= TOTAL) { this._showEnd(); return; }

    this.current = pickQuestion();
    this.feedbackEl.textContent = '';
    this.feedbackEl.className = 'drill-feedback';
    this.inputEl.value = '';
    this.inputEl.disabled = false;
    this._setControlsDisabled(false);

    const { start, target } = this.current;
    this.promptEl.textContent = `Shortest knight path from ${start} to ${target} — how many moves?`;
    speak(`shortest knight path from ${speakableSquare(start)} to ${speakableSquare(target)}. How many moves?`);
    this.inputEl.focus();
  }

  _toggleListening(btn) {
    if (this._listening) { this._stopListening(); return; }
    const r = createRecognizer({
      onResult: (text) => {
        this.inputEl.value = normalizeSquareSpeech(text);
        this._stopListening();
      },
      onError: () => this._stopListening(),
    });
    if (!r) return;
    this._recognizer = r;
    this._listening = true;
    btn.classList.add('listening');
    try { r.start(); } catch { this._stopListening(); }
    r.onend = () => this._stopListening();
  }

  _stopListening() {
    this._listening = false;
    try { this._recognizer?.stop(); } catch { /* ignore */ }
    this._recognizer = null;
    const micBtn = this.container?.querySelector('[data-mic]');
    micBtn?.classList.remove('listening');
  }

  _submit() {
    if (this._stopped || !this.current) return;
    cancelSpeech();
    this._stopListening();

    const answer = parseAnswer(this.inputEl.value);
    const { start, target, distance, path } = this.current;
    let right = false;
    let msg = '';

    if (answer.type === 'count') {
      right = answer.count === distance;
    } else if (answer.type === 'path') {
      const v = validatePath(answer.squares, start, target);
      right = v.ok && v.moves === distance;
      if (!right && answer.squares[0] !== start) msg = `path must start at ${start}`;
    }

    this.answered += 1;
    if (right) this.correct += 1;

    const rightAnswer = `${distance} moves (${path.join('-')})`;
    this.feedbackEl.textContent = right ? `✓ Correct — ${distance} moves`
      : `✗ Incorrect — ${rightAnswer}${msg ? ` (${msg})` : ''}`;
    this.feedbackEl.className = `drill-feedback ${right ? 'ok' : 'bad'}`;
    this._updateTally();
    this._setControlsDisabled(true);

    this._timer = setTimeout(() => this._next(), FEEDBACK_MS);
  }

  _setControlsDisabled(disabled) {
    this.container.querySelectorAll('.drill-input-row button, .drill-input')
      .forEach(el => { el.disabled = disabled; });
  }

  _showEnd() {
    this.container.innerHTML = `
      <div class="drill-end">
        <div class="drill-end-score">Session complete: ${this.correct}/${TOTAL} correct</div>
        <button class="btn btn-primary" data-replay>Play again</button>
      </div>
    `;
    this.container.querySelector('[data-replay]').addEventListener('click', () => this.start());
  }
}
