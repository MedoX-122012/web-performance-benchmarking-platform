type DeviceType = 'desktop' | 'mobile';
type ConnectionProfile = 'fast' | '4g' | '3g' | 'slow';

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function generateDemoResult(url: string, device: DeviceType, connection: ConnectionProfile): any {
  const seed = hashString(`${url}:${device}:${connection}`);
  const rand = seededRandom(seed);

  const deviceMultiplier = device === 'mobile' ? 0.65 : 1;
  const connectionMultipliers: Record<ConnectionProfile, number> = {
    fast: 1,
    '4g': 0.75,
    '3g': 0.45,
    slow: 0.3,
  };
  const connMult = connectionMultipliers[connection];
  const effectiveMult = deviceMultiplier * connMult;

  const hostname = getHostname(url);

  const perfScore = Math.round(55 + rand() * 40);
  const a11yScore = Math.round(65 + rand() * 35);
  const seoScore = Math.round(60 + rand() * 40);
  const bpScore = Math.round(65 + rand() * 35);

  const fcpMs = (0.4 + rand() * 3.5) * (1 / effectiveMult);
  const lcpMs = (0.6 + rand() * 4.5) * (1 / effectiveMult);
  const cls = Math.round(rand() * 35) / 100;
  const tbtMs = (40 + rand() * 450) * (1 / effectiveMult);
  const siMs = (fcpMs + rand() * 2.5) * (1 / effectiveMult);
  const ttfbMs = (50 + rand() * 600) * (1 / effectiveMult);

  const totalTransfer = Math.round(300000 + rand() * 3500000);
  const domSize = 400 + Math.round(rand() * 2200);

  const THIRD_PARTY_DOMAINS: Array<{ domain: string; category: string }> = [
    { domain: 'www.google-analytics.com', category: 'analytics' },
    { domain: 'www.googletagmanager.com', category: 'analytics' },
    { domain: 'fonts.googleapis.com', category: 'fonts' },
    { domain: 'fonts.gstatic.com', category: 'fonts' },
    { domain: 'cdn.jsdelivr.net', category: 'cdn' },
    { domain: 'unpkg.com', category: 'cdn' },
    { domain: 'ajax.cloudflare.com', category: 'cdn' },
    { domain: 'platform.twitter.com', category: 'social' },
    { domain: 'connect.facebook.net', category: 'social' },
    { domain: 'www.googletagservices.com', category: 'advertising' },
  ];

  const RESOURCE_TEMPLATES: Array<{ pattern: string; type: string }> = [
    { pattern: '/static/js/main.{hash}.js', type: 'script' },
    { pattern: '/static/js/vendor.{hash}.js', type: 'script' },
    { pattern: '/static/js/runtime.{hash}.js', type: 'script' },
    { pattern: '/static/css/main.{hash}.css', type: 'stylesheet' },
    { pattern: '/static/css/vendor.{hash}.css', type: 'stylesheet' },
    { pattern: '/static/images/hero.{hash}.webp', type: 'image' },
    { pattern: '/static/images/logo.{hash}.svg', type: 'image' },
    { pattern: '/static/images/banner.{hash}.jpg', type: 'image' },
    { pattern: '/static/fonts/inter.{hash}.woff2', type: 'font' },
    { pattern: '/static/fonts/roboto.{hash}.woff2', type: 'font' },
    { pattern: '/api/data', type: 'fetch' },
    { pattern: '/api/user', type: 'fetch' },
    { pattern: '/favicon.ico', type: 'image' },
    { pattern: '/manifest.json', type: 'other' },
    { pattern: '/robots.txt', type: 'other' },
  ];

  const resources: any[] = [];
  const thirdPartyCount = 4 + Math.round(rand() * 6);
  const selectedThirdParties = THIRD_PARTY_DOMAINS.slice(0, thirdPartyCount);

  let timeOffset = 0;
  RESOURCE_TEMPLATES.forEach((tpl) => {
    const hash = Math.round(rand() * 999999).toString(16).padStart(6, '0');
    const resUrl = `${hostname}${tpl.pattern.replace('{hash}', hash)}`;
    const duration = (15 + rand() * 400) * (1 / effectiveMult);
    const size = Math.round(800 + rand() * 400000);
    const transferSize = Math.round(size * (0.6 + rand() * 0.35));
    const startTime = timeOffset;

    resources.push({
      url: resUrl,
      name: tpl.pattern.split('/').pop() || tpl.pattern,
      type: tpl.type,
      size,
      transferSize,
      duration,
      status: 200,
      priority: tpl.type === 'script' ? 'high' : 'medium',
      startTime,
      domain: hostname,
    });

    timeOffset += duration * 0.3;
  });

  selectedThirdParties.forEach((tp) => {
    const duration = (30 + rand() * 700) * (1 / effectiveMult);
    const transferSize = Math.round(3000 + rand() * 180000);
    const size = Math.round(transferSize * (1 + rand() * 0.5));

    resources.push({
      url: `https://${tp.domain}/script.js`,
      name: 'script.js',
      type: 'script',
      size,
      transferSize,
      duration,
      status: 200,
      priority: 'low',
      startTime: timeOffset * rand(),
      domain: tp.domain,
    });
  });

  const waterfall = resources.slice(0, 15).map((r) => ({
    url: r.url,
    name: r.name,
    type: r.type,
    domain: r.domain,
    startTime: r.startTime,
    duration: r.duration,
    transferSize: r.transferSize,
    size: r.size,
    status: r.status,
  }));

  const thirdParties = selectedThirdParties.map((tp) => ({
    domain: tp.domain,
    requests: 1 + Math.round(rand() * 5),
    transferSize: Math.round(5000 + rand() * 200000),
    mainThreadTime: Math.round(10 + rand() * 200),
    category: tp.category,
  }));

  const jsBlocking = Math.round(rand() * 3);
  const jsAsync = 2 + Math.round(rand() * 4);
  const jsDeferred = Math.round(rand() * 3);
  const jsTotal = jsBlocking + jsAsync + jsDeferred;

  const makeVital = (value: number, goodThreshold: number, poorThreshold: number, unit: string, description: string, suggestion: string) => {
    let rating: string;
    if (unit === 'ms') {
      rating = value <= goodThreshold ? 'good' : value <= poorThreshold ? 'needs-improvement' : 'poor';
    } else {
      rating = value <= goodThreshold ? 'good' : value <= poorThreshold ? 'needs-improvement' : 'poor';
    }
    return {
      value: Math.round(value * 1000) / 1000,
      rating,
      unit,
      threshold: { good: goodThreshold, poor: poorThreshold },
      description,
      suggestion,
    };
  };

  return {
    id: generateId(),
    url,
    hostname,
    timestamp: new Date().toISOString(),
    device,
    connection,
    duration: Math.round(fcpMs + rand() * 2000),
    scores: { performance: perfScore, accessibility: a11yScore, seo: seoScore, bestPractices: bpScore },
    coreWebVitals: {
      lcp: makeVital(lcpMs, 2500, 4000, 'ms', 'Largest Contentful Paint', 'Optimize largest element load time'),
      inp: makeVital(tbtMs, 200, 500, 'ms', 'Interaction to Next Paint', 'Reduce main thread blocking time'),
      cls: makeVital(cls, 0.1, 0.25, '', 'Cumulative Layout Shift', 'Set explicit dimensions for elements'),
    },
    supportingMetrics: {
      fcp: makeVital(fcpMs, 1800, 3000, 'ms', 'First Contentful Paint', 'Reduce render-blocking resources'),
      ttfb: makeVital(ttfbMs, 200, 600, 'ms', 'Time to First Byte', 'Improve server response time'),
      speedIndex: makeVital(siMs, 2000, 4000, 'ms', 'Speed Index', 'Optimize above-the-fold content'),
      totalBlockingTime: makeVital(tbtMs, 200, 600, 'ms', 'Total Blocking Time', 'Break up long tasks and reduce main thread work'),
    },
    navigationTiming: {
      dns: Math.round(10 + rand() * 80),
      connection: Math.round(5 + rand() * 40),
      tls: Math.round(20 + rand() * 100),
      request: Math.round(10 + rand() * 150),
      response: Math.round(50 + rand() * 300),
      dom: Math.round(200 + rand() * 800),
      firstPaint: Math.round(fcpMs * 0.9),
      fcp: Math.round(fcpMs),
      lcp: Math.round(lcpMs),
      load: Math.round((fcpMs + rand() * 3000) * (1 / effectiveMult)),
      domContentLoaded: Math.round((fcpMs * 0.8 + rand() * 1000) * (1 / effectiveMult)),
      domInteractive: Math.round((fcpMs * 0.6 + rand() * 600) * (1 / effectiveMult)),
    },
    resources,
    resourceBreakdown: {
      totalSize: totalTransfer,
      totalTransferSize: totalTransfer,
      totalRequests: resources.length,
      javascript: {
        size: Math.round(totalTransfer * 0.35),
        transferSize: Math.round(totalTransfer * 0.3),
        requests: jsTotal,
        blocking: jsBlocking,
        async: jsAsync,
        deferred: jsDeferred,
      },
      css: {
        size: Math.round(totalTransfer * 0.12),
        transferSize: Math.round(totalTransfer * 0.1),
        requests: 2 + Math.round(rand() * 3),
      },
      images: {
        size: Math.round(totalTransfer * 0.3),
        transferSize: Math.round(totalTransfer * 0.28),
        requests: 3 + Math.round(rand() * 5),
        oversized: Math.round(rand() * 3),
        missingDimensions: Math.round(rand() * 2),
        unsupportedFormat: Math.round(rand() * 2),
      },
      fonts: {
        size: Math.round(totalTransfer * 0.08),
        transferSize: Math.round(totalTransfer * 0.07),
        requests: 1 + Math.round(rand() * 3),
      },
      html: {
        size: Math.round(20000 + rand() * 80000),
        transferSize: Math.round(15000 + rand() * 60000),
        requests: 1,
      },
      xhrFetch: {
        size: Math.round(totalTransfer * 0.08),
        transferSize: Math.round(totalTransfer * 0.07),
        requests: 2 + Math.round(rand() * 4),
      },
      other: {
        size: Math.round(totalTransfer * 0.05),
        transferSize: Math.round(totalTransfer * 0.04),
        requests: 2 + Math.round(rand() * 3),
      },
    },
    thirdParties,
    accessibility: [
      { id: 'image-alt', title: 'Image elements have `[alt]` attributes', description: 'Informative elements should aim for short, descriptive alternate text.', impact: 'critical', status: rand() > 0.2 ? 'passed' : 'failed' },
      { id: 'label', title: 'Form elements have associated labels', description: 'Labels ensure that form controls are announced properly by assistive technologies.', impact: 'serious', status: rand() > 0.3 ? 'passed' : 'failed' },
      { id: 'link-name', title: 'Links have a discernible name', description: 'Link text should be discernible by screen readers.', impact: 'serious', status: rand() > 0.15 ? 'passed' : 'failed' },
      { id: 'button-name', title: 'Buttons have an accessible name', description: 'Buttons need accessible names for screen readers.', impact: 'serious', status: rand() > 0.2 ? 'passed' : 'failed' },
      { id: 'heading-order', title: 'Heading levels are increasing', description: 'Headings should be in sequentially-descending order.', impact: 'moderate', status: rand() > 0.4 ? 'passed' : 'warning' },
      { id: 'color-contrast', title: 'Sufficient color contrast ratio', description: 'Low-contrast text is difficult to read.', impact: 'serious', status: rand() > 0.35 ? 'passed' : 'failed' },
      { id: 'html-has-lang', title: '`<html>` element has a `[lang]` attribute', description: 'Without lang, screen readers assume default language.', impact: 'serious', status: rand() > 0.15 ? 'passed' : 'failed' },
      { id: 'meta-viewport', title: 'No user-scalable=no in viewport meta', description: 'Disabling zoom is problematic for low-vision users.', impact: 'critical', status: rand() > 0.3 ? 'passed' : 'failed' },
    ],
    seo: [
      { id: 'document-title', title: 'Document has a `<title>` element', description: 'The title gives screen reader users an overview of the page.', status: rand() > 0.1 ? 'passed' : 'failed' },
      { id: 'meta-description', title: 'Document has a meta description', description: 'Meta descriptions summarize page content in search results.', status: rand() > 0.25 ? 'passed' : 'failed' },
      { id: 'http-status-code', title: 'Document has a valid HTTP status code', description: 'Ensure correct HTTP status codes for all URLs.', status: rand() > 0.05 ? 'passed' : 'failed' },
      { id: 'is-crawlable', title: 'Page is not blocked from indexing', description: 'Search engines cannot index blocked pages.', status: rand() > 0.15 ? 'passed' : 'failed' },
      { id: 'canonical', title: 'Document has a valid canonical URL', description: 'Canonical URLs tell search engines which version to index.', status: rand() > 0.3 ? 'passed' : 'warning' },
      { id: 'robots-txt', title: 'robots.txt is valid', description: 'Invalid robots.txt may prevent crawling.', status: rand() > 0.1 ? 'passed' : 'failed' },
    ],
    bestPractices: [
      { id: 'is-on-https', title: 'Uses HTTPS', description: 'All sites should be protected with HTTPS.', severity: 'error', status: rand() > 0.15 ? 'passed' : 'failed' },
      { id: 'errors-in-console', title: 'No browser errors in the console', description: 'Error messages indicate page issues.', severity: 'error', status: rand() > 0.35 ? 'passed' : 'failed' },
      { id: 'deprecations', title: 'No deprecated APIs used', description: 'Deprecated APIs will be removed from the browser.', severity: 'warning', status: rand() > 0.3 ? 'passed' : 'warning' },
      { id: 'image-aspect-ratio', title: 'Displays images with correct aspect ratio', description: 'Correct dimensions preserve layout.', severity: 'warning', status: rand() > 0.25 ? 'passed' : 'warning' },
      { id: 'csp-xss', title: 'Uses CSP to prevent XSS', description: 'A strong CSP reduces XSS severity.', severity: 'error', status: rand() > 0.5 ? 'passed' : 'failed' },
    ],
    opportunities: [
      { id: 'render-blocking-resources', title: 'Eliminate render-blocking resources', description: 'Resources are blocking the first paint.', savings: Math.round(100 + rand() * 500), savingsUnit: 'ms', severity: 'high', affectedResources: resources.filter((r) => r.type === 'stylesheet').map((r) => r.url), explanation: 'CSS and scripts block rendering.', suggestedFix: 'Defer non-critical CSS and async scripts.' },
      { id: 'unused-javascript', title: 'Reduce unused JavaScript', description: 'Unused JS adds unnecessary bytes.', savings: Math.round(50000 + rand() * 200000), savingsUnit: 'bytes', severity: 'high', affectedResources: resources.filter((r) => r.type === 'script').slice(0, 2).map((r) => r.url), explanation: 'Large bundles contain unused code.', suggestedFix: 'Tree-shake and code-split bundles.' },
      { id: 'unused-css-rules', title: 'Reduce unused CSS', description: 'Unused rules consume bandwidth.', savings: Math.round(10000 + rand() * 50000), savingsUnit: 'bytes', severity: 'medium', affectedResources: resources.filter((r) => r.type === 'stylesheet').map((r) => r.url), explanation: 'Stylesheets contain selectors not used on this page.', suggestedFix: 'Use critical CSS and defer non-critical styles.' },
      { id: 'modern-image-formats', title: 'Use modern image formats', description: 'WebP/AVIF provide better compression.', savings: Math.round(20000 + rand() * 100000), savingsUnit: 'bytes', severity: 'medium', affectedResources: resources.filter((r) => r.type === 'image').map((r) => r.url), explanation: 'JPEG/PNG are less efficient than modern formats.', suggestedFix: 'Serve images as WebP or AVIF.' },
      { id: 'offscreen-images', title: 'Defer offscreen images', description: 'Lazy-load offscreen images.', savings: Math.round(5000 + rand() * 30000), savingsUnit: 'bytes', severity: 'low', affectedResources: resources.filter((r) => r.type === 'image').slice(2).map((r) => r.url), explanation: 'Below-the-fold images delay initial render.', suggestedFix: 'Use loading="lazy" or Intersection Observer.' },
    ],
    diagnostics: [
      { id: 'total-byte-weight', title: 'Total page weight', description: 'Overall transfer size of all resources.', status: totalTransfer < 2000000 ? 'good' : totalTransfer < 4000000 ? 'warning' : 'poor', value: totalTransfer, unit: 'bytes' },
      { id: 'dom-size', title: 'DOM size', description: 'Number of DOM elements.', status: domSize < 1500 ? 'good' : domSize < 3000 ? 'warning' : 'poor', value: domSize, unit: 'elements' },
      { id: 'mainthread-work', title: 'Main thread work', description: 'Time spent on the main thread.', status: tbtMs < 2000 ? 'good' : tbtMs < 5000 ? 'warning' : 'poor', value: Math.round(tbtMs), unit: 'ms' },
      { id: 'network-requests', title: 'Network requests', description: 'Total number of network requests.', status: resources.length < 40 ? 'good' : resources.length < 80 ? 'warning' : 'poor', value: resources.length, unit: 'requests' },
      { id: 'third-party-summary', title: 'Third-party impact', description: 'Impact of third-party code.', status: thirdPartyCount < 6 ? 'good' : thirdPartyCount < 9 ? 'warning' : 'poor', value: thirdPartyCount, unit: 'domains' },
    ],
    javascriptAnalysis: {
      totalSize: Math.round(totalTransfer * 0.35),
      totalTransferSize: Math.round(totalTransfer * 0.3),
      scriptCount: jsTotal,
      blockingScripts: jsBlocking,
      asyncScripts: jsAsync,
      deferredScripts: jsDeferred,
      longTasks: Math.round(rand() * 10),
      thirdPartyScripts: Math.round(rand() * 5),
      executionTime: Math.round(tbtMs * 0.6),
      mainThreadTime: Math.round(tbtMs * 0.8),
    },
    imageAnalysis: {
      oversized: resources.filter((r) => r.type === 'image').slice(0, 2).map((r) => ({ url: r.url, size: r.size, recommended: Math.round(r.size * 0.4) })),
      missingDimensions: resources.filter((r) => r.type === 'image').slice(0, 1).map((r) => r.url),
      unsupportedFormat: [],
      lazyLoadOpportunities: resources.filter((r) => r.type === 'image').slice(2).map((r) => r.url),
      responsiveOpportunities: [],
      recommendations: ['Use WebP format', 'Add width and height attributes', 'Implement lazy loading for below-the-fold images'],
    },
    cachingAnalysis: {
      resourcesWithCaching: Math.round(resources.length * 0.6),
      resourcesWithoutCaching: Math.round(resources.length * 0.4),
      totalCacheableSize: Math.round(totalTransfer * 0.5),
      recommendations: resources.filter((r) => r.type === 'script').slice(0, 2).map((r) => ({ resource: r.url, issue: 'No cache-control header', recommendation: 'Set max-age to at least 1 week' })),
    },
    compressionAnalysis: {
      compressedSize: Math.round(totalTransfer * 0.7),
      uncompressedSize: totalTransfer,
      potentialSavings: Math.round(totalTransfer * 0.3),
      resourcesCompressed: Math.round(resources.length * 0.7),
      resourcesUncompressed: Math.round(resources.length * 0.3),
      formats: ['gzip', 'br'],
    },
    securityAnalysis: {
      https: url.startsWith('https://'),
      mixedContent: false,
      consoleErrors: [],
      failedRequests: [],
      deprecatedAPIs: [],
      checks: [],
    },
    waterfall,
    isDemoData: true,
  };
}
