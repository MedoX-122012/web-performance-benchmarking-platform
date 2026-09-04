import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TestHistoryCard from '@components/TestHistoryCard';
import {
  getHistory as getLocalHistory,
  deleteHistoryEntry,
  clearAllHistory,
} from '@utils/storage';
import type { DeviceType, HistoryEntry } from '@types/index';

const PAGE_SIZE = 12;

type SortOption = 'newest' | 'oldest' | 'score-high' | 'score-low';
type DeviceFilter = 'all' | DeviceType;

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
        <h3 id="dialog-title" className="text-lg font-semibold text-gray-100 mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-6">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <div className="w-24 h-24 rounded-full bg-gray-800/50 border border-gray-700/50 flex items-center justify-center mb-6">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
          <path d="M12 8v4l3 3" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-300 mb-2">No benchmark history yet</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm">
        Run your first test to get started! Benchmark any website to track its performance over time.
      </p>
    </div>
  );
}

export default function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryEntry[]>(() => getLocalHistory());

  const [searchQuery, setSearchQuery] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const filteredHistory = useMemo(() => {
    let result = [...history];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.url.toLowerCase().includes(q) ||
          e.hostname.toLowerCase().includes(q),
      );
    }

    if (deviceFilter !== 'all') {
      result = result.filter((e) => e.device === deviceFilter);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'score-high':
          return b.performanceScore - a.performanceScore;
        case 'score-low':
          return a.performanceScore - b.performanceScore;
        default:
          return 0;
      }
    });

    return result;
  }, [history, searchQuery, deviceFilter, sortBy]);

  const totalPages = Math.ceil(filteredHistory.length / PAGE_SIZE);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleView = useCallback((id: string) => navigate(`/report/${id}`), [navigate]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteHistoryEntry(id);
      setHistory((prev) => prev.filter((e) => e.id !== id));
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    },
    [],
  );

  const handleToggleCompare = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((sid) => sid !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === paginatedHistory.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedHistory.map((e) => e.id));
    }
  }, [paginatedHistory, selectedIds.length]);

  const handleBulkDelete = useCallback(() => {
    selectedIds.forEach((id) => deleteHistoryEntry(id));
    setHistory((prev) => prev.filter((e) => !selectedIds.includes(e.id)));
    setSelectedIds([]);
    setShowBulkDeleteDialog(false);
  }, [selectedIds]);

  const handleCompare = useCallback(() => {
    if (selectedIds.length === 2) {
      navigate(`/compare?id1=${selectedIds[0]}&id2=${selectedIds[1]}`);
    }
  }, [selectedIds, navigate]);

  const allSelected = paginatedHistory.length > 0 && selectedIds.length === paginatedHistory.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Test History</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredHistory.length} {filteredHistory.length === 1 ? 'benchmark' : 'benchmarks'} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {compareMode && (
            <>
              <button
                onClick={handleCompare}
                disabled={selectedIds.length !== 2}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Compare Selected ({selectedIds.length}/2)
              </button>
              <button
                onClick={() => { setCompareMode(false); setSelectedIds([]); }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Exit Compare
              </button>
            </>
          )}
          {history.length > 0 && !compareMode && (
            <>
              <button
                onClick={() => setCompareMode(true)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800 border border-gray-700/50 transition-colors"
              >
                Compare Mode
              </button>
              <button
                onClick={() => setShowClearDialog(true)}
                className="px-4 py-2 text-sm text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 border border-red-500/20 transition-colors"
              >
                Clear All History
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search by URL or hostname..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-colors"
            aria-label="Search benchmarks"
          />
        </div>
        <select
          value={deviceFilter}
          onChange={(e) => { setDeviceFilter(e.target.value as DeviceFilter); setCurrentPage(1); }}
          className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-gray-600 appearance-none cursor-pointer min-w-[140px]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: 32,
          }}
          aria-label="Filter by device"
        >
          <option value="all">All Devices</option>
          <option value="desktop">Desktop</option>
          <option value="mobile">Mobile</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-gray-600 appearance-none cursor-pointer min-w-[160px]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: 32,
          }}
          aria-label="Sort by"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="score-high">Highest Score</option>
          <option value="score-low">Lowest Score</option>
        </select>
      </div>

      {compareMode && history.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/30"
            />
            <span className="text-sm text-gray-400">Select All (page)</span>
          </label>
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowBulkDeleteDialog(true)}
              className="px-3 py-1 text-xs font-medium text-red-400 bg-red-500/10 rounded-md hover:bg-red-500/20 transition-colors"
            >
              Delete Selected ({selectedIds.length})
            </button>
          )}
        </div>
      )}

      {filteredHistory.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedHistory.map((entry) => (
              <TestHistoryCard
                key={entry.id}
                entry={entry}
                onView={handleView}
                onDelete={handleDelete}
                compareMode={compareMode}
                selected={selectedIds.includes(entry.id)}
                onToggleCompare={handleToggleCompare}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 pt-4" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-md hover:bg-gray-800 transition-colors"
                aria-label="Previous page"
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalPages <= 7) return true;
                  if (p === 1 || p === totalPages) return true;
                  if (Math.abs(p - currentPage) <= 1) return true;
                  return false;
                })
                .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === 'ellipsis' ? (
                    <span key={`e${i}`} className="px-2 text-gray-600">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      className={`w-9 h-9 text-sm rounded-md transition-colors ${
                        currentPage === item
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                      }`}
                      aria-current={currentPage === item ? 'page' : undefined}
                    >
                      {item}
                    </button>
                  ),
                )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-md hover:bg-gray-800 transition-colors"
                aria-label="Next page"
              >
                Next →
              </button>
            </nav>
          )}
        </>
      )}

      <ConfirmationDialog
        isOpen={showClearDialog}
        title="Clear All History"
        message="Are you sure you want to delete all benchmark history? This action cannot be undone."
        confirmLabel="Clear All"
        onConfirm={() => { clearAllHistory(); setHistory([]); setShowClearDialog(false); }}
        onCancel={() => setShowClearDialog(false)}
      />

      <ConfirmationDialog
        isOpen={showBulkDeleteDialog}
        title="Delete Selected"
        message={`Are you sure you want to delete ${selectedIds.length} selected ${selectedIds.length === 1 ? 'entry' : 'entries'}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteDialog(false)}
      />
    </div>
  );
}
