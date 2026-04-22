export const FILES = 'abcdefgh';

export function squareOf(fi, rank) {
  return FILES[fi] + rank;
}

export function parseSquare(sq) {
  return { fi: FILES.indexOf(sq[0]), rank: parseInt(sq[1], 10) };
}

export function isLightSquare(sq) {
  const { fi, rank } = parseSquare(sq);
  return (fi + rank) % 2 === 0;
}

export function allSquares() {
  const out = [];
  for (let r = 1; r <= 8; r++) {
    for (let f = 0; f < 8; f++) out.push(FILES[f] + r);
  }
  return out;
}

export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function speakableSquare(sq) {
  return sq[0].toUpperCase() + ' ' + sq[1];
}

const KNIGHT_DELTAS = [
  [1, 2], [2, 1], [-1, 2], [-2, 1],
  [1, -2], [2, -1], [-1, -2], [-2, -1],
];

export function knightMovesFrom(sq) {
  const { fi, rank } = parseSquare(sq);
  const out = [];
  for (const [df, dr] of KNIGHT_DELTAS) {
    const nf = fi + df;
    const nr = rank + dr;
    if (nf >= 0 && nf < 8 && nr >= 1 && nr <= 8) out.push(FILES[nf] + nr);
  }
  return out;
}

export function isKnightMove(from, to) {
  return knightMovesFrom(from).includes(to);
}

export function knightShortestPath(start, target) {
  if (start === target) return [start];
  const cameFrom = { [start]: null };
  const queue = [start];
  while (queue.length) {
    const sq = queue.shift();
    for (const next of knightMovesFrom(sq)) {
      if (next in cameFrom) continue;
      cameFrom[next] = sq;
      if (next === target) {
        const path = [next];
        let cur = sq;
        while (cur !== null) { path.unshift(cur); cur = cameFrom[cur]; }
        return path;
      }
      queue.push(next);
    }
  }
  return null;
}

export function knightDistance(start, target) {
  const p = knightShortestPath(start, target);
  return p ? p.length - 1 : -1;
}

export function diagonals(minLength = 4) {
  const out = [];
  // NE (a1-h8 direction): rank - fi = k
  for (let k = -7; k <= 8; k++) {
    const squares = [];
    for (let fi = 0; fi < 8; fi++) {
      const rank = fi + k;
      if (rank >= 1 && rank <= 8) squares.push(FILES[fi] + rank);
    }
    if (squares.length >= minLength) {
      out.push({
        name: `${squares[0]}-${squares[squares.length - 1]}`,
        squares,
        direction: 'ne',
      });
    }
  }
  // NW (a8-h1 direction): rank + fi = k
  for (let k = 1; k <= 15; k++) {
    const squares = [];
    for (let fi = 0; fi < 8; fi++) {
      const rank = k - fi;
      if (rank >= 1 && rank <= 8) squares.push(FILES[fi] + rank);
    }
    if (squares.length >= minLength) {
      out.push({
        name: `${squares[0]}-${squares[squares.length - 1]}`,
        squares,
        direction: 'nw',
      });
    }
  }
  return out;
}

export function parseSquareList(text) {
  const t = (text || '').toLowerCase().replace(/[.,;]/g, ' ');
  const tokens = t.split(/[\s\-]+|\bto\b|\band\b/g).map(s => s.trim()).filter(Boolean);
  return tokens.filter(s => /^[a-h][1-8]$/.test(s));
}

export function sameSquareSet(a, b) {
  const sa = [...new Set(a)].sort();
  const sb = [...new Set(b)].sort();
  if (sa.length !== sb.length) return false;
  return sa.every((s, i) => s === sb[i]);
}
