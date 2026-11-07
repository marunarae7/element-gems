// Game flow on top of the pure engine: turns, cascades, scoring, levels, timing.
// The board is mutated in a ref (async cascades need the live grid), and render() asks React to redraw.
import { useCallback, useEffect, useRef, useState } from 'react';
import * as E from './engine.js';
import { N } from './elements.js';
import { sound } from './sound.js';

// Keep these in sync with the transition/animation times in styles.css.
export const SWAP_MS = 180;
export const CLEAR_MS = 280;
export const FALL_MS = 340;
const HINT_IDLE_MS = 7000;

export const targetFor = (level) => 2500 + (level - 1) * 1500;
export const movesFor = (level) => Math.max(16, 26 - level);
export function starsFor(score, target) {
  const ratio = score / target;
  return ratio >= 1.8 ? 3 : ratio >= 1.35 ? 2 : 1;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fxSeq = 0;

function freshState(level) {
  return {
    grid: E.createBoard(),
    level,
    score: 0,
    target: targetFor(level),
    moves: movesFor(level),
    combo: 0,
    busy: true,
    selected: null,
    hint: null,
    overlay: null,
    lastAct: Date.now(),
    token: 0,
  };
}

export function useGame() {
  const ref = useRef(null);
  if (!ref.current) ref.current = freshState(1);
  const [, setTick] = useState(0);
  const render = useCallback(() => setTick((t) => t + 1), []);
  const [dying, setDying] = useState([]);
  const [effects, setEffects] = useState([]);
  const [texts, setTexts] = useState([]);
  const [soundOn, setSoundOn] = useState(sound.enabled);

  const addEffect = useCallback((fx, ms = 520) => {
    const id = ++fxSeq;
    const item = { ...fx, id };
    if (fx.kind === 'zap') {
      // Pre-compute jagged lightning paths so they don't change on every render.
      item.paths = fx.to.map(([r, c]) => {
        const x0 = fx.c + 0.5, y0 = fx.r + 0.5, x1 = c + 0.5, y1 = r + 0.5;
        const pts = [[x0, y0]];
        for (let i = 1; i < 5; i++) pts.push([x0 + (x1 - x0) * i / 5 + (Math.random() - 0.5) * 0.4, y0 + (y1 - y0) * i / 5 + (Math.random() - 0.5) * 0.4]);
        pts.push([x1, y1]);
        return pts.map((p) => p.join(',')).join(' ');
      });
    }
    setEffects((l) => [...l, item]);
    setTimeout(() => setEffects((l) => l.filter((f) => f.id !== id)), ms);
  }, []);

  const addText = useCallback((t, ms = 1200) => {
    const id = ++fxSeq;
    setTexts((l) => [...l, { ...t, id }]);
    setTimeout(() => setTexts((l) => l.filter((x) => x.id !== id)), ms);
  }, []);

  // Let the opening drop-in finish before accepting input.
  const beginLevel = useCallback((level) => {
    const token = (ref.current?.token ?? 0) + 1;
    ref.current = { ...freshState(level), token };
    setDying([]);
    setEffects([]);
    setTexts([]);
    render();
    setTimeout(() => {
      const s = ref.current;
      if (s.token !== token) return;
      s.busy = false;
      s.lastAct = Date.now();
      render();
    }, FALL_MS + 300);
  }, [render]);

  useEffect(() => {
    beginLevel(1);
  }, [beginLevel]);

  // Show a hint after a while with no input.
  useEffect(() => {
    const id = setInterval(() => {
      const s = ref.current;
      if (!s.busy && !s.overlay && !s.hint && Date.now() - s.lastAct > HINT_IDLE_MS) {
        s.hint = E.findHint(s.grid);
        render();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [render]);

  async function clearCells(clear, creates = [], squares = []) {
    const s = ref.current;
    const { all, effects: fx } = E.expandSpecials(s.grid, clear);
    squares.forEach(([r, c]) => addEffect({ kind: 'sq', r, c }));
    fx.forEach((f) => addEffect(f));

    const removed = [];
    all.forEach((k) => {
      const [r, c] = E.unkey(k);
      const gem = s.grid[r][c];
      if (!gem) return;
      removed.push({
        ...gem,
        sparks: Array.from({ length: 6 }, () => ({ dx: (Math.random() - 0.5) * 14, dy: (Math.random() - 0.6) * 14 })),
      });
      s.grid[r][c] = null;
    });
    creates.forEach((o) => {
      s.grid[o.r][o.c] = E.makeGem(o.t, o.r, o.c, { sp: o.sp, created: true });
    });

    const mult = Math.max(1, s.combo);
    const pts = removed.length * 30 * mult + creates.length * 120;
    s.score += pts;
    if (removed.length) {
      const x = removed.reduce((a, g) => a + g.c, 0) / removed.length;
      const y = removed.reduce((a, g) => a + g.r, 0) / removed.length;
      addText({ x, y, text: `+${pts}`, big: mult > 1 });
    }
    if (s.combo > 1) addText({ x: (N - 1) / 2, y: N / 2 - 1.5, text: `${s.combo} 콤보!`, big: true, color: '#ffef7a' });
    sound.match(s.combo || 1);
    if (fx.length) sound.boom();

    setDying((d) => [...d, ...removed]);
    render();
    await sleep(CLEAR_MS);
    const gone = new Set(removed.map((g) => g.id));
    setDying((d) => d.filter((g) => !gone.has(g.id)));
  }

  async function gravity() {
    E.applyGravity(ref.current.grid);
    render();
    await sleep(FALL_MS);
  }

  async function resolve(swapped) {
    const s = ref.current;
    s.combo = 0;
    for (;;) {
      const runs = E.findRuns(s.grid);
      if (!runs.length) break;
      s.combo++;
      const plan = E.planMatches(runs, swapped);
      await clearCells(plan.clear, plan.creates, plan.squares);
      await gravity();
      swapped = [];
    }
  }

  async function endTurn() {
    const s = ref.current;
    render();
    if (s.score >= s.target) {
      await sleep(300);
      const bonus = s.moves * 150;
      if (bonus) {
        s.score += bonus;
        addText({ x: (N - 1) / 2, y: N / 2 - 0.5, text: `남은 이동 보너스 +${bonus}`, big: true, color: '#bff' }, 1500);
        render();
        await sleep(900);
      }
      sound.win();
      s.overlay = { kind: 'win', stars: starsFor(s.score, s.target), score: s.score };
      render();
      return;
    }
    if (s.moves <= 0) {
      s.overlay = { kind: 'lose', short: s.target - s.score };
      render();
      return;
    }
    if (!E.findHint(s.grid)) {
      addText({ x: (N - 1) / 2, y: N / 2 - 0.5, text: '움직일 수 없어 섞는 중...', big: true, color: '#fff' }, 1400);
      await sleep(600);
      s.grid = E.shuffleBoard(s.grid);
      render();
      await sleep(FALL_MS);
      await resolve([]);
    }
    s.busy = false;
    s.lastAct = Date.now();
    render();
  }

  async function trySwap(a, b) {
    const s = ref.current;
    s.busy = true;
    s.selected = null;
    s.hint = null;
    const A = s.grid[a[0]][a[1]];
    const B = s.grid[b[0]][b[1]];
    E.swapCells(s.grid, a, b);
    sound.swap();
    render();
    await sleep(SWAP_MS);

    if (A.sp === 'c' || B.sp === 'c') {
      s.moves--;
      s.combo = 1;
      const clear = new Set();
      if (A.sp === 'c' && B.sp === 'c') {
        for (let k = 0; k < N * N; k++) clear.add(k);
        addEffect({ kind: 'ring', r: b[0], c: b[1], big: true }, 700);
      } else {
        const bomb = A.sp === 'c' ? A : B;
        const other = bomb === A ? B : A;
        bomb.target = other.t;
        if (other.sp) {
          // Coin + special: every gem of that element turns special, then they all go off.
          for (const row of s.grid) for (const g of row) {
            if (g && g.t === other.t && !g.sp) g.sp = other.sp === 'a' ? 'a' : (Math.random() < 0.5 ? 'h' : 'v');
          }
        }
        clear.add(E.key(bomb.r, bomb.c));
      }
      render();
      await clearCells(clear);
      await gravity();
      await resolve([]);
    } else if (E.findRuns(s.grid).length) {
      s.moves--;
      render();
      await resolve([a, b]);
    } else {
      sound.bad();
      E.swapCells(s.grid, a, b);
      render();
      await sleep(SWAP_MS);
      s.busy = false;
      s.lastAct = Date.now();
      render();
      return;
    }
    await endTurn();
  }

  // ---- input actions ----
  /** Pointer down on a cell. Returns true when a drag may start from this cell. */
  function cellDown(r, c) {
    sound.unlock();
    const s = ref.current;
    if (s.busy || s.overlay) return false;
    s.lastAct = Date.now();
    s.hint = null;
    const sel = s.selected;
    if (sel && Math.abs(sel[0] - r) + Math.abs(sel[1] - c) === 1) {
      s.selected = null;
      trySwap(sel, [r, c]);
      return false;
    }
    s.selected = sel && sel[0] === r && sel[1] === c ? null : [r, c];
    render();
    return true;
  }

  function dragTo(a, b) {
    const s = ref.current;
    if (s.busy || s.overlay || !E.inBounds(b[0], b[1])) return;
    s.selected = null;
    trySwap(a, b);
  }

  function showHint() {
    sound.unlock();
    const s = ref.current;
    if (s.busy || s.overlay) return;
    s.hint = E.findHint(s.grid);
    render();
  }

  function restart() {
    sound.unlock();
    const s = ref.current;
    if (s.busy && !s.overlay) return;
    beginLevel(s.level);
  }

  function toggleSound() {
    sound.unlock();
    setSoundOn(sound.toggle());
  }

  const s = ref.current;
  return {
    grid: s.grid,
    level: s.level,
    score: s.score,
    target: s.target,
    moves: s.moves,
    selected: s.selected,
    hint: s.hint,
    overlay: s.overlay,
    dying,
    effects,
    texts,
    soundOn,
    cellDown,
    dragTo,
    showHint,
    restart,
    nextLevel: () => beginLevel(s.level + 1),
    retry: () => beginLevel(s.level),
    toggleSound,
  };
}
