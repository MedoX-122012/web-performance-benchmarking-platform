import { useState, useMemo } from 'react';
import type { NetworkResource, ResourceType } from '@/types';
import { formatBytes, formatDuration, truncateUrl } from '@/utils/formatting';

interface ResourceTableProps {
  resources: NetworkResource[];
  pageSize?: number;
}

type SortKey = 'name' | 'type' | 'size' | 'transferSize' | 'duration' | 'status' | 'priority';
type SortDir = 'asc' | 'desc';
type FilterTab = 'all' | 'script' | 'stylesheet' | 'image' | 'font' | 'xhr';

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'script', label: 'JS' },
  { value: 'stylesheet', label: 'CSS' },
  { value: 'image', label: 'Images' },
  { value: 'font', label: 'Fonts' },
  { value: 'xhr', label: 'XHR' },
];

const TYPE_ICONS: Record<ResourceType, string> = {
  script: '📜',
  stylesheet: '🎨',
  image: '🖼️',
  font: '🔤',
  document: '📄',
  xhr: '🔄',
  fetch: '🔄',
  other: '📦',
};

const STATUS_COLORS: Record<string, string> = {
  success: 'var(--score-good)',
  redirect: 'var(--score-medium)',
  clientError: 'var(--score-poor)',
  serverError: 'var(--score-poor)',
};

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return STATUS_COLORS.success;
  if (status >= 300 && status < 400) return STATUS_COLORS.redirect;
  if (status >= 400 && status < 500) return STATUS_COLORS.clientError;
  return STATUS_COLORS.serverError;
}

function getStatusBg(status: number): string {
  if (status >= 200 && status < 300) return 'rgba(34, 197, 94, 0.15)';
  if (status >= 300 && status < 400) return 'rgba(245, 158, 11, 0.15)';
  return 'rgba(239, 68, 68, 0.15)';
}

export default function ResourceTable({ resources, pageSize = 25 }: ResourceTableProps) {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('startTime');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let result = resources;
    if (filter !== 'all') {
      if (filter === 'xhr') {
        result = result.filter((r) => r.type === 'xhr' || r.type === 'fetch');
      } else {
        result = result.filter((r) => r.type === filter);
      }
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.name.toLowerCase().includes(q) || r.url.toLowerCase().includes(q) || r.domain.toLowerCase().includes(q),
      );
    }
    return result;
  }, [resources, filter, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'type':
          cmp = a.type.localeCompare(b.type);
          break;
        case 'size':
          cmp = a.size - b.size;
          break;
        case 'transferSize':
          cmp = a.transferSize - b.transferSize;
          break;
        case 'duration':
          cmp = a.duration - b.duration;
          break;
        case 'status':
          cmp = a.status - b.status;
          break;
        case 'priority':
          cmp = a.priority.localeCompare(b.priority);
          break;
        default:
          cmp = a.startTime - b.startTime;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>⇅</span>;
    return <span style={{ color: 'var(--color-primary)', marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const thStyle: React.CSSProperties = {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: 'var(--font-xs)',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid var(--border-color)',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: 'var(--font-sm)',
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)',
    verticalAlign: 'middle',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="2"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-sm)',
              outline: 'none',
            }}
            aria-label="Search resources"
          />
        </div>
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setFilter(tab.value); setPage(0); }}
              style={{
                padding: '6px 12px',
                fontSize: 'var(--font-xs)',
                fontWeight: 500,
                borderRadius: 'var(--radius-md)',
                color: filter === tab.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: filter === tab.value ? 'var(--bg-hover)' : 'transparent',
                border: filter === tab.value ? '1px solid var(--border-color-light)' : '1px solid transparent',
                transition: 'all 150ms ease',
              }}
              aria-pressed={filter === tab.value}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 800 }} role="grid">
            <thead>
              <tr>
                <th style={thStyle} onClick={() => handleSort('name')}>
                  Resource <SortIcon columnKey="name" />
                </th>
                <th style={thStyle} onClick={() => handleSort('type')}>
                  Type <SortIcon columnKey="type" />
                </th>
                <th style={thStyle} onClick={() => handleSort('size')}>
                  Size <SortIcon columnKey="size" />
                </th>
                <th style={thStyle} onClick={() => handleSort('transferSize')}>
                  Transfer <SortIcon columnKey="transferSize" />
                </th>
                <th style={thStyle} onClick={() => handleSort('duration')}>
                  Duration <SortIcon columnKey="duration" />
                </th>
                <th style={thStyle} onClick={() => handleSort('status')}>
                  Status <SortIcon columnKey="status" />
                </th>
                <th style={thStyle} onClick={() => handleSort('priority')}>
                  Priority <SortIcon columnKey="priority" />
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r, i) => (
                <tr
                  key={`${r.url}-${i}`}
                  style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                >
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span title={r.type}>{TYPE_ICONS[r.type] || '📦'}</span>
                      <span
                        style={{ fontFamily: '"SF Mono", monospace', fontSize: 'var(--font-xs)' }}
                        title={r.url}
                      >
                        {truncateUrl(r.name, 40)}
                      </span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: '2px 8px',
                        fontSize: 'var(--font-xs)',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--bg-hover)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {r.type}
                    </span>
                  </td>
                  <td style={tdStyle}>{formatBytes(r.size)}</td>
                  <td style={tdStyle}>
                    <span style={{ color: r.transferSize < r.size ? 'var(--score-good)' : 'var(--text-primary)' }}>
                      {formatBytes(r.transferSize)}
                    </span>
                  </td>
                  <td style={tdStyle}>{formatDuration(r.duration)}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: '2px 8px',
                        fontSize: 'var(--font-xs)',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-full)',
                        color: getStatusColor(r.status),
                        backgroundColor: getStatusBg(r.status),
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: '2px 8px',
                        fontSize: 'var(--font-xs)',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--bg-hover)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {r.priority}
                    </span>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
                    No resources found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)' }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              padding: '6px 12px',
              fontSize: 'var(--font-xs)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: page === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{
              padding: '6px 12px',
              fontSize: 'var(--font-xs)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: page >= totalPages - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
