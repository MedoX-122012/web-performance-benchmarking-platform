interface BenchmarkProgressProps {
  url: string;
  currentStage: string;
  stages: string[];
  elapsedMs: number;
  onCancel: () => void;
}

export default function BenchmarkProgress({ url, currentStage, stages, elapsedMs, onCancel }: BenchmarkProgressProps) {
  const currentIdx = stages.indexOf(currentStage);
  const progress = currentIdx >= 0 ? ((currentIdx + 1) / stages.length) * 100 : 0;
  const elapsed = elapsedMs > 1000 ? `${(elapsedMs / 1000).toFixed(0)}s` : '';

  return (
    <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
      <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>{url}</div>
      <div style={{ width: '100%', height: 3, backgroundColor: 'var(--border-color)', borderRadius: 2, overflow: 'hidden', marginBottom: '1rem' }}>
        <div style={{ height: '100%', width: `${progress}%`, backgroundColor: 'var(--color-primary)', borderRadius: 2, transition: 'width 400ms ease' }} />
      </div>
      <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{currentStage}</div>
      {elapsed && <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{elapsed}</div>}
      <button onClick={onCancel} style={{ marginTop: '1rem', padding: '6px 16px', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 120ms ease' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-error)'; e.currentTarget.style.color = 'var(--color-error)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
        Cancel
      </button>
    </div>
  );
}
