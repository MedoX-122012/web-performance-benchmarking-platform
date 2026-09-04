import { useState, useMemo } from 'react';
import type { ThirdPartyDomain } from '@/types';
import { formatBytes } from '@/utils/formatting';

interface ThirdPartyTableProps {
  domains: ThirdPartyDomain[];
}

type SortKey = 'domain' | 'requests' | 'transferSize' | 'mainThreadTime';
type SortDir = 'asc' | 'desc';

const CATEGORY_COLORS: Record<ThirdPartyDomain['category'], { bg: string; text: string }> = {
  analytics: { bg: 'bg-sky-500/20', text: 'text-sky-400' },
  advertising: { bg: 'bg-rose-500/20', text: 'text-rose-400' },
  social: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  fonts: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  cdn: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  other: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-gray-600 ml-1">↕</span>;
  return <span className="text-blue-400 ml-1">{dir === 'asc' ? '↑' : '↓'}</span>;
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
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
          Third-Party Domains
        </h3>
        <p className="text-sm text-gray-500">No third-party domains detected.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Third-Party Domains
      </h3>

      <div className="flex gap-6 mb-5">
        <div className="flex flex-wrap gap-3">
          {categoryBreakdown.map(([cat, data]) => {
            const colors = CATEGORY_COLORS[cat as ThirdPartyDomain['category']] || CATEGORY_COLORS.other;
            return (
              <div key={cat} className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                  {cat}
                </span>
                <span className="text-xs text-gray-500">
                  {data.count} domain{data.count !== 1 ? 's' : ''} · {formatBytes(data.transferSize)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-800">
              {[
                { key: 'domain' as SortKey, label: 'Domain' },
                { key: 'requests' as SortKey, label: 'Requests' },
                { key: 'transferSize' as SortKey, label: 'Transfer Size' },
                { key: 'mainThreadTime' as SortKey, label: 'Main-Thread Impact' },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="text-left py-2.5 px-3 text-xs font-medium text-gray-400 cursor-pointer hover:text-gray-200 select-none"
                  onClick={() => handleSort(key)}
                >
                  {label}
                  <SortIcon active={sortKey === key} dir={sortDir} />
                </th>
              ))}
              <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-400">Category</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => {
              const colors = CATEGORY_COLORS[d.category] || CATEGORY_COLORS.other;
              return (
                <tr key={d.domain} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="py-2.5 px-3 text-gray-200 font-mono text-xs">{d.domain}</td>
                  <td className="py-2.5 px-3 text-gray-300 tabular-nums">{d.requests}</td>
                  <td className="py-2.5 px-3 text-gray-300 tabular-nums">{formatBytes(d.transferSize)}</td>
                  <td className="py-2.5 px-3 text-gray-300 tabular-nums">{d.mainThreadTime}ms</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                      {d.category}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-700 font-medium">
              <td className="py-2.5 px-3 text-gray-300">Total</td>
              <td className="py-2.5 px-3 text-gray-300 tabular-nums">{totals.requests}</td>
              <td className="py-2.5 px-3 text-gray-300 tabular-nums">{formatBytes(totals.transferSize)}</td>
              <td className="py-2.5 px-3 text-gray-300 tabular-nums">{totals.mainThreadTime}ms</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
