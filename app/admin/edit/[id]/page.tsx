import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { listTemplates } from '@/lib/actions/templates';
import { getProposal } from '@/lib/actions/proposals';
import { ProposalForm } from '@/app/admin/_components/ProposalForm';
import { StatusBadge } from '@/components/madhat/StatusBadge';
import type { Duration, ProposalStatus } from '@/lib/types';
import { formatDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function EditProposalPage({ params }: { params: { id: string } }) {
  const [proposal, templates] = await Promise.all([getProposal(params.id), listTemplates()]);
  if (!proposal) notFound();

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-2 text-xs uppercase tracking-wider-2 text-cream/45 hover:text-orange-pale mb-8">
        <ChevronLeft className="w-3.5 h-3.5" /> Back to proposals
      </Link>
      <p className="mh-label mb-5">Edit proposal</p>
      <h1 className="mh-headline text-4xl mb-2">{proposal.title}</h1>
      <div className="flex items-center gap-3 mb-12 text-xs text-cream/45">
        <StatusBadge status={proposal.status as ProposalStatus} />
        <span>Last update {formatDateTime(proposal.updatedAt)}</span>
      </div>

      {proposal.acceptance && (
        <div className="mb-12 p-6 bg-emerald-500/5 border border-emerald-400/30">
          <p className="text-[0.65rem] uppercase tracking-wider-2 text-emerald-300 font-bold mb-2">Accepted by client</p>
          <div className="grid md:grid-cols-2 gap-3 text-sm text-cream/80">
            <div><span className="text-cream/45">Signed by:</span> {proposal.acceptance.typedSignature}</div>
            <div><span className="text-cream/45">At:</span> {formatDateTime(proposal.acceptance.acceptedAt)}</div>
            <div><span className="text-cream/45">Terms version:</span> <code className="text-xs">{proposal.acceptance.acceptedTermsVersion}</code></div>
            <div><span className="text-cream/45">Evidence hash:</span> <code className="text-xs">{proposal.acceptance.acceptedTermsHash}</code></div>
            <div><span className="text-cream/45">IP:</span> <code className="text-xs">{proposal.acceptance.ipAddress}</code></div>
            <div><span className="text-cream/45">Language:</span> <code className="text-xs">{proposal.acceptance.browserLanguage ?? '—'}</code></div>
          </div>
        </div>
      )}

      <ProposalForm
        templates={templates}
        initial={{
          id: proposal.id,
          token: proposal.token,
          status: proposal.status as ProposalStatus,
          templateId: proposal.templateId ?? null,
          title: proposal.title,
          clientName: proposal.clientName,
          clientEmail: proposal.clientEmail,
          companyName: proposal.companyName ?? '',
          description: proposal.description,
          deliverables: proposal.deliverables,
          includedServices: proposal.includedServices,
          excludedServices: proposal.excludedServices,
          oneTimePrice: proposal.oneTimePrice,
          monthlyFee: proposal.monthlyFee,
          duration: proposal.duration as Duration,
          timeline: proposal.timeline ?? '',
          expiresAt: proposal.expiresAt ? proposal.expiresAt.toISOString().slice(0, 10) : null,
          acceptanceId: proposal.acceptance?.id ?? null,
        }}
      />
    </div>
  );
}
