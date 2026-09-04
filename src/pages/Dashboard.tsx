import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory as getLocalHistory, clearAllHistory } from '@utils/storage';
import {
  formatBytes,
  formatDuration,
  formatScore,
  getScoreColor,
  formatDate,
  formatTimeAgo,
  getHostname,
} from '@utils/formatting';
import type { HistoryEntry } from '@types/index';

interface StatCard {
  icon: string;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}

function computeStats(entries: HistoryEntry[]): StatCard[] {
  if (entries.length === 0) {
    return [
      { icon: '📊', label: 'Tests Run', value: '0', trend: 'No data yet' },
      { icon: '🎯', label: 'Avg Performance', value: '—' },
      { icon: '⚡', label: 'Avg LCP', value: '—' },
      { icon: '📦', label: 'Avg Page Weight', value: '—' },
    ];
  }

  const count = entries.length;
  const avgPerf = Math.round(entries.reduce((s, e) => s + e.performanceScore, 0) / count);
  const avgLcp = entries.reduce((s, e) => s + e.lcp, 0) / count;
  const avgWeight = entries.reduce((s, e) => s + e.pageSize, 0) / count;

  const recent = entries.slice(0, Math.min(5, count));
  const older = entries.slice(Math.min(5, count), Math.min(10, count));

  let perfTrend = 'No trend';
  if (older.length > 0) {
    const oldAvg = older.reduce((s, e) => s + e.performanceScore, 0) / older.length;
    const diff = avgPerf - oldAvg;
    if (diff > 2) perfTrend = `+${Math.round(diff)} vs recent`;
    else if (diff < -2) perfTrend = `${Math.round(diff)} vs recent`;
    else perfTrend = 'Stable';
  }

  return [
    {
      icon: '📊',
      label: 'Tests Run',
      value: count.toString(),
      trend: count > 0 ? `${count} total` : undefined,
      trendUp: true,
    },
    {
      icon: '🎯',
      label: 'Avg Performance',
      value: `${avgPerf}`,
      trend: perfTrend,
      trendUp: perfTrend.startsWith('+'),
    },
    {
      icon: '⚡',
      label: 'Avg LCP',
      value: formatDuration(avgLcp),
      trend: avgLcp <= 2500 ? 'Good' : avgLcp <= 4000 ? 'Needs Work' : 'Poor',
      trendUp: avgLcp <= 2500,
    },
    {
      icon: '📦',
      label: 'Avg Page Weight',
      value: formatBytes(avgWeight),
      trend: avgWeight <= 2000000 ? 'Good' : avgWeight <= 4000000 ? 'Heavy' : 'Very Heavy',
      trendUp: avgWeight <= 2000000,
    },
  ];
}

