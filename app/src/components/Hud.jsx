export default function Hud({ level, score, target, moves }) {
  const progress = Math.min(100, (score / target) * 100);
  return (
    <div className="hud">
      <div className="stat">
        <small>레벨</small>
        <b>{level}</b>
      </div>
      <div className="stat wide">
        <small>점수 / 목표 {target.toLocaleString()}</small>
        <b>{score.toLocaleString()}</b>
        <div className="bar"><div className="bar-fill" style={{ width: `${progress}%` }} /></div>
      </div>
      <div className="stat">
        <small>남은 이동</small>
        <b>{moves}</b>
      </div>
    </div>
  );
}
