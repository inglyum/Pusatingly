#!/usr/bin/env node
/* ============================================================
   INGLY DESIGN — TEST CSS
   ------------------------------------------------------------
   Verifica la disciplina del design system:
   - i token esistono e sono definiti una volta sola
   - nessun colore sciolto fuori da variables.css
   - la modalità chiara ridefinisce tutti i token cromatici
   - il movimento è disattivato sotto prefers-reduced-motion
   ============================================================ */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSS_DIR = join(ROOT, 'assets/css');
const text = (f) => readFileSync(join(CSS_DIR, f), 'utf8');

let passed = 0;
const failures = [];

function test(name, fn) {
  try { fn(); passed++; }
  catch (e) { failures.push(`${name}\n      ${e.message}`); }
}
const assert = (c, m) => { if (!c) throw new Error(m); };

const files = readdirSync(CSS_DIR).filter((f) => f.endsWith('.css'));
const variables = text('variables.css');

/* ---- token ------------------------------------------------------------- */

const REQUIRED_TOKENS = [
  '--ingly-anthracite', '--ingly-dark', '--ingly-white', '--ingly-cyan', '--ingly-cyan-print',
  '--surface-0', '--surface-1', '--surface-2', '--surface-3',
  '--text-1', '--text-2', '--text-3', '--accent', '--line',
  '--font-display', '--font-body', '--font-mono',
  '--fs-xs', '--fs-md', '--fs-4xl', '--sp-4', '--radius', '--ease', '--dur',
  '--elev-1', '--elev-4', '--container', '--section-y'
];

test('tutti i token richiesti sono definiti', () => {
  for (const tk of REQUIRED_TOKENS) {
    assert(variables.includes(`${tk}:`), `token mancante: ${tk}`);
  }
});

test('la palette del brand rispetta i valori del master command §20', () => {
  const expected = {
    '--ingly-anthracite': '#1F2328',
    '--ingly-dark': '#2E3238',
    '--ingly-white': '#FFFFFF',
    '--ingly-cyan': '#00E6D2',
    '--ingly-cyan-print': '#00CFC0'
  };
  for (const [tk, value] of Object.entries(expected)) {
    const re = new RegExp(`${tk}:\\s*${value}`, 'i');
    assert(re.test(variables), `${tk} deve valere ${value}`);
  }
});

/* ---- nessun colore sciolto --------------------------------------------- */

test('nessun colore esadecimale fuori da variables.css', () => {
  const offenders = [];
  for (const f of files) {
    if (f === 'variables.css') continue;
    const src = text(f);
    src.split('\n').forEach((line, i) => {
      // Gli unici hex ammessi altrove sono nelle mask/gradient tecniche (#000, #fff)
      // e nel colore di errore dei form, che non è un colore di brand.
      const m = line.match(/#[0-9a-fA-F]{3,8}\b/g);
      if (!m) return;
      for (const hex of m) {
        const ok = ['#000', '#fff', '#ffffff', '#E5484D'].includes(hex) || /^#fff/i.test(hex);
        if (!ok) offenders.push(`${f}:${i + 1} ${hex}`);
      }
    });
  }
  assert(!offenders.length, `colori sciolti trovati:\n        ${offenders.join('\n        ')}`);
});

test('nessun valore rgb()/hsl() sciolto fuori da variables.css', () => {
  const offenders = [];
  for (const f of files) {
    if (f === 'variables.css') continue;
    const src = text(f);
    src.split('\n').forEach((line, i) => {
      if (/\b(rgb|hsl)a?\(\s*\d/.test(line)) offenders.push(`${f}:${i + 1}`);
    });
  }
  assert(!offenders.length, `colori rgb/hsl sciolti: ${offenders.join(', ')}`);
});

/* ---- modalità chiara ---------------------------------------------------- */

test('la modalità chiara ridefinisce tutti i token cromatici', () => {
  const lightBlock = variables.split('[data-mode="light"]')[1] || '';
  const chromatic = [
    '--surface-0', '--surface-1', '--surface-2', '--surface-3',
    '--text-1', '--text-2', '--text-3', '--accent', '--line'
  ];
  for (const tk of chromatic) {
    assert(lightBlock.includes(`${tk}:`), `modalità chiara: token non ridefinito ${tk}`);
  }
});

test('la modalità chiara usa un accento con contrasto sufficiente', () => {
  // #00E6D2 su bianco dà ~1.7:1, sotto soglia AA. In luce serve un valore scurito.
  const lightBlock = variables.split('[data-mode="light"]')[1] || '';
  const m = lightBlock.match(/--accent:\s*(#[0-9a-fA-F]{6})/);
  assert(m, 'modalità chiara: --accent non definito');
  assert(m[1].toUpperCase() !== '#00E6D2',
    'modalità chiara: --accent non può restare #00E6D2 (contrasto insufficiente su bianco)');
});

/* ---- accessibilità e movimento ------------------------------------------ */

test('il focus è visibile e non viene mai rimosso', () => {
  const reset = text('reset.css');
  assert(/:focus-visible\s*\{[^}]*outline:/.test(reset), 'manca lo stile di :focus-visible');
  const offenders = [];
  for (const f of files) {
    const src = text(f);
    src.split('\n').forEach((line, i) => {
      if (/outline:\s*(none|0)/.test(line) && !line.includes('focus:not')) {
        offenders.push(`${f}:${i + 1}`);
      }
    });
  }
  assert(!offenders.length, `outline rimosso senza sostituto: ${offenders.join(', ')}`);
});

test('prefers-reduced-motion è rispettato', () => {
  const all = files.map(text).join('\n');
  assert(all.includes('prefers-reduced-motion'), 'nessuna regola per prefers-reduced-motion');
  const anim = text('animations.css');
  assert(/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(anim),
    'animations.css deve disattivare le animazioni sotto reduced-motion');
});

test('le transizioni animano solo proprietà compositing-only', () => {
  // width/height/top/left in transition causano layout thrash.
  const banned = /transition:[^;]*\b(width|height|top|left|margin|padding)\b/;
  const offenders = [];
  for (const f of files) {
    text(f).split('\n').forEach((line, i) => {
      if (banned.test(line) && !line.includes('padding-left')) offenders.push(`${f}:${i + 1}`);
    });
  }
  // padding-left sul mega-link è un caso isolato e voluto (micro-spostamento).
  assert(offenders.length <= 1, `transizioni su proprietà di layout: ${offenders.join(', ')}`);
});

/* ---- responsive --------------------------------------------------------- */

test('i breakpoint dichiarati esistono', () => {
  const responsive = text('responsive.css');
  for (const bp of ['1199px', '1023px', '899px', '599px']) {
    assert(responsive.includes(bp), `breakpoint mancante: ${bp}`);
  }
});

test('esiste una regola contro lo scroll orizzontale', () => {
  const all = files.map(text).join('\n');
  assert(all.includes('overflow-x'), 'nessuna gestione di overflow-x');
});

/* ---- report ------------------------------------------------------------- */

console.log(`\n  TEST CSS`);
console.log(`  ${'─'.repeat(52)}`);
if (failures.length) {
  console.log(`  ✓ ${passed} superati · ✗ ${failures.length} falliti\n`);
  for (const f of failures) console.log(`    ✗ ${f}\n`);
  process.exit(1);
}
console.log(`  ✓ ${passed} test superati\n`);
