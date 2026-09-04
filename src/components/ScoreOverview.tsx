import { useEffect, useState } from 'react';
import type { BenchmarkScores } from '@/types';
import { getScoreColor } from '@/utils/formatting';

interface ScoreOverviewProps {
  scores: BenchmarkScores;
}

interface CircleProps {
  label: string;
  score: number;
  delay: number;
  size?: 'normal' | 'large';
}

function ScoreCircle({ label, score, delay, size = 'normal' }: CircleProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const color = getScoreColor(score);
  const dim = size === 'large' ? 120 : 80;
  const stroke = size === 'large' ? 6 : 4;
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 800;
      const start = performance.now();
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setAnimatedScore(Math.round(eased * score));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timer);
  }, [score, delay]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={dim} height={dim} className="-rotate-90">
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="#1f2937"
          strokeWidth={stroke}
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-none"
        />
      </svg>
      <div className={`${size === 'large' ? '-mt-[84px] mb-2' : '-mt-[56px] mb-1'} flex flex-col items-center`}>
        <span className={`font-bold tabular-nums ${size === 'large' ? 'text-3xl' : 'text-xl'}`} style={{ color }}>
          {animatedScore}
        </span>
      </div>
      <span className="text-xs text-gray-400 font-medium">{label}</span>
    </div>
  );
}

export default function ScoreOverview({ scores }: ScoreOverviewProps) {
  const overall = Math.round(
    scores.performance * 0.4 + scores.accessibility * 0.2 + scores.bestPractices * 0.2 + scores.seo * 0.2,
  );

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        <div className="flex flex-col items-center gap-1">
          <ScoreCircle label="Overall" score={overall} delay={0} size="large" />
        </div>

        <div className="hidden sm:block w-px h-24 bg-gray-800" />

        <div className="grid grid-cols-2 gap-5 sm:gap-6">
          <ScoreCircle label="Performance" score={scores.performance} delay={100} />
          <ScoreCircle label="Accessibility" score={scores.accessibility} delay={200} />
          <ScoreCircle label="Best Practices" score={scores.bestPractices} delay={300} />
          <ScoreCircle label="SEO" score={scores.seo} delay={400} />
        </div>
      </div>
    </div>
  );
}
