import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { DeviceType, ConnectionProfile } from '@/types';

interface HeaderProps {
  onSubmit?: (url: string) => void;
  showUrlInput?: boolean;
  device?: DeviceType;
  connection?: ConnectionProfile;
  onDeviceChange?: (device: DeviceType) => void;
  onConnectionChange?: (connection: ConnectionProfile) => void;
}

const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/history', label: 'History' },
  { to: '/compare', label: 'Compare' },
];

const DEVICE_OPTIONS: { value: DeviceType; label: string }[] = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile', label: 'Mobile' },
];

const CONNECTION_OPTIONS: { value: ConnectionProfile; label: string }[] = [
  { value: 'fast', label: 'Fast' },
  { value: '4g', label: '4G' },
];

export default function Header({
  onSubmit,
  showUrlInput = true,
  device = 'desktop',
  connection = 'fast',
  onDeviceChange,
  onConnectionChange,
}: HeaderProps) {
  const [url, setUrl] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const finalUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    onSubmit?.(finalUrl);
  };

  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 200,
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          height: 56,
          gap: '1.5rem',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Benchmarker
          </span>
        </Link>

        <nav style={{ display: 'flex', gap: 4, alignItems: 'center' }} className="hidden-mobile">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-sm)',
                fontWeight: 500,
                color: isActive(link.to) ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive(link.to) ? 'var(--bg-hover)' : 'transparent',
                transition: 'all 120ms ease',
                textDecoration: 'none',
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {showUrlInput && (
          <form
            className="hidden-mobile"
            style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center', maxWidth: 700 }}
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          >
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL to benchmark..."
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-sm)',
                fontFamily: '"SF Mono", "Fira Code", monospace',
                outline: 'none',
                transition: 'border-color 120ms ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              aria-label="Website URL"
            />
            <select
              value={device}
              onChange={(e) => onDeviceChange?.(e.target.value as DeviceType)}
              style={{
                padding: '8px 28px 8px 10px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-sm)',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2366707A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
              }}
            >
              {DEVICE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              value={connection}
              onChange={(e) => onConnectionChange?.(e.target.value as ConnectionProfile)}
              style={{
                padding: '8px 28px 8px 10px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-sm)',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2366707A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
              }}
            >
              {CONNECTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              type="submit"
              style={{
                padding: '8px 20px',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 500,
                fontSize: 'var(--font-sm)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 120ms ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary)'; }}
            >
              Analyze
            </button>
          </form>
        )}

        <div style={{ flex: 1 }} />

        <button
          className="hidden-desktop"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ padding: 8, color: 'var(--text-secondary)' }}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="hidden-desktop" style={{ padding: '0.75rem 1.5rem 1rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)', fontWeight: 500, color: isActive(link.to) ? 'var(--text-primary)' : 'var(--text-secondary)', backgroundColor: isActive(link.to) ? 'var(--bg-hover)' : 'transparent', textDecoration: 'none' }}>
                {link.label}
              </Link>
            ))}
          </nav>
          {showUrlInput && (
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter URL..." style={{ padding: '8px 12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-sm)' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={device} onChange={(e) => onDeviceChange?.(e.target.value as DeviceType)} style={{ flex: 1, padding: '8px 10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-sm)' }}>
                  {DEVICE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select value={connection} onChange={(e) => onConnectionChange?.(e.target.value as ConnectionProfile)} style={{ flex: 1, padding: '8px 10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-sm)' }}>
                  {CONNECTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <button type="submit" style={{ padding: '8px 20px', backgroundColor: 'var(--color-primary)', color: '#fff', fontWeight: 500, fontSize: 'var(--font-sm)', borderRadius: 'var(--radius-md)', border: 'none' }}>Analyze</button>
            </form>
          )}
        </div>
      )}
    </header>
  );
}
