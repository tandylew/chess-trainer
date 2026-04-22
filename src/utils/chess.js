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
