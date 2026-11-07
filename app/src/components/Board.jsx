import { useRef } from 'react';
import { N } from '../game/elements.js';
import { inBounds } from '../game/engine.js';
import Tile from './Tile.jsx';
import Effects from './Effects.jsx';

const pct = (cells) => `${(cells * 100) / N}%`;

export default function Board({ game, children }) {
  const boardRef = useRef(null);
  const drag = useRef(null);

  function cellAt(e) {
    const rect = boardRef.current.getBoundingClientRect();
    const size = rect.width / N;
    return { r: Math.floor((e.clientY - rect.top) / size), c: Math.floor((e.clientX - rect.left) / size), size };
  }

  function onPointerDown(e) {
    const { r, c, size } = cellAt(e);
    if (!inBounds(r, c)) return;
    if (game.cellDown(r, c)) {
      drag.current = { x: e.clientX, y: e.clientY, r, c, size };
      try { boardRef.current.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    }
  }

  function onPointerMove(e) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < d.size * 0.4) return;
    const [dr, dc] = Math.abs(dx) > Math.abs(dy) ? [0, Math.sign(dx)] : [Math.sign(dy), 0];
    drag.current = null;
    game.dragTo([d.r, d.c], [d.r + dr, d.c + dc]);
  }

  const endDrag = () => { drag.current = null; };
  const isAt = (cell, g) => !!cell && cell[0] === g.r && cell[1] === g.c;
  const hinted = (g) => !!game.hint && game.hint.some((h) => h[0] === g.r && h[1] === g.c);

  return (
    <div className="board-frame">
      <div
        className="board"
        ref={boardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {game.grid.flat().filter(Boolean).map((g) => (
          <Tile key={g.id} gem={g} selected={isAt(game.selected, g)} hinted={hinted(g)} />
        ))}
        {game.dying.map((g) => <Tile key={`d${g.id}`} gem={g} dying />)}
        <Effects effects={game.effects} />
        {game.texts.map((t) => (
          <div
            key={t.id}
            className={t.big ? 'float-text big' : 'float-text'}
            style={{
              left: `clamp(25%, ${pct(t.x + 0.5)}, 75%)`,
              top: pct(t.y + 0.5),
              color: t.color || '#fff',
            }}
          >
            {t.text}
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}
