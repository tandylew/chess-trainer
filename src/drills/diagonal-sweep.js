import {
  diagonals, randomChoice, speakableSquare,
  parseSquareList, sameSquareSet,
} from '../utils/chess.js';
import { speak, cancelSpeech, createRecognizer, normalizeSquareSpeech } from '../utils/speech.js';

const TOTAL = 10;
const FEEDBACK_MS = 2500;
const DIAGONALS = diagonals(4);
const BLOCKERS = ['knight', 'bishop', 'pawn'];

function pickQuestion() {
  const diag = randomChoice(DIAGONALS);
  const blockerSq = randomChoice(diag.squares);
  const blocker = randomChoice(BLOCKERS);
  const unblocked = diag.squares.filter(s => s !== blockerSq);
  return { diagonal: diag, blockerSq, blocker, unblocked };
}

function diagonalSpeech(diag) {
  const [a, b] = diag.name.split('-');
  return `${speakableSquare(a)} to ${speakableSquare(b)}`;
}

export default class DiagonalSweepDrill {
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
               placeholder="e.g. a1 b2 c3 e5 f6 g7 h8" />
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
    this._setControlsDisabled(false);

    const { diagonal, blocker, blockerSq } = this.current;
    this.promptEl.textContent =
      `Name all squares on the ${diagonal.name} diagonal not blocked by a ${blocker} on ${blockerSq}.`;
    speak(
      `Name all squares on the ${diagonalSpeech(diagonal)} diagonal not blocked by a ${blocker} on ${speakableSquare(blockerSq)}`
    );
    this.inputEl.focus();
  }

  _toggleListening(btn) {
    if (this._listening) { this._stopListening(); return; }
    const r = createRecognizer({
      onResult: (text) => {
        const normalized = normalizeSquareSpeech(text);
        this.inputEl.value = this.inputEl.value
          ? `${this.inputEl.value} ${normalized}`.trim()
          : normalized;
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

    const guess = parseSquareList(this.inputEl.value);
    const { unblocked } = this.current;
    const right = sameSquareSet(guess, unblocked);

    this.answered += 1;
    if (right) this.correct += 1;

    const answer = unblocked.join(' ');
    this.feedbackEl.textContent = right
      ? `✓ Correct — ${answer}`
      : `✗ Incorrect — ${answer}`;
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
