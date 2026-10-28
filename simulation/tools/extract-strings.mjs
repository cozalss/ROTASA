// Extracts candidate player-facing strings from js/ for translation.
// Usage: node tools/extract-strings.mjs > strings.json
// Output: { files: { path: { strings, templates } } }; templates use {0}, {1} for ${...}.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../js/', import.meta.url));
const SKIP_DIRS = new Set(['i18n']);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return SKIP_DIRS.has(name) ? [] : walk(p);
    return p.endsWith('.js') ? [p] : [];
  });
}

// Player-facing heuristic: has a letter, and either a space or starts with a capital.
const looksLikeText = (s) => /[A-Za-z]/.test(s)
  && !/^[a-z0-9_-]+$/.test(s)
  && !/^[.#[]|^\.\.?\/|\.js$|\.css$|^https?:/.test(s)
  && !/^(--|rgba?\(|#[0-9a-f]{3,8}$)/i.test(s)
  && !/^[a-z]+(-[a-z0-9]+)+( [a-z]+(-[a-z0-9]+)*)*$/.test(s)
  && !/(gl_|vec[234]|uniform |varying |void main|precision )/.test(s)
  && (/\s/.test(s) || /^[A-ZÇĞİÖŞÜ]/.test(s));

const LITERAL = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\$]|\\.|\$(?!\{)|\$\{(?:[^{}]|\{[^{}]*\})*\})*)`/g;
const PLACEHOLDER = /\$\{(?:[^{}]|\{[^{}]*\})*\}/g;

function scan(src) {
  const strings = new Set();
  const templates = new Set();
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const m of code.matchAll(LITERAL)) {
    const raw = m[1] ?? m[2];
    if (raw !== undefined) {
      const s = raw.replace(/\\(['"\\])/g, '$1');
      if (looksLikeText(s)) strings.add(s);
      continue;
    }
    const tpl = m[3];
    if (!tpl.includes('${')) {
      if (looksLikeText(tpl)) strings.add(tpl);
      continue;
    }
    let n = 0;
    const t = tpl.replace(PLACEHOLDER, () => `{${n++}}`);
    if (/[A-Za-z]{2}/.test(t.replace(/\{\d+\}/g, '')) && looksLikeText(t)) templates.add(t);
  }
  return { strings, templates };
}

const out = { files: {} };
for (const file of walk(ROOT)) {
  const { strings, templates } = scan(readFileSync(file, 'utf8'));
  if (strings.size || templates.size) {
    out.files[relative(ROOT, file).replace(/\\/g, '/')] = { strings: [...strings], templates: [...templates] };
  }
}
process.stdout.write(JSON.stringify(out, null, 1));
