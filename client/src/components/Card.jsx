export function Card({ title, value, tone = 'default' }) {
  const toneClass =
    tone === 'warning'
      ? 'border-epiroc-yellow'
      : tone === 'danger'
        ? 'border-red-500'
        : 'border-transparent';

  return (
    <div className={`rounded-xl bg-white shadow-soft p-4 border ${toneClass}`.trim()}>
      <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}
