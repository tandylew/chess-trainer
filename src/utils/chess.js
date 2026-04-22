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
