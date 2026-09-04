import type { WebVitalMetric } from '@types/index';

interface WebVitalCardProps {
  metric: WebVitalMetric;
  name: string;
}

function getStatusColor(rating: string): string {
  if (rating === 'good') return 'var(--score-good)';
  if (rating === 'needs-improvement') return 'var(--score-medium)';
  return 'var(--score-poor)';
}

function formatValue(value: number, unit: string): string {
  if (unit === 'ms') return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`;
  if (unit === '') return value.toFixed(3);
  return `${value} ${unit}`;
}

export default function WebVitalCard({ metric, name }: WebVitalCardProps) {
  const color = getStatusColor(metric.rating);
  return (
    <div style={{ padding: '0.875rem 1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{name}</span>
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono, monospace)', marginBottom: 2 }}>
        {formatValue(metric.value, metric.unit)}
      </div>
      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{metric.description}</div>
    </div>
  );
}
