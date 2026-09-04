import type { WebVitalMetric } from '@/types';
import { formatDuration, formatScore } from '@/utils/formatting';

interface WebVitalCardProps {
  name: string;
  metric: WebVitalMetric;
  compact?: boolean;
}

const RATING_CONFIG = {
  good: { label: 'Good', color: 'var(--score-good)', bg: 'rgba(34, 197, 94, 0.15)' },
  'needs-improvement': { label: 'Needs Improvement', color: 'var(--score-medium)', bg: 'rgba(245, 158, 11, 0.15)' },
  poor: { label: 'Poor', color: 'var(--score-poor)', bg: 'rgba(239, 68, 68, 0.15)' },
};

export default function WebVitalCard({ name, metric, compact = false }: WebVitalCardProps) {
  const rating = RATING_CONFIG[metric.rating];
  const maxValue = metric.threshold.poor * 1.5;
  const barPercent = Math.min((metric.value / maxValue) * 100, 100);

  return (
    <article
      className="card"
      style={{
        padding: compact ? 'var(--space-md)' : 'var(--space-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? 8 : 12,
      }}
      aria-label={`${name}: ${metric.value}${metric.unit} - ${rating.label}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <h4
          style={{
            margin: 0,
            fontSize: compact ? 'var(--font-sm)' : 'var(--font-base)',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {name}
        </h4>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 10px',
            fontSize: 'var(--font-xs)',
            fontWeight: 600,
            borderRadius: 'var(--radius-full)',
            color: rating.color,
            backgroundColor: rating.bg,
            whiteSpace: 'nowrap',
          }}
        >
          {rating.label}
        </span>
      </div>

      <div
        style={{
          fontSize: compact ? 'var(--font-2xl)' : 'var(--font-3xl)',
          fontWeight: 700,
          color: rating.color,
          fontFamily: '"SF Mono", "Fira Code", monospace',
          lineHeight: 1.1,
        }}
      >
        {metric.unit === 'ms' ? formatDuration(metric.value) : formatScore(metric.value)}
        {metric.unit !== 'ms' && metric.unit !== '' && (
          <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: 4 }}>
            {metric.unit}
          </span>
        )}
      </div>

      <div
        style={{
          height: 6,
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
        }}
        role="progressbar"
        aria-valuenow={metric.value}
        aria-valuemin={0}
        aria-valuemax={metric.threshold.poor}
        aria-label={`${name} progress`}
      >
        <div
          style={{
            height: '100%',
            width: `${barPercent}%`,
            backgroundColor: rating.color,
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.6s ease',
          }}
        />
      </div>

      {!compact && (
        <>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--font-sm)',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            {metric.description}
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 'var(--font-xs)',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
              gap: 4,
            }}
          >
            <span>
              Target: {'good' in metric.threshold ? `<${formatDuration(metric.threshold.good)}` : `<${metric.threshold.good}`}
            </span>
            <span style={{ color: 'var(--color-info)' }}>{metric.suggestion}</span>
          </div>
        </>
      )}
    </article>
  );
}
