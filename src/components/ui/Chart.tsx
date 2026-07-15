interface BarChartProps {
  data: Array<{ label: string; value: number; value2?: number }>;
  height?: number;
  color?: string;
  color2?: string;
  prefix?: string;
  showLegend?: boolean;
  legend1?: string;
  legend2?: string;
}

export function BarChart({ data, height = 180, color = '#2563eb', color2 = '#10b981', prefix = '', showLegend, legend1 = 'Value 1', legend2 = 'Value 2' }: BarChartProps) {
  const hasSecond = data.some(d => d.value2 !== undefined);
  const allValues = data.flatMap(d => [d.value, d.value2 ?? 0]);
  const max = Math.max(...allValues, 1);
  const padX = 8;
  const padY = 8;
  const chartW = 520;
  const chartH = height;
  const barW = hasSecond ? (chartW / data.length) * 0.35 : (chartW / data.length) * 0.6;
  const gap = hasSecond ? (chartW / data.length) * 0.05 : 0;

  return (
    <div>
      {showLegend && (
        <div className="flex gap-4 mb-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: color }} />
            {legend1}
          </span>
          {hasSecond && (
            <span className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: color2 }} />
              {legend2}
            </span>
          )}
        </div>
      )}
      <svg viewBox={`0 0 ${chartW + padX * 2} ${chartH + padY * 2 + 20}`} className="w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <line key={t} x1={padX} y1={padY + chartH * (1 - t)} x2={chartW + padX} y2={padY + chartH * (1 - t)}
            stroke="#f1f5f9" strokeWidth="1" />
        ))}
        {data.map((d, i) => {
          const slotW = chartW / data.length;
          const slotX = padX + i * slotW;
          const barH1 = (d.value / max) * chartH;
          const x1 = slotX + (slotW - barW * (hasSecond ? 2 : 1) - gap) / 2;
          const x2 = x1 + barW + gap;

          return (
            <g key={i}>
              <rect x={x1} y={padY + chartH - barH1} width={barW} height={barH1}
                fill={color} rx={3} opacity={0.9} />
              {hasSecond && d.value2 !== undefined && (
                <rect x={x2} y={padY + chartH - (d.value2 / max) * chartH} width={barW} height={(d.value2 / max) * chartH}
                  fill={color2} rx={3} opacity={0.9} />
              )}
              <text x={slotX + slotW / 2} y={chartH + padY + 14} textAnchor="middle"
                fontSize="10" fill="#94a3b8">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface LineChartProps {
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string;
  prefix?: string;
}

export function LineChart({ data, height = 120, color = '#2563eb', prefix = '' }: LineChartProps) {
  const max = Math.max(...data.map(d => d.value), 1);
  const min = Math.min(...data.map(d => d.value), 0);
  const range = max - min || 1;
  const W = 520;
  const H = height;
  const padX = 8;
  const padY = 10;

  const pts = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * W;
    const y = padY + H - ((d.value - min) / range) * H;
    return { x, y, d };
  });

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${padY + H} L${pts[0].x},${padY + H} Z`;

  return (
    <svg viewBox={`0 0 ${W + padX * 2} ${H + padY * 2 + 16}`} className="w-full">
      {/* Grid */}
      {[0, 0.5, 1].map(t => (
        <line key={t} x1={padX} y1={padY + H * (1 - t)} x2={W + padX} y2={padY + H * (1 - t)}
          stroke="#f1f5f9" strokeWidth="1" />
      ))}
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill={color} />
          <text x={p.x} y={H + padY + 14} textAnchor="middle" fontSize="10" fill="#94a3b8">{p.d.label}</text>
        </g>
      ))}
    </svg>
  );
}

interface HorizontalBarProps {
  data: Array<{ label: string; value: number; max?: number }>;
  color?: string;
  suffix?: string;
}

export function HorizontalBar({ data, color = '#2563eb', suffix = '%' }: HorizontalBarProps) {
  const maxVal = Math.max(...data.map(d => d.max ?? d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-600 font-medium truncate mr-2">{d.label}</span>
            <span className="text-slate-900 font-semibold flex-shrink-0">{d.value}{suffix}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(d.value / maxVal) * 100}%`, background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
