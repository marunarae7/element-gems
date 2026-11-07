// Pure board logic: no React, no timing. The grid is grid[r][c] = gem | null.
// A gem is { id, t, sp, r, c, drop, created } where
//   t   = element index (0..T-1) or COIN for the gold coin
//   sp  = null | 'h' | 'v' (striped) | 'a' (bomb) | 'c' (gold coin)
//   drop = rows it falls in from above when it first appears (for the entry animation)
import { N, T } from './elements.js';

export const COIN = T;

let nextId = 1;
export function makeGem(t, r, c, extra = {}) {
  return { id: nextId++, t, sp: null, r, c, drop: 0, created: false, ...extra };
}

export const inBounds = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
export const key = (r, c) => r * N + c;
export const unkey = (k) => [Math.floor(k / N), k % N];
const range = (a, b) => Array.from({ length: b - a }, (_, i) => a + i);
const rnd = (n) => Math.floor(Math.random() * n);
const sameType = (grid, r, c, t) => !!grid[r]?.[c] && grid[r][c].t === t;

/** A fresh board with no matches already on it and at least one possible move. */
export function createBoard() {
  for (;;) {
    const grid = [];
    for (let r = 0; r < N; r++) {
      const row = [];
      for (let c = 0; c < N; c++) {
        let t;
        do { t = rnd(T); } while (
          (c >= 2 && row[c - 1].t === t && row[c - 2].t === t) ||
          (r >= 2 && grid[r - 1][c].t === t && grid[r - 2][c].t === t) ||
          (r >= 1 && c >= 1 && row[c - 1].t === t && grid[r - 1][c].t === t && grid[r - 1][c - 1].t === t));
        row.push(makeGem(t, r, c, { drop: N }));
      }
      grid.push(row);
    }
    if (findHint(grid)) return grid;
  }
}

/** Every line of 3+ (dir 'h' / 'v') and every 2×2 square (sq: true) of one element. */
export function findRuns(grid) {
  const runs = [];
  for (let r = 0; r < N; r++) {
    let c = 0;
    while (c < N) {
      const g = grid[r][c];
      let e = c + 1;
      if (g && g.t < T) {
        while (e < N && sameType(grid, r, e, g.t)) e++;
        if (e - c >= 3) runs.push({ dir: 'h', t: g.t, cells: range(c, e).map((x) => [r, x]) });
      }
      c = e;
    }
  }
  for (let c = 0; c < N; c++) {
    let r = 0;
    while (r < N) {
      const g = grid[r][c];
      let e = r + 1;
      if (g && g.t < T) {
        while (e < N && sameType(grid, e, c, g.t)) e++;
        if (e - r >= 3) runs.push({ dir: 'v', t: g.t, cells: range(r, e).map((y) => [y, c]) });
      }
      r = e;
    }
  }
  for (let r = 0; r < N - 1; r++) {
    for (let c = 0; c < N - 1; c++) {
      const g = grid[r][c];
      if (!g || g.t >= T) continue;
      const cells = [[r, c], [r, c + 1], [r + 1, c], [r + 1, c + 1]];
      if (cells.every(([y, x]) => sameType(grid, y, x, g.t))) runs.push({ dir: 'sq', t: g.t, sq: true, cells });
    }
  }
  return runs;
}

/** Swap two cells in place, keeping each gem's r/c in sync with where it now sits. */
export function swapCells(grid, a, b) {
  const A = grid[a[0]][a[1]];
  const B = grid[b[0]][b[1]];
  grid[a[0]][a[1]] = B;
  grid[b[0]][b[1]] = A;
  if (A) { A.r = b[0]; A.c = b[1]; }
  if (B) { B.r = a[0]; B.c = a[1]; }
}

/** A pair of cells whose swap makes a match, or null. A gold coin always counts. */
export function findHint(grid) {
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (grid[r][c]?.sp === 'c') {
        const n = [[r, c + 1], [r, c - 1], [r + 1, c], [r - 1, c]].find(([y, x]) => inBounds(y, x));
        return [[r, c], n];
      }
    }
  }
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const b = [r + dr, c + dc];
        if (!inBounds(b[0], b[1])) continue;
        swapCells(grid, [r, c], b);
        const ok = findRuns(grid).length > 0;
        swapCells(grid, [r, c], b);
        if (ok) return [[r, c], b];
      }
    }
  }
  return null;
}

export function mostCommon(grid) {
  const cnt = Array(T).fill(0);
  for (const row of grid) for (const g of row) if (g && g.t < T) cnt[g.t]++;
  return cnt.indexOf(Math.max(...cnt));
}

