import { useState, useMemo } from 'react';
import type { AccessibilityAudit, SEOAudit, BestPracticeAudit } from '@/types';

interface AuditListProps {
  audits: Array<AccessibilityAudit | SEOAudit | BestPracticeAudit>;
  type: 'accessibility' | 'seo' | 'bestPractices';
}

type Status = 'passed' | 'warning' | 'failed';

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string; icon: string }> = {
  passed: { label: 'Passed', bg: 'bg-green-500/20', text: 'text-green-400', icon: '✓' },
  warning: { label: 'Warning', bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: '⚠' },
  failed: { label: 'Failed', bg: 'bg-red-500/20', text: 'text-red-400', icon: '✕' },
};

function getImpactConfig(impact: string) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    critical: { label: 'Critical', bg: 'bg-red-500/20', text: 'text-red-400' },
    serious: { label: 'Serious', bg: 'bg-orange-500/20', text: 'text-orange-400' },
    moderate: { label: 'Moderate', bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
    minor: { label: 'Minor', bg: 'bg-gray-500/20', text: 'text-gray-400' },
  };
  return map[impact] || map.minor;
}

function hasImpact(audit: AccessibilityAudit | SEOAudit | BestPracticeAudit): audit is AccessibilityAudit {
  return 'impact' in audit;
}

function hasSeverity(audit: AccessibilityAudit | SEOAudit | BestPracticeAudit): audit is BestPracticeAudit {
  return 'severity' in audit;
}

function getAuditDetails(audit: AccessibilityAudit | SEOAudit | BestPracticeAudit) {
  if (hasImpact(audit)) return audit.details;
  if (hasSeverity(audit)) return audit.details;
  return (audit as SEOAudit).details;
}

function getFixSuggestion(audit: AccessibilityAudit | SEOAudit | BestPracticeAudit) {
  if (hasImpact(audit)) return audit.howToFix;
  if (hasSeverity(audit)) return undefined;
  return (audit as SEOAudit).recommendation;
}

export default function AuditList({ audits, type }: AuditListProps) {
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const groups: Record<Status, typeof audits> = {
      passed: [],
      warning: [],
      failed: [],
    };
    for (const a of audits) {
      groups[a.status].push(a);
    }
    return groups;
  }, [audits]);

  const filteredAudits = useMemo(() => {
    if (filter === 'all') return audits;
    return grouped[filter];
  }, [audits, filter, grouped]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          {type === 'accessibility' ? 'Accessibility' : type === 'seo' ? 'SEO' : 'Best Practices'} Audits
        </h3>
        <div className="flex gap-2">
          {(['all', 'passed', 'warning', 'failed'] as const).map((s) => {
            const cfg = s === 'all' ? { label: 'All', bg: 'bg-gray-700/50', text: 'text-gray-300' } : STATUS_CONFIG[s];
            const count = s === 'all' ? audits.length : grouped[s].length;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filter === s ? `${cfg.bg} ${cfg.text} ring-1 ring-white/10` : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {cfg.label}
                <span className="ml-1.5 text-[10px] opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        {filteredAudits.length === 0 && (
          <p className="text-sm text-gray-500 py-4 text-center">No audits match this filter.</p>
        )}
        {filteredAudits.map((audit) => {
          const cfg = STATUS_CONFIG[audit.status];
          const isExpanded = expanded.has(audit.id);
          const impact = hasImpact(audit) ? getImpactConfig(audit.impact) : null;
          const details = getAuditDetails(audit);
          const fix = getFixSuggestion(audit);

          return (
            <div key={audit.id} className="rounded-lg border border-gray-800/50 overflow-hidden">
              <button
                onClick={() => toggle(audit.id)}
                className="w-full flex items-start gap-3 p-3 text-left hover:bg-gray-800/30 transition-colors"
              >
                <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${cfg.bg} ${cfg.text}`}>
                  {cfg.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-200 font-medium">{audit.title}</span>
                    {impact && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${impact.bg} ${impact.text}`}>
                        {impact.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{audit.description}</p>
                </div>
                <span className="text-gray-600 text-xs flex-shrink-0 mt-1">{isExpanded ? '−' : '+'}</span>
              </button>

              {isExpanded && (details || fix) && (
                <div className="px-3 pb-3 pt-0 ml-8 space-y-2">
                  {details && (
                    <div>
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Details</p>
                      <p className="text-xs text-gray-400 leading-relaxed">{details}</p>
                    </div>
                  )}
                  {fix && (
                    <div>
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                        {type === 'seo' ? 'Recommendation' : 'How to Fix'}
                      </p>
                      <p className="text-xs text-gray-400 leading-relaxed">{fix}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
