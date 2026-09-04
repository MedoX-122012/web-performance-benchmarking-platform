import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { BenchmarkResult, DeviceType } from '../src/types/index';

const PSI_BASE = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [5000, 10000, 20000];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function getHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

function getRating(value: number, goodThreshold: number, poorThreshold: number): 'good' | 'needs-improvement' | 'poor' {
  if (value <= goodThreshold) return 'good';
  if (value <= poorThreshold) return 'needs-improvement';
  return 'poor';
}

function parseNumericValue(audit: any): number {
  return audit?.numericValue ?? 0;
}

function mapAudits(audits: any, category: string): Array<{id: string; title: string; description: string; status: 'passed' | 'warning' | 'failed'; severity: string; impact?: string}> {
  if (!audits) return [];
  return Object.values(audits)
    .filter((a: any) => a?.category === category || (a?.group && a.group.startsWith(category)))
    .map((a: any) => ({
      id: a.id || '',
      title: a.title || '',
      description: a.description || '',
      status: a.score === 1 ? 'passed' : a.score === 0 ? 'failed' : 'warning',
      severity: a.score === 1 ? 'info' : a.score === 0 ? 'error' : 'warning',
      impact: a.scoreDisplayMode || undefined,
    }));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  const response = await fetch(url);

  // Retry on 429 (rate limit) and 500 (Google internal error - temporary)
  if ((response.status === 429 || response.status === 500) && retries > 0) {
    const delay = RETRY_DELAYS[MAX_RETRIES - retries];
    console.log(`[PSI] Error ${response.status}. Retrying in ${delay / 1000}s... (${retries} retries left)`);
    await sleep(delay);
    return fetchWithRetry(url, retries - 1);
  }

  return response;
}

