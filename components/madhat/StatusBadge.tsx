import type { ProposalStatus } from '@/lib/types';

const styles: Record<ProposalStatus, { bg: string; color: string; dot: string }> = {
  DRAFT:    { bg: 'bg-cream/5',     color: 'text-cream/60',   dot: 'bg-cream/40' },
  PENDING:  { bg: 'bg-orange/15',   color: 'text-orange-pale',dot: 'bg-orange' },
  ACCEPTED: { bg: 'bg-emerald-500/15', color: 'text-emerald-300', dot: 'bg-emerald-400' },
  EXPIRED:  { bg: 'bg-red-500/10',  color: 'text-red-300',    dot: 'bg-red-400' },
};

export function StatusBadge({ status }: { status: ProposalStatus }) {
  const s = styles[status];
  return (
    <span className={`mh-status-badge ${s.bg} ${s.color}`}>
      <span className={`w-1.5 h-1.5 ${s.dot}`} />
      {status}
    </span>
  );
}
