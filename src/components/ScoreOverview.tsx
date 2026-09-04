import ScoreCircle from './ScoreCircle';
import type { BenchmarkScores } from '@types/index';

interface ScoreOverviewProps {
  scores: BenchmarkScores;
}

export default function ScoreOverview({ scores }: ScoreOverviewProps) {
  return (
    <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', padding: '1.5rem 0' }}>
      <ScoreCircle score={scores.performance} label="Performance" />
      <ScoreCircle score={scores.accessibility} label="Accessibility" />
      <ScoreCircle score={scores.seo} label="SEO" />
      <ScoreCircle score={scores.bestPractices} label="Best Practices" />
    </div>
  );
}
