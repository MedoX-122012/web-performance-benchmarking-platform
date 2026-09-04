import { useMemo, useState } from 'react';
import type { NavigationTiming } from '@/types';

interface NavigationTimelineProps {
  timing: NavigationTiming;
}

interface TimelineEvent {
  label: string;
  startMs: number;
  endMs: number;
  color: string;
  startKey?: keyof NavigationTiming;
}

const EVENT_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#6366f1',
  '#ec4899',
  '#f43f5e',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
];

export default function NavigationTimeline({ timing }: NavigationTimelineProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const events: TimelineEvent[] = useMemo(() => {
    const cumulative: Array<{ label: string; value: number; key: keyof NavigationTiming }> = [
      { label: 'DNS', value: timing.dns, key: 'dns' },
      { label: 'Connection', value: timing.connection, key: 'connection' },
      { label: 'TLS', value: timing.tls, key: 'tls' },
      { label: 'Request', value: timing.request, key: 'request' },
      { label: 'Response', value: timing.response, key: 'response' },
      { label: 'DOM Parse', value: timing.dom, key: 'dom' },
    ];

    const absoluteEvents: Array<{ label: string; value: number; key: keyof NavigationTiming }> = [
      { label: 'First Paint', value: timing.firstPaint, key: 'firstPaint' },
      { label: 'FCP', value: timing.fcp, key: 'fcp' },
      { label: 'LCP', value: timing.lcp, key: 'lcp' },
      { label: 'Load', value: timing.load, key: 'load' },
    ];

    const result: TimelineEvent[] = [];
    let offset = 0;

    cumulative.forEach((evt, i) => {
      const start = offset;
      offset += evt.value;
      result.push({
        label: evt.label,
        startMs: start,
        endMs: offset,
        color: EVENT_COLORS[i % EVENT_COLORS.length],
        startKey: evt.key,
      });
    });

    absoluteEvents.forEach((evt, i) => {
      result.push({
        label: evt.label,
        startMs: evt.value,
        endMs: evt.value,
        color: EVENT_COLORS[(cumulative.length + i) % EVENT_COLORS.length],
        startKey: evt.key,
      });
    });

    return result;
  }, [timing]);

  const totalTime = Math.max(...events.map((e) => e.endMs), timing.load);
  const segEvents = events.filter((e) => e.endMs > e.startMs);

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Navigation Timeline
      </h3>

      <div className="relative">
        <div className="flex h-8 rounded overflow-hidden bg-gray-800/50">
          {segEvents.map((evt, i) => {
            const widthPct = ((evt.endMs - evt.startMs) / totalTime) * 100;
            return (
              <div
                key={`${evt.label}-${i}`}
                className="relative h-full transition-opacity"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: evt.color,
                  opacity: hoveredIdx !== null && hoveredIdx !== i ? 0.4 : 1,
                }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {hoveredIdx === i && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-800 border border-gray-700 rounded shadow-lg whitespace-nowrap z-20 text-xs">
                    <div className="font-medium text-white">{evt.label}</div>
                    <div className="text-gray-400">
                      {Math.round(evt.startMs)}ms → {Math.round(evt.endMs)}ms
                    </div>
                    <div className="text-gray-500">
                      Duration: {Math.round(evt.endMs - evt.startMs)}ms
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between mt-2 px-1">
          <span className="text-[10px] text-gray-500">0ms</span>
          <span className="text-[10px] text-gray-500">{Math.round(totalTime)}ms</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {events.map((evt, i) => (
          <div
            key={`${evt.label}-legend`}
            className="flex items-center gap-1.5 cursor-default"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: evt.color }}
            />
            <span className="text-xs text-gray-400">{evt.label}</span>
            <span className="text-[10px] text-gray-600">
              {evt.startMs === evt.endMs
                ? `${Math.round(evt.startMs)}ms`
                : `${Math.round(evt.endMs - evt.startMs)}ms`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
