import Link from 'next/link';
import { listProposals } from '@/lib/actions/proposals';
import { StatusBadge } from '@/components/madhat/StatusBadge';
import { formatEUR, formatDate, relativeFromNow } from '@/lib/format';
import type { ProposalStatus } from '@/lib/types';
import { Plus, ExternalLink } from 'lucide-react';
import { ProposalRowActions } from './_components/ProposalRowActions';

export const dynamic = 'force-dynamic';

export default async function AdminProposalsPage() {
  const proposals = await listProposals();
  const counts = {
    total: proposals.length,
    pending: proposals.filter((p) => p.status === 'PENDING').length,
    accepted: proposals.filter((p) => p.status === 'ACCEPTED').length,
    draft: proposals.filter((p) => p.status === 'DRAFT').length,
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <p className="mh-label mb-5">Dashboard · Proposals</p>
          <h1 className="mh-headline text-[clamp(2rem,4vw,3.5rem)]">
            Every <em>deal</em>,<br />in one place.
          </h1>
        </div>
        <Link href="/admin/new" className="mh-btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" strokeWidth={3} /> New proposal
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-orange/15 mb-10">
        <Stat label="Total"    value={counts.total} />
        <Stat label="Draft"    value={counts.draft} tone="mute" />
        <Stat label="Pending"  value={counts.pending} tone="orange" />
        <Stat label="Accepted" value={counts.accepted} tone="emerald" />
      </div>

      {proposals.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="border border-cream/10">
          <table className="w-full text-sm">
            <thead className="text-[0.65rem] uppercase tracking-wider-2 text-cream/45">
              <tr className="border-b border-cream/10">
                <th className="text-left font-semibold py-4 px-5">Proposal</th>
                <th className="text-left font-semibold py-4 px-5 hidden md:table-cell">Client</th>
                <th className="text-left font-semibold py-4 px-5 hidden lg:table-cell">Pricing</th>
                <th className="text-left font-semibold py-4 px-5">Status</th>
                <th className="text-left font-semibold py-4 px-5 hidden md:table-cell">Updated</th>
                <th className="py-4 px-5"/>
              </tr>
            </thead>
            <tbody>
              {proposals.map((p) => (
                <tr key={p.id} className="border-b border-cream/5 hover:bg-cream/5 transition-colors">
                  <td className="py-4 px-5">
                    <Link href={`/admin/edit/${p.id}`} className="block group">
                      <span className="font-serif text-cream group-hover:text-orange-pale font-semibold text-base">{p.title}</span>
                      {p.template ? <span className="block text-[0.65rem] uppercase tracking-wider-2 text-cream/35 mt-1">{p.template.name}</span> : null}
                    </Link>
                  </td>
                  <td className="py-4 px-5 hidden md:table-cell">
                    <div className="text-cream/80">{p.clientName}</div>
                    {p.companyName ? <div className="text-cream/35 text-xs">{p.companyName}</div> : null}
                  </td>
                  <td className="py-4 px-5 hidden lg:table-cell text-cream/70">
                    <div>{formatEUR(p.oneTimePrice)} <span className="text-cream/35 text-xs">setup</span></div>
                    {p.monthlyFee ? <div className="text-xs text-cream/45">{formatEUR(p.monthlyFee)}/mo</div> : null}
                  </td>
                  <td className="py-4 px-5"><StatusBadge status={p.status as ProposalStatus} /></td>
                  <td className="py-4 px-5 text-cream/45 text-xs hidden md:table-cell">
                    <div>{formatDate(p.updatedAt)}</div>
                    <div className="text-cream/30">{relativeFromNow(p.updatedAt)}</div>
                  </td>
                  <td className="py-4 px-5">
                    <ProposalRowActions
                      id={p.id}
                      token={p.token}
                      acceptanceId={p.acceptance?.id ?? null}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone = 'cream' }: { label: string; value: number; tone?: 'cream' | 'mute' | 'orange' | 'emerald' }) {
  const colors: Record<string, string> = {
    cream: 'text-cream',
    mute: 'text-cream/55',
    orange: 'text-orange',
    emerald: 'text-emerald-300',
  };
  return (
    <div className="bg-navy-mid p-6">
      <div className="text-[0.6rem] uppercase tracking-widest-2 text-cream/45 font-semibold">{label}</div>
      <div className={`font-serif font-black text-4xl mt-2 ${colors[tone]}`}>{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24 bg-navy-mid border border-cream/10">
      <p className="mh-label justify-center mb-6">No proposals yet</p>
      <h2 className="mh-headline text-2xl mb-4">Send your first <em>deal</em>.</h2>
      <p className="text-cream/55 max-w-md mx-auto mb-8 text-sm leading-relaxed">
        Pick a template, edit anything you want, then share a private link. The client signs digitally and you keep the PDF.
      </p>
      <Link href="/admin/new" className="mh-btn-primary inline-flex items-center gap-2">
        <Plus className="w-4 h-4" strokeWidth={3} /> Create proposal
      </Link>
    </div>
  );
}
