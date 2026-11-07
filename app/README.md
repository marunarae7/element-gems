# 원소 보석 게임 (React)

`index.html` 한 파일로 된 원래 게임을 React + Vite로 다시 만든 버전입니다. 게임 규칙과 원소 구성은 PRD와 같습니다.

## 실행

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:5173)
npm test         # 게임 로직 테스트
npm run build    # dist/ 폴더에 배포용 파일 생성
```

`dist/` 안의 파일은 어느 하위 경로에 올려도 동작합니다 (`base: './'`).

## 구조

| 파일 | 역할 |
| --- | --- |
| `src/game/elements.js` | 원소 6개 (기호, 원자번호, 색) |
| `src/game/engine.js` | 매치 찾기, 특수 보석, 중력, 섞기 (React 없는 순수 로직) |
| `src/game/engine.test.js` | 엔진 테스트 |
| `src/game/useGame.js` | 턴 진행, 연쇄, 점수, 레벨, 힌트 |
| `src/game/sound.js` | 효과음 |
| `src/components/` | 보드, 타일, 효과, 상태 표시, 결과 창, 도움말 |
| `src/styles.css` | 화면 스타일과 애니메이션 |
