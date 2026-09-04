import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStartBenchmark } from '@hooks/useBenchmark';
import BenchmarkProgress from '@components/BenchmarkProgress';
import { saveToHistory } from '@utils/storage';
import type { DeviceType, ConnectionProfile } from '@types/index';

const PROGRESS_STAGES = [
  'Connecting to PageSpeed Insights...',
  'Sending URL to Google Lighthouse...',
  'Loading page in headless browser...',
  'Collecting performance metrics...',
  'Running accessibility audits...',
  'Analyzing SEO & best practices...',
  'Generating detailed report...',
];

function isValidUrl(input: string): boolean {
  try { const u = new URL(input); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
}

export default function Home() {
  const navigate = useNavigate();
  const { phase, progress, stage, result, error, startBenchmark, reset, cancel } = useStartBenchmark();
  const [url, setUrl] = useState('');
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [connection, setConnection] = useState<ConnectionProfile>('fast');
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showToast = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    if (phase === 'completed' && result) {
      saveToHistory(result);
      navigate(`/report/${result.id}`, { state: { result } });
    }
  }, [phase, result, navigate]);

  useEffect(() => {
    if (phase === 'failed' && error) showToast(error);
  }, [phase, error, showToast]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = url.trim();
      if (!trimmed) { showToast('Please enter a URL'); return; }
      const fullUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
      if (!isValidUrl(fullUrl)) { showToast('Please enter a valid URL'); return; }
      startBenchmark(fullUrl, device, connection);
    },
    [url, device, connection, startBenchmark, showToast],
  );

  const isRunning = phase === 'submitting' || phase === 'running';

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>
      {toast && (
        <div role="alert" style={{ position: 'fixed', top: 72, right: 24, zIndex: 9999, padding: '10px 16px', borderRadius: 'var(--radius-md)', backgroundColor: toast.type === 'error' ? 'var(--color-error)' : 'var(--color-success)', color: '#fff', fontSize: 'var(--font-sm)', fontWeight: 500, boxShadow: 'var(--shadow-md)' }}>
          {toast.message}
        </div>
      )}

      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', textAlign: 'center', minHeight: '60vh' }}>
        {isRunning ? (
          <BenchmarkProgress
            url={url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`}
            currentStage={stage}
            stages={PROGRESS_STAGES}
            elapsedMs={progress * 500}
            onCancel={cancel}
          />
        ) : (
          <div style={{ maxWidth: 640, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '0.5rem' }}>
                Web Performance Benchmarker
              </h1>
              <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
                Analyze your website's performance, accessibility, SEO, and Core Web Vitals using Google Lighthouse.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  disabled={isRunning}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: 'var(--font-base)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color 120ms ease',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                />
                <button
                  type="submit"
                  disabled={isRunning}
                  style={{
                    padding: '10px 24px',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 500,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                    opacity: isRunning ? 0.5 : 1,
                    transition: 'background-color 120ms ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Analyze
                </button>
              </div>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <fieldset style={{ border: 'none', padding: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <legend style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--text-muted)', marginRight: 4 }}>Device</legend>
                  {(['desktop', 'mobile'] as DeviceType[]).map((d) => (
                    <button key={d} type="button" onClick={() => setDevice(d)} disabled={isRunning} style={{
                      padding: '6px 14px', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)',
                      border: `1px solid ${device === d ? 'var(--color-primary)' : 'var(--border-color)'}`,
                      backgroundColor: device === d ? 'var(--bg-hover)' : 'transparent',
                      color: device === d ? 'var(--color-primary)' : 'var(--text-secondary)',
                      cursor: isRunning ? 'not-allowed' : 'pointer',
                      transition: 'all 120ms ease',
                    }}>
                      {d === 'desktop' ? 'Desktop' : 'Mobile'}
                    </button>
                  ))}
                </fieldset>

                <fieldset style={{ border: 'none', padding: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <legend style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--text-muted)', marginRight: 4 }}>Network</legend>
                  {(['fast', '4g'] as ConnectionProfile[]).map((c) => (
                    <button key={c} type="button" onClick={() => setConnection(c)} disabled={isRunning} style={{
                      padding: '6px 14px', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)',
                      border: `1px solid ${connection === c ? 'var(--color-primary)' : 'var(--border-color)'}`,
                      backgroundColor: connection === c ? 'var(--bg-hover)' : 'transparent',
                      color: connection === c ? 'var(--color-primary)' : 'var(--text-secondary)',
                      cursor: isRunning ? 'not-allowed' : 'pointer',
                      transition: 'all 120ms ease',
                    }}>
                      {c === 'fast' ? 'Fast' : '4G'}
                    </button>
                  ))}
                </fieldset>
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
