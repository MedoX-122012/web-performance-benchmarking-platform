import { useState, useEffect } from 'react';
import { formatScore, getScoreColor, getScoreLabel } from '@/utils/formatting';

interface ScoreCircleProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: { width: 80, strokeWidth: 6, fontSize: 'var(--font-xl)', labelSize: 'var(--font-xs)' },
  md: { width: 120, strokeWidth: 8, fontSize: 'var(--font-3xl)', labelSize: 'var(--font-sm)' },
  lg: { width: 160, strokeWidth: 10, fontSize: 'var(--font-4xl)', labelSize: 'var(--font-base)' },
};

export default function ScoreCircle({ score, label, size = 'md' }: ScoreCircleProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const config = SIZE_MAP[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  const color = getScoreColor(score);
  const ratingLabel = getScoreLabel(score);

  useEffect(() => {
    let frame: number;
    const duration = 1000;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative' }}
      role="img"
      aria-label={`Score: ${score} out of 100. Rating: ${ratingLabel}`}
    >
      <svg
        width={config.width}
        height={config.width}
        viewBox={`0 0 ${config.width} ${config.width}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={config.strokeWidth}
        />
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={config.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          width: config.width,
          height: config.width,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: config.fontSize,
            fontWeight: 700,
            color,
            fontFamily: '"SF Mono", "Fira Code", monospace',
            lineHeight: 1,
          }}
        >
          {formatScore(animatedScore)}
        </span>
      </div>
      <span
        style={{
          fontSize: config.labelSize,
          color: 'var(--text-secondary)',
          fontWeight: 500,
          textAlign: 'center',
        }}
      >
        {label || ratingLabel}
      </span>
    </div>
  );
}
