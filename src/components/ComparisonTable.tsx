import { useMemo } from 'react';
import type { BenchmarkResult, ComparisonData } from '@/types';
import { formatBytes } from '@/utils/formatting';

interface ComparisonTableProps {
  previous: BenchmarkResult;
  current: BenchmarkResult;
}

function computeDiff(metric: string, prev: number, curr: number, unit: string, lowerIsBetter: boolean = true): ComparisonData {
  const diff = curr - prev;
  const isImprovement = lowerIsBetter ? diff < 0 : diff > 0;
  let displayDiff: string;
  if (unit === 'bytes') { const abs = Math.abs(diff); displayDiff = `${diff >= 0 ? '+' : '-'}${formatBytes(abs)}`; }
  else if (unit === 'score') { displayDiff = `${diff >= 0 ? '+' : ''}${Math.round(diff)}`; }
  else { const abs = Math.abs(diff); displayDiff = `${diff >= 0 ? '+' : '-'}${abs >= 1000 ? `${(abs / 1000).toFixed(1)}s` : `${Math.round(abs)}ms}`}`; }
  return { metric, previous: prev, current: curr, difference: displayDiff, isImprovement };
}

function formatCell(value: number, unit: string): string {
  if (unit === 'bytes') return formatBytes(value);
  if (unit === 'score') return Math.round(value).toString();
  return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`;
}

export default function ComparisonTable({ previous, current }: ComparisonTableProps) {
  const rows = useMemo((): ComparisonData[] => [
    computeDiff('Performance Score', previous.scores.performance, current.scores.performance, 'score', false),
    computeDiff('LCP', previous.coreWebVitals.lcp.value, current.coreWebVitals.lcp.value, 'ms', true),
    computeDiff('INP', previous.coreWebVitals.inp.value, current.coreWebVitals.inp.value, 'ms', true),
    computeDiff('CLS', previous.coreWebVitals.cls.value, current.coreWebVitals.cls.value, '', true),
    computeDiff('FCP', previous.supportingMetrics.fcp.value, current.supportingMetrics.fcp.value, 'ms', true),
    computeDiff('Page Size', previous.resourceBreakdown.totalTransferSize, current.resourceBreakdown.totalTransferSize, 'bytes', true),
    computeDiff('Requests', previous.resourceBreakdown.totalRequests, current.resourceBreakdown.totalRequests, 'score', true),
  ], [previous, current]);

  const improvements = rows.filter(r => r.isImprovement).length;
  const regressions = rows.filter(r => !r.isImprovement).length;

  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Comparison Summary</h3>
        <div style={{ display: 'flex', gap: 12, fontSize: 'var(--font-xs)' }}>
          <span style={{ color: 'var(--score-good)' }}>{improvements} improved</span>
          <span style={{ color: 'var(--score-poor)' }}>{regressions} regressed</span>
        </div>
      </div>
      <table style={{ width: '100%', fontSize: 'var(--font-sm)', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem 1rem', fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--text-muted)' }}>Metric</th>
            <th style={{ textAlign: 'right', padding: '0.5rem 1rem', fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--text-muted)' }}>Previous</th>
            <th style={{ textAlign: 'right', padding: '0.5rem 1rem', fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--text-muted)' }}>Current</th>
            <th style={{ textAlign: 'right', padding: '0.5rem 1rem', fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--text-muted)' }}>Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.metric} style={{ borderBottom: '1px solid var(--border-color-light, var(--border-color))' }}>
              <td style={{ padding: '0.5rem 1rem', color: 'var(--text-primary)', fontWeight: 500 }}>{row.metric}</td>
              <td style={{ padding: '0.5rem 1rem', textAlign: 'right', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                {row.metric === 'Performance Score' ? Math.round(row.previous as number) : row.metric === 'CLS' ? (row.previous as number).toFixed(2) : formatCell(row.previous as number, row.metric === 'Page Size' ? 'bytes' : row.metric === 'Requests' ? 'score' : 'ms')}
              </td>
              <td style={{ padding: '0.5rem 1rem', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'monospace' }}>
                {row.metric === 'Performance Score' ? Math.round(row.current as number) : row.metric === 'CLS' ? (row.current as number).toFixed(2) : formatCell(row.current as number, row.metric === 'Page Size' ? 'bytes' : row.metric === 'Requests' ? 'score' : 'ms')}
              </td>
              <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontFamily: 'monospace', fontSize: 'var(--font-xs)', color: row.isImprovement ? 'var(--score-good)' : 'var(--score-poor)' }}>
                {row.isImprovement ? '\u25B2' : '\u25BC'} {row.difference}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--border-color)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
        <span>{previous.hostname} \u2192 {current.hostname}</span>
      </div>
    </div>
  );
}
