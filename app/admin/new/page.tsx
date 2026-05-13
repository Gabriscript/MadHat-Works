import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { listTemplates } from '@/lib/actions/templates';
import { ProposalForm } from '@/app/admin/_components/ProposalForm';

export const dynamic = 'force-dynamic';

export default async function NewProposalPage() {
  const templates = await listTemplates();
  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-2 text-xs uppercase tracking-wider-2 text-cream/45 hover:text-orange-pale mb-8">
        <ChevronLeft className="w-3.5 h-3.5" /> Back to proposals
      </Link>
      <p className="mh-label mb-5">New proposal</p>
      <h1 className="mh-headline text-4xl mb-12">Send a <em>winning</em> deal.</h1>
      <ProposalForm templates={templates} />
    </div>
  );
}
