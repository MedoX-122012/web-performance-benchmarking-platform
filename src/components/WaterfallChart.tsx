import { useRef, useState, useMemo } from 'react';
import type { WaterfallEntry, ResourceType } from '@/types';
import { formatBytes, formatDuration, truncateUrl } from '@/utils/formatting';

interface WaterfallChartProps {
  entries: WaterfallEntry[];
}

const TYPE_COLORS: Record<ResourceType, string> = {
  script: '#facc15',
  stylesheet: '#60a5fa',
  image: '#a78bfa',
  font: '#f472b6',
  document: '#34d399',
  xhr: '#fb923c',
  fetch: '#fb923c',
  other: '#94a3b8',
};

const LEGEND_ITEMS: { type: ResourceType; label: string }[] = [
  { type: 'document', label: 'HTML' },
  { type: 'script', label: 'JS' },
  { type: 'stylesheet', label: 'CSS' },
  { type: 'image', label: 'Image' },
  { type: 'font', label: 'Font' },
  { type: 'xhr', label: 'XHR/Fetch' },
  { type: 'other', label: 'Other' },
];

const ROW_HEIGHT = 28;
const LEFT_GUTTER = 300;
const BAR_PADDING = 4;

export default function WaterfallChart({ entries }: WaterfallChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    entry: WaterfallEntry;
    x: number;
    y: number;
  } | null>(null);

  const sorted = useMemo(() => [...entries].sort((a, b) => a.startTime - b.startTime), [entries]);

  const maxTime = useMemo(() => {
    if (sorted.length === 0) return 1000;
    return Math.max(...sorted.map((e) => e.startTime + e.duration));
  }, [sorted]);

  const chartWidth = Math.max(800, sorted.length * 2);

  const timeScale = (ms: number) => (ms / maxTime) * (chartWidth - LEFT_GUTTER);

  const domains = useMemo(() => {
    const map = new Map<string, number>();
    sorted.forEach((e) => {
      map.set(e.domain, (map.get(e.domain) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [sorted]);

  const handleMouseEnter = (entry: WaterfallEntry, e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({
        entry,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseLeave = () => setTooltip(null);

  const tickCount = 6;
  const ticks = Array.from({ length: tickCount }, (_, i) => (maxTime / (tickCount - 1)) * i);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)',
      }}
      role="figure"
      aria-label="Network waterfall chart showing resource loading timeline"
    >
      <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
          Waterfall
        </span>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          {LEGEND_ITEMS.map((item) => (
            <span
              key={item.type}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}
            >
              <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: TYPE_COLORS[item.type], flexShrink: 0 }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          position: 'relative',
          overflowX: 'auto',
          overflowY: 'auto',
          maxHeight: 500,
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ position: 'relative', width: chartWidth, minHeight: sorted.length * ROW_HEIGHT + 40 }}>
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 2,
              height: 32,
              backgroundColor: 'var(--bg-card)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              paddingLeft: LEFT_GUTTER,
            }}
          >
            {ticks.map((tick, i) => (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  left: LEFT_GUTTER + timeScale(tick),
                  fontSize: 'var(--font-xs)',
                  color: 'var(--text-muted)',
                  fontFamily: '"SF Mono", monospace',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatDuration(tick)}
              </span>
            ))}
          </div>

          {sorted.map((entry, i) => {
            const barLeft = LEFT_GUTTER + timeScale(entry.startTime);
            const barWidth = Math.max(2, timeScale(entry.duration));
            const color = TYPE_COLORS[entry.type] || TYPE_COLORS.other;

            return (
              <div
                key={`${entry.url}-${i}`}
                style={{
                  position: 'relative',
                  height: ROW_HEIGHT,
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(42, 42, 64, 0.5)',
                }}
                onMouseEnter={(e) => handleMouseEnter(entry, e)}
                onMouseLeave={handleMouseLeave}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 8,
                    width: LEFT_GUTTER - 16,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: 'var(--font-xs)',
                    fontFamily: '"SF Mono", monospace',
                    color: 'var(--text-secondary)',
                    zIndex: 1,
                    backgroundColor: 'var(--bg-card)',
                  }}
                  title={entry.url}
                >
                  {truncateUrl(entry.name, 35)}
                </div>

                <div
                  style={{
                    position: 'absolute',
                    left: barLeft,
                    top: BAR_PADDING,
                    height: ROW_HEIGHT - BAR_PADDING * 2,
                    width: barWidth,
                    backgroundColor: color,
                    borderRadius: 3,
                    opacity: 0.85,
                    transition: 'opacity 150ms ease',
                    cursor: 'pointer',
                  }}
                />

                <span
                  style={{
                    position: 'absolute',
                    right: 8,
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    fontFamily: '"SF Mono", monospace',
                  }}
                >
                  {formatBytes(entry.transferSize)}
                </span>
              </div>
            );
          })}

          {sorted.length === 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 120,
                color: 'var(--text-muted)',
                fontSize: 'var(--font-sm)',
              }}
            >
              No waterfall data available
            </div>
          )}
        </div>

        {tooltip && (
          <div
            role="tooltip"
            style={{
              position: 'absolute',
              left: Math.min(tooltip.x + 12, (containerRef.current?.clientWidth || 400) - 280),
              top: tooltip.y - 10,
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color-light)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-sm) var(--space-md)',
              fontSize: 'var(--font-xs)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 10,
              maxWidth: 280,
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4, wordBreak: 'break-all' }}>{tooltip.entry.url}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 12px', color: 'var(--text-secondary)' }}>
              <span>Type:</span><span>{tooltip.entry.type}</span>
              <span>Domain:</span><span>{tooltip.entry.domain}</span>
              <span>Size:</span><span>{formatBytes(tooltip.entry.size)}</span>
              <span>Transfer:</span><span>{formatBytes(tooltip.entry.transferSize)}</span>
              <span>Duration:</span><span>{formatDuration(tooltip.entry.duration)}</span>
              <span>Start:</span><span>{formatDuration(tooltip.entry.startTime)}</span>
              <span>Status:</span><span>{tooltip.entry.status}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
        {sorted.length} requests • Total: {formatDuration(maxTime)}
      </div>
    </div>
  );
}
