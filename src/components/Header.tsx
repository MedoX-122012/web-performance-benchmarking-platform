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

const styles = {
  header: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 200,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    backgroundColor: 'rgba(10, 10, 15, 0.8)',
    borderBottom: '1px solid var(--border-color)',
  },
  inner: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '0 var(--space-lg)',
    display: 'flex',
    alignItems: 'center',
    height: 64,
    gap: 'var(--space-lg)',
  },
  logo: {
    fontSize: 'var(--font-xl)',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  nav: {
    display: 'flex',
    gap: 'var(--space-xs)',
    alignItems: 'center',
  },
  navLink: (active: boolean) => ({
    padding: '6px 12px',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-sm)',
    fontWeight: 500,
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    backgroundColor: active ? 'var(--bg-hover)' : 'transparent',
    transition: 'all 150ms ease',
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
  }),
  urlForm: {
    flex: 1,
    display: 'flex',
    gap: 'var(--space-sm)',
    alignItems: 'center',
    maxWidth: 700,
  },
  urlInput: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text-primary)',
    fontSize: 'var(--font-sm)',
    fontFamily: '"SF Mono", "Fira Code", monospace',
    outline: 'none',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
  },
  selectGroup: {
    display: 'flex',
    gap: 'var(--space-sm)',
    alignItems: 'center',
  },
  select: {
    padding: '8px 12px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--font-sm)',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238888aa' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: 30,
    minWidth: 100,
  },
  analyzeBtn: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    fontWeight: 600,
    fontSize: 'var(--font-sm)',
    borderRadius: 'var(--radius-lg)',
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 150ms ease, transform 150ms ease',
    whiteSpace: 'nowrap' as const,
  },
  settingsBtn: {
    padding: 8,
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 150ms ease, background-color 150ms ease',
    flexShrink: 0,
  },
  hamburger: {
    display: 'none',
    padding: 8,
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    flexShrink: 0,
  },
  mobileMenu: {
    position: 'absolute' as const,
    top: 64,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border-color)',
    padding: 'var(--space-md)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-sm)',
    zIndex: 199,
  },
};

const DEVICE_OPTIONS: { value: DeviceType; label: string; icon: string }[] = [
  { value: 'desktop', label: 'Desktop', icon: '🖥️' },
  { value: 'mobile', label: 'Mobile', icon: '📱' },
];

const CONNECTION_OPTIONS: { value: ConnectionProfile; label: string; icon: string }[] = [
  { value: 'fast', label: 'Fast', icon: '⚡' },
  { value: '4g', label: '4G', icon: '📶' },
  { value: '3g', label: '3G', icon: '📡' },
  { value: 'slow', label: 'Slow', icon: '🐢' },
];

const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/history', label: 'History' },
  { to: '/compare', label: 'Compare' },
];

export default function Header({
  onSubmit,
  showUrlInput = true,
  device = 'desktop',
  connection = '4g',
  onDeviceChange,
  onConnectionChange,
}: HeaderProps) {
  const [url, setUrl] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    let finalUrl = trimmed;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }
    onSubmit?.(finalUrl);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header style={styles.header} role="banner">
      <div style={styles.inner}>
        <Link to="/" style={{ textDecoration: 'none' }} aria-label="Benchmarker Home">
          <span style={styles.logo}>⚡ Benchmarker</span>
        </Link>

        <nav style={styles.nav} className="hidden-mobile" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={styles.navLink(isActive(link.to))}
              aria-current={isActive(link.to) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {showUrlInput && (
          <form
            style={styles.urlForm}
            className="hidden-mobile"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            role="search"
          >
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter URL to benchmark..."
              style={styles.urlInput}
              aria-label="Website URL to benchmark"
              autoComplete="url"
              spellCheck={false}
            />
            <div style={styles.selectGroup}>
              <select
                value={device}
                onChange={(e) => onDeviceChange?.(e.target.value as DeviceType)}
                style={styles.select}
                aria-label="Select device type"
              >
                {DEVICE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
              <select
                value={connection}
                onChange={(e) => onConnectionChange?.(e.target.value as ConnectionProfile)}
                style={styles.select}
                aria-label="Select connection speed"
              >
                {CONNECTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              style={styles.analyzeBtn}
              aria-label="Start benchmark analysis"
            >
              Analyze
            </button>
          </form>
        )}

        <button
          style={styles.settingsBtn}
          className="hidden-mobile"
          aria-label="Settings"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        <button
          style={styles.hamburger}
          className="hidden-desktop"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <div style={styles.mobileMenu} className="hidden-desktop" role="navigation" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                ...styles.navLink(isActive(link.to)),
                padding: '10px 16px',
                width: '100%',
              }}
              aria-current={isActive(link.to) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
          {showUrlInput && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}
              role="search"
            >
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL to benchmark..."
                style={{ ...styles.urlInput, width: '100%' }}
                aria-label="Website URL to benchmark"
              />
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <select
                  value={device}
                  onChange={(e) => onDeviceChange?.(e.target.value as DeviceType)}
                  style={{ ...styles.select, flex: 1 }}
                  aria-label="Select device type"
                >
                  {DEVICE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={connection}
                  onChange={(e) => onConnectionChange?.(e.target.value as ConnectionProfile)}
                  style={{ ...styles.select, flex: 1 }}
                  aria-label="Select connection speed"
                >
                  {CONNECTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" style={styles.analyzeBtn}>
                Analyze
              </button>
            </form>
          )}
        </div>
      )}
    </header>
  );
}
