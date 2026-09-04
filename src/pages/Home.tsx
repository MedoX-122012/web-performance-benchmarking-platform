import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStartBenchmark } from '@hooks/useBenchmark';
import BenchmarkProgress from '@components/BenchmarkProgress';
import { saveToHistory } from '@utils/storage';
import type { DeviceType, ConnectionProfile } from '@types/index';

const DEMO_URL = 'https://example.com';

const STAGES = [
  'Validating URL',
  'Launching Browser',
  'Loading Page',
  'Collecting Data',
  'Running Audits',
  'Analyzing Resources',
  'Generating Report',
];

interface DeviceOption {
  value: DeviceType;
  label: string;
  icon: string;
  description: string;
}

interface ConnectionOption {
  value: ConnectionProfile;
  label: string;
  icon: string;
  speed: string;
}

const DEVICES: DeviceOption[] = [
  { value: 'desktop', label: 'Desktop', icon: '🖥️', description: '1920×1080' },
  { value: 'mobile', label: 'Mobile', icon: '📱', description: 'iPhone 14' },
];

const CONNECTIONS: ConnectionOption[] = [
  { value: 'fast', label: 'Fast', icon: '⚡', speed: 'Unlimited' },
  { value: '4g', label: '4G', icon: '📶', speed: '20 Mbps' },
  { value: '3g', label: '3G', icon: '📡', speed: '2 Mbps' },
  { value: 'slow', label: 'Slow', icon: '🐢', speed: '500 Kbps' },
];

const FEATURES = [
  {
    icon: '📊',
    title: 'Performance Metrics',
    description: 'Lighthouse scores, Core Web Vitals, and detailed timing breakdowns.',
  },
  {
    icon: '⚡',
    title: 'Core Web Vitals',
    description: 'LCP, INP, CLS measurements with real-world thresholds.',
  },
  {
    icon: '🌐',
    title: 'Network Analysis',
    description: 'Waterfall charts, request counts, and third-party impact.',
  },
  {
    icon: '♿',
    title: 'Accessibility Audit',
    description: 'WCAG compliance checks with severity levels.',
  },
  {
    icon: '🔍',
    title: 'SEO Analysis',
    description: 'Meta tags, crawlability, and search optimization checks.',
  },
  {
    icon: '📈',
    title: 'Resource Analysis',
    description: 'JS bundles, image optimization, and caching breakdown.',
  },
];

const PROGRESS_STAGES = [
  'Validating URL',
  'Launching Browser',
  'Loading Page',
  'Collecting Performance Metrics',
  'Running Accessibility Audits',
  'Analyzing SEO & Best Practices',
  'Generating Detailed Report',
];

function isValidUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function Home() {
  const navigate = useNavigate();
  const { phase, progress, stage, result, error, startBenchmark, reset, cancel } =
    useStartBenchmark();
  const [url, setUrl] = useState('');
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [connection, setConnection] = useState<ConnectionProfile>('fast');
  const [demoMode, setDemoMode] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [visibleCards, setVisibleCards] = useState<boolean[]>(new Array(6).fill(false));
  const inputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const showToast = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            setVisibleCards((prev) => {
              const next = [...prev];
              next[idx] = true;
              return next;
            });
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    document.querySelectorAll('[data-feature-card]').forEach((el) => {
      observerRef.current?.observe(el);
    });
  }, []);

  useEffect(() => {
    if (phase === 'completed' && result) {
      saveToHistory(result);
      navigate(`/report/${result.id}`, { state: { result } });
    }
  }, [phase, result, navigate]);

  useEffect(() => {
    if (phase === 'failed' && error) {
      showToast(error);
    }
  }, [phase, error, showToast]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = url.trim();
      if (!trimmed) {
        showToast('Please enter a URL');
        inputRef.current?.focus();
        return;
      }
      const fullUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
      if (!isValidUrl(fullUrl)) {
        showToast('Please enter a valid URL (e.g., https://example.com)');
        return;
      }
      startBenchmark(fullUrl, device, connection, demoMode);
    },
    [url, device, connection, demoMode, startBenchmark, showToast],
  );

  const handleExample = useCallback(() => {
    setUrl(DEMO_URL);
    inputRef.current?.focus();
  }, []);

  const isRunning = phase === 'submitting' || phase === 'running';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {toast && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: 80,
            right: 24,
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: toast.type === 'error' ? 'var(--color-error)' : 'var(--color-success)',
            color: '#fff',
            fontSize: 'var(--font-sm)',
            fontWeight: 500,
            boxShadow: 'var(--shadow-lg)',
            animation: 'slideUp 300ms ease-out',
          }}
        >
          {toast.message}
        </div>
      )}

      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-3xl) var(--space-lg)',
          textAlign: 'center',
          minHeight: '70vh',
        }}
      >
        {isRunning ? (
          <BenchmarkProgress
            url={url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`}
            currentStage={stage}
            stages={PROGRESS_STAGES}
            elapsedMs={progress * 300}
            onCancel={cancel}
          />
        ) : (
          <div style={{ maxWidth: 720, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
              <span style={{ fontSize: 28 }} aria-hidden="true">⚡</span>
              <span
                style={{
                  fontSize: 'var(--font-xs)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--color-primary)',
                }}
              >
                Web Performance Benchmarker
              </span>
            </div>

            <h1
              style={{
                fontSize: 'var(--font-4xl)',
                fontWeight: 700,
                lineHeight: 1.1,
                maxWidth: 600,
                background: 'linear-gradient(135deg, var(--text-primary), var(--color-primary-hover))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Measure your website's performance
            </h1>

            <p
              style={{
                fontSize: 'var(--font-lg)',
                color: 'var(--text-secondary)',
                maxWidth: 520,
                lineHeight: 1.6,
              }}
            >
              Measure performance, accessibility, SEO, best practices and Core Web Vitals.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{
                width: '100%',
                maxWidth: 600,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-md)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-sm)',
                  width: '100%',
                }}
              >
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    aria-label="Website URL"
                    disabled={isRunning}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: 'var(--font-base)',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'border-color 150ms ease, box-shadow 150ms ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.25)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isRunning}
                  style={{
                    padding: '14px 28px',
                    fontSize: 'var(--font-base)',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                    opacity: isRunning ? 0.6 : 1,
                    transition: 'background-color 150ms ease, transform 100ms ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (!isRunning) e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                  }}
                  onMouseDown={(e) => {
                    if (!isRunning) e.currentTarget.style.transform = 'scale(0.98)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  Analyze Website
                </button>
              </div>

              <button
                type="button"
                onClick={handleExample}
                disabled={isRunning}
                style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text-muted)',
                  background: 'none',
                  border: 'none',
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  textDecoration: 'underline',
                  textDecorationStyle: 'dotted',
                  textDecorationColor: 'var(--text-muted)',
                  alignSelf: 'flex-start',
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                Try example: example.com
              </button>
            </form>

            <div
              style={{
                display: 'flex',
                gap: 'var(--space-2xl)',
                flexWrap: 'wrap',
                justifyContent: 'center',
                width: '100%',
                maxWidth: 600,
              }}
            >
              <fieldset style={{ border: 'none', padding: 0 }}>
                <legend
                  style={{
                    fontSize: 'var(--font-xs)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                    marginBottom: 'var(--space-sm)',
                  }}
                >
                  Device
                </legend>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  {DEVICES.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDevice(d.value)}
                      disabled={isRunning}
                      aria-pressed={device === d.value}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-lg)',
                        border: `2px solid ${device === d.value ? 'var(--color-primary)' : 'var(--border-color)'}`,
                        backgroundColor: device === d.value ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        opacity: isRunning ? 0.6 : 1,
                        transition: 'all 150ms ease',
                        minWidth: 90,
                      }}
                      onMouseEnter={(e) => {
                        if (device !== d.value) e.currentTarget.style.borderColor = 'var(--border-color-light)';
                      }}
                      onMouseLeave={(e) => {
                        if (device !== d.value) e.currentTarget.style.borderColor = 'var(--border-color)';
                      }}
                    >
                      <span style={{ fontSize: 20 }} aria-hidden="true">{d.icon}</span>
                      <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{d.label}</span>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{d.description}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset style={{ border: 'none', padding: 0 }}>
                <legend
                  style={{
                    fontSize: 'var(--font-xs)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                    marginBottom: 'var(--space-sm)',
                  }}
                >
                  Connection
                </legend>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                  {CONNECTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setConnection(c.value)}
                      disabled={isRunning}
                      aria-pressed={connection === c.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-lg)',
                        border: `2px solid ${connection === c.value ? 'var(--color-primary)' : 'var(--border-color)'}`,
                        backgroundColor: connection === c.value ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        opacity: isRunning ? 0.6 : 1,
                        transition: 'all 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        if (connection !== c.value) e.currentTarget.style.borderColor = 'var(--border-color-light)';
                      }}
                      onMouseLeave={(e) => {
                        if (connection !== c.value) e.currentTarget.style.borderColor = 'var(--border-color)';
                      }}
                    >
                      <span aria-hidden="true">{c.icon}</span>
                      <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{c.label}</span>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{c.speed}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                opacity: isRunning ? 0.6 : 1,
                padding: '10px 16px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                backgroundColor: demoMode ? 'rgba(99,102,241,0.08)' : 'var(--bg-card)',
                transition: 'all 150ms ease',
                width: '100%',
                maxWidth: 320,
                justifyContent: 'center',
              }}
            >
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => setDemoMode(e.target.checked)}
                disabled={isRunning}
                style={{
                  width: 18,
                  height: 18,
                  accentColor: 'var(--color-primary)',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                Use demo mode (simulated data)
              </span>
            </label>
          </div>
        )}
      </section>

      {!isRunning && (
        <section
          style={{
            padding: 'var(--space-3xl) var(--space-lg)',
            maxWidth: 1200,
            width: '100%',
            margin: '0 auto',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-3xl)',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: 'var(--space-sm)',
            }}
          >
            Everything you need to measure
          </h2>
          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-2xl)',
              maxWidth: 500,
              margin: '0 auto var(--space-2xl)',
            }}
          >
            Comprehensive analysis with actionable insights
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--space-lg)',
            }}
          >
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                data-feature-card
                data-index={i}
                style={{
                  padding: 'var(--space-xl)',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-md)',
                  transition: 'border-color 250ms ease, box-shadow 250ms ease, transform 250ms ease, opacity 250ms ease',
                  opacity: visibleCards[i] ? 1 : 0,
                  transform: visibleCards[i] ? 'translateY(0)' : 'translateY(24px)',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color-light)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'rgba(99,102,241,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                  }}
                  aria-hidden="true"
                >
                  {feature.icon}
                </div>
                <h3
                  style={{
                    fontSize: 'var(--font-xl)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: 'var(--font-sm)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer
        style={{
          padding: 'var(--space-xl) var(--space-lg)',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-muted)',
          }}
        >
          Powered by Playwright + Lighthouse
        </p>
      </footer>
    </div>
  );
}
