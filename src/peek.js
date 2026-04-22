const FILES = 'abcdefgh';
const LONG_PRESS_MS = 500;

class PeekBoard {
  constructor() {
    this.el = document.getElementById('peek-board');
    this._peekParam = new URLSearchParams(location.search).get('peek') === '1';
    this._render();
    if (this._peekParam) this.show();
    this._initLongPress();
  }

  _render() {
    const grid = document.createElement('div');
    grid.className = 'peek-grid';

    for (let rank = 8; rank >= 1; rank--) {
      for (let fi = 0; fi < 8; fi++) {
        const sq = document.createElement('div');
        // a1 is dark: dark when (fi + rank) is odd
        sq.className = `sq ${(fi + rank) % 2 === 1 ? 'dark' : 'light'}`;
        const label = document.createElement('span');
        label.className = 'sq-label';
        label.textContent = FILES[fi] + rank;
        sq.appendChild(label);
        grid.appendChild(sq);
      }
    }

    this.el.appendChild(grid);
  }

  show() { this.el.classList.remove('hidden'); }

  hide() {
    if (!this._peekParam) this.el.classList.add('hidden');
  }

  _initLongPress() {
    let timer = null;

    document.addEventListener('touchstart', () => {
      timer = setTimeout(() => this.show(), LONG_PRESS_MS);
    }, { passive: true });

    document.addEventListener('touchend', () => {
      clearTimeout(timer);
      timer = null;
      this.hide();
    }, { passive: true });

    document.addEventListener('touchcancel', () => {
      clearTimeout(timer);
      timer = null;
      this.hide();
    }, { passive: true });
  }
}

const peekBoard = new PeekBoard();
export default peekBoard;
