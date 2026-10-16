/* Se preferir, coloque seu Client ID do Spotify aqui e o campo de configuração some. */
const CLIENT_ID = '';

const $ = (s) => document.querySelector(s);
const store = {
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};

/* ============================ GERADOR ============================ */
// <gen>
const POP = new Uint8Array(512);
for (let i = 1; i < 512; i++) POP[i] = POP[i >> 1] + (i & 1);
const ROW = new Uint8Array(81), COL = new Uint8Array(81), BOX = new Uint8Array(81);
for (let i = 0; i < 81; i++) {
  ROW[i] = (i / 9) | 0; COL[i] = i % 9;
  BOX[i] = ((ROW[i] / 3) | 0) * 3 + ((COL[i] / 3) | 0);
}
function shuffle(a){
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
// Conta soluções (até "limit"). Com random=true, devolve uma solução aleatória.
function solve(grid, limit, random){
  const g = Int8Array.from(grid);
  const rows = new Int16Array(9), cols = new Int16Array(9), boxes = new Int16Array(9);
  for (let i = 0; i < 81; i++) {
    const v = g[i];
    if (v) { const b = 1 << (v - 1); rows[ROW[i]] |= b; cols[COL[i]] |= b; boxes[BOX[i]] |= b; }
  }
  let count = 0, first = null;
  function rec(){
    let best = -1, bm = 0, bn = 10;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const m = ~(rows[ROW[i]] | cols[COL[i]] | boxes[BOX[i]]) & 511;
      const n = POP[m];
      if (n < bn) { bn = n; best = i; bm = m; if (n <= 1) break; }
    }
    if (best < 0) { count++; if (!first) first = Int8Array.from(g); return; }
    if (bn === 0) return;
    const r = ROW[best], c = COL[best], b = BOX[best];
    const digits = [];
    for (let d = 0; d < 9; d++) if (bm & (1 << d)) digits.push(d);
    if (random) shuffle(digits);
    for (const d of digits) {
      const bit = 1 << d;
      g[best] = d + 1; rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
      rec();
      g[best] = 0; rows[r] &= ~bit; cols[c] &= ~bit; boxes[b] &= ~bit;
      if (count >= limit) return;
    }
  }
  rec();
  return { count, solution: first };
}
// Tira números ao acaso mantendo a solução única, até chegar perto de "target" pistas.
function makePuzzle(target){
  const sol = solve(new Int8Array(81), 1, true).solution;
  const p = Int8Array.from(sol);
  let left = 81;
  const order = shuffle(Array.from({ length: 81 }, (_, i) => i));
  for (const i of order) {
    if (left <= target) break;
    const v = p[i];
    p[i] = 0;
    if (solve(p, 2, false).count === 1) left--; else p[i] = v;
  }
  return { puzzle: Array.from(p), solution: Array.from(sol) };
}
// </gen>

/* ============================ JOGO ============================ */
const LEVELS = {
  facil:   { label: 'Fácil',   clues: 42 },
  medio:   { label: 'Médio',   clues: 34 },
  dificil: { label: 'Difícil', clues: 26 }
};
const SAVE_KEY = 'sudoku.v1';

let G = null;          // { level, puzzle, solution, values, notes, done, revealed }
let sel = -1;
let noteMode = false;
let busy = false;
const cells = [];

const boardEl = $('#board');
const statusEl = $('#status');

const menuStatusEl = $('#menuStatus');
function say(t){ statusEl.textContent = t || ''; menuStatusEl.textContent = t || ''; }

// Duas telas: "menu" (escolha da dificuldade) e "game" (tabuleiro).
let view = 'menu';
function setView(v){
  view = v;
  document.body.dataset.view = v;
  if (v === 'menu') say('');
}

function buildBoard(){
  for (let i = 0; i < 81; i++) {
    const r = ROW[i], c = COL[i];
    const el = document.createElement('div');
    el.className = 'cell' +
      (c % 3 === 2 && c < 8 ? ' cr' : '') + (r % 3 === 2 && r < 8 ? ' rb' : '') +
      (c === 8 ? ' ce' : '') + (r === 8 ? ' be' : '');
    el.setAttribute('role', 'gridcell');
    el.dataset.i = i;
    const v = document.createElement('span'); v.className = 'v';
    const n = document.createElement('div'); n.className = 'notes';
    const ns = [];
    for (let d = 1; d <= 9; d++) { const s = document.createElement('span'); n.appendChild(s); ns.push(s); }
    el.append(v, n);
    boardEl.appendChild(el);
    cells.push({ el, v, ns });
  }
  boardEl.addEventListener('pointerdown', (e) => {
    const c = e.target.closest('.cell');
    if (!c) return;
    sel = +c.dataset.i;
    render();
  });
  const pad = $('#pad');
  for (let d = 1; d <= 9; d++) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = d; b.setAttribute('aria-label', 'Número ' + d);
    b.addEventListener('click', () => enter(d));
    pad.appendChild(b);
  }
}

function render(){
  if (!G) return;
  for (let i = 0; i < 81; i++) {
    const { el, v, ns } = cells[i];
    const given = G.puzzle[i] !== 0;
    const val = given ? G.puzzle[i] : G.values[i];
    v.textContent = val || '';
    const mask = G.notes[i];
    for (let d = 0; d < 9; d++) ns[d].textContent = (mask & (1 << d)) ? d + 1 : '';
    el.classList.toggle('given', given);
    el.classList.toggle('entry', !given && !!val);
    el.classList.toggle('has-value', !!val);
    el.classList.toggle('has-notes', !val && mask !== 0);
    const isSel = i === sel;
    el.classList.toggle('sel', isSel);
    el.classList.toggle('peer', !isSel && sel >= 0 &&
      (ROW[i] === ROW[sel] || COL[i] === COL[sel] || BOX[i] === BOX[sel]));
  }
  $('#levelName').textContent = LEVELS[G.level].label;
  $('#btnNotes').setAttribute('aria-pressed', String(noteMode));
}

