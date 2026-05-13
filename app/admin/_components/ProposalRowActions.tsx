'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Copy, Download, Files, Trash2, ExternalLink, Pencil } from 'lucide-react';
import { deleteProposal, duplicateProposal } from '@/lib/actions/proposals';

export function ProposalRowActions({
  id, token, acceptanceId,
}: { id: string; token: string; acceptanceId: string | null }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const copyLink = async () => {
    const url = `${window.location.origin}/proposal/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success('Proposal link copied');
  };

  const handleDuplicate = () => {
    startTransition(async () => {
      const r = await duplicateProposal(id);
      if (r.ok) {
        toast.success('Duplicated');
        router.push(`/admin/edit/${r.id}`);
      } else toast.error(r.error);
    });
  };

  const handleDelete = () => {
    if (!confirm('Delete this proposal? This cannot be undone.')) return;
    startTransition(async () => {
      const r = await deleteProposal(id);
      if (r.ok) {
        toast.success('Deleted');
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-0.5">
      <IconBtn title="Edit" href={`/admin/edit/${id}`}><Pencil className="w-4 h-4" /></IconBtn>
      <IconBtn title="Copy link" onClick={copyLink}><Copy className="w-4 h-4" /></IconBtn>
      <IconBtn title="Open" href={`/proposal/${token}`} target="_blank"><ExternalLink className="w-4 h-4" /></IconBtn>
      {acceptanceId ? (
        <IconBtn title="Download PDF" href={`/api/pdf/${acceptanceId}`} tone="emerald"><Download className="w-4 h-4" /></IconBtn>
      ) : null}
      <IconBtn title="Duplicate" onClick={handleDuplicate} disabled={pending}><Files className="w-4 h-4" /></IconBtn>
      <IconBtn title="Delete" onClick={handleDelete} tone="red" disabled={pending}><Trash2 className="w-4 h-4" /></IconBtn>
    </div>
  );
}

function IconBtn({
  children, title, href, onClick, target, disabled, tone = 'default',
}: {
  children: React.ReactNode;
  title: string;
  href?: string;
  onClick?: () => void;
  target?: string;
  disabled?: boolean;
  tone?: 'default' | 'emerald' | 'red';
}) {
  const colors: Record<string, string> = {
    default: 'text-cream/45 hover:text-orange',
    emerald: 'text-emerald-300 hover:text-emerald-200',
    red: 'text-cream/45 hover:text-red-400',
  };
  const cls = `p-2 transition-colors ${colors[tone]} disabled:opacity-40 disabled:cursor-not-allowed`;
  if (href) {
    return (
      <Link href={href} target={target} title={title} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} title={title} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
