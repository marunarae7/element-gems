import { N } from '../game/elements.js';

const pct = (cells) => `${(cells * 100) / N}%`;

export default function Effects({ effects }) {
  return effects.map((f) => {
    switch (f.kind) {
      case 'h':
        return <div key={f.id} className="fx beam beam-h" style={{ top: pct(f.r) }} />;
      case 'v':
        return <div key={f.id} className="fx beam beam-v" style={{ left: pct(f.c) }} />;
      case 'ring':
        return (
          <div
            key={f.id}
            className={f.big ? 'fx ring big' : 'fx ring'}
            style={{ left: pct(f.c + 0.5), top: pct(f.r + 0.5) }}
          />
        );
      case 'sq':
        return <div key={f.id} className="fx square" style={{ left: pct(f.c), top: pct(f.r) }} />;
      case 'zap':
        return (
          <svg key={f.id} className="fx zap" viewBox={`0 0 ${N} ${N}`} preserveAspectRatio="none" aria-hidden="true">
            {f.paths.map((p, i) => <polyline key={i} points={p} />)}
          </svg>
        );
      default:
        return null;
    }
  });
}