function save(){ if (G) store.set(SAVE_KEY, JSON.stringify(G)); }

function hasProgress(){
  return G && !G.done && (G.values.some(Boolean) || G.notes.some(Boolean));
}

function allFilled(){
  for (let i = 0; i < 81; i++) if (!(G.puzzle[i] || G.values[i])) return false;
  return true;
}
function allCorrect(){
  for (let i = 0; i < 81; i++) if ((G.puzzle[i] || G.values[i]) !== G.solution[i]) return false;
  return true;
}

function finishIfSolved(){
  if (!G.done && allFilled() && allCorrect()) {
    G.done = true;
    say('Concluído. Bom trabalho.');
  }
}

function enter(d){
  if (!G || sel < 0 || G.done || G.puzzle[sel]) return;
  if (noteMode) {
    if (G.values[sel]) return;
    G.notes[sel] ^= (1 << (d - 1));
  } else {
    G.values[sel] = G.values[sel] === d ? 0 : d;
    G.notes[sel] = 0;
    finishIfSolved();
  }
  render(); save();
}
function erase(){
  if (!G || sel < 0 || G.done || G.puzzle[sel]) return;
  G.values[sel] = 0; G.notes[sel] = 0;
  render(); save();
}

// Pede um segundo toque antes de descartar um jogo em andamento.
let pendingKey = null, pendingTimer = 0;
function confirmFirst(key, msg, fn){
  if (!hasProgress() || pendingKey === key) {
    clearTimeout(pendingTimer); pendingKey = null; say('');
    fn();
    return;
  }
  pendingKey = key; say(msg);
  clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => { pendingKey = null; say(''); }, 4000);
}

function newGame(level){
  if (busy) return;
  busy = true;
  say('Preparando o tabuleiro…');
  setTimeout(() => {
    const { puzzle, solution } = makePuzzle(LEVELS[level].clues);
    G = {
      level, puzzle, solution,
      values: new Array(81).fill(0), notes: new Array(81).fill(0),
      done: false, revealed: false
    };
    sel = -1; noteMode = false; busy = false;
    say('');
    render(); save();
    setView('game');
  }, 30);
}

function restore(){
  try {
    const raw = store.get(SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    const ok = s && LEVELS[s.level] && ['puzzle', 'solution', 'values', 'notes'].every((k) => Array.isArray(s[k]) && s[k].length === 81);
    if (!ok) return false;
    G = s;
    render();
    if (G.revealed) say('Respostas reveladas.');
    else if (G.done) say('Concluído. Bom trabalho.');
    return true;
  } catch (e) { return false; }
}

/* Eventos do jogo */
// Menu: escolher a dificuldade começa um jogo novo e mostra o tabuleiro.
document.querySelectorAll('#menu button[data-level]').forEach((b) =>
  b.addEventListener('click', () => newGame(b.dataset.level)));
// Voltar ao menu para trocar a dificuldade (pede um segundo toque se houver jogo em andamento).
$('#btnBack').addEventListener('click', () =>
  confirmFirst('back', 'Há um jogo em andamento. Toque de novo para voltar e escolher outra dificuldade.', () => setView('menu')));
$('#btnNew').addEventListener('click', () =>
  confirmFirst('new', 'Há um jogo em andamento. Toque de novo para começar outro.', () => newGame(G ? G.level : 'medio')));
$('#btnNotes').addEventListener('click', () => { noteMode = !noteMode; render(); });
$('#btnErase').addEventListener('click', erase);
$('#btnCheck').addEventListener('click', () => {
  if (!G || G.done) return;
  if (!allFilled()) { say('Ainda há casas em branco.'); return; }
  if (allCorrect()) { finishIfSolved(); render(); save(); }
  else say('Algo não confere. Continue procurando.');
});
let ansPending = false, ansTimer = 0;
$('#btnAnswers').addEventListener('click', () => {
  if (!G || G.revealed) return;
  if (!ansPending) {
    ansPending = true;
    say('Toque de novo em Respostas para ver a solução. O jogo termina.');
    ansTimer = setTimeout(() => { ansPending = false; say(''); }, 4000);
    return;
  }
  clearTimeout(ansTimer); ansPending = false;
  for (let i = 0; i < 81; i++) if (!G.puzzle[i]) { G.values[i] = G.solution[i]; G.notes[i] = 0; }
  G.revealed = true; G.done = true;
  say('Respostas reveladas.');
  render(); save();
});

document.addEventListener('keydown', (e) => {
  if (view !== 'game') return;
  if (e.target.closest && e.target.closest('input')) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (k >= '1' && k <= '9') { enter(+k); return; }
  if (k === '0' || k === 'Backspace' || k === 'Delete') { e.preventDefault(); erase(); return; }
  if (k === 'n' || k === 'N') { noteMode = !noteMode; render(); return; }
  const move = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[k];
  if (move) {
    e.preventDefault();
    if (sel < 0) sel = 40;
    else sel = Math.max(0, Math.min(8, ROW[sel] + move[0])) * 9 + Math.max(0, Math.min(8, COL[sel] + move[1]));
    render();
  }
});

