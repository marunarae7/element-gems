import { ELEMENTS, GOLD } from '../game/elements.js';

// Layers: .tile = board position (transitions on swap/fall)
//         .tile-drop = entry animation (drop in from above, or pop for a newly made special)
//         .tile-fx = selection / hint / vanish animations
//         .tile-body = the element tile itself
export default function Tile({ gem, selected = false, hinted = false, dying = false }) {
  const el = ELEMENTS[gem.t];
  const tileClass = ['tile', selected && 'selected', hinted && 'hinted', dying && 'dying'].filter(Boolean).join(' ');
  const dropClass = ['tile-drop', !dying && gem.drop > 0 && 'dropping', !dying && gem.created && 'popping'].filter(Boolean).join(' ');

  return (
    <div className={tileClass} style={{ transform: `translate(${gem.c * 100}%, ${gem.r * 100}%)` }}>
      <div className={dropClass} style={{ '--drop': gem.drop }}>
        <div className="tile-fx">
          {gem.sp === 'c' ? (
            <div className="coin" aria-label="황금 코인">
              <span className="coin-star">★</span>
            </div>
          ) : (
            <div
              className="tile-body"
              style={{ '--c1': el.c1, '--c2': el.c2, '--c3': el.c3 }}
              aria-label={`${el.name} ${el.sym}`}
            >
              <span className="num">{el.num}</span>
              <span className={el.sym.length > 1 ? 'sym' : 'sym one'}>{el.sym}</span>
              {(gem.sp === 'h' || gem.sp === 'v') && <span className={`stripes ${gem.sp}`} />}
              {gem.sp === 'a' && <span className="bomb-ring" />}
            </div>
          )}
        </div>
      </div>
      {dying && gem.sparks?.map((s, i) => (
        <span
          key={i}
          className="spark"
          style={{ '--dx': s.dx, '--dy': s.dy, background: el ? el.c2 : GOLD }}
        />
      ))}
    </div>
  );
}
