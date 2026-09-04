import type { Diagnostic } from '@/types';
import { formatDuration, formatScore } from '@/utils/formatting';

interface DiagnosticCardProps {
  diagnostic: Diagnostic;
  compact?: boolean;
}

const STATUS_CONFIG = {
  good: { label: 'Good', color: 'var(--score-good)', bg: 'rgba(34, 197, 94, 0.15)' },
  warning: { label: 'Warning', color: 'var(--score-medium)', bg: 'rgba(245, 158, 11, 0.15)' },
  poor: { label: 'Poor', color: 'var(--score-poor)', bg: 'rgba(239, 68, 68, 0.15)' },
};

function formatValue(value: number, unit: string): string {
  if (unit === 'ms') return formatDuration(value);
  if (unit === 'score') return formatScore(value);
  if (unit === 'bytes') {
    if (value >= 1048576) return `${(value / 1048576).toFixed(1)} MB`;
    if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${value} B`;
  }
  return `${formatScore(value)}${unit ? ` ${unit}` : ''}`;
}

export default function DiagnosticCard({ diagnostic, compact = false }: DiagnosticCardProps) {
  const status = STATUS_CONFIG[diagnostic.status];
  const formattedValue = formatValue(diagnostic.value, diagnostic.unit);
  const thresholdFormatted = diagnostic.threshold != null ? formatValue(diagnostic.threshold, diagnostic.unit) : null;

  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-md)',
          padding: 'var(--space-sm) var(--space-md)',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}
        role="listitem"
        aria-label={`${diagnostic.title}: ${formattedValue} - ${status.label}`}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: status.color,
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
        <span
          style={{
            flex: 1,
            fontSize: 'var(--font-sm)',
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {diagnostic.title}
        </span>
        <span
          style={{
            fontSize: 'var(--font-sm)',
            fontWeight: 600,
            fontFamily: '"SF Mono", monospace',
            color: status.color,
            whiteSpace: 'nowrap',
          }}
        >
          {formattedValue}
        </span>
        {thresholdFormatted && (
          <span
            style={{
              fontSize: 'var(--font-xs)',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            / {thresholdFormatted}
          </span>
        )}
      </div>
    );
  }

  return (
    <article
      style={{
        padding: 'var(--space-md)',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
      aria-label={`${diagnostic.title}: ${formattedValue} - ${status.label}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: status.color,
              flexShrink: 0,
            }}
            aria-hidden="true"
          />
          <h4
            style={{
              margin: 0,
              fontSize: 'var(--font-sm)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {diagnostic.title}
          </h4>
        </div>
        <span
          style={{
            padding: '2px 8px',
            fontSize: 'var(--font-xs)',
            fontWeight: 600,
            borderRadius: 'var(--radius-full)',
            color: status.color,
            backgroundColor: status.bg,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {status.label}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span
          style={{
            fontSize: 'var(--font-2xl)',
            fontWeight: 700,
            fontFamily: '"SF Mono", monospace',
            color: status.color,
            lineHeight: 1,
          }}
        >
          {formattedValue}
        </span>
        {thresholdFormatted && (
          <span
            style={{
              fontSize: 'var(--font-xs)',
              color: 'var(--text-muted)',
            }}
          >
            threshold: {thresholdFormatted}
          </span>
        )}
      </div>

      {diagnostic.details && (
        <p
          style={{
            margin: 0,
            fontSize: 'var(--font-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          {diagnostic.details}
        </p>
      )}
    </article>
  );
}
