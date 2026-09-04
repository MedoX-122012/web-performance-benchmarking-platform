export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatScore(score: number): string {
  return Math.round(score).toString();
}

export function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 50) return '#eab308';
  return '#ef4444';
}

export function getScoreLabel(score: number): 'Good' | 'Needs Work' | 'Poor' {
  if (score >= 90) return 'Good';
  if (score >= 50) return 'Needs Work';
  return 'Poor';
}

export function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = Math.max(0, now - then);

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return formatDate(timestamp);
}

export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function truncateUrl(url: string, maxLength = 50): string {
  if (url.length <= maxLength) return url;
  const hostname = getHostname(url);
  if (hostname.length + 8 >= maxLength) {
    return hostname.slice(0, maxLength - 3) + '...';
  }
  const available = maxLength - hostname.length - 5;
  const path = new URL(url).pathname;
  if (path.length <= available) return url;
  return hostname + '/...' + path.slice(-(available - 3));
}

export function clsx(
  ...args: Array<string | false | null | undefined>
): string {
  return args.filter(Boolean).join(' ');
}
