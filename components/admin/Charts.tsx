/**
 * 서버 렌더링 SVG 차트 (관리자 대시보드용).
 * dataviz 원칙 적용: 얇은 마크 + 4px 라운드 데이터 끝, 2px 간격,
 * recessive 그리드, 선택적 직접 라벨(최댓값·마지막 값), 텍스트는 텍스트 토큰,
 * 단일 시리즈 브랜드 블루(#0052ff — 밝은 표면 대비 검증 통과), sr-only 표 병행.
 */

const BLUE = "#0052ff";
const GRID = "#eef0f3";
const INK = "#0a0b0d";
const MUTED = "#7c828a";

export function TrendBars({
  title,
  data,
  height = 180,
}: {
  title: string;
  data: { label: string; value: number }[];
  height?: number;
}) {
  const width = 560;
  const pad = { top: 18, right: 8, bottom: 24, left: 8 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((d) => d.value));
  const gap = 2;
  const barW = Math.max(4, innerW / data.length - gap);
  const maxIdx = data.findIndex((d) => d.value === max);

  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${title} 차트`}
        className="w-full"
      >
        {/* recessive 그리드 */}
        {[0.5, 1].map((f) => (
          <line
            key={f}
            x1={pad.left}
            x2={width - pad.right}
            y1={pad.top + innerH * (1 - f)}
            y2={pad.top + innerH * (1 - f)}
            stroke={GRID}
            strokeWidth={1}
          />
        ))}
        <line
          x1={pad.left}
          x2={width - pad.right}
          y1={pad.top + innerH}
          y2={pad.top + innerH}
          stroke="#dee1e6"
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const h = Math.round((d.value / max) * innerH);
          const x = pad.left + i * (innerW / data.length) + gap / 2;
          const y = pad.top + innerH - h;
          const showLabel = i === maxIdx || i === data.length - 1;
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(h, d.value > 0 ? 3 : 0)}
                rx={h > 4 ? 4 : 0}
                fill={BLUE}
              >
                <title>{`${d.label}: ${d.value}건`}</title>
              </rect>
              {/* 라운드는 위쪽만: 기준선 쪽 모서리 채움 */}
              {h > 4 && (
                <rect x={x} y={pad.top + innerH - Math.min(4, h)} width={barW} height={Math.min(4, h)} fill={BLUE} />
              )}
              {showLabel && d.value > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill={INK}
                >
                  {d.value}
                </text>
              )}
              {(i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)) && (
                <text
                  x={x + barW / 2}
                  y={height - 7}
                  textAnchor="middle"
                  fontSize={10}
                  fill={MUTED}
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">{title}</figcaption>
      <div className="sr-only">
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">구분</th>
              <th scope="col">건수</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <th scope="row">{d.label}</th>
                <td>{d.value}</td>
              </tr>
            ))}
          </tbody>
          </table>
      </div>
    </figure>
  );
}

export function HBars({
  title,
  data,
  unit = "건",
}: {
  title: string;
  data: { label: string; value: number }[];
  unit?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure>
      <ul aria-hidden className="space-y-2.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-xs text-body" title={d.label}>
              {d.label}
            </span>
            <span className="h-3.5 flex-1 overflow-hidden rounded-[4px] bg-strong">
              <span
                className="block h-full rounded-[4px] bg-primary"
                style={{ width: `${Math.max((d.value / max) * 100, d.value > 0 ? 3 : 0)}%` }}
                title={`${d.label}: ${d.value}${unit}`}
              />
            </span>
            <span className="w-10 shrink-0 text-right font-mono text-xs font-semibold text-ink">
              {d.value}
            </span>
          </li>
        ))}
      </ul>
      <figcaption className="sr-only">{title}</figcaption>
      <div className="sr-only">
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">구분</th>
              <th scope="col">{unit}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <th scope="row">{d.label}</th>
                <td>{d.value}</td>
              </tr>
            ))}
          </tbody>
          </table>
      </div>
    </figure>
  );
}
