import { useMemo } from 'react';
import type { BenchmarkResult, ComparisonData } from '@/types';
import { formatBytes } from '@/utils/formatting';

interface ComparisonTableProps {
  previous: BenchmarkResult;
  current: BenchmarkResult;
}

function computeDiff(
  metric: string,
  prev: number,
  curr: number,
  unit: string,
  lowerIsBetter: boolean = true,
): ComparisonData {
  const diff = curr - prev;
  const pct = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0;
  const isImprovement = lowerIsBetter ? diff < 0 : diff > 0;

  let displayDiff: string;
  if (unit === 'bytes') {
    const absBytes = Math.abs(diff);
    displayDiff = `${diff >= 0 ? '+' : '-'}${formatBytes(absBytes)}`;
  } else if (unit === 'score') {
    displayDiff = `${diff >= 0 ? '+' : ''}${Math.round(diff)}`;
  } else {
    const absMs = Math.abs(diff);
    displayDiff = `${diff >= 0 ? '+' : '-'}${absMs >= 1000 ? `${(absMs / 1000).toFixed(1)}s` : `${Math.round(absMs)}ms`}`;
  }

  return {
    metric,
    previous: prev,
    current: curr,
    difference: displayDiff,
    isImprovement,
  };
}

function formatCell(value: number, unit: string): string {
  if (unit === 'bytes') return formatBytes(value);
  if (unit === 'score') return Math.round(value).toString();
  return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`;
}

export default function ComparisonTable({ previous, current }: ComparisonTableProps) {
  const rows = useMemo((): ComparisonData[] => {
    const perfDiff = computeDiff(
      'Performance Score',
      previous.scores.performance,
      current.scores.performance,
      'score',
      false,
    );
    const lcpDiff = computeDiff(
      'LCP',
      previous.coreWebVitals.lcp.value,
      current.coreWebVitals.lcp.value,
      'ms',
      true,
    );
    const inpDiff = computeDiff(
      'INP',
      previous.coreWebVitals.inp.value,
      current.coreWebVitals.inp.value,
      'ms',
      true,
    );
    const clsDiff = computeDiff(
      'CLS',
      previous.coreWebVitals.cls.value,
      current.coreWebVitals.cls.value,
      '',
      true,
    );
    const fcpDiff = computeDiff(
      'FCP',
      previous.supportingMetrics.fcp.value,
      current.supportingMetrics.fcp.value,
      'ms',
      true,
    );
    const sizeDiff = computeDiff(
      'Page Size',
      previous.resourceBreakdown.totalTransferSize,
      current.resourceBreakdown.totalTransferSize,
      'bytes',
      true,
    );
    const reqDiff = computeDiff(
      'Requests',
      previous.resourceBreakdown.totalRequests,
      current.resourceBreakdown.totalRequests,
      'score',
      true,
    );

    return [perfDiff, lcpDiff, inpDiff, clsDiff, fcpDiff, sizeDiff, reqDiff];
  }, [previous, current]);

  const improvements = rows.filter((r) => r.isImprovement).length;
  const regressions = rows.filter((r) => !r.isImprovement).length;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-5 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">
          Comparison Summary
        </h3>
        <div className="flex gap-4 text-xs">
          <span className="text-green-400">▲ {improvements} improved</span>
          <span className="text-red-400">▼ {regressions} regressed</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-3 px-5 text-xs font-medium text-gray-400 w-1/4">Metric</th>
              <th className="text-right py-3 px-5 text-xs font-medium text-gray-400 w-1/4">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                  Previous
                </div>
              </th>
              <th className="text-right py-3 px-5 text-xs font-medium text-gray-400 w-1/4">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Current
                </div>
              </th>
              <th className="text-right py-3 px-5 text-xs font-medium text-gray-400 w-1/4">Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.metric} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                <td className="py-3 px-5 text-gray-300 font-medium">{row.metric}</td>
                <td className="py-3 px-5 text-right text-gray-400 tabular-nums">
                  {row.metric === 'Performance Score'
                    ? Math.round(row.previous as number)
                    : row.metric === 'CLS'
                    ? (row.previous as number).toFixed(2)
                    : formatCell(row.previous as number, row.metric === 'Page Size' ? 'bytes' : row.metric === 'Requests' ? 'score' : 'ms')}
                </td>
                <td className="py-3 px-5 text-right text-gray-200 font-medium tabular-nums">
                  {row.metric === 'Performance Score'
                    ? Math.round(row.current as number)
                    : row.metric === 'CLS'
                    ? (row.current as number).toFixed(2)
                    : formatCell(row.current as number, row.metric === 'Page Size' ? 'bytes' : row.metric === 'Requests' ? 'score' : 'ms')}
                </td>
                <td className="py-3 px-5 text-right tabular-nums">
                  <span
                    className={`inline-flex items-center gap-1 font-medium ${
                      row.isImprovement ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {row.isImprovement ? '▲' : '▼'} {row.difference}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            {previous.hostname} · {new Date(previous.timestamp).toLocaleDateString()}
          </div>
          <div className="text-gray-700">→</div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {current.hostname} · {new Date(current.timestamp).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
