import { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type {
  BenchmarkResult,
  ResourceBreakdown,
  NetworkResource,
  Diagnostic,
  JavaScriptAnalysis,
  ImageAnalysis,
  CachingAnalysis,
  CompressionAnalysis,
  HistoryEntry,
} from '@types/index';
import { useGetHistory } from '@hooks/useHistory';
import { getFullResult, getHistoryForUrl } from '@utils/storage';
import {
  formatBytes,
  formatDuration,
  formatDate,
  formatTimeAgo,
  clsx,
} from '@utils/formatting';
import ScoreOverview from '@components/ScoreOverview';
import ExportMenu from '@components/ExportMenu';
import WebVitalCard from '@components/WebVitalCard';
import NavigationTimeline from '@components/NavigationTimeline';
import OpportunityCard from '@components/OpportunityCard';
import DiagnosticCard from '@components/DiagnosticCard';
import AuditList from '@components/AuditList';
import ResourceTable from '@components/ResourceTable';
import ThirdPartyTable from '@components/ThirdPartyTable';
import ResourceBreakdownChart from '@components/ResourceBreakdownChart';
import WaterfallChart from '@components/WaterfallChart';
import ComparisonTable from '@components/ComparisonTable';

const LazyOverviewTab = lazy(() => Promise.resolve({ default: OverviewTab }));
const LazyPerformanceTab = lazy(() => Promise.resolve({ default: PerformanceTab }));
const LazyAccessibilityTab = lazy(() => Promise.resolve({ default: AccessibilityTab }));
const LazySEOTab = lazy(() => Promise.resolve({ default: SEOTab }));
const LazyBestPracticesTab = lazy(() => Promise.resolve({ default: BestPracticesTab }));
const LazyNetworkTab = lazy(() => Promise.resolve({ default: NetworkTab }));
const LazyResourcesTab = lazy(() => Promise.resolve({ default: ResourcesTab }));
const LazyDiagnosticsTab = lazy(() => Promise.resolve({ default: DiagnosticsTab }));

type TabId = 'overview' | 'performance' | 'accessibility' | 'seo' | 'bestPractices' | 'network' | 'resources' | 'diagnostics';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'performance', label: 'Performance', icon: '⚡' },
  { id: 'accessibility', label: 'Accessibility', icon: '♿' },
  { id: 'seo', label: 'SEO', icon: '🔍' },
  { id: 'bestPractices', label: 'Best Practices', icon: '✅' },
  { id: 'network', label: 'Network', icon: '🌐' },
  { id: 'resources', label: 'Resources', icon: '📦' },
  { id: 'diagnostics', label: 'Diagnostics', icon: '🩺' },
];

const DEVICE_LABELS: Record<string, string> = {
  desktop: '🖥️ Desktop',
  mobile: '📱 Mobile',
};

const CONNECTION_LABELS: Record<string, string> = {
  fast: 'Fast',
  '4g': '4G',
};

const TAB_CONTENT_STYLE: React.CSSProperties = {
  animation: 'fadeIn 0.2s ease-out',
};

function TabFallback() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500">Loading tab content...</span>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-sm">{icon}</span>}
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-lg font-bold text-gray-200 font-mono">{value}</span>
    </div>
  );
}

function getAuditCounts(audits: Array<{ status: string }>) {
  const counts = { passed: 0, warning: 0, failed: 0 };
  for (const a of audits) {
    if (a.status === 'passed') counts.passed++;
    else if (a.status === 'warning') counts.warning++;
    else if (a.status === 'failed') counts.failed++;
  }
  return counts;
}

