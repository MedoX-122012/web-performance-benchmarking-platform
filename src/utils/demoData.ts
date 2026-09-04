import type {
  BenchmarkResult,
  DeviceType,
  ConnectionProfile,
  WebVitalMetric,
  CoreWebVitals,
  SupportingMetrics,
  NavigationTiming,
  NetworkResource,
  ResourceBreakdown,
  ThirdPartyDomain,
  AccessibilityAudit,
  SEOAudit,
  BestPracticeAudit,
  Opportunity,
  Diagnostic,
  WaterfallEntry,
} from '@types/index';

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

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function range(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}

function intRange(rand: () => number, min: number, max: number): number {
  return Math.round(range(rand, min, max));
}

function makeVital(
  value: number,
  goodThreshold: number,
  poorThreshold: number,
  unit: string,
  description: string,
  suggestion: string,
): WebVitalMetric {
  let rating: WebVitalMetric['rating'];
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

const THIRD_PARTY_DOMAINS: Array<{ domain: string; category: ThirdPartyDomain['category'] }> = [
  { domain: 'www.googletagmanager.com', category: 'analytics' },
  { domain: 'www.google-analytics.com', category: 'analytics' },
  { domain: 'analytics.google.com', category: 'analytics' },
  { domain: 'fonts.googleapis.com', category: 'fonts' },
  { domain: 'fonts.gstatic.com', category: 'fonts' },
  { domain: 'cdn.jsdelivr.net', category: 'cdn' },
  { domain: 'cdnjs.cloudflare.com', category: 'cdn' },
  { domain: 'unpkg.com', category: 'cdn' },
  { domain: 'platform.twitter.com', category: 'social' },
  { domain: 'connect.facebook.net', category: 'social' },
  { domain: 'www.googletagservices.com', category: 'advertising' },
  { domain: 'adservice.google.com', category: 'advertising' },
  { domain: 'pagead2.googlesyndication.com', category: 'advertising' },
  { domain: 'securepubads.g.doubleclick.net', category: 'advertising' },
];

export function generateDemoResult(
  url: string,
  device: DeviceType,
  connection: ConnectionProfile,
): BenchmarkResult {
  const seed = hashString(`${url}:${device}:${connection}`);
  const rand = seededRandom(seed);

  const hostname = getHostname(url);

  const deviceMult = device === 'mobile' ? 0.6 : 1;
  const connMult: Record<ConnectionProfile, number> = { fast: 1, '4g': 0.8, '3g': 0.5, slow: 0.35 };
  const speed = deviceMult * connMult[connection];

  const perfScore = intRange(rand, 58, 98);
  const a11yScore = intRange(rand, 62, 99);
  const seoScore = intRange(rand, 68, 100);
  const bpScore = intRange(rand, 60, 99);

  const fcpMs = range(rand, 800, 3200) / speed;
  const lcpMs = range(rand, 1200, 4500) / speed;
  const cls = Math.round(range(rand, 0, 0.32) * 100) / 100;
  const tbtMs = range(rand, 80, 800) / speed;
  const siMs = range(rand, 1500, 5000) / speed;
  const ttfbMs = range(rand, 80, 650) / speed;

  const jsSize = intRange(rand, 180000, 650000);
  const cssSize = intRange(rand, 25000, 120000);
  const imgSize = intRange(rand, 200000, 1800000);
  const fontSize = intRange(rand, 30000, 120000);
  const htmlSize = intRange(rand, 12000, 65000);
  const fetchSize = intRange(rand, 10000, 80000);
  const otherSize = intRange(rand, 5000, 30000);
  const totalTransfer = jsSize + cssSize + imgSize + fontSize + htmlSize + fetchSize + otherSize;

  const jsBlockingCount = intRange(rand, 1, 4);
  const jsAsyncCount = intRange(rand, 2, 6);
  const jsDeferredCount = intRange(rand, 1, 4);
  const jsTotalCount = jsBlockingCount + jsAsyncCount + jsDeferredCount;

  const cssCount = intRange(rand, 2, 5);
  const imgCount = intRange(rand, 3, 12);
  const fontCount = intRange(rand, 1, 4);
  const fetchCount = intRange(rand, 2, 6);
  const otherCount = intRange(rand, 1, 4);
  const totalRequests = jsTotalCount + cssCount + imgCount + fontCount + 1 + fetchCount + otherCount;

  const jsBlocking: string[] = [];
  const jsAsync: string[] = [];
  const jsDeferred: string[] = [];
  const cssFiles: string[] = [];
  const imgFiles: string[] = [];
  const fontFiles: string[] = [];

  const hash = () => Math.round(rand() * 999999).toString(16).padStart(6, '0');

  const resources: NetworkResource[] = [];
  let timeOffset = 0;

  for (let i = 0; i < jsBlockingCount; i++) {
    const h = hash();
    const url_ = `https://${hostname}/static/js/main.${h}.js`;
    const size = intRange(rand, 40000, 180000);
    const duration = range(rand, 80, 600) / speed;
    jsBlocking.push(url_);
    resources.push({ url: url_, name: `main.${h}.js`, type: 'script', size, transferSize: Math.round(size * 0.7), duration, status: 200, priority: 'high', startTime: timeOffset, domain: hostname });
    timeOffset += duration * 0.4;
  }

  for (let i = 0; i < jsAsyncCount; i++) {
    const h = hash();
    const url_ = `https://${hostname}/static/js/chunk-${h}.js`;
    const size = intRange(rand, 15000, 90000);
    const duration = range(rand, 50, 400) / speed;
    jsAsync.push(url_);
    resources.push({ url: url_, name: `chunk-${h}.js`, type: 'script', size, transferSize: Math.round(size * 0.68), duration, status: 200, priority: 'low', startTime: timeOffset * rand(), domain: hostname });
  }

  for (let i = 0; i < jsDeferredCount; i++) {
    const h = hash();
    const url_ = `https://${hostname}/static/js/deferred-${h}.js`;
    const size = intRange(rand, 10000, 60000);
    const duration = range(rand, 40, 300) / speed;
    jsDeferred.push(url_);
    resources.push({ url: url_, name: `deferred-${h}.js`, type: 'script', size, transferSize: Math.round(size * 0.65), duration, status: 200, priority: 'low', startTime: timeOffset * rand() + 200, domain: hostname });
  }

  for (let i = 0; i < cssCount; i++) {
    const h = hash();
    const url_ = i === 0 ? `https://${hostname}/static/css/main.${h}.css` : `https://${hostname}/static/css/chunk-${h}.css`;
    const size = intRange(rand, 12000, 55000);
    const duration = range(rand, 30, 200) / speed;
    cssFiles.push(url_);
    resources.push({ url: url_, name: url_.split('/').pop() || '', type: 'stylesheet', size, transferSize: Math.round(size * 0.72), duration, status: 200, priority: i === 0 ? 'high' : 'medium', startTime: timeOffset, domain: hostname });
    timeOffset += duration * 0.5;
  }

  const imageNames = ['hero-banner.webp', 'product-showcase.jpg', 'team-photo.webp', 'logo.svg', 'icon-sprite.png', 'background-pattern.webp', 'og-image.jpg', 'feature-1.webp', 'feature-2.webp', 'feature-3.webp', 'thumbnail.webp', 'avatar.webp'];
  for (let i = 0; i < imgCount; i++) {
    const name = pick(imageNames, rand);
    const url_ = `https://${hostname}/images/${name}`;
    const size = intRange(rand, 8000, 350000);
    const duration = range(rand, 40, 500) / speed;
    imgFiles.push(url_);
    resources.push({ url: url_, name, type: 'image', size, transferSize: Math.round(size * 0.75), duration, status: 200, priority: i < 2 ? 'high' : 'low', startTime: i < 2 ? timeOffset : timeOffset + range(rand, 100, 800), domain: hostname });
  }

  const fontNames = ['Inter-Regular.woff2', 'Inter-SemiBold.woff2', 'Inter-Bold.woff2'];
  for (let i = 0; i < fontCount; i++) {
    const name = fontNames[i % fontNames.length];
    const url_ = `https://${hostname}/fonts/${name}`;
    const size = intRange(rand, 15000, 45000);
    const duration = range(rand, 50, 300) / speed;
    fontFiles.push(url_);
    resources.push({ url: url_, name, type: 'font', size, transferSize: Math.round(size * 0.85), duration, status: 200, priority: 'high', startTime: timeOffset + range(rand, 0, 200), domain: hostname });
  }

  resources.push({ url: `https://${hostname}/`, name: 'index.html', type: 'document', size: htmlSize, transferSize: Math.round(htmlSize * 0.8), duration: range(rand, 50, 200) / speed, status: 200, priority: 'high', startTime: 0, domain: hostname });

  for (let i = 0; i < fetchCount; i++) {
    const endpoints = ['/api/config', '/api/user/profile', '/api/products', '/api/analytics', '/api/notifications', '/api/settings'];
    const ep = pick(endpoints, rand);
    const url_ = `https://${hostname}${ep}`;
    const size = intRange(rand, 500, 30000);
    const duration = range(rand, 30, 400) / speed;
    resources.push({ url: url_, name: ep.split('/').pop() || ep, type: 'fetch', size, transferSize: Math.round(size * 0.9), duration, status: 200, priority: 'medium', startTime: timeOffset + range(rand, 0, 500), domain: hostname });
  }

  const thirdPartyCount = intRange(rand, 3, 7);
  const shuffled = [...THIRD_PARTY_DOMAINS].sort(() => rand() - 0.5);
  const selectedThirdParties = shuffled.slice(0, thirdPartyCount);

  selectedThirdParties.forEach((tp) => {
    const name = tp.category === 'analytics' ? 'gtm.js' : tp.category === 'fonts' ? 'css2' : tp.category === 'cdn' ? 'lib.min.js' : tp.category === 'social' ? 'sdk.js' : 'adsbygoogle.js';
    const url_ = `https://${tp.domain}/${name}`;
    const size = intRange(rand, 3000, 120000);
    const duration = range(rand, 40, 600) / speed;
    resources.push({ url: url_, name, type: 'script', size, transferSize: Math.round(size * 0.7), duration, status: 200, priority: 'low', startTime: range(rand, 100, 1500) / speed, domain: tp.domain });
  });

  const sortedResources = [...resources].sort((a, b) => a.startTime - b.startTime);
  const waterfall: WaterfallEntry[] = sortedResources.slice(0, 20).map((r) => ({
    url: r.url, name: r.name, type: r.type, domain: r.domain,
    startTime: r.startTime, duration: r.duration, transferSize: r.transferSize, size: r.size, status: r.status,
  }));

  const thirdParties: ThirdPartyDomain[] = selectedThirdParties.map((tp) => {
    const tpResources = resources.filter((r) => r.domain === tp.domain);
    return {
      domain: tp.domain,
      requests: tpResources.length || 1,
      transferSize: tpResources.reduce((sum, r) => sum + r.transferSize, 0) || intRange(rand, 5000, 80000),
      mainThreadTime: intRange(rand, 15, 250),
      category: tp.category,
    };
  });

  const domSize = intRange(rand, 800, 3500);

  const resourceBreakdown: ResourceBreakdown = {
    totalSize: totalTransfer,
    totalTransferSize: totalTransfer,
    totalRequests,
    javascript: { size: jsSize, transferSize: Math.round(jsSize * 0.7), requests: jsTotalCount, blocking: jsBlockingCount, async: jsAsyncCount, deferred: jsDeferredCount },
    css: { size: cssSize, transferSize: Math.round(cssSize * 0.72), requests: cssCount },
    images: { size: imgSize, transferSize: Math.round(imgSize * 0.75), requests: imgCount, oversized: intRange(rand, 0, 3), missingDimensions: intRange(rand, 0, 2), unsupportedFormat: intRange(rand, 0, 2) },
    fonts: { size: fontSize, transferSize: Math.round(fontSize * 0.85), requests: fontCount },
    html: { size: htmlSize, transferSize: Math.round(htmlSize * 0.8), requests: 1 },
    xhrFetch: { size: fetchSize, transferSize: Math.round(fetchSize * 0.9), requests: fetchCount },
    other: { size: otherSize, transferSize: Math.round(otherSize * 0.85), requests: otherCount },
  };

  const coreWebVitals: CoreWebVitals = {
    lcp: makeVital(lcpMs, 2500, 4000, 'ms', 'Largest Contentful Paint', 'Optimize the largest above-the-fold element load time.'),
    inp: makeVital(tbtMs, 200, 500, 'ms', 'Interaction to Next Paint', 'Reduce main thread blocking to improve input responsiveness.'),
    cls: makeVital(cls, 0.1, 0.25, '', 'Cumulative Layout Shift', 'Set explicit width/height on images and inject dynamic content carefully.'),
  };

  const supportingMetrics: SupportingMetrics = {
    fcp: makeVital(fcpMs, 1800, 3000, 'ms', 'First Contentful Paint', 'Eliminate render-blocking resources in the <head>.'),
    ttfb: makeVital(ttfbMs, 200, 600, 'ms', 'Time to First Byte', 'Improve server response time with caching or a CDN.'),
    speedIndex: makeVital(siMs, 2000, 4000, 'ms', 'Speed Index', 'Optimize above-the-fold content delivery.'),
    totalBlockingTime: makeVital(tbtMs, 200, 600, 'ms', 'Total Blocking Time', 'Break long tasks into smaller async chunks.'),
  };

  const navigationTiming: NavigationTiming = {
    dns: intRange(rand, 5, 60),
    connection: intRange(rand, 3, 30),
    tls: intRange(rand, 10, 80),
    request: intRange(rand, 8, 100),
    response: intRange(rand, 30, 200),
    dom: intRange(rand, 200, 900),
    firstPaint: Math.round(fcpMs * 0.85),
    fcp: Math.round(fcpMs),
    lcp: Math.round(lcpMs),
    load: Math.round((fcpMs + range(rand, 500, 3000)) / speed),
    domContentLoaded: Math.round((fcpMs * 0.75 + range(rand, 200, 800)) / speed),
    domInteractive: Math.round((fcpMs * 0.6 + range(rand, 100, 500)) / speed),
  };

  const accessibilityAudits: AccessibilityAudit[] = [
    { id: 'image-alt', title: 'Image elements have `[alt]` attributes', description: 'Informative elements should aim for short, descriptive alternate text.', impact: 'critical', status: rand() > 0.18 ? 'passed' : 'failed' },
    { id: 'label', title: 'Form elements have associated labels', description: 'Labels ensure that form controls are announced properly by assistive technologies.', impact: 'serious', status: rand() > 0.25 ? 'passed' : 'failed' },
    { id: 'link-name', title: 'Links have a discernible name', description: 'Link text should be discernible by screen readers.', impact: 'serious', status: rand() > 0.12 ? 'passed' : 'failed' },
    { id: 'button-name', title: 'Buttons have an accessible name', description: 'Buttons need accessible names for screen readers.', impact: 'serious', status: rand() > 0.2 ? 'passed' : 'failed' },
    { id: 'heading-order', title: 'Heading levels are increasing', description: 'Headings should be in sequentially-descending order.', impact: 'moderate', status: rand() > 0.35 ? 'passed' : 'warning' },
    { id: 'color-contrast', title: 'Sufficient color contrast ratio', description: 'Low-contrast text is difficult to read for low-vision users.', impact: 'serious', status: rand() > 0.3 ? 'passed' : 'failed' },
    { id: 'html-has-lang', title: '`<html>` element has a `[lang]` attribute', description: 'Without lang, screen readers assume default language.', impact: 'serious', status: rand() > 0.1 ? 'passed' : 'failed' },
    { id: 'meta-viewport', title: 'No user-scalable=no in viewport meta', description: 'Disabling zoom is problematic for low-vision users.', impact: 'critical', status: rand() > 0.25 ? 'passed' : 'failed' },
  ];

  const seoAudits: SEOAudit[] = [
    { id: 'document-title', title: 'Document has a `<title>` element', description: 'The title gives screen reader users an overview of the page.', status: rand() > 0.08 ? 'passed' : 'failed' },
    { id: 'meta-description', title: 'Document has a meta description', description: 'Meta descriptions summarize page content in search results.', status: rand() > 0.2 ? 'passed' : 'failed' },
    { id: 'http-status-code', title: 'Document has a valid HTTP status code', description: 'Ensure correct HTTP status codes for all URLs.', status: rand() > 0.04 ? 'passed' : 'failed' },
    { id: 'is-crawlable', title: 'Page is not blocked from indexing', description: 'Search engines cannot index pages blocked by robots.txt.', status: rand() > 0.12 ? 'passed' : 'failed' },
    { id: 'canonical', title: 'Document has a valid canonical URL', description: 'Canonical URLs tell search engines which version to index.', status: rand() > 0.25 ? 'passed' : 'warning' },
    { id: 'robots-txt', title: 'robots.txt is valid', description: 'Invalid robots.txt may prevent crawling.', status: rand() > 0.08 ? 'passed' : 'failed' },
  ];

  const bestPracticesAudits: BestPracticeAudit[] = [
    { id: 'is-on-https', title: 'Uses HTTPS', description: 'All sites should be protected with HTTPS for security.', severity: 'error', status: url.startsWith('https://') ? 'passed' : 'failed' },
    { id: 'errors-in-console', title: 'No browser errors in the console', description: 'Error messages indicate page issues.', severity: 'error', status: rand() > 0.3 ? 'passed' : 'failed' },
    { id: 'deprecations', title: 'No deprecated APIs used', description: 'Deprecated APIs will be removed from the browser.', severity: 'warning', status: rand() > 0.25 ? 'passed' : 'warning' },
    { id: 'image-aspect-ratio', title: 'Displays images with correct aspect ratio', description: 'Correct dimensions preserve layout integrity.', severity: 'warning', status: rand() > 0.2 ? 'passed' : 'warning' },
    { id: 'csp-xss', title: 'Uses CSP to prevent XSS', description: 'A strong Content Security Policy reduces XSS severity.', severity: 'error', status: rand() > 0.55 ? 'passed' : 'failed' },
  ];

  const opportunities: Opportunity[] = [
    { id: 'render-blocking-resources', title: 'Eliminate render-blocking resources', description: 'Resources are blocking the first paint of your page.', savings: intRange(rand, 120, 600), savingsUnit: 'ms', severity: 'high', affectedResources: cssFiles.slice(0, 2), explanation: 'Critical CSS and synchronous scripts block rendering.', suggestedFix: 'Inline critical CSS and use async/defer for scripts.' },
    { id: 'unused-javascript', title: 'Reduce unused JavaScript', description: 'Unused JavaScript adds unnecessary bytes and parse time.', savings: intRange(rand, 35000, 220000), savingsUnit: 'bytes', severity: 'high', affectedResources: jsAsync.slice(0, 2), explanation: 'Large bundles include code not executed on this page.', suggestedFix: 'Use dynamic import() and tree-shaking.' },
    { id: 'unused-css-rules', title: 'Reduce unused CSS', description: 'Unused CSS rules consume bandwidth and processing time.', savings: intRange(rand, 8000, 60000), savingsUnit: 'bytes', severity: 'medium', affectedResources: cssFiles, explanation: 'Stylesheets contain selectors not used on this page.', suggestedFix: 'Use critical CSS inlining and defer non-critical styles.' },
    { id: 'modern-image-formats', title: 'Use modern image formats', description: 'WebP and AVIF provide better compression than JPEG/PNG.', savings: intRange(rand, 15000, 120000), savingsUnit: 'bytes', severity: 'medium', affectedResources: imgFiles.filter((f) => f.includes('.jpg') || f.includes('.png')), explanation: 'JPEG/PNG are less efficient than modern formats.', suggestedFix: 'Serve images as WebP or AVIF with appropriate fallbacks.' },
    { id: 'offscreen-images', title: 'Defer offscreen images', description: 'Lazy-load images that are not visible in the viewport.', savings: intRange(rand, 3000, 40000), savingsUnit: 'bytes', severity: 'low', affectedResources: imgFiles.slice(3), explanation: 'Below-the-fold images delay initial render.', suggestedFix: 'Add loading="lazy" to offscreen images.' },
    { id: 'font-display', title: 'Ensure text remains visible during webfont load', description: 'Apply font-display: swap to avoid FOIT.', savings: intRange(rand, 100, 400), savingsUnit: 'ms', severity: 'low', affectedResources: fontFiles.slice(0, 1), explanation: 'Custom fonts block text rendering while loading.', suggestedFix: 'Use font-display: swap or optional.' },
  ];

  const diagnostics: Diagnostic[] = [
    { id: 'total-byte-weight', title: 'Total page weight', description: 'Overall transfer size of all resources loaded.', status: totalTransfer < 1500000 ? 'good' : totalTransfer < 3000000 ? 'warning' : 'poor', value: totalTransfer, unit: 'bytes' },
    { id: 'dom-size', title: 'DOM size', description: 'Number of DOM elements in the document.', status: domSize < 1500 ? 'good' : domSize < 2800 ? 'warning' : 'poor', value: domSize, unit: 'elements' },
    { id: 'mainthread-work', title: 'Main thread work', description: 'Time spent executing JavaScript on the main thread.', status: tbtMs < 600 ? 'good' : tbtMs < 1200 ? 'warning' : 'poor', value: Math.round(tbtMs), unit: 'ms' },
    { id: 'network-requests', title: 'Network requests', description: 'Total number of network requests made.', status: totalRequests < 40 ? 'good' : totalRequests < 65 ? 'warning' : 'poor', value: totalRequests, unit: 'requests' },
    { id: 'third-party-summary', title: 'Third-party impact', description: 'Impact of third-party code on performance.', status: thirdPartyCount < 5 ? 'good' : thirdPartyCount < 8 ? 'warning' : 'poor', value: thirdPartyCount, unit: 'domains' },
  ];

  return {
    id: generateId(),
    url,
    hostname,
    timestamp: new Date().toISOString(),
    device,
    connection,
    duration: intRange(rand, 2000, 8000),
    scores: { performance: perfScore, accessibility: a11yScore, seo: seoScore, bestPractices: bpScore },
    coreWebVitals,
    supportingMetrics,
    navigationTiming,
    resources,
    resourceBreakdown,
    thirdParties,
    accessibility: accessibilityAudits,
    seo: seoAudits,
    bestPractices: bestPracticesAudits,
    opportunities,
    diagnostics,
    javascriptAnalysis: {
      totalSize: jsSize,
      totalTransferSize: Math.round(jsSize * 0.7),
      scriptCount: jsTotalCount,
      blockingScripts: jsBlockingCount,
      asyncScripts: jsAsyncCount,
      deferredScripts: jsDeferredCount,
      longTasks: intRange(rand, 0, 12),
      thirdPartyScripts: intRange(rand, 1, thirdPartyCount + 2),
      executionTime: Math.round(tbtMs * 0.65),
      mainThreadTime: Math.round(tbtMs * 0.8),
    },
    imageAnalysis: {
      oversized: imgFiles.slice(0, intRange(rand, 0, 3)).map((url_) => ({ url: url_, size: intRange(rand, 80000, 300000), recommended: intRange(rand, 15000, 60000) })),
      missingDimensions: imgFiles.slice(0, intRange(rand, 0, 2)),
      unsupportedFormat: [],
      lazyLoadOpportunities: imgFiles.slice(3),
      responsiveOpportunities: [],
      recommendations: [
        'Use modern image formats (WebP, AVIF)',
        'Set explicit width and height to prevent layout shifts',
        'Implement lazy loading for below-the-fold images',
        'Compress images without visible quality loss',
      ],
    },
    cachingAnalysis: {
      resourcesWithCaching: intRange(rand, Math.round(resources.length * 0.4), Math.round(resources.length * 0.8)),
      resourcesWithoutCaching: intRange(rand, 2, Math.round(resources.length * 0.4)),
      totalCacheableSize: Math.round(totalTransfer * range(rand, 0.3, 0.6)),
      recommendations: [
        { resource: `https://${hostname}/static/js/main.${hash()}.js`, issue: 'No cache-control header', recommendation: 'Set max-age=31536000, immutable for hashed assets' },
        { resource: `https://${hostname}/images/og-image.jpg`, issue: 'Cache expires in 1 hour', recommendation: 'Set max-age=604800 for static images' },
      ],
    },
    compressionAnalysis: {
      compressedSize: Math.round(totalTransfer * range(rand, 0.6, 0.8)),
      uncompressedSize: totalTransfer,
      potentialSavings: Math.round(totalTransfer * range(rand, 0.15, 0.35)),
      resourcesCompressed: intRange(rand, Math.round(resources.length * 0.5), Math.round(resources.length * 0.8)),
      resourcesUncompressed: intRange(rand, 2, Math.round(resources.length * 0.4)),
      formats: rand() > 0.3 ? ['gzip', 'br'] : ['gzip'],
    },
    securityAnalysis: {
      https: url.startsWith('https://'),
      mixedContent: false,
      consoleErrors: [],
      failedRequests: [],
      deprecatedAPIs: [],
      checks: bestPracticesAudits,
    },
    waterfall,
    isDemoData: true,
  };
}
