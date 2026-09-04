interface Audit {
  id: string;
  title: string;
  description: string;
  status: 'passed' | 'warning' | 'failed';
  severity?: string;
  impact?: string;
}

interface AuditListProps {
  title: string;
  audits: Audit[];
  type?: 'accessibility' | 'seo' | 'best-practices';
}

function getStatusIcon(status: string): { color: string; symbol: string } {
  if (status === 'passed') return { color: 'var(--score-good)', symbol: '\u2713' };
  if (status === 'warning') return { color: 'var(--score-medium)', symbol: '!' };
  return { color: 'var(--score-poor)', symbol: '\u2717' };
}

export default function AuditList({ title, audits }: AuditListProps) {
  const passed = audits.filter(a => a.status === 'passed').length;
  const failed = audits.filter(a => a.status === 'failed').length;
  const warnings = audits.filter(a => a.status === 'warning').length;

  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
        <div style={{ display: 'flex', gap: 8, fontSize: 'var(--font-xs)' }}>
          {passed > 0 && <span style={{ color: 'var(--score-good)' }}>{passed} passed</span>}
          {warnings > 0 && <span style={{ color: 'var(--score-medium)' }}>{warnings} warnings</span>}
          {failed > 0 && <span style={{ color: 'var(--score-poor)' }}>{failed} failed</span>}
        </div>
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {audits.map((audit) => {
          const { color, symbol } = getStatusIcon(audit.status);
          return (
            <div key={audit.id} style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-color-light, var(--border-color))', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ color, fontSize: '0.8125rem', fontWeight: 600, marginTop: 1, flexShrink: 0 }}>{symbol}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', fontWeight: 500 }}>{audit.title}</div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{audit.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
