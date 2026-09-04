import { useState, useMemo } from 'react';
import type { ThirdPartyDomain } from '@types/index';
import { formatBytes } from '@utils/formatting';

interface ThirdPartyTableProps {
  domains: ThirdPartyDomain[];
}

type SortKey = 'domain' | 'requests' | 'transferSize' | 'mainThreadTime';
type SortDir = 'asc' | 'desc';

const CATEGORY_COLORS: Record<ThirdPartyDomain['category'], { bg: string; text: string }> = {
  analytics: { bg: 'rgba(99, 179, 237, 0.2)', text: '#63B3ED' },
  advertising: { bg: 'rgba(252, 129, 129, 0.2)', text: '#FC8181' },
  social: { bg: 'rgba(237, 184, 113, 0.2)', text: '#EDB871' },
  fonts: { bg: 'rgba(72, 187, 120, 0.2)', text: '#48BB78' },
  cdn: { bg: 'rgba(90, 150, 200, 0.2)', text: '#5A96C8' },
  other: { bg: 'var(--bg-hover)', text: 'var(--text-muted)' },
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>↕</span>;
  return <span style={{ color: 'var(--color-primary)', marginLeft: 4 }}>{dir === 'asc' ? '↑' : '↓'}</span>;
}

export default function ThirdPartyTable({ domains }: ThirdPartyTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('transferSize');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = useMemo(() => {
    return [...domains].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal as string) : aVal - bVal;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [domains, sortKey, sortDir]);

  const totals = useMemo(
    () =>
      domains.reduce(
        (acc, d) => ({
          requests: acc.requests + d.requests,
          transferSize: acc.transferSize + d.transferSize,
          mainThreadTime: acc.mainThreadTime + d.mainThreadTime,
        }),
        { requests: 0, transferSize: 0, mainThreadTime: 0 },
      ),
    [domains],
  );

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { count: number; transferSize: number; mainThreadTime: number }> = {};
    for (const d of domains) {
      if (!map[d.category]) map[d.category] = { count: 0, transferSize: 0, mainThreadTime: 0 };
      map[d.category].count++;
      map[d.category].transferSize += d.transferSize;
      map[d.category].mainThreadTime += d.mainThreadTime;
    }
    return Object.entries(map).sort((a, b) => b[1].transferSize - a[1].transferSize);
  }, [domains]);

  if (domains.length === 0) {
    return (
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          Third-Party Domains
        </h3>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>No third-party domains detected.</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', border: '1px solid var(--border-color)' }}>
      <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
        Third-Party Domains
      </h3>

      <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {categoryBreakdown.map(([cat, data]) => {
            const colors = CATEGORY_COLORS[cat as ThirdPartyDomain['category']] || CATEGORY_COLORS.other;
            return (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-xs)', fontWeight: 500, backgroundColor: colors.bg, color: colors.text }}>
                  {cat}
                </span>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  {data.count} domain{data.count !== 1 ? 's' : ''} · {formatBytes(data.transferSize)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ overflowX: 'auto', margin: '0 -20px', padding: '0 20px' }}>
        <table style={{ width: '100%', fontSize: 'var(--font-sm)', minWidth: 600 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              {[
                { key: 'domain' as SortKey, label: 'Domain' },
                { key: 'requests' as SortKey, label: 'Requests' },
                { key: 'transferSize' as SortKey, label: 'Transfer Size' },
                { key: 'mainThreadTime' as SortKey, label: 'Main-Thread Impact' },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  style={{ textAlign: 'left', padding: '10px 12px', fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort(key)}
                >
                  {label}
                  <SortIcon active={sortKey === key} dir={sortDir} />
                </th>
              ))}
              <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--text-muted)' }}>Category</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => {
              const colors = CATEGORY_COLORS[d.category] || CATEGORY_COLORS.other;
              return (
                <tr key={d.domain} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 150ms ease' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontFamily: '"SF Mono", "Fira Code", monospace', fontSize: 'var(--font-xs)' }}>{d.domain}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{d.requests}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{formatBytes(d.transferSize)}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{d.mainThreadTime}ms</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-xs)', fontWeight: 500, backgroundColor: colors.bg, color: colors.text }}>
                      {d.category}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '1px solid var(--border-color)', fontWeight: 500 }}>
              <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>Total</td>
              <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{totals.requests}</td>
              <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{formatBytes(totals.transferSize)}</td>
              <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{totals.mainThreadTime}ms</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
