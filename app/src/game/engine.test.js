import { describe, expect, it } from 'vitest';
import { N, T } from './elements.js';
import * as E from './engine.js';

// Build a grid from a pattern of element indexes. Default fill has no matches anywhere.
function gridFrom(set = {}) {
  const grid = [];
  for (let r = 0; r < N; r++) {
    const row = [];
    for (let c = 0; c < N; c++) {
      const t = set[`${r},${c}`] ?? ((r * 2 + c) % 5) + 1; // types 1..5, no lines or squares
      row.push(E.makeGem(t, r, c));
    }
    grid.push(row);
  }
  return grid;
}

describe('base pattern', () => {
  it('has no matches', () => {
    expect(E.findRuns(gridFrom())).toEqual([]);
  });
});

describe('findRuns', () => {
  it('finds a horizontal line of 3', () => {
    const runs = E.findRuns(gridFrom({ '2,1': 0, '2,2': 0, '2,3': 0 }));
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({ dir: 'h', t: 0 });
    expect(runs[0].cells).toEqual([[2, 1], [2, 2], [2, 3]]);
  });

  it('finds a vertical line of 3', () => {
    const runs = E.findRuns(gridFrom({ '1,4': 0, '2,4': 0, '3,4': 0 }));
    expect(runs).toHaveLength(1);
    expect(runs[0].dir).toBe('v');
  });

  it('finds a 2x2 square', () => {
    const runs = E.findRuns(gridFrom({ '3,3': 0, '3,4': 0, '4,3': 0, '4,4': 0 }));
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({ dir: 'sq', sq: true });
  });

  it('ignores gold coins', () => {
    const g = gridFrom({ '0,0': 0, '0,1': 0 });
    g[0][2] = E.makeGem(E.COIN, 0, 2, { sp: 'c' });
    expect(E.findRuns(g)).toEqual([]);
  });
});

describe('planMatches', () => {
  it('makes a striped gem at the swapped cell for a line of 4', () => {
    const g = gridFrom({ '5,0': 0, '5,1': 0, '5,2': 0, '5,3': 0 });
    const plan = E.planMatches(E.findRuns(g), [[5, 2]]);
    expect(plan.creates).toEqual([{ r: 5, c: 2, t: 0, sp: 'h' }]);
    expect(plan.clear.size).toBe(4);
  });

  it('makes a gold coin for a line of 5', () => {
    const g = gridFrom({ '0,0': 0, '0,1': 0, '0,2': 0, '0,3': 0, '0,4': 0 });
    const plan = E.planMatches(E.findRuns(g));
    expect(plan.creates).toHaveLength(1);
    expect(plan.creates[0]).toMatchObject({ t: E.COIN, sp: 'c' });
  });

  it('makes a bomb where an L shape crosses', () => {
    const g = gridFrom({ '0,0': 0, '0,1': 0, '0,2': 0, '1,0': 0, '2,0': 0 });
    const plan = E.planMatches(E.findRuns(g));
    expect(plan.creates).toEqual([{ r: 0, c: 0, t: 0, sp: 'a' }]);
  });

  it('clears a square without making a special', () => {
    const g = gridFrom({ '3,3': 0, '3,4': 0, '4,3': 0, '4,4': 0 });
    const plan = E.planMatches(E.findRuns(g));
    expect(plan.creates).toEqual([]);
    expect(plan.clear.size).toBe(4);
    expect(plan.squares).toEqual([[3, 3]]);
  });
});

describe('expandSpecials', () => {
  it('a striped gem clears its whole row', () => {
    const g = gridFrom();
    g[2][5].sp = 'h';
    const { all, effects } = E.expandSpecials(g, new Set([E.key(2, 5)]));
    expect(all.size).toBe(N);
    expect(effects).toEqual([{ kind: 'h', r: 2 }]);
  });

  it('a coin with a target clears every gem of that element', () => {
    const g = gridFrom();
    const coin = E.makeGem(E.COIN, 0, 0, { sp: 'c', target: 1 });
    g[0][0] = coin;
    const expected = g.flat().filter((x) => x.t === 1).length + 1;
    const { all } = E.expandSpecials(g, new Set([E.key(0, 0)]));
    expect(all.size).toBe(expected);
  });
});

describe('board lifecycle', () => {
  it('createBoard has no matches and at least one move', () => {
    for (let i = 0; i < 20; i++) {
      const g = E.createBoard();
      expect(E.findRuns(g)).toEqual([]);
      expect(E.findHint(g)).not.toBeNull();
      expect(g.flat().every((x) => x.t >= 0 && x.t < T)).toBe(true);
    }
  });

  it('applyGravity fills every cell and keeps r/c in sync', () => {
    const g = gridFrom();
    g[7][3] = null; g[6][3] = null; g[0][0] = null;
    E.applyGravity(g);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      expect(g[r][c]).toBeTruthy();
      expect([g[r][c].r, g[r][c].c]).toEqual([r, c]);
    }
    expect(g[0][3].drop).toBe(2);
  });

  it('swapCells keeps r/c in sync', () => {
    const g = gridFrom();
    const a = g[1][1], b = g[1][2];
    E.swapCells(g, [1, 1], [1, 2]);
    expect(g[1][2]).toBe(a);
    expect([a.r, a.c]).toEqual([1, 2]);
    expect([b.r, b.c]).toEqual([1, 1]);
  });
});
