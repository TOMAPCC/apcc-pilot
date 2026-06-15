export function MetricCard({ label, value, hint }: Readonly<{ label: string; value: string | number; hint: string }>) {
  return (
    <div className="card metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}
