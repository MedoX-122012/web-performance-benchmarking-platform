import { useState } from 'react';
import type { HistoryEntry } from '@types/index';
import { formatBytes, formatTimeAgo, getScoreColor, getHostname } from '@utils/formatting';

interface TestHistoryCardProps {
  entry: HistoryEntry;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  selected?: boolean;
  compareMode?: boolean;
  onToggleCompare?: (id: string) => void;
}

export default function TestHistoryCard({
  entry,
  onView,
  onDelete,
  selected = false,
  compareMode = false,
  onToggleCompare,
}: TestHistoryCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const hostname = entry.hostname || getHostname(entry.url);
  const perfColor = getScoreColor(entry.performanceScore);

  const connectionLabels: Record<string, string> = {
    fast: 'Fast',
    '4g': '4G',
  };

  const deviceIcons: Record<string, string> = {
    desktop: '🖥',
    mobile: '📱',
  };

  const handleDelete = () => {
    if (showConfirm) {
      onDelete(entry.id);
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${selected ? 'var(--color-primary)' : 'var(--border-color)'}`,
        transition: 'all 150ms ease',
        boxShadow: selected ? '0 0 0 2px var(--color-primary-alpha)' : 'none',
      }}
    >
      <div style={{ padding: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              {compareMode && onToggleCompare && (
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggleCompare(entry.id)}
                  style={{ width: 14, height: 14, accentColor: 'var(--color-primary)' }}
                />
              )}
              <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hostname}</h4>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
              <span>{deviceIcons[entry.device]} {entry.device}</span>
              <span style={{ color: 'var(--border-color)' }}>·</span>
              <span>{connectionLabels[entry.connection]}</span>
              <span style={{ color: 'var(--border-color)' }}>·</span>
              <span>{formatTimeAgo(entry.timestamp)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--font-sm)',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                backgroundColor: `${perfColor}20`,
                color: perfColor,
              }}
            >
              {Math.round(entry.performanceScore)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 2 }}>LCP</div>
            <div style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
              {entry.lcp >= 1000 ? `${(entry.lcp / 1000).toFixed(1)}s` : `${Math.round(entry.lcp)}ms`}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 2 }}>CLS</div>
            <div style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{entry.cls.toFixed(2)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 2 }}>Size</div>
            <div style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{formatBytes(entry.pageSize)}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{entry.requests} requests</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {showConfirm ? (
              <>
                <button
                  onClick={() => setShowConfirm(false)}
                  style={{ padding: '4px 8px', fontSize: 10, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  style={{ padding: '4px 8px', fontSize: 10, color: 'var(--color-error)', backgroundColor: 'var(--color-error-alpha)', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
                >
                  Confirm
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleDelete}
                  style={{ padding: '4px 8px', fontSize: 10, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0 }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--color-error)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  aria-label="Delete entry"
                >
                  Delete
                </button>
                <button
                  onClick={() => onView(entry.id)}
                  style={{ padding: '4px 12px', fontSize: 10, fontWeight: 500, color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-alpha)', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
                >
                  View Report
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
