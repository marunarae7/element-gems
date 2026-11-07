export default function ResultOverlay({ overlay, onNext, onRetry }) {
  if (!overlay) return null;
  const win = overlay.kind === 'win';
  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="card">
        <h2>{win ? '레벨 클리어!' : '아쉬워요!'}</h2>
        {win && (
          <div className="stars" aria-label={`별 ${overlay.stars}개`}>
            {[1, 2, 3].map((i) => <span key={i} className={i <= overlay.stars ? '' : 'off'}>★</span>)}
          </div>
        )}
        <p>
          {win
            ? `점수 ${overlay.score.toLocaleString()}점`
            : `목표까지 ${overlay.short.toLocaleString()}점 부족했어요.`}
        </p>
        <button type="button" onClick={win ? onNext : onRetry} autoFocus>
          {win ? '다음 레벨 ▶' : '다시 도전'}
        </button>
      </div>
    </div>
  );
}
