// 생성 문제에 붙일 그림(svg). 문항 은행 그림과 같은 모양: 연한 파랑 도형, 검은 이름, 파란 길이, 빨간 각
// 좌표는 cm 단위(위쪽이 +y)로 만들고 fit()으로 그림 칸에 맞춘다. 길이·각은 실제 비율대로 그린다.

const INK = '#1f2937';
const BLUE = '#2563eb';
const RED = '#dc2626';
const PINK = '#ec4899';
const f1 = (n) => Math.round(n * 10) / 10;

/** cm 좌표 점들을 [x, y, w, h] 칸 가운데에 맞춘 함수 (y는 아래로) */
export function fit(points, [bx, by, bw, bh]) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const s = Math.min(bw / (maxX - minX || 1), bh / (maxY - minY || 1));
  const ox = bx + (bw - (maxX - minX) * s) / 2;
  const oy = by + (bh - (maxY - minY) * s) / 2;
  return (p) => [f1(ox + (p[0] - minX) * s), f1(oy + (maxY - p[1]) * s)];
}

const centroid = (ps) => [ps.reduce((a, p) => a + p[0], 0) / ps.length, ps.reduce((a, p) => a + p[1], 0) / ps.length];
const unit = (x, y) => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};

export const text = (x, y, t, { size = 18, color = INK, bold = true } = {}) =>
  `<text x="${f1(x)}" y="${f1(y)}" font-size="${size}" fill="${color}" text-anchor="middle" dominant-baseline="central"${bold ? ' font-weight="bold"' : ''}>${t}</text>`;

export const polygon = (ps, fill = '#dbeafe') => `<polygon points="${ps.map((p) => p.join(',')).join(' ')}" fill="${fill}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;

export const line = (a, b, { color = '#64748b', dash = false, width = 2 } = {}) =>
  `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"${dash ? ' stroke-dasharray="8 6"' : ''}/>`;

/** 꼭짓점 이름: 도형 가운데에서 바깥쪽으로 조금 떨어뜨려 */
export function vertexNames(ps, names) {
  const c = centroid(ps);
  return ps.map((p, i) => {
    const [ux, uy] = unit(p[0] - c[0], p[1] - c[1]);
    return text(p[0] + ux * 21, p[1] + uy * 21, names[i]);
  });
}

/** 길이 표시: 변과 나란한 치수선(양 끝 눈금)을 도형 바깥쪽에 긋고 가운데에 길이를 쓴다. 어느 변의 길이인지 끝점까지 분명하게 */
export function sideLabel(a, b, ps, label, { inside = false, gap = 13 } = {}) {
  const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const c = centroid(ps);
  let [nx, ny] = unit(-(b[1] - a[1]), b[0] - a[0]);
  if ((m[0] - c[0]) * nx + (m[1] - c[1]) * ny < 0) [nx, ny] = [-nx, -ny];
  if (inside) [nx, ny] = [-nx, -ny];
  return dim(a, b, label, [nx * gap, ny * gap]);
}

/** 치수선: 양 끝 눈금 + 가운데 흰 바탕 이름표 */
export function dim(a, b, label, off = [0, 16]) {
  const [ax, ay, bx, by] = [a[0] + off[0], a[1] + off[1], b[0] + off[0], b[1] + off[1]];
  const [ux, uy] = unit(-(by - ay), bx - ax);
  const tick = (x, y) => `<line x1="${f1(x + ux * 5)}" y1="${f1(y + uy * 5)}" x2="${f1(x - ux * 5)}" y2="${f1(y - uy * 5)}"/>`;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const w = label.length * 9 + 10;
  return (
    `<g stroke="${BLUE}" stroke-width="1.6"><line x1="${f1(ax)}" y1="${f1(ay)}" x2="${f1(bx)}" y2="${f1(by)}"/>${tick(ax, ay)}${tick(bx, by)}</g>` +
    `<rect x="${f1(mx - w / 2)}" y="${f1(my - 10)}" width="${w}" height="20" rx="4" fill="#fff" fill-opacity=".9"/>${text(mx, my, label, { size: 16, color: BLUE, bold: false })}`
  );
}

/** 각 표시: 꼭짓점 v에서 p, q 쪽으로 호 + 안쪽에 빨간 이름표 */
export function angleMark(v, p, q, label, r = 24) {
  const a1 = Math.atan2(p[1] - v[1], p[0] - v[0]);
  let a2 = Math.atan2(q[1] - v[1], q[0] - v[0]);
  let d = a2 - a1;
  while (d <= -Math.PI) d += 2 * Math.PI;
  while (d > Math.PI) d -= 2 * Math.PI;
  a2 = a1 + d;
  const s = [v[0] + r * Math.cos(a1), v[1] + r * Math.sin(a1)];
  const e = [v[0] + r * Math.cos(a2), v[1] + r * Math.sin(a2)];
  const mid = a1 + d / 2;
  const lx = v[0] + (r + 22) * Math.cos(mid);
  const ly = v[1] + (r + 16) * Math.sin(mid);
  const w = label.length * 9 + 8;
  return (
    `<path d="M${f1(s[0])},${f1(s[1])} A${r},${r} 0 0 ${d > 0 ? 1 : 0} ${f1(e[0])},${f1(e[1])}" fill="none" stroke="${RED}" stroke-width="2.2"/>` +
    `<rect x="${f1(lx - w / 2)}" y="${f1(ly - 10)}" width="${w}" height="20" rx="4" fill="#fff" fill-opacity=".85"/>${text(lx, ly, label, { size: 16, color: RED, bold: false })}`
  );
}

export const dot = (p, color = PINK) => `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${color}"/>`;

export const svgDoc = (h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${h}" width="360" height="${h}" font-family="sans-serif"><rect width="360" height="${h}" fill="#fff"/>${body}</svg>`;

/** 세 변(ㄱㄴ=a, ㄴㄷ=b, ㄷㄱ=c)으로 삼각형 꼭짓점 [ㄱ, ㄴ, ㄷ] (cm, 위가 +y) */
export function triangleBySides(a, b, c) {
  const x = (a * a + b * b - c * c) / (2 * b);
  return [[x, Math.sqrt(Math.max(0, a * a - x * x))], [0, 0], [b, 0]];
}
/** 밑변 L과 양 끝 각(ㄴ=B°, ㄷ=C°)으로 삼각형 꼭짓점 [ㄱ, ㄴ, ㄷ] */
export function triangleByAngles(L, B, C) {
  const tb = Math.tan((B * Math.PI) / 180);
  const tc = Math.tan((C * Math.PI) / 180);
  const x = (L * tc) / (tb + tc);
  return [[x, x * tb], [0, 0], [L, 0]];
}
/** 가장 작은 각(도) */
export function minAngle(ps) {
  return Math.min(
    ...ps.map((p, i) => {
      const a = ps[(i + 1) % 3];
      const b = ps[(i + 2) % 3];
      const v1 = unit(a[0] - p[0], a[1] - p[1]);
      const v2 = unit(b[0] - p[0], b[1] - p[1]);
      return (Math.acos(Math.max(-1, Math.min(1, v1[0] * v2[0] + v1[1] * v2[1]))) * 180) / Math.PI;
    }),
  );
}
