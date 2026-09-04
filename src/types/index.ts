// =============================================================================
// Web Performance Benchmarker - Type Definitions
// =============================================================================

// -----------------------------------------------------------------------------
// Device and Connection Types
// -----------------------------------------------------------------------------

/** Device types for benchmarking */
export type DeviceType = 'desktop' | 'mobile';

/** Network connection profiles simulating different speeds */
export type ConnectionProfile = 'fast' | '4g' | '3g' | 'slow';

// -----------------------------------------------------------------------------
// Job Status
// -----------------------------------------------------------------------------

/** Status of a benchmark job throughout its lifecycle */
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

// -----------------------------------------------------------------------------
// Score Categories
// -----------------------------------------------------------------------------

/** Lighthouse-style benchmark scores (0-100) */
export interface BenchmarkScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

// -----------------------------------------------------------------------------
// Core Web Vitals
// -----------------------------------------------------------------------------

/** Individual web vital metric with rating and thresholds */
export interface WebVitalMetric {
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  unit: string;
  threshold: { good: number; poor: number };
  description: string;
  suggestion: string;
}

/** Core Web Vitals (LCP, INP, CLS) */
export interface CoreWebVitals {
  lcp: WebVitalMetric;
  inp: WebVitalMetric;
  cls: WebVitalMetric;
}

/** Supporting performance metrics */
export interface SupportingMetrics {
  fcp: WebVitalMetric;
  ttfb: WebVitalMetric;
  speedIndex: WebVitalMetric;
  totalBlockingTime: WebVitalMetric;
}

// -----------------------------------------------------------------------------
// Navigation Timing
// -----------------------------------------------------------------------------

/** Navigation timing breakdown in milliseconds */
export interface NavigationTiming {
  dns: number;
  connection: number;
  tls: number;
  request: number;
  response: number;
  dom: number;
  firstPaint: number;
  fcp: number;
  lcp: number;
  load: number;
  domContentLoaded: number;
  domInteractive: number;
}

// -----------------------------------------------------------------------------
// Network Resources
// -----------------------------------------------------------------------------

/** Resource type categories */
export type ResourceType = 'script' | 'stylesheet' | 'image' | 'font' | 'document' | 'xhr' | 'fetch' | 'other';

/** Individual network resource loaded during page load */
export interface NetworkResource {
  url: string;
  name: string;
  type: ResourceType;
  size: number;
  transferSize: number;
  duration: number;
  status: number;
  priority: string;
  startTime: number;
  domain: string;
  cacheControl?: string;
  etag?: string;
  lastModified?: string;
  expires?: string;
  compression?: string;
}

// -----------------------------------------------------------------------------
// Resource Breakdown
// -----------------------------------------------------------------------------

/** Detailed breakdown of resources by type */
export interface ResourceBreakdown {
  totalSize: number;
  totalTransferSize: number;
  totalRequests: number;
  javascript: {
    size: number;
    transferSize: number;
    requests: number;
    blocking: number;
    async: number;
    deferred: number;
  };
  css: {
    size: number;
    transferSize: number;
    requests: number;
  };
  images: {
    size: number;
    transferSize: number;
    requests: number;
    oversized: number;
    missingDimensions: number;
    unsupportedFormat: number;
  };
  fonts: {
    size: number;
    transferSize: number;
    requests: number;
  };
  html: {
    size: number;
    transferSize: number;
    requests: number;
  };
  xhrFetch: {
    size: number;
    transferSize: number;
    requests: number;
  };
  other: {
    size: number;
    transferSize: number;
    requests: number;
  };
}

// -----------------------------------------------------------------------------
// Third Party Domains
// -----------------------------------------------------------------------------

/** Third-party domain loaded on the page */
export interface ThirdPartyDomain {
  domain: string;
  requests: number;
  transferSize: number;
  mainThreadTime: number;
  category: 'analytics' | 'advertising' | 'social' | 'fonts' | 'cdn' | 'other';
}

// -----------------------------------------------------------------------------
// Audits
// -----------------------------------------------------------------------------

/** Accessibility audit result */
export interface AccessibilityAudit {
  id: string;
  title: string;
  description: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  status: 'passed' | 'warning' | 'failed';
  details?: string;
  howToFix?: string;
  affectedElements?: string[];
}

/** SEO audit result */
export interface SEOAudit {
  id: string;
  title: string;
  description: string;
  status: 'passed' | 'warning' | 'failed';
  details?: string;
  recommendation?: string;
}

/** Best practices audit result */
export interface BestPracticeAudit {
  id: string;
  title: string;
  description: string;
  status: 'passed' | 'warning' | 'failed';
  details?: string;
  severity: 'error' | 'warning' | 'info';
}

// -----------------------------------------------------------------------------
// Opportunities & Diagnostics
// -----------------------------------------------------------------------------

/** Performance optimization opportunity */
export interface Opportunity {
  id: string;
  title: string;
  description: string;
  savings: number;
  savingsUnit: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedResources: string[];
  explanation: string;
  suggestedFix: string;
}

