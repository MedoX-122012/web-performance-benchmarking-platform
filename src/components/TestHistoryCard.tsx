import { useState } from 'react';
import type { HistoryEntry } from '@/types';
import { formatBytes, formatTimeAgo, getScoreColor, getHostname } from '@/utils/formatting';

interface TestHistoryCardProps {
  entry: HistoryEntry;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  selected?: boolean;
  compareMode?: boolean;
  onToggleCompare?: (id: string) => void;
}

export default function TestHistoryCard({
  entry,
  onView,
  onDelete,
  selected = false,
  compareMode = false,
  onToggleCompare,
}: TestHistoryCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const hostname = entry.hostname || getHostname(entry.url);
  const perfColor = getScoreColor(entry.performanceScore);

  const connectionLabels: Record<string, string> = {
    fast: 'Fast',
    '4g': '4G',
    '3g': '3G',
    slow: 'Slow 3G',
  };

  const deviceIcons: Record<string, string> = {
    desktop: '🖥',
    mobile: '📱',
  };

  const handleDelete = () => {
    if (showConfirm) {
      onDelete(entry.id);
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };

  return (
    <div
      className={`bg-gray-900 rounded-xl border transition-all group ${
        selected ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-gray-800 hover:border-gray-700'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              {compareMode && onToggleCompare && (
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggleCompare(entry.id)}
                  className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/30"
                />
              )}
              <h4 className="text-sm font-medium text-gray-200 truncate">{hostname}</h4>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{deviceIcons[entry.device]} {entry.device}</span>
              <span className="text-gray-700">·</span>
              <span>{connectionLabels[entry.connection]}</span>
              <span className="text-gray-700">·</span>
              <span>{formatTimeAgo(entry.timestamp)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold tabular-nums"
              style={{ backgroundColor: `${perfColor}20`, color: perfColor }}
            >
              {Math.round(entry.performanceScore)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-0.5">LCP</div>
            <div className="text-sm font-medium text-gray-300 tabular-nums">
              {entry.lcp >= 1000 ? `${(entry.lcp / 1000).toFixed(1)}s` : `${Math.round(entry.lcp)}ms`}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-0.5">CLS</div>
            <div className="text-sm font-medium text-gray-300 tabular-nums">{entry.cls.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-0.5">Size</div>
            <div className="text-sm font-medium text-gray-300 tabular-nums">{formatBytes(entry.pageSize)}</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
          <span className="text-[10px] text-gray-600 tabular-nums">{entry.requests} requests</span>
          <div className="flex items-center gap-2">
            {showConfirm ? (
              <>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-2 py-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-2 py-1 text-[10px] text-red-400 bg-red-500/10 rounded hover:bg-red-500/20 transition-colors"
                >
                  Confirm
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleDelete}
                  className="px-2 py-1 text-[10px] text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Delete entry"
                >
                  Delete
                </button>
                <button
                  onClick={() => onView(entry.id)}
                  className="px-3 py-1 text-[10px] font-medium text-blue-400 bg-blue-500/10 rounded hover:bg-blue-500/20 transition-colors"
                >
                  View Report
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
