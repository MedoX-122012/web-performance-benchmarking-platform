import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ComparisonTable from '@/components/ComparisonTable';
import ScoreCircle from '@/components/ScoreCircle';
import { formatBytes, formatDuration } from '@/utils/formatting';
import { getHistory as getLocalHistory, getFullResult } from '@/utils/storage';
import type { BenchmarkResult, HistoryEntry } from '@/types';

interface ReportSelectorProps {
  label: string;
  value: string;
  entries: HistoryEntry[];
  onSelect: (id: string) => void;
  report: BenchmarkResult | undefined;
  isLoading: boolean;
}

function ReportSelector({ label, value, entries, onSelect, report, isLoading }: ReportSelectorProps) {
  const [manualId, setManualId] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) onSelect(manualId.trim());
  };

  return (
    <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{label}</h3>
        {report && (
          <ScoreCircle score={report.scores.performance} size="sm" />
        )}
      </div>

      {entries.length > 0 && (
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1.5">Choose from history</label>
          <select
            value={value}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-gray-600 appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              paddingRight: 32,
            }}
            aria-label={`${label} selection`}
          >
            <option value="">Select a report...</option>
            {entries.map((e) => (
              <option key={e.id} value={e.id}>
                {e.hostname} — Score {Math.round(e.performanceScore)} — {new Date(e.timestamp).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      )}

      <form onSubmit={handleManualSubmit} className="mb-4">
        <label className="block text-xs text-gray-500 mb-1.5">Or enter report ID</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="Paste report ID..."
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono"
          />
          <button
            type="submit"
            disabled={!manualId.trim()}
            className="px-3 py-2 text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Load
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {report && !isLoading && (
        <div className="space-y-3 pt-3 border-t border-gray-800/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">URL</span>
            <span className="text-sm text-gray-300 truncate font-mono">{report.url}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Device</span>
            <span className="text-sm text-gray-300 capitalize">{report.device}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Date</span>
            <span className="text-sm text-gray-300">{new Date(report.timestamp).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface MetricBarProps {
  label: string;
  left: number;
  right: number;
  unit: string;
  lowerIsBetter?: boolean;
}

function MetricBar({ label, left, right, unit, lowerIsBetter = true }: MetricBarProps) {
  const max = Math.max(left, right, 1);
  const leftPct = (left / max) * 100;
  const rightPct = (right / max) * 100;
  const diff = right - left;
  const improved = lowerIsBetter ? diff < 0 : diff > 0;

  const formatValue = (v: number) => {
    if (unit === 'bytes') return formatBytes(v);
    if (unit === 's') return formatDuration(v);
    if (unit === 'cls') return v.toFixed(2);
    return Math.round(v).toString();
  };

  return (
    <div className="py-3 border-b border-gray-800/50 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className={`text-xs font-medium ${improved ? 'text-green-400' : 'text-red-400'}`}>
          {improved ? '▲' : '▼'} {formatValue(Math.abs(diff))} {improved ? 'better' : 'worse'}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="text-[10px] text-gray-500 mb-1">Previous</div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-500 rounded-full transition-all duration-500"
              style={{ width: `${leftPct}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1 tabular-nums">{formatValue(left)}</div>
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-gray-500 mb-1">Current</div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${improved ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${rightPct}%` }}
            />
          </div>
          <div className="text-xs text-gray-200 mt-1 tabular-nums font-medium">{formatValue(right)}</div>
        </div>
      </div>
    </div>
  );
}

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [history] = useState<HistoryEntry[]>(() => getLocalHistory());

  const [id1, setId1] = useState(searchParams.get('id1') || '');
  const [id2, setId2] = useState(searchParams.get('id2') || '');

  const [report1, setReport1] = useState<BenchmarkResult | null>(null);
  const [report2, setReport2] = useState<BenchmarkResult | null>(null);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);

  useEffect(() => {
    if (!id1) { setReport1(null); return; }
    setLoading1(true);
    const result = getFullResult(id1);
    setReport1(result);
    setLoading1(false);
  }, [id1]);

  useEffect(() => {
    if (!id2) { setReport2(null); return; }
    setLoading2(true);
    const result = getFullResult(id2);
    setReport2(result);
    setLoading2(false);
  }, [id2]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (id1) params.set('id1', id1);
    if (id2) params.set('id2', id2);
    setSearchParams(params, { replace: true });
  }, [id1, id2, setSearchParams]);

  const handleSwap = useCallback(() => {
    setId1(id2);
    setId2(id1);
  }, [id1, id2]);

  const bothSelected = !!report1 && !!report2;
  const bothLoading = loading1 || loading2;

  const metricComparisons = useMemo(() => {
    if (!report1 || !report2) return [];
    return [
      { label: 'Performance Score', left: report1.scores.performance, right: report2.scores.performance, unit: 'score', lowerIsBetter: false },
      { label: 'LCP', left: report1.coreWebVitals.lcp.value, right: report2.coreWebVitals.lcp.value, unit: 'ms' },
      { label: 'INP', left: report1.coreWebVitals.inp.value, right: report2.coreWebVitals.inp.value, unit: 'ms' },
      { label: 'CLS', left: report1.coreWebVitals.cls.value, right: report2.coreWebVitals.cls.value, unit: 'cls' },
      { label: 'FCP', left: report1.supportingMetrics.fcp.value, right: report2.supportingMetrics.fcp.value, unit: 'ms' },
      { label: 'TTFB', left: report1.supportingMetrics.ttfb.value, right: report2.supportingMetrics.ttfb.value, unit: 'ms' },
      { label: 'Page Size', left: report1.resourceBreakdown.totalTransferSize, right: report2.resourceBreakdown.totalTransferSize, unit: 'bytes' },
      { label: 'Requests', left: report1.resourceBreakdown.totalRequests, right: report2.resourceBreakdown.totalRequests, unit: 'count' },
    ];
  }, [report1, report2]);

  const improvementCount = useMemo(() => {
    if (!report1 || !report2) return 0;
    let count = 0;
    const checks: [number, number, boolean][] = [
      [report1.scores.performance, report2.scores.performance, false],
      [report1.coreWebVitals.lcp.value, report2.coreWebVitals.lcp.value, true],
      [report1.coreWebVitals.inp.value, report2.coreWebVitals.inp.value, true],
      [report1.coreWebVitals.cls.value, report2.coreWebVitals.cls.value, true],
      [report1.resourceBreakdown.totalTransferSize, report2.resourceBreakdown.totalTransferSize, true],
      [report1.resourceBreakdown.totalRequests, report2.resourceBreakdown.totalRequests, true],
    ];
    for (const [prev, curr, lowerBetter] of checks) {
      const improved = lowerBetter ? curr < prev : curr > prev;
      if (improved) count++;
    }
    return count;
  }, [report1, report2]);

  if (history.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="w-24 h-24 rounded-full bg-gray-800/50 border border-gray-700/50 flex items-center justify-center mb-6">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
            <path d="M16 3h5v5" />
            <path d="M8 3H3v5" />
            <path d="M21 3l-7 7" />
            <path d="M3 3l7 7" />
            <path d="M16 21h5v-5" />
            <path d="M8 21H3v-5" />
            <path d="M21 21l-7-7" />
            <path d="M3 21l7-7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-300 mb-2">Not enough data to compare</h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Run at least 2 benchmarks to compare results. Benchmark any website to start building comparison data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Compare Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            {bothSelected
              ? 'Review performance differences side by side'
              : 'Select two reports to compare their performance'}
          </p>
        </div>
        {bothSelected && (
          <button
            onClick={handleSwap}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-gray-200 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Swap comparison"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16V4m0 0L3 8m4-4l4 4" />
              <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Swap
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <ReportSelector
          label="Previous Report"
          value={id1}
          entries={history}
          onSelect={setId1}
          report={report1}
          isLoading={loading1}
        />

        <div className="flex items-center justify-center lg:mt-8">
          <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>
        </div>

        <ReportSelector
          label="Current Report"
          value={id2}
          entries={history}
          onSelect={setId2}
          report={report2}
          isLoading={loading2}
        />
      </div>

      {bothLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {bothSelected && report1 && report2 && !bothLoading && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Previous</div>
              <ScoreCircle score={report1.scores.performance} label={report1.hostname} size="lg" />
              <div className="text-xs text-gray-500 mt-3">{new Date(report1.timestamp).toLocaleDateString()}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Current</div>
              <ScoreCircle score={report2.scores.performance} label={report2.hostname} size="lg" />
              <div className="text-xs text-gray-500 mt-3">{new Date(report2.timestamp).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Metric Comparison
              </h3>
              <div className="flex gap-3 text-xs">
                <span className="text-green-400">▲ {improvementCount} improved</span>
                <span className="text-red-400">▼ {metricComparisons.length - improvementCount} regressed</span>
              </div>
            </div>
            <div>
              {metricComparisons.map((m) => (
                <MetricBar
                  key={m.label}
                  label={m.label}
                  left={m.left}
                  right={m.right}
                  unit={m.unit}
                  lowerIsBetter={m.lowerIsBetter}
                />
              ))}
            </div>
          </div>

          <ComparisonTable previous={report1} current={report2} />

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Improvement / Regression Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-medium text-green-400 mb-3 uppercase tracking-wider">Improvements</h4>
                <div className="space-y-2">
                  {report2.scores.performance > report1.scores.performance && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-400">✓</span>
                      <span className="text-gray-300">Performance score improved by {Math.round(report2.scores.performance - report1.scores.performance)} points</span>
                    </div>
                  )}
                  {report2.coreWebVitals.lcp.value < report1.coreWebVitals.lcp.value && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-400">✓</span>
                      <span className="text-gray-300">LCP reduced by {formatDuration(report1.coreWebVitals.lcp.value - report2.coreWebVitals.lcp.value)}</span>
                    </div>
                  )}
                  {report2.coreWebVitals.cls.value < report1.coreWebVitals.cls.value && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-400">✓</span>
                      <span className="text-gray-300">CLS improved from {report1.coreWebVitals.cls.value.toFixed(2)} to {report2.coreWebVitals.cls.value.toFixed(2)}</span>
                    </div>
                  )}
                  {report2.resourceBreakdown.totalTransferSize < report1.resourceBreakdown.totalTransferSize && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-400">✓</span>
                      <span className="text-gray-300">Page size reduced by {formatBytes(report1.resourceBreakdown.totalTransferSize - report2.resourceBreakdown.totalTransferSize)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-red-400 mb-3 uppercase tracking-wider">Regressions</h4>
                <div className="space-y-2">
                  {report2.scores.performance < report1.scores.performance && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-red-400">✗</span>
                      <span className="text-gray-300">Performance score dropped by {Math.round(report1.scores.performance - report2.scores.performance)} points</span>
                    </div>
                  )}
                  {report2.coreWebVitals.lcp.value > report1.coreWebVitals.lcp.value && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-red-400">✗</span>
                      <span className="text-gray-300">LCP increased by {formatDuration(report2.coreWebVitals.lcp.value - report1.coreWebVitals.lcp.value)}</span>
                    </div>
                  )}
                  {report2.coreWebVitals.cls.value > report1.coreWebVitals.cls.value && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-red-400">✗</span>
                      <span className="text-gray-300">CLS worsened from {report1.coreWebVitals.cls.value.toFixed(2)} to {report2.coreWebVitals.cls.value.toFixed(2)}</span>
                    </div>
                  )}
                  {report2.resourceBreakdown.totalTransferSize > report1.resourceBreakdown.totalTransferSize && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-red-400">✗</span>
                      <span className="text-gray-300">Page size increased by {formatBytes(report2.resourceBreakdown.totalTransferSize - report1.resourceBreakdown.totalTransferSize)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
