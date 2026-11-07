// 원자번호 1~20번 원소 중 6개. Li·Na·K·Ca는 불꽃 반응 색, C·O는 구분용 색.
export const ELEMENTS = [
  { sym: 'Li', num: 3,  name: '리튬',   colorName: '빨강', reason: '불꽃 반응', c1: '#ff9aa8', c2: '#e3152f', c3: '#6e0010' },
  { sym: 'C',  num: 6,  name: '탄소',   colorName: '초록', reason: '구분용',   c1: '#a8f5b4', c2: '#1db544', c3: '#04501a' },
  { sym: 'O',  num: 8,  name: '산소',   colorName: '파랑', reason: '구분용',   c1: '#b0d8ff', c2: '#2272e6', c3: '#0a2a78' },
  { sym: 'Na', num: 11, name: '나트륨', colorName: '노랑', reason: '불꽃 반응', c1: '#fff3a8', c2: '#f0b000', c3: '#7a4f00' },
  { sym: 'K',  num: 19, name: '칼륨',   colorName: '보라', reason: '불꽃 반응', c1: '#efbfff', c2: '#a133dd', c3: '#420a70' },
  { sym: 'Ca', num: 20, name: '칼슘',   colorName: '주황', reason: '불꽃 반응', c1: '#ffd2a3', c2: '#f27a10', c3: '#6e2e00' },
];

/** Board size (N × N) and number of element types. */
export const N = 8;
export const T = ELEMENTS.length;
export const GOLD = '#ffd34d';
