import { allSquares, isLightSquare, randomChoice, speakableSquare } from '../utils/chess.js';
import { speak, cancelSpeech } from '../utils/speech.js';

const EXCLUDED = new Set(['a1', 'h1', 'a8', 'h8']);
const POOL = allSquares().filter(s => !EXCLUDED.has(s));
const TOTAL = 10;
const FEEDBACK_MS = 1500;

export default class SquareColorDrill {
  constructor(container) {
    this.container = container;
    this._timer = null;
    this._stopped = false;
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
    this.container.innerHTML = '';
  }

  _render() {
    this.container.innerHTML = `
      <div class="sc-prompt" aria-live="polite"></div>
      <div class="sc-buttons">
        <button class="btn btn-xl" data-answer="light">Light Square</button>
        <button class="btn btn-xl" data-answer="dark">Dark Square</button>
      </div>
      <div class="drill-feedback" aria-live="polite"></div>
      <div class="drill-tally"></div>
    `;
    this.promptEl = this.container.querySelector('.sc-prompt');
    this.feedbackEl = this.container.querySelector('.drill-feedback');
    this.tallyEl = this.container.querySelector('.drill-tally');
    this.buttonsEl = this.container.querySelector('.sc-buttons');
    this.buttonsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-answer]');
      if (btn) this._answer(btn.dataset.answer);
    });
    this._updateTally();
  }

  _updateTally() {
    this.tallyEl.textContent = `${this.correct}/${this.answered} correct`;
  }

  _next() {
    if (this._stopped) return;
    if (this.answered >= TOTAL) { this._showEnd(); return; }

    this.current = randomChoice(POOL);
    this.feedbackEl.textContent = '';
    this.feedbackEl.className = 'drill-feedback';
    this._setButtonsDisabled(false);
    this.promptEl.textContent = this.current;
    const { ok } = speak(speakableSquare(this.current));
    if (!ok) this.promptEl.classList.add('sc-prompt-fallback');
  }

  _answer(choice) {
    if (this._stopped) return;
    this._setButtonsDisabled(true);
    cancelSpeech();

    const truth = isLightSquare(this.current) ? 'light' : 'dark';
    const right = choice === truth;
    this.answered += 1;
    if (right) this.correct += 1;

    this.feedbackEl.textContent = right ? '✓ Correct' : `✗ Wrong — ${truth}`;
    this.feedbackEl.className = `drill-feedback ${right ? 'ok' : 'bad'}`;
    this._updateTally();

    this._timer = setTimeout(() => this._next(), FEEDBACK_MS);
  }

  _setButtonsDisabled(disabled) {
    this.buttonsEl.querySelectorAll('button').forEach(b => { b.disabled = disabled; });
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