async function tryWebPageTestFallback(url: string, strategy: string): Promise<BenchmarkResult | null> {
  const wptKey = process.env.WEBPAGETEST_API_KEY || '';
  if (!wptKey) {
    console.log('[WPT] No WebPageTest API key configured, skipping fallback');
    return null;
  }

  console.log(`[WPT] Trying fallback for ${url}`);

  try {
    // Step 1: Submit test
    const testUrl = `https://www.webpagetest.org/runtest.php?url=${encodeURIComponent(url)}&f=json&k=${wptKey}&runs=1&fvonly=1&lighthouse=1&video=0&f=csv`;
    const submitRes = await fetch(testUrl);
    if (!submitRes.ok) {
      console.log(`[WPT] Submit failed: ${submitRes.status}`);
      return null;
    }

    const submitData = await submitRes.json();
    const testId = submitData.data?.testId;
    if (!testId) {
      console.log('[WPT] No test ID returned');
      return null;
    }

    // Step 2: Poll for results (max 3 minutes)
    const baseUrl = submitData.data?.jsonUrl || `https://www.webpagetest.org/results/${testId}`;
    const csvUrl = `https://www.webpagetest.org/results.csv/${testId}`;
    const maxPolls = 36;
    const pollInterval = 5000;

    for (let i = 0; i < maxPolls; i++) {
      await sleep(pollInterval);

      const pollUrl = `${baseUrl}?f=json`;
      const pollRes = await fetch(pollUrl);
      if (!pollRes.ok) continue;

      const pollData = await pollRes.json();
      const testResult = pollData.data?.runs?.['1']?.firstView;
      if (!testResult) continue;

      // Got results - map to BenchmarkResult
      const perfScore = Math.round(testResult.score?.performance || 0);
      const a11yScore = Math.round(testResult.score?.accessibility || 0);
      const seoScore = Math.round(testResult.score?.seo || 0);
      const bpScore = Math.round(testResult.score?.bestpractices || 0);

      const lcpMs = testResult.metrics?.LargestContentfulPaint?.renderStart || 0;
      const fcpMs = testResult.metrics?.FirstContentfulPaint?.start || 0;
      const clsValue = 0;
      const tbtMs = testResult.metrics?.TotalBlockingTime?.time || 0;
      const siMs = testResult.metrics?.SpeedIndex?.time || 0;
      const ttfbMs = testResult.metrics?.TTFB?.responseStart || 0;

      const resources = (testResult.requests || []).map((r: any) => ({
        url: r.url || '',
        name: (r.url || '').split('/').pop() || '',
        type: (r.type || 'other').toLowerCase(),
        size: r.bytes || 0,
        transferSize: r.bytes || 0,
        duration: r.end - r.start || 0,
        status: r.responseCode || 200,
        priority: 'medium',
        startTime: r.start || 0,
        domain: (() => { try { return new URL(r.url || '').hostname; } catch { return ''; } })(),
      }));

      const totalTransfer = resources.reduce((s: number, r: any) => s + (r.transferSize || 0), 0);
      const totalRequests = resources.length;

      const result: BenchmarkResult = {
        id: generateId(),
        url,
        hostname: getHostname(url),
        timestamp: new Date().toISOString(),
        device: strategy === 'mobile' ? 'mobile' : 'desktop',
        connection: 'fast',
        duration: Math.round(testResult.loadTime || 0),
        scores: { performance: perfScore, accessibility: a11yScore, seo: seoScore, bestPractices: bpScore },
        coreWebVitals: {
          lcp: { value: Math.round(lcpMs), rating: getRating(lcpMs, 2500, 4000), unit: 'ms', threshold: { good: 2500, poor: 4000 }, description: 'Largest Contentful Paint', suggestion: 'Optimize the largest element load time.' },
          inp: { value: Math.round(tbtMs), rating: getRating(tbtMs, 200, 500), unit: 'ms', threshold: { good: 200, poor: 500 }, description: 'Interaction to Next Paint', suggestion: 'Reduce main thread blocking time.' },
          cls: { value: Math.round(clsValue * 1000) / 1000, rating: getRating(clsValue, 0.1, 0.25), unit: '', threshold: { good: 0.1, poor: 0.25 }, description: 'Cumulative Layout Shift', suggestion: 'Set explicit dimensions for elements.' },
        },
        supportingMetrics: {
          fcp: { value: Math.round(fcpMs), rating: getRating(fcpMs, 1800, 3000), unit: 'ms', threshold: { good: 1800, poor: 3000 }, description: 'First Contentful Paint', suggestion: 'Reduce render-blocking resources.' },
          ttfb: { value: Math.round(ttfbMs), rating: getRating(ttfbMs, 200, 600), unit: 'ms', threshold: { good: 200, poor: 600 }, description: 'Time to First Byte', suggestion: 'Improve server response time.' },
          speedIndex: { value: Math.round(siMs), rating: getRating(siMs, 2000, 4000), unit: 'ms', threshold: { good: 2000, poor: 4000 }, description: 'Speed Index', suggestion: 'Optimize above-the-fold content.' },
          totalBlockingTime: { value: Math.round(tbtMs), rating: getRating(tbtMs, 200, 600), unit: 'ms', threshold: { good: 200, poor: 600 }, description: 'Total Blocking Time', suggestion: 'Break up long tasks.' },
        },
        navigationTiming: {
          dns: 0, connection: 0, tls: 0, request: 0, response: 0,
          dom: testResult.domContentLoadedEventEnd || 0,
          firstPaint: fcpMs, fcp: fcpMs, lcp: lcpMs,
          load: testResult.loadTime || 0,
          domContentLoaded: testResult.domContentLoadedEventEnd || 0,
          domInteractive: testResult.domInteractive || 0,
        },
        resources: resources.slice(0, 50),
        resourceBreakdown: {
          totalSize: totalTransfer, totalTransferSize: totalTransfer, totalRequests,
          javascript: { size: 0, transferSize: 0, requests: 0, blocking: 0, async: 0, deferred: 0 },
          css: { size: 0, transferSize: 0, requests: 0 },
          images: { size: 0, transferSize: 0, requests: 0, oversized: 0, missingDimensions: 0, unsupportedFormat: 0 },
          fonts: { size: 0, transferSize: 0, requests: 0 },
          html: { size: 0, transferSize: 0, requests: 0 },
          xhrFetch: { size: 0, transferSize: 0, requests: 0 },
          other: { size: 0, transferSize: 0, requests: 0 },
        },
        thirdParties: [],
        accessibility: [], seo: [], bestPractices: [],
        opportunities: [],
        diagnostics: [
          { id: 'total-byte-weight', title: 'Total page weight', value: totalTransfer, unit: 'bytes', status: totalTransfer < 1500000 ? 'good' : totalTransfer < 3000000 ? 'warning' : 'poor' },
          { id: 'network-requests', title: 'Network requests', value: totalRequests, unit: 'requests', status: totalRequests < 40 ? 'good' : totalRequests < 65 ? 'warning' : 'poor' },
        ],
        javascriptAnalysis: { totalSize: 0, totalTransferSize: 0, scriptCount: 0, blockingScripts: 0, asyncScripts: 0, deferredScripts: 0, longTasks: 0, thirdPartyScripts: 0, executionTime: 0, mainThreadTime: 0 },
        imageAnalysis: { oversized: [], missingDimensions: [], unsupportedFormat: [], lazyLoadOpportunities: [], responsiveOpportunities: [], recommendations: [] },
        cachingAnalysis: { resourcesWithCaching: 0, resourcesWithoutCaching: 0, totalCacheableSize: 0, recommendations: [] },
        compressionAnalysis: { compressedSize: 0, uncompressedSize: 0, potentialSavings: 0, resourcesCompressed: 0, resourcesUncompressed: 0, formats: [] },
        securityAnalysis: { https: url.startsWith('https://'), mixedContent: false, consoleErrors: [], failedRequests: [], deprecatedAPIs: [], checks: [] },
        waterfall: [],
      };

      console.log(`[WPT] Test completed for ${url}`);
      return result;
    }

    console.log('[WPT] Test timed out waiting for results');
    return null;
  } catch (err: any) {
    console.log(`[WPT] Fallback failed: ${err.message}`);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, device = 'desktop' } = req.body || {};
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try { new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL' }); }

  const strategy = device === 'mobile' ? 'mobile' : 'desktop';
  const apiKey = process.env.GOOGLE_PSI_API_KEY || process.env.PSI_API_KEY || '';
  const keyParam = apiKey ? `&key=${apiKey}` : '';
  const apiUrl = `${PSI_BASE}?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance&category=accessibility&category=seo&category=best-practices${keyParam}`;

  try {
    console.log(`[PSI] Analyzing ${url} (${strategy})${apiKey ? ' with API key' : ' without API key (rate limited)'}`);

    const psiResponse = await fetchWithRetry(apiUrl);

    if (!psiResponse.ok) {
      const errText = await psiResponse.text().catch(() => '');

      if (psiResponse.status === 429) {
        return res.status(429).json({
          error: 'Rate limited by Google PageSpeed Insights API.',
          message: apiKey
            ? 'API key quota exceeded. Please wait a few minutes and try again.'
            : 'Too many requests without an API key. Add a GOOGLE_PSI_API_KEY environment variable for higher limits (free, 250k requests/day).',
          hint: 'Get a free API key at: https://console.cloud.google.com/apis/credentials',
        });
      }

      // WebPageTest fallback for any non-OK response
      const fallbackResult = await tryWebPageTestFallback(url, strategy);
      if (fallbackResult) {
        return res.status(200).json(fallbackResult);
      }

      return res.status(psiResponse.status).json({ error: `PageSpeed API error: ${errText}` });
    }

    const psi = await psiResponse.json();
    const lh = psi.lighthouseResult;
    if (!lh) return res.status(500).json({ error: 'No Lighthouse result returned' });

    const categories = lh.categories || {};
    const audits = lh.audits || {};

    const perfScore = Math.round((categories.performance?.score || 0) * 100);
    const a11yScore = Math.round((categories.accessibility?.score || 0) * 100);
    const seoScore = Math.round((categories.seo?.score || 0) * 100);
    const bpScore = Math.round((categories['best-practices']?.score || 0) * 100);

    const lcpMs = parseNumericValue(audits['largest-contentful-paint']);
    const fcpMs = parseNumericValue(audits['first-contentful-paint']);
    const clsValue = audits['cumulative-layout-shift']?.numericValue ?? 0;
    const tbtMs = parseNumericValue(audits['total-blocking-time']);
    const siMs = parseNumericValue(audits['speed-index']);
    const ttfbMs = parseNumericValue(audits['server-response-time']);
    const ttiMs = parseNumericValue(audits['interactive']);

    const timings = lh.timing || {};
    const navigationTiming = {
      dns: 0, connection: 0, tls: 0, request: 0, response: 0,
      dom: timings.domContentLoaded || 0,
      firstPaint: fcpMs,
      fcp: fcpMs,
      lcp: lcpMs,
      load: timings.total || 0,
      domContentLoaded: timings.domContentLoaded || 0,
      domInteractive: timings.domInteractive || 0,
    };

    const networkRequests = audits['network-requests']?.details?.items || [];
    const resources = networkRequests.map((item: any) => ({
      url: item.url || '',
      name: (item.url || '').split('/').pop() || '',
      type: (item.resourceType || 'other').toLowerCase() as any,
      size: item.transferSize || 0,
      transferSize: item.transferSize || 0,
      duration: item.duration || 0,
      status: item.statusCode || 200,
      priority: item.priority || 'medium',
      startTime: item.networkRequestTime || 0,
      domain: (() => { try { return new URL(item.url || '').hostname; } catch { return ''; } })(),
    }));

    const totalTransfer = resources.reduce((sum: number, r: any) => sum + (r.transferSize || 0), 0);
    const totalRequests = resources.length;

    const thirdPartyRequests = audits['third-party-summary']?.details?.items || [];
    const thirdParties = thirdPartyRequests.map((item: any) => ({
      domain: item.entity || '',
      requests: item.requestCount || 0,
      transferSize: item.transferSize || 0,
      mainThreadTime: item.blockingTime || 0,
      category: 'other' as const,
    }));

    const opportunities = (audits['render-blocking-resources']?.details?.items || []).map((item: any) => ({
      id: 'render-blocking-resources',
      title: audits['render-blocking-resources']?.title || 'Render blocking resources',
      description: audits['render-blocking-resources']?.description || '',
      savings: item.wastedMs || 0,
      savingsUnit: 'ms',
      severity: 'high' as const,
      affectedResources: [item.url || ''],
      explanation: '',
      suggestedFix: '',
    }));

    const diagnosticItems = [
      { id: 'total-byte-weight', title: 'Total page weight', value: totalTransfer, unit: 'bytes', status: totalTransfer < 1500000 ? 'good' : totalTransfer < 3000000 ? 'warning' : 'poor' as const },
      { id: 'dom-size', title: 'DOM size', value: audits['dom-size']?.numericValue || 0, unit: 'elements', status: (audits['dom-size']?.score || 1) >= 0.9 ? 'good' : (audits['dom-size']?.score || 0) >= 0.5 ? 'warning' : 'poor' as const },
      { id: 'network-requests', title: 'Network requests', value: totalRequests, unit: 'requests', status: totalRequests < 40 ? 'good' : totalRequests < 65 ? 'warning' : 'poor' as const },
    ];

    const jsAnalysis = {
      totalSize: resources.filter((r: any) => r.type === 'script').reduce((s: number, r: any) => s + r.size, 0),
      totalTransferSize: resources.filter((r: any) => r.type === 'script').reduce((s: number, r: any) => s + r.transferSize, 0),
      scriptCount: resources.filter((r: any) => r.type === 'script').length,
      blockingScripts: audits['render-blocking-resources']?.details?.items?.filter((i: any) => i.url?.endsWith('.js')).length || 0,
      asyncScripts: 0,
      deferredScripts: 0,
      longTasks: audits['long-tasks']?.details?.items?.length || 0,
      thirdPartyScripts: thirdParties.length,
      executionTime: tbtMs,
      mainThreadTime: tbtMs,
    };

    const imageItems = resources.filter((r: any) => r.type === 'image');
    const imageAnalysis = {
      oversized: (audits['uses-optimized-images']?.details?.items || []).map((i: any) => ({ url: i.url || '', size: i.totalBytes || 0, recommended: i.wastedBytes ? i.totalBytes - i.wastedBytes : 0 })),
      missingDimensions: [],
      unsupportedFormat: [],
      lazyLoadOpportunities: (audits['offscreen-images']?.details?.items || []).map((i: any) => i.url || ''),
      responsiveOpportunities: [],
      recommendations: ['Use modern image formats (WebP, AVIF)', 'Set explicit width and height', 'Implement lazy loading for below-the-fold images'],
    };

    const cachingItems = audits['uses-long-cache-ttl']?.details?.items || [];
    const cachingAnalysis = {
      resourcesWithCaching: totalRequests - cachingItems.length,
      resourcesWithoutCaching: cachingItems.length,
      totalCacheableSize: cachingItems.reduce((s: number, i: any) => s + (i.totalBytes || 0), 0),
      recommendations: cachingItems.slice(0, 3).map((i: any) => ({ resource: i.url || '', issue: 'No cache-control header', recommendation: 'Set max-age to at least 1 week' })),
    };

    const compressionItems = audits['uses-text-compression']?.details?.items || [];
    const compressionAnalysis = {
      compressedSize: totalTransfer - compressionItems.reduce((s: number, i: any) => s + (i.wastedBytes || 0), 0),
      uncompressedSize: totalTransfer,
      potentialSavings: compressionItems.reduce((s: number, i: any) => s + (i.wastedBytes || 0), 0),
      resourcesCompressed: totalRequests - compressionItems.length,
      resourcesUncompressed: compressionItems.length,
      formats: ['gzip', 'br'],
    };

    const hostname = getHostname(url);
    const result: BenchmarkResult = {
      id: generateId(),
      url,
      hostname,
      timestamp: new Date().toISOString(),
      device: device as DeviceType,
      connection: 'fast',
      duration: Math.round(timings.total || 0),
      scores: { performance: perfScore, accessibility: a11yScore, seo: seoScore, bestPractices: bpScore },
      coreWebVitals: {
        lcp: { value: Math.round(lcpMs), rating: getRating(lcpMs, 2500, 4000), unit: 'ms', threshold: { good: 2500, poor: 4000 }, description: 'Largest Contentful Paint', suggestion: 'Optimize the largest element load time.' },
        inp: { value: Math.round(tbtMs), rating: getRating(tbtMs, 200, 500), unit: 'ms', threshold: { good: 200, poor: 500 }, description: 'Interaction to Next Paint', suggestion: 'Reduce main thread blocking time.' },
        cls: { value: Math.round(clsValue * 1000) / 1000, rating: getRating(clsValue, 0.1, 0.25), unit: '', threshold: { good: 0.1, poor: 0.25 }, description: 'Cumulative Layout Shift', suggestion: 'Set explicit dimensions for elements.' },
      },
      supportingMetrics: {
        fcp: { value: Math.round(fcpMs), rating: getRating(fcpMs, 1800, 3000), unit: 'ms', threshold: { good: 1800, poor: 3000 }, description: 'First Contentful Paint', suggestion: 'Reduce render-blocking resources.' },
        ttfb: { value: Math.round(ttfbMs), rating: getRating(ttfbMs, 200, 600), unit: 'ms', threshold: { good: 200, poor: 600 }, description: 'Time to First Byte', suggestion: 'Improve server response time.' },
        speedIndex: { value: Math.round(siMs), rating: getRating(siMs, 2000, 4000), unit: 'ms', threshold: { good: 2000, poor: 4000 }, description: 'Speed Index', suggestion: 'Optimize above-the-fold content.' },
        totalBlockingTime: { value: Math.round(tbtMs), rating: getRating(tbtMs, 200, 600), unit: 'ms', threshold: { good: 200, poor: 600 }, description: 'Total Blocking Time', suggestion: 'Break up long tasks.' },
      },
      navigationTiming,
      resources: resources.slice(0, 50),
      resourceBreakdown: {
        totalSize: totalTransfer, totalTransferSize: totalTransfer, totalRequests,
        javascript: { size: jsAnalysis.totalSize, transferSize: jsAnalysis.totalTransferSize, requests: jsAnalysis.scriptCount, blocking: jsAnalysis.blockingScripts, async: 0, deferred: 0 },
        css: { size: resources.filter((r: any) => r.type === 'stylesheet').reduce((s: number, r: any) => s + r.size, 0), transferSize: resources.filter((r: any) => r.type === 'stylesheet').reduce((s: number, r: any) => s + r.transferSize, 0), requests: resources.filter((r: any) => r.type === 'stylesheet').length },
        images: { size: imageItems.reduce((s: number, r: any) => s + r.size, 0), transferSize: imageItems.reduce((s: number, r: any) => s + r.transferSize, 0), requests: imageItems.length, oversized: imageAnalysis.oversized.length, missingDimensions: 0, unsupportedFormat: 0 },
        fonts: { size: resources.filter((r: any) => r.type === 'font').reduce((s: number, r: any) => s + r.size, 0), transferSize: resources.filter((r: any) => r.type === 'font').reduce((s: number, r: any) => s + r.transferSize, 0), requests: resources.filter((r: any) => r.type === 'font').length },
        html: { size: resources.filter((r: any) => r.type === 'document').reduce((s: number, r: any) => s + r.size, 0), transferSize: resources.filter((r: any) => r.type === 'document').reduce((s: number, r: any) => s + r.transferSize, 0), requests: resources.filter((r: any) => r.type === 'document').length },
        xhrFetch: { size: resources.filter((r: any) => r.type === 'fetch' || r.type === 'xhr').reduce((s: number, r: any) => s + r.size, 0), transferSize: resources.filter((r: any) => r.type === 'fetch' || r.type === 'xhr').reduce((s: number, r: any) => s + r.transferSize, 0), requests: resources.filter((r: any) => r.type === 'fetch' || r.type === 'xhr').length },
        other: { size: resources.filter((r: any) => !['script', 'stylesheet', 'image', 'font', 'document', 'fetch', 'xhr'].includes(r.type)).reduce((s: number, r: any) => s + r.size, 0), transferSize: resources.filter((r: any) => !['script', 'stylesheet', 'image', 'font', 'document', 'fetch', 'xhr'].includes(r.type)).reduce((s: number, r: any) => s + r.transferSize, 0), requests: resources.filter((r: any) => !['script', 'stylesheet', 'image', 'font', 'document', 'fetch', 'xhr'].includes(r.type)).length },
      },
      thirdParties,
      accessibility: mapAudits(audits, 'a11y'),
      seo: mapAudits(audits, 'seo'),
      bestPractices: mapAudits(audits, 'best-practices'),
      opportunities,
      diagnostics: diagnosticItems,
      javascriptAnalysis: jsAnalysis,
      imageAnalysis,
      cachingAnalysis,
      compressionAnalysis,
      securityAnalysis: { https: url.startsWith('https://'), mixedContent: false, consoleErrors: [], failedRequests: [], deprecatedAPIs: [], checks: [] },
      waterfall: resources.slice(0, 20).map((r: any) => ({ url: r.url, name: r.name, type: r.type, domain: r.domain, startTime: r.startTime, duration: r.duration, transferSize: r.transferSize, size: r.size, status: r.status })),
    };

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[PSI] Error:', err.message);

    if (err.message?.includes('fetch failed') || err.message?.includes('ECONNREFUSED')) {
      return res.status(502).json({ error: 'Could not reach Google PageSpeed Insights API. Check your network connection.' });
    }

    return res.status(500).json({
      error: 'Failed to run PageSpeed analysis.',
      message: err.message || 'Unknown error',
    });
  }
}
