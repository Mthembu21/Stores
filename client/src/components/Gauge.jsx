const TRACK_COLOR = '#e2e8f0';

export function scoreColor(value) {
  if (value === null || value === undefined) return '#94a3b8';
  if (value >= 90) return '#16a34a';
  if (value >= 70) return '#FFCD00';
  return '#dc2626';
}

export function Gauge({ value, size = 96, strokeWidth = 10, label, sublabel }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = value === null || value === undefined ? 0 : Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - pct / 100);
  const color = scoreColor(value);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={TRACK_COLOR} strokeWidth={strokeWidth} />
        {value !== null && value !== undefined && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        )}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.22}
          fontWeight="700"
          fill="#334155"
        >
          {value === null || value === undefined ? '—' : `${value}%`}
        </text>
      </svg>
      {label && <div className="text-xs font-semibold text-slate-700 text-center leading-tight">{label}</div>}
      {sublabel && <div className="text-[11px] text-slate-400 text-center leading-tight">{sublabel}</div>}
    </div>
  );
}