function SkeletonCard() {
  return (
    <div
      style={{
        padding: 'var(--space-lg)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-sm)',
      }}
    >
      <div className="skeleton skeleton-text" style={{ width: '40%', height: 12 }} />
      <div className="skeleton skeleton-title" style={{ width: '60%', height: 28 }} />
      <div className="skeleton skeleton-text" style={{ width: '50%', height: 12 }} />
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} style={{ padding: 'var(--space-md)' }}>
          <div className="skeleton skeleton-text" style={{ height: 16 }} />
        </td>
      ))}
    </tr>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryEntry[]>(() => getLocalHistory());
  const [confirmClear, setConfirmClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const stats = useMemo(() => computeStats(history), [history]);
  const recentTests = useMemo(() => history.slice(0, 20), [history]);

  const handleRowClick = useCallback(
    (entry: HistoryEntry) => {
      navigate(`/report/${entry.id}`);
    },
    [navigate],
  );

  const handleRunNew = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleClearHistory = useCallback(() => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    setIsClearing(true);
    clearAllHistory();
    setHistory([]);
    setConfirmClear(false);
    setIsClearing(false);
  }, [confirmClear]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)', paddingBottom: 'var(--space-3xl)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 700, marginBottom: 'var(--space-xs)' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-base)' }}>
          Overview of your recent benchmark activity
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 'var(--space-lg)',
        }}
      >
        {stats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: 'var(--space-lg)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-sm)',
                  transition: 'border-color 150ms ease, box-shadow 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color-light)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontSize: 'var(--font-xs)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {stat.label}
                  </span>
                  <span style={{ fontSize: 20 }} aria-hidden="true">
                    {stat.icon}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 'var(--font-3xl)',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontFamily: '"SF Mono", "Fira Code", monospace',
                  }}
                >
                  {stat.value}
                </span>
                {stat.trend && (
                  <span
                    style={{
                      fontSize: 'var(--font-xs)',
                      color: stat.trendUp === true
                        ? 'var(--score-good)'
                        : stat.trendUp === false
                          ? 'var(--score-poor)'
                          : 'var(--text-muted)',
                      fontWeight: 500,
                    }}
                  >
                    {stat.trend}
                  </span>
                )}
              </div>
            ))}
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-lg)',
            flexWrap: 'wrap',
            gap: 'var(--space-md)',
          }}
        >
          <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 600 }}>Recent Benchmarks</h2>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              type="button"
              onClick={handleRunNew}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                padding: '8px 16px',
                fontSize: 'var(--font-sm)',
                fontWeight: 500,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
              }}
            >
              <span aria-hidden="true">+</span>
              Run New Test
            </button>
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={isClearing}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  padding: '8px 16px',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: confirmClear ? 'var(--color-error)' : 'transparent',
                  color: confirmClear ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${confirmClear ? 'var(--color-error)' : 'var(--border-color-light)'}`,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!confirmClear) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    e.currentTarget.style.borderColor = 'var(--text-muted)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!confirmClear) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--border-color-light)';
                  }
                }}
              >
                {confirmClear ? 'Confirm Clear' : 'Clear History'}
              </button>
            )}
          </div>
        </div>

        {recentTests.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--space-3xl) var(--space-lg)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
            }}
          >
            <span style={{ fontSize: 48, display: 'block', marginBottom: 'var(--space-md)' }} aria-hidden="true">
              🚀
            </span>
            <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
              No tests yet
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
              Run your first benchmark!
            </p>
            <button
              type="button"
              onClick={handleRunNew}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                padding: '12px 24px',
                fontSize: 'var(--font-base)',
                fontWeight: 600,
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
              }}
            >
              Start Benchmarking
            </button>
          </div>
        ) : (
          <div
            style={{
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr>
                  {['Website', 'Score', 'LCP', 'CLS', 'Page Size', 'Date'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: 'var(--space-md)',
                        textAlign: 'left',
                        fontSize: 'var(--font-xs)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--bg-card)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTests.map((entry) => {
                  const scoreColor = getScoreColor(entry.performanceScore);
                  return (
                    <tr
                      key={entry.id}
                      onClick={() => handleRowClick(entry)}
                      style={{
                        cursor: 'pointer',
                        transition: 'background-color 150ms ease',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span
                            style={{
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              fontSize: 'var(--font-sm)',
                            }}
                          >
                            {getHostname(entry.url)}
                          </span>
                          <span
                            style={{
                              fontSize: 'var(--font-xs)',
                              color: 'var(--text-muted)',
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {entry.url}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-md)' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40,
                            height: 28,
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-sm)',
                            fontWeight: 700,
                            fontFamily: '"SF Mono", monospace',
                            color: scoreColor,
                            backgroundColor: `${scoreColor}18`,
                          }}
                        >
                          {formatScore(entry.performanceScore)}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-md)' }}>
                        <span
                          style={{
                            fontSize: 'var(--font-sm)',
                            fontFamily: '"SF Mono", monospace',
                            color: entry.lcp <= 2500 ? 'var(--score-good)' : entry.lcp <= 4000 ? 'var(--score-medium)' : 'var(--score-poor)',
                          }}
                        >
                          {formatDuration(entry.lcp)}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-md)' }}>
                        <span
                          style={{
                            fontSize: 'var(--font-sm)',
                            fontFamily: '"SF Mono", monospace',
                            color: entry.cls <= 0.1 ? 'var(--score-good)' : entry.cls <= 0.25 ? 'var(--score-medium)' : 'var(--score-poor)',
                          }}
                        >
                          {entry.cls.toFixed(3)}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-md)' }}>
                        <span
                          style={{
                            fontSize: 'var(--font-sm)',
                            fontFamily: '"SF Mono", monospace',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {formatBytes(entry.pageSize)}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                            {formatDate(entry.timestamp)}
                          </span>
                          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                            {formatTimeAgo(entry.timestamp)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
