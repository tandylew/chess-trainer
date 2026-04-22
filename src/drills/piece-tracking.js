import { randomChoice, speakableSquare } from '../utils/chess.js';
import { speak, cancelSpeech } from '../utils/speech.js';
import { STARTING_POSITION, applyMoves, pieceName } from '../utils/position.js';

const TOTAL = 10;
const FEEDBACK_MS = 1500;
const MOVE_PAUSE_MS = 1000;
const ALL_PIECE_NAMES = ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];

const LINES = [
  ['e2-e4', 'e7-e5', 'g1-f3', 'b8-c6', 'f1-b5'],
  ['e2-e4', 'c7-c5', 'g1-f3', 'd7-d6', 'd2-d4'],
  ['e2-e4', 'e7-e5', 'g1-f3', 'b8-c6', 'f1-c4'],
  ['e2-e4', 'e7-e5', 'g1-f3', 'g8-f6'],
  ['d2-d4', 'd7-d5', 'c2-c4', 'e7-e6'],
  ['d2-d4', 'g8-f6', 'c2-c4', 'e7-e6', 'b1-c3'],
  ['d2-d4', 'g8-f6', 'c2-c4', 'g7-g6', 'b1-c3'],
  ['e2-e4', 'c7-c6', 'd2-d4', 'd7-d5'],
  ['e2-e4', 'e7-e6', 'd2-d4', 'd7-d5'],
  ['c2-c4', 'e7-e5', 'b1-c3', 'g8-f6'],
  ['g1-f3', 'd7-d5', 'g2-g3', 'g8-f6'],
  ['e2-e4', 'e7-e5', 'f2-f4', 'e5-f4'],
  ['e2-e4', 'd7-d5', 'e4-d5', 'd8-d5'],
  ['d2-d4', 'f7-f5', 'g2-g3', 'g8-f6'],
  ['e2-e4', 'e7-e5', 'b1-c3', 'g8-f6'],
  ['e2-e4', 'c7-c5', 'b1-c3', 'b8-c6'],
  ['d2-d4', 'd7-d5', 'c1-f4', 'g8-f6'],
  ['e2-e4', 'e7-e5', 'g1-f3', 'd7-d6'],
];

function pickQuestion() {
  const line = randomChoice(LINES);
  const maxLen = Math.min(5, line.length);
  const minLen = Math.min(3, line.length);
  const len = minLen + Math.floor(Math.random() * (maxLen - minLen + 1));
  const moves = line.slice(0, len);
  const position = applyMoves(STARTING_POSITION, moves);

  const destinations = moves.map(m => m.split('-')[1]).filter(sq => position[sq]);
  const occupied = Object.keys(position);
  const square = (destinations.length && Math.random() < 0.7)
    ? randomChoice(destinations)
    : randomChoice(occupied);

  const correct = pieceName(position[square]);
  const pool = ALL_PIECE_NAMES.filter(p => p !== correct);
  const d1 = randomChoice(pool);
  const d2 = randomChoice(pool.filter(p => p !== d1));
  const options = [correct, d1, d2].sort(() => Math.random() - 0.5);

  return { moves, square, correct, options };
}

export default class PieceTrackingDrill {
  constructor(container) {
    this.container = container;
    this._timers = new Set();
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
    for (const t of this._timers) clearTimeout(t);
    this._timers.clear();
    cancelSpeech();
    this.container.innerHTML = '';
  }

  _setTimer(fn, ms) {
    if (this._stopped) return null;
    const t = setTimeout(() => {
      this._timers.delete(t);
      if (!this._stopped) fn();
    }, ms);
    this._timers.add(t);
    return t;
  }

  _render() {
    this.container.innerHTML = `
      <div class="pt-status" aria-live="polite"></div>
      <div class="pt-sequence" aria-live="polite"></div>
      <div class="pt-question" aria-live="polite"></div>
      <div class="pt-buttons"></div>
      <div class="drill-feedback" aria-live="polite"></div>
      <div class="drill-tally"></div>
    `;
    this.statusEl = this.container.querySelector('.pt-status');
    this.seqEl = this.container.querySelector('.pt-sequence');
    this.questionEl = this.container.querySelector('.pt-question');
    this.buttonsEl = this.container.querySelector('.pt-buttons');
    this.feedbackEl = this.container.querySelector('.drill-feedback');
    this.tallyEl = this.container.querySelector('.drill-tally');
    this.buttonsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-option]');
      if (btn) this._answer(btn.dataset.option);
    });
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
    this.questionEl.textContent = '';
    this.buttonsEl.innerHTML = '';
    this.seqEl.textContent = '';
    this.statusEl.textContent = `Listen: ${this.current.moves.length} moves coming up…`;
    this._playMove(0);
  }

  _playMove(idx) {
    if (this._stopped) return;
    const { moves } = this.current;
    if (idx >= moves.length) {
      this.statusEl.textContent = '';
      this._askQuestion();
      return;
    }
    const move = moves[idx];
    const [from, to] = move.split('-');
    this.statusEl.textContent = `Move ${idx + 1} of ${moves.length}`;
    this.seqEl.textContent = `${from} → ${to}`;
    speak(`${speakableSquare(from)} to ${speakableSquare(to)}`, {
      onEnd: () => this._setTimer(() => this._playMove(idx + 1), MOVE_PAUSE_MS),
    });
  }

  _askQuestion() {
    if (this._stopped) return;
    const { square, options } = this.current;
    this.seqEl.textContent = '';
    this.questionEl.textContent = `What piece is on ${square}?`;
    speak(`What piece is on ${speakableSquare(square)}?`);
    this.buttonsEl.innerHTML = options
      .map(opt => `<button class="btn btn-xl" data-option="${opt}">${opt}</button>`)
      .join('');
  }

  _answer(choice) {
    if (this._stopped || !this.current) return;
    cancelSpeech();
    this.buttonsEl.querySelectorAll('button').forEach(b => { b.disabled = true; });

    const right = choice === this.current.correct;
    this.answered += 1;
    if (right) this.correct += 1;

    this.feedbackEl.textContent = right
      ? `✓ Correct — ${this.current.correct}`
      : `✗ Wrong — ${this.current.correct}`;
    this.feedbackEl.className = `drill-feedback ${right ? 'ok' : 'bad'}`;
    this._updateTally();

    this._setTimer(() => this._next(), FEEDBACK_MS);
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
