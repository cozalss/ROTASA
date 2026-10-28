// Runtime translation. Source strings stay in English in the code; a
// dictionary maps each English string (or template) to its translation.
// translate() is applied where text enters the DOM: h(), dialogue lines,
// toasts, chapter cards and world labels.

const STORAGE_KEY = 'rotasa-lang-v1';
export const LANGUAGES = Object.freeze([
  { id: 'en', label: 'English' },
  { id: 'tr', label: 'Türkçe' },
]);

let lang = readLang();
const strings = new Map();
let templates = [];
const cache = new Map();

function readLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.some((l) => l.id === saved) ? saved : 'en';
  } catch {
    return 'en';
  }
}

export function getLang() {
  return lang;
}

/** Switches the active language in memory only (used by setLang and tests). */
export function useLanguage(next) {
  if (LANGUAGES.some((l) => l.id === next)) lang = next;
  return lang;
}

// Changing the language reloads the page so every module re-renders cleanly.
export function setLang(next) {
  if (!LANGUAGES.some((l) => l.id === next) || next === lang) return;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Without storage the choice lasts for this page only.
  }
  useLanguage(next);
  window.location.reload();
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Templates with little fixed text ("{0} of {1}", "Rate {0}.") would match
// whole sentences that have no translation, so each value must be a number,
// a known string or a short name in Title Case ("Deniz", "Test Planning").
const GENERIC_LETTERS = 8;
const MAX_NAME_WORDS = 7;
const SMALL_WORDS = new Set(['a', 'an', 'and', 'of', 'the', 'to', 'for', 'in', 'on']);
function isSafeValue(value) {
  const v = value.trim();
  if (!/[A-Za-z]/.test(v) || strings.has(v)) return true;
  const words = v.split(/\s+/);
  return !/[;!?“”"]|\.(\s|$)/.test(v) && words.length <= MAX_NAME_WORDS && words.every((w) => SMALL_WORDS.has(w) || !/^[a-zçğıöşü]/.test(w));
}

// Template "Request ({0} min)" -> regexes that capture each {n}: shortest
// values first, longest values as the fallback.
function compileTemplate(source, target) {
  const order = [];
  const pieces = source.trim().split(/(\{\d+\})/).map((part) => {
    const m = /^\{(\d+)\}$/.exec(part);
    if (!m) return escapeRegex(part);
    order.push(Number(m[1]));
    return null;
  });
  const build = (capture) => new RegExp(`^${pieces.map((p) => p ?? capture).join('')}$`);
  const fixed = source.replace(/\{\d+\}/g, '').replace(/[^A-Za-z]/g, '').length;
  return {
    regexes: [build('([\\s\\S]+?)'), build('([\\s\\S]+)')],
    order, target: target.trim(), fixed, generic: fixed < GENERIC_LETTERS,
  };
}

// A value must not split a bracket pair: "(wiki) (20 min)" is two groups.
function balanced(s) {
  let depth = 0;
  for (const ch of s) {
    if (ch === '(') depth += 1;
    else if (ch === ')' && --depth < 0) return false;
  }
  return depth === 0;
}

function matchTemplate(tpl, text) {
  for (const regex of tpl.regexes) {
    const m = regex.exec(text);
    const values = m ? m.slice(1) : [];
    if (m && values.every(balanced) && (!tpl.generic || values.every(isSafeValue))) return m;
  }
  return null;
}

/**
 * Registers a dictionary: { strings: { en: tr }, templates: [[en, tr]] }.
 * Later registrations win for duplicate keys.
 */
export function registerDictionary(dict) {
  Object.entries(dict.strings || {}).forEach(([en, tr]) => {
    if (typeof tr !== 'string' || !tr.trim()) return;
    strings.set(en, tr);
    if (en.trim() !== en) strings.set(en.trim(), tr.trim());
  });
  const compiled = (dict.templates || []).map(([en, tr]) => compileTemplate(en, tr));
  // Most specific first, so "Rate each of the {0} goals…" wins over "Rate {0}.".
  templates = [...compiled, ...templates].sort((a, b) => b.fixed - a.fixed);
  cache.clear();
}

// Values inside a template are names, numbers or whole known strings, so they
// are not run through the generic templates again ("Test Policy and Strategy").
function translateValue(value) {
  const v = value.trim();
  return strings.get(v) ?? fromTemplates(v, { nested: true }) ?? value;
}

function fromTemplates(text, { nested = false } = {}) {
  for (const tpl of templates) {
    if (nested && tpl.generic) continue;
    const m = matchTemplate(tpl, text);
    if (!m) continue;
    const values = {};
    tpl.order.forEach((n, i) => { values[n] = translateValue(m[i + 1]); });
    return tpl.target.replace(/\{(\d+)\}/g, (_, n) => values[n] ?? '');
  }
  return null;
}

// One whole string: exact match, then templates. Null when nothing matches.
function whole(trimmed) {
  return strings.get(trimmed) ?? fromTemplates(trimmed);
}

// Text glued together at runtime ("QA lead. Owns the test plan.",
// "N · The one corrective action…", "“quote”") is translated piece by piece.
const QUOTED = /^([“"])([\s\S]+)([”"])$/;
// Coarse pieces first ("N · <sentence>"), then sentences, then clauses.
const SEPARATORS = [/(\s*[·—]\s+)/, /((?<=[.!?])\s+)/, /((?<=[:;])\s+)/];

// "QA lead." when only "QA lead" is in the dictionary.
function withoutStop(part) {
  const m = /^(.+?)([.:;])$/.exec(part);
  const tr = m && whole(m[1]);
  return tr ? `${tr}${m[2]}` : null;
}

function byPieces(trimmed, level = 0) {
  const quoted = QUOTED.exec(trimmed);
  if (quoted) {
    const inner = translate(quoted[2]);
    return inner === quoted[2] ? null : `${quoted[1]}${inner}${quoted[3]}`;
  }
  if (level >= SEPARATORS.length) return null;
  const parts = trimmed.split(SEPARATORS[level]);
  if (parts.length < 3) return byPieces(trimmed, level + 1);
  let changed = false;
  const out = [];
  for (let i = 0; i < parts.length; i += 2) {
    const run = longestRun(parts, i, level);
    if (run) {
      changed = true;
      out.push(run.text, parts[run.end + 1] ?? '');
      i = run.end;
      continue;
    }
    out.push(parts[i], parts[i + 1] ?? '');
  }
  return changed ? out.join('') : null;
}

// The longest run of pieces from `start` that has a translation, so a
// paragraph glued after a label ("Step 5 · Attribution. <paragraph>") is
// matched as one paragraph before falling back to single sentences.
function longestRun(parts, start, level) {
  if (!/[A-Za-z]/.test(parts[start])) return null;
  // split() with a capture group alternates text and separator, so text sits at even indices.
  for (let end = parts.length - 1; end >= start; end -= 2) {
    const piece = parts.slice(start, end + 1).join('');
    const tr = whole(piece) ?? withoutStop(piece) ?? (end === start ? byPieces(piece, level + 1) : null);
    if (tr !== null) return { text: tr, end };
  }
  return null;
}

// Money, large numbers and durations in Turkish: "TRY 150,000" -> "150.000 TL",
// "5 h 40 min" -> "5 sa 40 dk".
function localizeNumbers(text) {
  return text
    .replace(/(\d) h\b/g, '$1 sa')
    .replace(/(\d) min\b/g, '$1 dk')
    .replace(/\bTRY\s*(\d[\d,]*)/g, '$1 TL')
    .replace(/(\d[\d,]*)\s*TRY\b/g, '$1 TL')
    .replace(/\b\d{1,3}(?:,\d{3})+\b/g, (n) => n.replace(/,/g, '.'));
}

function translateText(text) {
  const exact = strings.get(text);
  if (exact !== undefined) return exact;
  const trimmed = text.trim();
  if (!trimmed || !/[A-Za-z]/.test(trimmed)) return text;
  if (!cache.has(trimmed)) cache.set(trimmed, whole(trimmed) ?? byPieces(trimmed) ?? trimmed);
  const result = cache.get(trimmed);
  return text === trimmed ? result : text.replace(trimmed, result);
}

/** Translates one string; returns it unchanged when no translation exists. */
export function translate(text) {
  if (lang === 'en' || typeof text !== 'string') return text;
  return localizeNumbers(translateText(text));
}

/** "A and B" / "A ve B": joins names with the current language's "and". */
export function joinAnd(items) {
  return new Intl.ListFormat(lang, { type: 'conjunction' }).format(items);
}

/** Loads the dictionaries for the current language. Never throws. */
export async function loadLanguage() {
  document.documentElement.lang = lang;
  if (lang === 'en') return;
  try {
    const [mod, keep] = await Promise.all([import(`./${lang}/index.js`), import('./keep.js')]);
    [...(mod.default || []), keep.default].forEach(registerDictionary);
  } catch {
    // Missing dictionary: the game stays in English.
  }
}