function ResourceMiniChart({ breakdown }: { breakdown: ResourceBreakdown }) {
  const items = [
    { label: 'JS', size: breakdown.javascript.transferSize, color: '#f59e0b' },
    { label: 'CSS', size: breakdown.css.transferSize, color: '#8b5cf6' },
    { label: 'Images', size: breakdown.images.transferSize, color: '#3b82f6' },
    { label: 'Fonts', size: breakdown.fonts.transferSize, color: '#22c55e' },
    { label: 'Other', size: breakdown.html.transferSize + breakdown.xhrFetch.transferSize + breakdown.other.transferSize, color: '#6b7280' },
  ].filter((i) => i.size > 0);

  const total = items.reduce((s, i) => s + i.size, 0);
  if (total === 0) return null;

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <SectionHeader title="Resource Breakdown" />
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-800">
        {items.map((item) => (
          <div
            key={item.label}
            style={{ width: `${(item.size / total) * 100}%`, backgroundColor: item.color }}
            className="h-full transition-all duration-500"
            title={`${item.label}: ${formatBytes(item.size)}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
            {item.label}
            <span className="text-gray-600">({((item.size / total) * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewTab({ result }: { result: BenchmarkResult }) {
  const topIssues = useMemo(
    () =>
      [...result.opportunities]
        .sort((a, b) => b.savings - a.savings)
        .slice(0, 3),
    [result.opportunities],
  );

  const topOpportunities = useMemo(
    () =>
      [...result.opportunities]
        .sort((a, b) => b.savings - a.savings)
        .slice(0, 3),
    [result.opportunities],
  );

  return (
    <div style={TAB_CONTENT_STYLE} className="space-y-6">
      <SectionHeader title="Core Web Vitals" subtitle="Key metrics for user experience" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WebVitalCard name="LCP" metric={result.coreWebVitals.lcp} compact />
        <WebVitalCard name="INP" metric={result.coreWebVitals.inp} compact />
        <WebVitalCard name="CLS" metric={result.coreWebVitals.cls} compact />
      </div>

      <SectionHeader title="Supporting Metrics" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WebVitalCard name="FCP" metric={result.supportingMetrics.fcp} compact />
        <WebVitalCard name="TTFB" metric={result.supportingMetrics.ttfb} compact />
        <WebVitalCard name="Speed Index" metric={result.supportingMetrics.speedIndex} compact />
        <WebVitalCard name="TBT" metric={result.supportingMetrics.totalBlockingTime} compact />
      </div>

      <NavigationTimeline timing={result.navigationTiming} />

      {topIssues.length > 0 && (
        <div>
          <SectionHeader title="Top Issues" subtitle="Sorted by potential savings" />
          <div className="space-y-3">
            {topIssues.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        </div>
      )}

      {topOpportunities.length > 0 && (
        <div>
          <SectionHeader title="Top Opportunities" />
          <div className="space-y-3">
            {topOpportunities.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Page Size" value={formatBytes(result.resourceBreakdown.totalTransferSize)} icon="📦" />
        <StatCard label="Total Requests" value={String(result.resourceBreakdown.totalRequests)} icon="🔄" />
        <StatCard label="Load Time" value={formatDuration(result.navigationTiming.load)} icon="⏱️" />
      </div>

      <ResourceMiniChart breakdown={result.resourceBreakdown} />
    </div>
  );
}

function PerformanceTab({ result }: { result: BenchmarkResult }) {
  return (
    <div style={TAB_CONTENT_STYLE} className="space-y-8">
      <div>
        <SectionHeader title="Core Web Vitals" subtitle="Critical metrics for page experience" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <WebVitalCard name="LCP (Largest Contentful Paint)" metric={result.coreWebVitals.lcp} />
          <WebVitalCard name="INP (Interaction to Next Paint)" metric={result.coreWebVitals.inp} />
          <WebVitalCard name="CLS (Cumulative Layout Shift)" metric={result.coreWebVitals.cls} />
        </div>
      </div>

      <div>
        <SectionHeader title="Supporting Metrics" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WebVitalCard name="FCP (First Contentful Paint)" metric={result.supportingMetrics.fcp} />
          <WebVitalCard name="TTFB (Time to First Byte)" metric={result.supportingMetrics.ttfb} />
          <WebVitalCard name="Speed Index" metric={result.supportingMetrics.speedIndex} />
          <WebVitalCard name="TBT (Total Blocking Time)" metric={result.supportingMetrics.totalBlockingTime} />
        </div>
      </div>

      <NavigationTimeline timing={result.navigationTiming} />

      {result.opportunities.length > 0 && (
        <div>
          <SectionHeader title="Opportunities" subtitle="Optimization suggestions ranked by impact" />
          <div className="space-y-3">
            {result.opportunities
              .sort((a, b) => b.savings - a.savings)
              .map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
          </div>
        </div>
      )}

      <JavaScriptAnalysisSection analysis={result.javascriptAnalysis} resources={result.resources} />

      <ImageAnalysisSection analysis={result.imageAnalysis} />

      <CachingAnalysisSection analysis={result.cachingAnalysis} />

      <CompressionAnalysisSection analysis={result.compressionAnalysis} />
    </div>
  );
}

function JavaScriptAnalysisSection({ analysis, resources }: { analysis: JavaScriptAnalysis; resources: NetworkResource[] }) {
  const jsResources = resources.filter((r) => r.type === 'script');
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <SectionHeader title="JavaScript Analysis" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <StatCard label="Total JS Size" value={formatBytes(analysis.totalTransferSize)} icon="📜" />
        <StatCard label="Script Count" value={String(analysis.scriptCount)} icon="📋" />
        <StatCard label="Execution Time" value={formatDuration(analysis.executionTime)} icon="⏱️" />
        <StatCard label="Main-Thread Time" value={formatDuration(analysis.mainThreadTime)} icon="🧵" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="text-xs text-red-400 font-medium mb-1">Blocking Scripts</div>
          <div className="text-xl font-bold text-red-400 font-mono">{analysis.blockingScripts}</div>
          <div className="text-xs text-gray-500">Render-blocking resources</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="text-xs text-green-400 font-medium mb-1">Async Scripts</div>
          <div className="text-xl font-bold text-green-400 font-mono">{analysis.asyncScripts}</div>
          <div className="text-xs text-gray-500">Non-blocking async loading</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="text-xs text-sky-400 font-medium mb-1">Deferred Scripts</div>
          <div className="text-xl font-bold text-sky-400 font-mono">{analysis.deferredScripts}</div>
          <div className="text-xs text-gray-500">Deferred until DOM ready</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Long Tasks" value={String(analysis.longTasks)} icon="⚠️" />
        <StatCard label="Third-Party Scripts" value={String(analysis.thirdPartyScripts)} icon="🔗" />
      </div>

      {jsResources.length > 0 && (
        <div className="mt-5">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Script Resources</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {jsResources.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-800/30 rounded-lg text-xs">
                <span className="text-gray-300 font-mono truncate mr-4" title={r.url}>{r.name}</span>
                <div className="flex items-center gap-3 text-gray-500 flex-shrink-0">
                  <span>{formatBytes(r.transferSize)}</span>
                  <span>{formatDuration(r.duration)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ImageAnalysisSection({ analysis }: { analysis: ImageAnalysis }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <SectionHeader title="Image Analysis" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <StatCard label="Oversized Images" value={String(analysis.oversized.length)} icon="🖼️" />
        <StatCard label="Missing Dimensions" value={String(analysis.missingDimensions.length)} icon="📐" />
        <StatCard label="Unsupported Formats" value={String(analysis.unsupportedFormat.length)} icon="📁" />
      </div>

      {analysis.oversized.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Oversized Images</h4>
          <div className="space-y-2">
            {analysis.oversized.map((img, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-800/30 rounded-lg text-xs">
                <span className="text-gray-300 font-mono truncate mr-4" title={img.url}>{img.url}</span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-red-400">{formatBytes(img.size)}</span>
                  <span className="text-gray-600">→</span>
                  <span className="text-green-400">{formatBytes(img.recommended)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.missingDimensions.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Missing Dimensions</h4>
          <div className="space-y-2">
            {analysis.missingDimensions.map((url, i) => (
              <div key={i} className="py-2 px-3 bg-gray-800/30 rounded-lg text-xs text-gray-300 font-mono truncate" title={url}>
                {url}
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.unsupportedFormat.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Unsupported Formats</h4>
          <div className="space-y-2">
            {analysis.unsupportedFormat.map((url, i) => (
              <div key={i} className="py-2 px-3 bg-gray-800/30 rounded-lg text-xs text-gray-300 font-mono truncate" title={url}>
                {url}
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.lazyLoadOpportunities.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Lazy Loading Opportunities</h4>
          <div className="space-y-2">
            {analysis.lazyLoadOpportunities.map((url, i) => (
              <div key={i} className="py-2 px-3 bg-gray-800/30 rounded-lg text-xs text-gray-300 font-mono truncate" title={url}>
                {url}
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.recommendations.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recommendations</h4>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                <span className="text-yellow-400 mt-0.5 flex-shrink-0">💡</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CachingAnalysisSection({ analysis }: { analysis: CachingAnalysis }) {
  const totalResources = analysis.resourcesWithCaching + analysis.resourcesWithoutCaching;
  const cachedPercent = totalResources > 0 ? Math.round((analysis.resourcesWithCaching / totalResources) * 100) : 0;

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <SectionHeader title="Caching Analysis" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <StatCard label="Cached Resources" value={`${analysis.resourcesWithCaching} (${cachedPercent}%)`} icon="✅" />
        <StatCard label="Uncached Resources" value={String(analysis.resourcesWithoutCaching)} icon="❌" />
        <StatCard label="Cacheable Size" value={formatBytes(analysis.totalCacheableSize)} icon="💾" />
      </div>

      <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${cachedPercent}%` }}
        />
      </div>

      {analysis.recommendations.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recommendations</h4>
          <div className="space-y-3">
            {analysis.recommendations.map((rec, i) => (
              <div key={i} className="py-3 px-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                <div className="text-xs text-gray-300 font-mono mb-1 truncate" title={rec.resource}>{rec.resource}</div>
                <div className="text-xs text-yellow-400 mb-1">{rec.issue}</div>
                <div className="text-xs text-gray-500">{rec.recommendation}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CompressionAnalysisSection({ analysis }: { analysis: CompressionAnalysis }) {
  const totalResources = analysis.resourcesCompressed + analysis.resourcesUncompressed;
  const compressedPercent = totalResources > 0 ? Math.round((analysis.resourcesCompressed / totalResources) * 100) : 0;

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <SectionHeader title="Compression Analysis" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <StatCard label="Compressed" value={`${analysis.resourcesCompressed} (${compressedPercent}%)`} icon="📦" />
        <StatCard label="Uncompressed" value={String(analysis.resourcesUncompressed)} icon="📄" />
        <StatCard label="Potential Savings" value={formatBytes(analysis.potentialSavings)} icon="💰" />
      </div>

      <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${compressedPercent}%` }}
        />
      </div>

      {analysis.formats.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Compression Formats Detected</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.formats.map((fmt) => (
              <span key={fmt} className="px-3 py-1 bg-blue-500/15 text-blue-400 text-xs font-medium rounded-full">
                {fmt}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AccessibilityTab({ result }: { result: BenchmarkResult }) {
  const counts = useMemo(() => getAuditCounts(result.accessibility), [result.accessibility]);

  return (
    <div style={TAB_CONTENT_STYLE} className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Passed" value={String(counts.passed)} icon="✅" />
        <StatCard label="Warnings" value={String(counts.warning)} icon="⚠️" />
        <StatCard label="Failed" value={String(counts.failed)} icon="❌" />
      </div>
      <AuditList audits={result.accessibility} type="accessibility" />
    </div>
  );
}

function SEOTab({ result }: { result: BenchmarkResult }) {
  const counts = useMemo(() => getAuditCounts(result.seo), [result.seo]);

  return (
    <div style={TAB_CONTENT_STYLE} className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Passed" value={String(counts.passed)} icon="✅" />
        <StatCard label="Warnings" value={String(counts.warning)} icon="⚠️" />
        <StatCard label="Failed" value={String(counts.failed)} icon="❌" />
      </div>
      <AuditList audits={result.seo} type="seo" />
    </div>
  );
}

function BestPracticesTab({ result }: { result: BenchmarkResult }) {
  const counts = useMemo(() => getAuditCounts(result.bestPractices), [result.bestPractices]);
  const security = result.securityAnalysis;

  return (
    <div style={TAB_CONTENT_STYLE} className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Passed" value={String(counts.passed)} icon="✅" />
        <StatCard label="Warnings" value={String(counts.warning)} icon="⚠️" />
        <StatCard label="Failed" value={String(counts.failed)} icon="❌" />
      </div>

      <AuditList audits={result.bestPractices} type="bestPractices" />

      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <SectionHeader title="Security" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <span className={`w-3 h-3 rounded-full ${security.https ? 'bg-green-500' : 'bg-red-500'}`} />
            <div>
              <div className="text-sm text-gray-200 font-medium">HTTPS</div>
              <div className="text-xs text-gray-500">{security.https ? 'Secure connection' : 'Not using HTTPS'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <span className={`w-3 h-3 rounded-full ${security.mixedContent ? 'bg-red-500' : 'bg-green-500'}`} />
            <div>
              <div className="text-sm text-gray-200 font-medium">Mixed Content</div>
              <div className="text-xs text-gray-500">{security.mixedContent ? 'Mixed content detected' : 'No mixed content'}</div>
            </div>
          </div>
        </div>

        {security.consoleErrors.length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Console Errors</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {security.consoleErrors.map((err, i) => (
                <div key={i} className="py-2 px-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-mono">
                  {err}
                </div>
              ))}
            </div>
          </div>
        )}

        {security.failedRequests.length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Failed Requests</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {security.failedRequests.map((req, i) => (
                <div key={i} className="py-2 px-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-mono truncate" title={req}>
                  {req}
                </div>
              ))}
            </div>
          </div>
        )}

        {security.deprecatedAPIs.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Deprecated APIs</h4>
            <div className="space-y-2">
              {security.deprecatedAPIs.map((api, i) => (
                <div key={i} className="py-2 px-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400">
                  {api}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NetworkTab({ result }: { result: BenchmarkResult }) {
  const domains = useMemo(() => {
    const map = new Map<string, { requests: number; transferSize: number }>();
    for (const r of result.resources) {
      const existing = map.get(r.domain) || { requests: 0, transferSize: 0 };
      map.set(r.domain, { requests: existing.requests + 1, transferSize: existing.transferSize + r.transferSize });
    }
    return map.size;
  }, [result.resources]);

  return (
    <div style={TAB_CONTENT_STYLE} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Requests" value={String(result.resourceBreakdown.totalRequests)} icon="🔄" />
        <StatCard label="Total Transfer" value={formatBytes(result.resourceBreakdown.totalTransferSize)} icon="📦" />
        <StatCard label="Unique Domains" value={String(domains)} icon="🌐" />
      </div>

      <WaterfallChart entries={result.waterfall} />
      <ResourceTable resources={result.resources} />
      <ThirdPartyTable domains={result.thirdParties} />

      {result.thirdParties.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <SectionHeader title="Third-Party Cost Summary" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Third-Party Transfer"
              value={formatBytes(result.thirdParties.reduce((s, d) => s + d.transferSize, 0))}
              icon="💸"
            />
            <StatCard
              label="Third-Party Requests"
              value={String(result.thirdParties.reduce((s, d) => s + d.requests, 0))}
              icon="🔄"
            />
            <StatCard
              label="Main-Thread Impact"
              value={formatDuration(result.thirdParties.reduce((s, d) => s + d.mainThreadTime, 0))}
              icon="🧵"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ResourcesTab({ result }: { result: BenchmarkResult }) {
  const largestResources = useMemo(
    () => [...result.resources].sort((a, b) => b.transferSize - a.transferSize).slice(0, 10),
    [result.resources],
  );

  const breakdown = result.resourceBreakdown;

  function getSuggestion(type: string): string {
    switch (type) {
      case 'script':
        return 'Consider code splitting, tree shaking, or removing unused code.';
      case 'stylesheet':
        return 'Remove unused CSS rules and consider critical CSS inlining.';
      case 'image':
        return 'Use modern formats (WebP/AVIF), compress, and set proper dimensions.';
      case 'font':
        return 'Use font-display: swap and subset fonts to include only needed characters.';
      default:
        return 'Review if this resource is necessary and optimize its delivery.';
    }
  }

  return (
    <div style={TAB_CONTENT_STYLE} className="space-y-6">
      <ResourceBreakdownChart breakdown={result.resourceBreakdown} />

      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <SectionHeader title="Detailed Breakdown" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-400">Type</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-400">Requests</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-400">Size</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-400">Transfer</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-400">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'JavaScript', data: breakdown.javascript, color: '#f59e0b' },
                { label: 'CSS', data: breakdown.css, color: '#8b5cf6' },
                { label: 'Images', data: breakdown.images, color: '#3b82f6' },
                { label: 'Fonts', data: breakdown.fonts, color: '#22c55e' },
                { label: 'HTML', data: breakdown.html, color: '#06b6d4' },
                { label: 'XHR/Fetch', data: breakdown.xhrFetch, color: '#ec4899' },
                { label: 'Other', data: breakdown.other, color: '#6b7280' },
              ].map((row) => {
                const pct = breakdown.totalTransferSize > 0 ? (row.data.transferSize / breakdown.totalTransferSize) * 100 : 0;
                return (
                  <tr key={row.label} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                    <td className="py-2.5 px-3 text-gray-300">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: row.color }} />
                        {row.label}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-400 tabular-nums">{row.data.requests}</td>
                    <td className="py-2.5 px-3 text-right text-gray-400 tabular-nums">{formatBytes(row.data.size)}</td>
                    <td className="py-2.5 px-3 text-right text-gray-300 tabular-nums font-medium">{formatBytes(row.data.transferSize)}</td>
                    <td className="py-2.5 px-3 text-right text-gray-500 tabular-nums">{pct.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-700 font-medium">
                <td className="py-2.5 px-3 text-gray-300">Total</td>
                <td className="py-2.5 px-3 text-right text-gray-300 tabular-nums">{breakdown.totalRequests}</td>
                <td className="py-2.5 px-3 text-right text-gray-300 tabular-nums">{formatBytes(breakdown.totalSize)}</td>
                <td className="py-2.5 px-3 text-right text-gray-200 tabular-nums font-bold">{formatBytes(breakdown.totalTransferSize)}</td>
                <td className="py-2.5 px-3 text-right text-gray-300 tabular-nums">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <SectionHeader title="Largest Resources" subtitle="Top 10 heaviest resources by transfer size" />
        <div className="space-y-2">
          {largestResources.map((res, i) => {
            const pct = breakdown.totalTransferSize > 0 ? (res.transferSize / breakdown.totalTransferSize) * 100 : 0;
            return (
              <div key={i} className="flex items-center gap-3 py-2.5 px-3 bg-gray-800/30 rounded-lg">
                <span className="text-xs text-gray-600 w-6 text-right flex-shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-300 font-mono truncate" title={res.url}>{res.name}</div>
                  <div className="text-[10px] text-gray-600 mt-0.5">{res.type} · {getSuggestion(res.type)}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                  <span className="text-gray-400 tabular-nums">{formatBytes(res.transferSize)}</span>
                  <span className="text-gray-600 tabular-nums w-12 text-right">{pct.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DiagnosticsTab({ result }: { result: BenchmarkResult }) {
  const grouped = useMemo(() => {
    const good: Diagnostic[] = [];
    const warning: Diagnostic[] = [];
    const poor: Diagnostic[] = [];
    for (const d of result.diagnostics) {
      if (d.status === 'good') good.push(d);
      else if (d.status === 'warning') warning.push(d);
      else poor.push(d);
    }
    return { good, warning, poor };
  }, [result.diagnostics]);

  return (
    <div style={TAB_CONTENT_STYLE} className="space-y-6">
      {grouped.poor.length > 0 && (
        <div>
          <SectionHeader title="Poor" subtitle="Items requiring attention" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {grouped.poor.map((d) => (
              <DiagnosticCard key={d.id} diagnostic={d} />
            ))}
          </div>
        </div>
      )}

      {grouped.warning.length > 0 && (
        <div>
          <SectionHeader title="Warnings" subtitle="Potential improvements" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {grouped.warning.map((d) => (
              <DiagnosticCard key={d.id} diagnostic={d} />
            ))}
          </div>
        </div>
      )}

      {grouped.good.length > 0 && (
        <div>
          <SectionHeader title="Passed" subtitle="Metrics meeting thresholds" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {grouped.good.map((d) => (
              <DiagnosticCard key={d.id} diagnostic={d} />
            ))}
          </div>
        </div>
      )}

      {result.diagnostics.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No diagnostics available.</p>
        </div>
      )}
    </div>
  );
}

function ComparisonModal({
  open,
  onClose,
  current,
  historyEntries,
}: {
  open: boolean;
  onClose: () => void;
  current: BenchmarkResult;
  historyEntries: HistoryEntry[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const previousResults = useMemo(
    () =>
      historyEntries
        .filter((e) => e.id !== current.id && e.url === current.url)
        .slice(0, 20),
    [historyEntries, current],
  );

  const [previousResult, setPreviousResult] = useState<BenchmarkResult | null>(null);
  const [loadingPrev, setLoadingPrev] = useState(false);

  useEffect(() => {
    if (!selectedId) {
      setPreviousResult(null);
      return;
    }
    setLoadingPrev(true);
    const stored = getFullResult(selectedId);
    if (stored) {
      setPreviousResult(stored);
    }
    setLoadingPrev(false);
  }, [selectedId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-gray-200">Compare with Previous Test</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {previousResults.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">No previous tests found for this URL.</p>
              <p className="text-xs mt-1">Run more benchmarks to enable comparison.</p>
            </div>
          ) : (
            <div className="space-y-2 mb-6">
              <p className="text-xs text-gray-500 mb-3">Select a previous test to compare against:</p>
              {previousResults.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedId(entry.id)}
                  className={clsx(
                    'w-full text-left p-3 rounded-lg border transition-colors',
                    selectedId === entry.id
                      ? 'bg-blue-500/15 border-blue-500/30'
                      : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-300">{formatDate(entry.timestamp)}</span>
                      <span className="text-xs text-gray-600 ml-2">{formatTimeAgo(entry.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>Perf: <span className="text-gray-300">{entry.performanceScore}</span></span>
                      <span>LCP: <span className="text-gray-300">{formatDuration(entry.lcp)}</span></span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {previousResult && (
            <ComparisonTable previous={previousResult} current={current} />
          )}

          {selectedId && loadingPrev && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrendCharts({ url, currentResult }: { url: string; currentResult: BenchmarkResult }) {
  const allEntries = useMemo(() => getHistoryForUrl(url), [url]);

  const chartData = useMemo(() => {
    if (allEntries.length < 2) return null;
    return allEntries
      .slice(0, 20)
      .reverse()
      .map((e) => ({
        date: new Date(e.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        performance: e.performanceScore,
        lcp: e.lcp,
        cls: e.cls,
        pageSize: e.pageSize / 1024,
      }));
  }, [allEntries]);

  if (!chartData || chartData.length < 2) return null;

  const chartProps = {
    margin: { top: 5, right: 10, left: -15, bottom: 5 },
  };

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <SectionHeader title="Trends Over Time" subtitle="Performance metrics across multiple tests" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-semibold text-gray-400 mb-3">Performance Score</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} {...chartProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Line type="monotone" dataKey="performance" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-400 mb-3">LCP (ms)</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} {...chartProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value: number) => [`${Math.round(value)}ms`, 'LCP']}
                />
                <Line type="monotone" dataKey="lcp" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-400 mb-3">CLS</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} {...chartProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value: number) => [value.toFixed(3), 'CLS']}
                />
                <Line type="monotone" dataKey="cls" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-400 mb-3">Page Size (KB)</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} {...chartProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value: number) => [`${Math.round(value)} KB`, 'Page Size']}
                />
                <Line type="monotone" dataKey="pageSize" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState<BenchmarkResult | null>(() => {
    const stateResult = (location.state as { result?: BenchmarkResult })?.result;
    if (stateResult) return stateResult;
    if (id) return getFullResult(id);
    return null;
  });
  const [isLoading, setIsLoading] = useState(!result);
  const { data: historyEntries = [] } = useGetHistory();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    if (result) {
      setIsLoading(false);
      return;
    }
    if (id) {
      const stored = getFullResult(id);
      if (stored) {
        setResult(stored);
      }
    }
    setIsLoading(false);
  }, [id, result]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="text-6xl">📭</div>
          <h2 className="text-2xl font-bold text-gray-200">Report not found</h2>
          <p className="text-gray-500 text-sm max-w-md">
            The benchmark report you're looking for doesn't exist or may have been removed.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    const props = { result };
    switch (activeTab) {
      case 'overview':
        return <LazyOverviewTab {...props} />;
      case 'performance':
        return <LazyPerformanceTab {...props} />;
      case 'accessibility':
        return <LazyAccessibilityTab {...props} />;
      case 'seo':
        return <LazySEOTab {...props} />;
      case 'bestPractices':
        return <LazyBestPracticesTab {...props} />;
      case 'network':
        return <LazyNetworkTab {...props} />;
      case 'resources':
        return <LazyResourcesTab {...props} />;
      case 'diagnostics':
        return <LazyDiagnosticsTab {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 truncate">{result.hostname}</h1>
            <p className="text-sm text-gray-500 font-mono mt-1 truncate" title={result.url}>{result.url}</p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className="text-xs text-gray-500">{formatDate(result.timestamp)}</span>
              <span className="text-xs text-gray-600">·</span>
              <span className="text-xs text-gray-500">{formatTimeAgo(result.timestamp)}</span>
              <span className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400 border border-gray-700">
                {DEVICE_LABELS[result.device] || result.device}
              </span>
              <span className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400 border border-gray-700">
                {CONNECTION_LABELS[result.connection] || result.connection}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setCompareOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
              </svg>
              Compare
            </button>
            <button
              onClick={() => navigate(`/`)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              Run Again
            </button>
            <ExportMenu result={result} />
          </div>
        </div>

        <ScoreOverview scores={result.scores} />
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="flex overflow-x-auto no-scrollbar" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 flex-shrink-0',
                activeTab === tab.id
                  ? 'text-blue-400 border-blue-400 bg-blue-500/5'
                  : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-800/50',
              )}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <Suspense fallback={<TabFallback />}>
        {renderTabContent()}
      </Suspense>

      <TrendCharts url={result.url} currentResult={result} />

      <ComparisonModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        current={result}
        historyEntries={historyEntries}
      />
    </div>
  );
}
