import { useState } from 'react';
import type { Opportunity } from '@/types';
import { formatBytes } from '@/utils/formatting';

interface OpportunityCardProps {
  opportunity: Opportunity;
}

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', color: 'var(--score-poor)', bg: 'rgba(239, 68, 68, 0.15)', icon: '🔴' },
  high: { label: 'High', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', icon: '🟠' },
  medium: { label: 'Medium', color: 'var(--score-medium)', bg: 'rgba(245, 158, 11, 0.15)', icon: '🟡' },
  low: { label: 'Low', color: 'var(--score-good)', bg: 'rgba(34, 197, 94, 0.15)', icon: '🟢' },
};

const TYPE_ICONS: Record<string, string> = {
  'render-blocking': '🚫',
  'unused-css': '🎨',
  'unused-js': '📜',
  'image-optimization': '🖼️',
  'compression': '📦',
  'caching': '💾',
  'font-optimization': '🔤',
  'code-splitting': '✂️',
  'lazy-loading': '⏳',
  'server-response': '🖥️',
  'dom-size': '🌳',
  'third-party': '🔗',
  default: '⚡',
};

function getIcon(id: string): string {
  for (const [key, icon] of Object.entries(TYPE_ICONS)) {
    if (id.includes(key)) return icon;
  }
  return TYPE_ICONS.default;
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const severity = SEVERITY_CONFIG[opportunity.severity];
  const icon = getIcon(opportunity.id);

  return (
    <article
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'border-color 150ms ease',
      }}
      aria-label={`${opportunity.title} - ${severity.label} severity`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: 'var(--space-md) var(--space-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-md)',
          textAlign: 'left',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
        }}
        aria-expanded={expanded}
      >
        <span style={{ fontSize: 20, flexShrink: 0 }} aria-hidden="true">
          {icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <h4
              style={{
                margin: 0,
                fontSize: 'var(--font-base)',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              {opportunity.title}
            </h4>
            <span
              style={{
                padding: '2px 8px',
                fontSize: 'var(--font-xs)',
                fontWeight: 600,
                borderRadius: 'var(--radius-full)',
                color: severity.color,
                backgroundColor: severity.bg,
                whiteSpace: 'nowrap',
              }}
            >
              {severity.label}
            </span>
          </div>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 'var(--font-sm)',
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: expanded ? 'normal' : 'nowrap',
            }}
          >
            {opportunity.description}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexShrink: 0 }}>
          <span
            style={{
              padding: '4px 12px',
              fontSize: 'var(--font-sm)',
              fontWeight: 700,
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))',
              color: 'var(--color-primary-hover)',
              fontFamily: '"SF Mono", monospace',
              whiteSpace: 'nowrap',
            }}
          >
            Save {formatBytes(opportunity.savings)}
          </span>
          <span
            style={{
              fontSize: 'var(--font-sm)',
              color: 'var(--text-muted)',
              transition: 'transform 150ms ease',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
            aria-hidden="true"
          >
            ▼
          </span>
        </div>
      </button>

      {expanded && (
        <div
          style={{
            padding: '0 var(--space-lg) var(--space-lg)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)',
            paddingTop: 'var(--space-md)',
          }}
        >
          <div>
            <h5 style={{ margin: '0 0 6px', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Suggested Fix
            </h5>
            <p style={{ margin: 0, fontSize: 'var(--font-sm)', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              {opportunity.suggestedFix}
            </p>
          </div>

          <div>
            <h5 style={{ margin: '0 0 6px', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Explanation
            </h5>
            <p style={{ margin: 0, fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {opportunity.explanation}
            </p>
          </div>

          {opportunity.affectedResources.length > 0 && (
            <div>
              <h5 style={{ margin: '0 0 6px', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Affected Resources ({opportunity.affectedResources.length})
              </h5>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {opportunity.affectedResources.slice(0, 10).map((res, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: 'var(--font-xs)',
                      fontFamily: '"SF Mono", monospace',
                      color: 'var(--text-secondary)',
                      padding: '4px 8px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={res}
                  >
                    {res}
                  </li>
                ))}
                {opportunity.affectedResources.length > 10 && (
                  <li style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    +{opportunity.affectedResources.length - 10} more
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