/**
 * Decide what a set of runs clears and which special gems it creates.
 * - L/T crossing of two lines → bomb ('a') at the crossing
 * - line of 4 → striped gem along the line ('h' or 'v'), at the swapped cell if it is in the line
 * - line of 5+ → gold coin
 * - 2×2 squares only clear; they never create specials
 */
export function planMatches(runs, swapped = []) {
  const clear = new Set();
  const creates = [];
  const lineCount = new Map();
  for (const run of runs) {
    for (const [r, c] of run.cells) {
      const k = key(r, c);
      clear.add(k);
      if (!run.sq) lineCount.set(k, (lineCount.get(k) || 0) + 1);
    }
  }
  const usedRun = new Set();
  const taken = new Set();
  for (const [k, n] of lineCount) {
    if (n < 2) continue;
    const idx = runs.flatMap((run, i) => (!run.sq && run.cells.some(([r, c]) => key(r, c) === k) ? [i] : []));
    if (idx.some((i) => runs[i].cells.length >= 5 || usedRun.has(i))) continue;
    idx.forEach((i) => usedRun.add(i));
    taken.add(k);
    const [r, c] = unkey(k);
    creates.push({ r, c, t: runs[idx[0]].t, sp: 'a' });
  }
  runs.forEach((run, i) => {
    if (run.sq || usedRun.has(i) || run.cells.length < 4) return;
    const p = run.cells.find(([r, c]) => swapped.some((s) => s[0] === r && s[1] === c) && !taken.has(key(r, c)))
      || run.cells[run.cells.length >> 1];
    const k = key(p[0], p[1]);
    if (taken.has(k)) return;
    taken.add(k);
    const five = run.cells.length >= 5;
    creates.push({ r: p[0], c: p[1], t: five ? COIN : run.t, sp: five ? 'c' : run.dir });
  });
  const squares = runs.filter((run) => run.sq).map((run) => run.cells[0]);
  return { clear, creates, squares };
}

/** Grow a clear set by firing every special gem inside it (chains included). */
export function expandSpecials(grid, clear) {
  const all = new Set(clear);
  const queue = [...clear];
  const fired = new Set();
  const effects = [];
  while (queue.length) {
    const [r, c] = unkey(queue.pop());
    const g = grid[r][c];
    if (!g || !g.sp || fired.has(g.id)) continue;
    fired.add(g.id);
    let targets = [];
    if (g.sp === 'h') {
      targets = range(0, N).map((x) => key(r, x));
      effects.push({ kind: 'h', r });
    } else if (g.sp === 'v') {
      targets = range(0, N).map((y) => key(y, c));
      effects.push({ kind: 'v', c });
    } else if (g.sp === 'a') {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (inBounds(r + dr, c + dc)) targets.push(key(r + dr, c + dc));
      effects.push({ kind: 'ring', r, c });
    } else if (g.sp === 'c') {
      const col = g.target ?? mostCommon(grid);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (grid[y][x]?.t === col) targets.push(key(y, x));
      effects.push({ kind: 'zap', r, c, to: targets.map(unkey) });
    }
    for (const t of targets) {
      if (!all.has(t)) { all.add(t); queue.push(t); }
    }
  }
  return { all, effects };
}

/** Let gems fall into gaps and fill each column from the top with new gems. */
export function applyGravity(grid) {
  for (let c = 0; c < N; c++) {
    let w = N - 1;
    for (let r = N - 1; r >= 0; r--) {
      const g = grid[r][c];
      if (!g) continue;
      if (r !== w) { grid[w][c] = g; grid[r][c] = null; g.r = w; }
      w--;
    }
    const missing = w + 1;
    for (let r = w; r >= 0; r--) grid[r][c] = makeGem(rnd(T), r, c, { drop: missing });
  }
}

/** Rearrange the same gems until the board has no matches and at least one move. */
export function shuffleBoard(grid) {
  const gems = grid.flat();
  for (let tries = 0; tries < 300; tries++) {
    for (let i = gems.length - 1; i > 0; i--) {
      const j = rnd(i + 1);
      [gems[i], gems[j]] = [gems[j], gems[i]];
    }
    const next = range(0, N).map((r) => range(0, N).map((c) => {
      const g = gems[r * N + c];
      g.r = r; g.c = c;
      return g;
    }));
    if (!findRuns(next).length && findHint(next)) return next;
  }
  return createBoard();
}
