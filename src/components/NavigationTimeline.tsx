import type { NavigationTiming } from '@types/index';

interface NavigationTimelineProps {
  timing: NavigationTiming;
}

export default function NavigationTimeline({ timing }: NavigationTimelineProps) {
  const events = [
    { label: 'DNS', value: timing.dns },
    { label: 'Connect', value: timing.connection },
    { label: 'TLS', value: timing.tls },
    { label: 'Request', value: timing.request },
    { label: 'Response', value: timing.response },
    { label: 'DOM', value: timing.domContentLoaded },
    { label: 'Load', value: timing.load },
  ].filter(e => e.value > 0);

  const maxVal = Math.max(...events.map(e => e.value), 1);

  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
      <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Navigation Timeline</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {events.map((event) => (
          <div key={event.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', width: 60, flexShrink: 0, textAlign: 'right' }}>{event.label}</span>
            <div style={{ flex: 1, height: 6, backgroundColor: 'var(--border-color-light, var(--border-color))', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(event.value / maxVal) * 100}%`, backgroundColor: 'var(--color-primary)', borderRadius: 3, opacity: 0.7, transition: 'width 400ms ease' }} />
            </div>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', width: 50, fontFamily: 'monospace' }}>{event.value}ms</span>
          </div>
        ))}
      </div>
    </div>
  );
}
