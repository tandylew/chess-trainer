export const STARTING_POSITION = {
  a1: 'R', b1: 'N', c1: 'B', d1: 'Q', e1: 'K', f1: 'B', g1: 'N', h1: 'R',
  a2: 'P', b2: 'P', c2: 'P', d2: 'P', e2: 'P', f2: 'P', g2: 'P', h2: 'P',
  a8: 'r', b8: 'n', c8: 'b', d8: 'q', e8: 'k', f8: 'b', g8: 'n', h8: 'r',
  a7: 'p', b7: 'p', c7: 'p', d7: 'p', e7: 'p', f7: 'p', g7: 'p', h7: 'p',
};

export const PIECE_NAMES = {
  P: 'Pawn', N: 'Knight', B: 'Bishop', R: 'Rook', Q: 'Queen', K: 'King',
};

export function pieceName(piece) {
  return PIECE_NAMES[piece.toUpperCase()];
}

export function applyMove(pos, move) {
  const [from, to] = move.split('-');
  const piece = pos[from];
  if (!piece) return pos;
  const next = { ...pos };
  delete next[from];
  next[to] = piece;
  return next;
}

export function applyMoves(pos, moves) {
  return moves.reduce((p, m) => applyMove(p, m), pos);
}
