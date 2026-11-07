import { ELEMENTS } from '../game/elements.js';

export default function Help() {
  return (
    <div className="help">
      <p>
        타일을 드래그하거나 두 개를 차례로 눌러 자리를 바꾸세요. 같은 원소 3개 이상을 한 줄로 맞추거나,
        2×2 사각형으로 모으면 사라집니다.
      </p>
      <p>
        보석은 원자번호 1~20번 원소예요:{' '}
        {ELEMENTS.map((el, i) => (
          <span key={el.sym}>
            {i > 0 && ' · '}
            <b>{el.sym}</b> {el.colorName}
          </span>
        ))}
        <br />
        (Li·Na·K·Ca의 색은 불꽃 반응 색이고, C·O의 색은 구분하기 쉽게 정한 색이에요.)
      </p>
      <p>4개 = 줄무늬 보석(한 줄 제거) · L/T자 = 폭탄 보석(주변 제거) · 5개 = ⭐ 황금 코인(같은 원소 전부 제거)</p>
    </div>
  );
}
