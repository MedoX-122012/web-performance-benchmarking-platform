interface ScoreCircleProps {
  score: number;
  label: string;
  size?: number;
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'var(--score-good)';
  if (score >= 50) return 'var(--score-medium)';
  return 'var(--score-poor)';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Good';
  if (score >= 50) return 'Needs Work';
  return 'Poor';
}

export default function ScoreCircle({ score, label, size = 100 }: ScoreCircleProps) {
  const color = getScoreColor(score);
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--border-color)" strokeWidth={5} />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={5} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: 'stroke-dashoffset 600ms ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: size > 80 ? '1.5rem' : '1.125rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>{score}</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</div>
        <div style={{ fontSize: '0.6875rem', fontWeight: 500, color, marginTop: 1 }}>{getScoreLabel(score)}</div>
      </div>
    </div>
  );
}
