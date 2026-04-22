export function speak(text, { onEnd, rate = 1, lang = 'en-US' } = {}) {
  const synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
    onEnd?.();
    return { ok: false };
  }
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.lang = lang;
    u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();
    synth.speak(u);
    return { ok: true };
  } catch {
    onEnd?.();
    return { ok: false };
  }
}

export function cancelSpeech() {
  try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
}

export function createRecognizer({ onResult, onError, lang = 'en-US' } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR();
  r.continuous = false;
  r.interimResults = false;
  r.lang = lang;
  r.maxAlternatives = 1;
  r.onresult = (e) => {
    const transcript = e.results?.[0]?.[0]?.transcript ?? '';
    onResult?.(transcript);
  };
  r.onerror = (e) => onError?.(e);
  return r;
}

const WORD_TO_NUM = {
  one: '1', two: '2', three: '3', four: '4',
  five: '5', six: '6', seven: '7', eight: '8',
};

export function normalizeSquareSpeech(text) {
  let t = (text || '').toLowerCase();
  t = t.replace(/[.,!?]/g, ' ');
  t = t.replace(/\b([a-h])\s*(one|two|three|four|five|six|seven|eight)\b/g,
    (_, f, n) => f + WORD_TO_NUM[n]);
  t = t.replace(/\b([a-h])\s+([1-8])\b/g, '$1$2');
  return t.replace(/\s+/g, ' ').trim();
}
