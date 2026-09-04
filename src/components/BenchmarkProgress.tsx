import { useState, useEffect } from 'react';

interface BenchmarkProgressProps {
  url: string;
  currentStage: string;
  stages: string[];
  elapsedMs: number;
  onCancel?: () => void;
}

const STAGE_ICONS: Record<string, string> = {
  'Validating URL': '🔍',
  'Launching Browser': '🌐',
  'Loading Page': '⏳',
  'Collecting Data': '📊',
  'Running Audits': '✅',
  'Analyzing Resources': '📦',
  'Generating Report': '📋',
};

function getStageIndex(stages: string[], current: string): number {
  const idx = stages.indexOf(current);
  return idx >= 0 ? idx : 0;
}

export default function BenchmarkProgress({
  url,
  currentStage,
  stages,
  elapsedMs,
  onCancel,
}: BenchmarkProgressProps) {
  const [dots, setDots] = useState('');
  const currentIndex = getStageIndex(stages, currentStage);
  const completedCount = currentIndex;
  const estimatedTotal = stages.length * 4000;
  const remainingMs = Math.max(0, estimatedTotal - elapsedMs);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms: number) => {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const remainSecs = secs % 60;
    return mins > 0 ? `${mins}m ${remainSecs}s` : `${remainSecs}s`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-xl)',
        padding: 'var(--space-3xl) var(--space-lg)',
      }}
      role="status"
      aria-live="polite"
      aria-label={`Benchmark in progress: ${currentStage}`}
    >
      <div
        style={{
          width: 120,
          height: 80,
          border: '3px solid var(--border-color-light)',
          borderRadius: 'var(--radius-xl)',
          position: 'relative',
          overflow: 'hidden',
        }}
        aria-hidden="true"
      >
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${Math.min(100, (completedCount / stages.length) * 100)}%`,
            background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.3))',
            transition: 'height 0.5s ease',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 28,
            animation: 'pulse 2s infinite',
          }}
        >
          🌐
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            marginBottom: 4,
            fontFamily: '"SF Mono", monospace',
          }}
        >
          Analyzing
        </p>
        <p
          style={{
            fontSize: 'var(--font-lg)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            wordBreak: 'break-all',
            maxWidth: 500,
          }}
        >
          {url}
        </p>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 500,
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-full)',
          height: 8,
          overflow: 'hidden',
        }}
        role="progressbar"
        aria-valuenow={completedCount}
        aria-valuemin={0}
        aria-valuemax={stages.length}
      >
        <div
          style={{
            height: '100%',
            width: `${(completedCount / stages.length) * 100}%`,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.5s ease',
          }}
        />
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 500,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-sm)',
        }}
      >
        {stages.map((stage, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isPending = i > currentIndex;

          return (
            <div
              key={stage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isCurrent ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                transition: 'background-color 0.3s ease',
              }}
            >
              <span style={{ fontSize: 'var(--font-sm)', width: 24, textAlign: 'center' }}>
                {isCompleted ? (
                  <span style={{ color: 'var(--score-good)' }} aria-hidden="true">✓</span>
                ) : isCurrent ? (
                  <span style={{ color: 'var(--color-primary)' }} aria-hidden="true">
                    {STAGE_ICONS[stage] || '⚙️'}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }} aria-hidden="true">○</span>
                )}
              </span>
              <span
                style={{
                  fontSize: 'var(--font-sm)',
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCompleted
                    ? 'var(--score-good)'
                    : isCurrent
                      ? 'var(--text-primary)'
                      : 'var(--text-muted)',
                  flex: 1,
                }}
              >
                {stage}
                {isCurrent && dots}
              </span>
              {isCompleted && (
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>done</span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 2 }}>Elapsed</p>
          <p
            style={{
              fontSize: 'var(--font-lg)',
              fontWeight: 600,
              fontFamily: '"SF Mono", monospace',
              color: 'var(--text-primary)',
            }}
          >
            {formatTime(elapsedMs)}
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 2 }}>Remaining</p>
          <p
            style={{
              fontSize: 'var(--font-lg)',
              fontWeight: 600,
              fontFamily: '"SF Mono", monospace',
              color: 'var(--text-secondary)',
            }}
          >
            ~{formatTime(remainingMs)}
          </p>
        </div>
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          style={{
            padding: '10px 24px',
            fontSize: 'var(--font-sm)',
            fontWeight: 500,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color-light)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          aria-label="Cancel benchmark"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