/** Diagnostic check result */
export interface Diagnostic {
  id: string;
  title: string;
  description: string;
  status: 'good' | 'warning' | 'poor';
  value: number;
  unit: string;
  threshold?: number;
  details?: string;
}

// -----------------------------------------------------------------------------
// JavaScript Analysis
// -----------------------------------------------------------------------------

/** JavaScript bundle and execution analysis */
export interface JavaScriptAnalysis {
  totalSize: number;
  totalTransferSize: number;
  scriptCount: number;
  blockingScripts: number;
  asyncScripts: number;
  deferredScripts: number;
  longTasks: number;
  thirdPartyScripts: number;
  executionTime: number;
  mainThreadTime: number;
}

// -----------------------------------------------------------------------------
// Image Analysis
// -----------------------------------------------------------------------------

/** Image optimization analysis */
export interface ImageAnalysis {
  oversized: Array<{ url: string; size: number; recommended: number }>;
  missingDimensions: string[];
  unsupportedFormat: string[];
  lazyLoadOpportunities: string[];
  responsiveOpportunities: string[];
  recommendations: string[];
}

// -----------------------------------------------------------------------------
// Caching Analysis
// -----------------------------------------------------------------------------

/** HTTP caching analysis */
export interface CachingAnalysis {
  resourcesWithCaching: number;
  resourcesWithoutCaching: number;
  totalCacheableSize: number;
  recommendations: Array<{ resource: string; issue: string; recommendation: string }>;
}

// -----------------------------------------------------------------------------
// Compression Analysis
// -----------------------------------------------------------------------------

/** Compression analysis for resources */
export interface CompressionAnalysis {
  compressedSize: number;
  uncompressedSize: number;
  potentialSavings: number;
  resourcesCompressed: number;
  resourcesUncompressed: number;
  formats: string[];
}

// -----------------------------------------------------------------------------
// Security Analysis
// -----------------------------------------------------------------------------

/** Security checks and analysis */
export interface SecurityAnalysis {
  https: boolean;
  mixedContent: boolean;
  consoleErrors: string[];
  failedRequests: string[];
  deprecatedAPIs: string[];
  checks: BestPracticeAudit[];
}

// -----------------------------------------------------------------------------
// Waterfall
// -----------------------------------------------------------------------------

/** Waterfall chart entry for resource loading timeline */
export interface WaterfallEntry {
  url: string;
  name: string;
  type: ResourceType;
  domain: string;
  startTime: number;
  duration: number;
  transferSize: number;
  size: number;
  status: number;
}

// -----------------------------------------------------------------------------
// Benchmark Request & Result
// -----------------------------------------------------------------------------

/** Benchmark request payload */
export interface BenchmarkRequest {
  url: string;
  device: DeviceType;
  connection: ConnectionProfile;
  demoMode?: boolean;
}

/** Complete benchmark result with all metrics */
export interface BenchmarkResult {
  id: string;
  url: string;
  hostname: string;
  timestamp: string;
  device: DeviceType;
  connection: ConnectionProfile;
  duration: number;
  scores: BenchmarkScores;
  coreWebVitals: CoreWebVitals;
  supportingMetrics: SupportingMetrics;
  navigationTiming: NavigationTiming;
  resources: NetworkResource[];
  resourceBreakdown: ResourceBreakdown;
  thirdParties: ThirdPartyDomain[];
  accessibility: AccessibilityAudit[];
  seo: SEOAudit[];
  bestPractices: BestPracticeAudit[];
  opportunities: Opportunity[];
  diagnostics: Diagnostic[];
  javascriptAnalysis: JavaScriptAnalysis;
  imageAnalysis: ImageAnalysis;
  cachingAnalysis: CachingAnalysis;
  compressionAnalysis: CompressionAnalysis;
  securityAnalysis: SecurityAnalysis;
  waterfall: WaterfallEntry[];
  isDemoData?: boolean;
}

// -----------------------------------------------------------------------------
// Benchmark Job
// -----------------------------------------------------------------------------

/** Benchmark job with status tracking */
export interface BenchmarkJob {
  id: string;
  request: BenchmarkRequest;
  status: JobStatus;
  progress: number;
  stage: string;
  result?: BenchmarkResult;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

// -----------------------------------------------------------------------------
// History
// -----------------------------------------------------------------------------

/** History entry stored in localStorage */
export interface HistoryEntry {
  id: string;
  url: string;
  hostname: string;
  timestamp: string;
  device: DeviceType;
  connection: ConnectionProfile;
  performanceScore: number;
  lcp: number;
  inp: number;
  cls: number;
  pageSize: number;
  requests: number;
}

// -----------------------------------------------------------------------------
// Comparison
// -----------------------------------------------------------------------------

/** Comparison data between two benchmark runs */
export interface ComparisonData {
  metric: string;
  previous: number | string;
  current: number | string;
  difference: number | string;
  isImprovement: boolean;
}

// -----------------------------------------------------------------------------
// Progress Stages
// -----------------------------------------------------------------------------

/** Benchmark progress stage */
export interface BenchmarkStage {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'error';
}
