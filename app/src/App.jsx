import { useGame } from './game/useGame.js';
import Hud from './components/Hud.jsx';
import Board from './components/Board.jsx';
import ResultOverlay from './components/ResultOverlay.jsx';
import Help from './components/Help.jsx';

function Scenery() {
  return (
    <svg className="scenery" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path d="M0 400 L0 210 L80 210 L95 170 L210 170 L225 215 L300 230 L340 140 L470 140 L490 200 L560 260 L700 250 L720 190 L830 190 L850 240 L960 250 L990 160 L1110 160 L1130 220 L1200 230 L1200 400Z" fill="#b5532a" opacity=".85" />
      <path d="M0 400 L0 300 L150 280 L260 310 L420 290 L600 320 L780 295 L940 315 L1100 290 L1200 300 L1200 400Z" fill="#8a3a1a" />
      <g fill="#3f6b2a">
        <path d="M140 300 v-70 a12 12 0 0 1 24 0 v70z M128 260 v-22 a8 8 0 0 1 16 0 v30z M160 255 v-30 a8 8 0 0 1 16 0 v22z" />
        <path d="M1030 305 v-90 a14 14 0 0 1 28 0 v90z M1016 260 v-26 a9 9 0 0 1 18 0 v34z M1056 250 v-34 a9 9 0 0 1 18 0 v26z" />
      </g>
    </svg>
  );
}

export default function App() {
  const game = useGame();
  return (
    <>
      <Scenery />
      <main className="game">
        <h1 className="title">GOLD CANYON GEMS</h1>
        <div className="sub">골드 캐니언 보석</div>
        <Hud level={game.level} score={game.score} target={game.target} moves={game.moves} />
        <Board game={game}>
          <ResultOverlay overlay={game.overlay} onNext={game.nextLevel} onRetry={game.retry} />
        </Board>
        <div className="tools">
          <button type="button" onClick={game.showHint}>💡 힌트</button>
          <button type="button" onClick={game.restart}>↻ 다시 시작</button>
          <button type="button" onClick={game.toggleSound}>{game.soundOn ? '🔊 소리' : '🔇 소리'}</button>
        </div>
        <Help />
      </main>
    </>
  );
}
