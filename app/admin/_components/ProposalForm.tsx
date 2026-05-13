'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ListEditor } from './ListEditor';
import { createProposal, updateProposal } from '@/lib/actions/proposals';
import { Save, Copy, ExternalLink, Download } from 'lucide-react';
import type { Duration, ProposalStatus } from '@/lib/types';
import { StatusBadge } from '@/components/madhat/StatusBadge';

type Template = {
  id: string;
  name: string;
  description: string;
  deliverables: string[];
  includedServices: string[];
  excludedServices: string[];
  oneTimePrice: number | null;
  monthlyFee: number | null;
  suggestedDuration: string;
};

export type ProposalFormInitial = {
  id?: string;
  token?: string;
  status?: ProposalStatus;
  templateId: string | null;
  title: string;
  clientName: string;
  clientEmail: string;
  companyName: string | null;
  description: string;
  deliverables: string[];
  includedServices: string[];
  excludedServices: string[];
  oneTimePrice: number | null;
  monthlyFee: number | null;
  duration: Duration;
  timeline: string | null;
  expiresAt: string | null; // ISO date (yyyy-mm-dd)
  acceptanceId?: string | null;
};

const BLANK: ProposalFormInitial = {
  templateId: null,
  title: '',
  clientName: '',
  clientEmail: '',
  companyName: '',
  description: '',
  deliverables: [],
  includedServices: [],
  excludedServices: [],
  oneTimePrice: null,
  monthlyFee: null,
  duration: 'ONE_TIME',
  timeline: '',
  expiresAt: null,
};

export function ProposalForm({
  initial, templates,
}: { initial?: ProposalFormInitial; templates: Template[] }) {
  const [data, setData] = useState<ProposalFormInitial>(initial ?? BLANK);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const proposalUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/proposal/${initial?.token ?? ''}`;

  const applyTemplate = (id: string) => {
    if (id === '') {
      setData((d) => ({ ...d, templateId: null }));
      return;
    }
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setData((d) => ({
      ...d,
      templateId: t.id,
      // Pre-fill only blank fields on first apply, but make it easy to overwrite all when switching:
      title: d.title || `${t.name} — Proposal`,
      description: t.description,
      deliverables: t.deliverables,
      includedServices: t.includedServices,
      excludedServices: t.excludedServices,
      oneTimePrice: t.oneTimePrice,
      monthlyFee: t.monthlyFee,
      duration: t.suggestedDuration as Duration,
    }));
  };

  const submit = (e: React.FormEvent<HTMLFormElement>, statusOverride?: ProposalStatus) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set('templateId', data.templateId ?? '');
    fd.set('title', data.title);
    fd.set('clientName', data.clientName);
    fd.set('clientEmail', data.clientEmail);
    fd.set('companyName', data.companyName ?? '');
    fd.set('description', data.description);
    fd.set('deliverables', JSON.stringify(data.deliverables));
    fd.set('includedServices', JSON.stringify(data.includedServices));
    fd.set('excludedServices', JSON.stringify(data.excludedServices));
    fd.set('oneTimePrice', data.oneTimePrice == null ? '' : String(data.oneTimePrice));
    fd.set('monthlyFee', data.monthlyFee == null ? '' : String(data.monthlyFee));
    fd.set('duration', data.duration);
    fd.set('timeline', data.timeline ?? '');
    fd.set('expiresAt', data.expiresAt ?? '');
    if (statusOverride) fd.set('status', statusOverride);
    else if (data.status) fd.set('status', data.status);

    startTransition(async () => {
      try {
        if (isEdit && initial?.id) {
          const r = await updateProposal(initial.id, null, fd);
          if (r && 'ok' in r) {
            if (r.ok) {
              toast.success('Saved');
              router.refresh();
            } else toast.error(r.error);
          }
        } else {
          const r = await createProposal(null, fd);
          if (r && 'ok' in r && r.ok === false) toast.error(r.error);
        }
      } catch {
        // redirect throws on success — ignore
      }
    });
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(proposalUrl);
    toast.success('Proposal link copied');
  };

  return (
    <form onSubmit={submit} className="space-y-12">
      {isEdit && initial?.token && (
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between p-5 border border-orange/30 bg-orange/[0.04]">
          <div className="flex items-center gap-4 flex-wrap">
            <StatusBadge status={(data.status ?? 'DRAFT') as ProposalStatus} />
            <code className="text-cream/70 text-xs break-all">{proposalUrl}</code>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={copyLink} className="mh-btn-dark inline-flex items-center gap-2">
              <Copy className="w-3.5 h-3.5" /> Copy link
            </button>
            <Link href={`/proposal/${initial.token}`} target="_blank" className="mh-btn-dark inline-flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" /> Preview
            </Link>
            {initial.acceptanceId ? (
              <Link href={`/api/pdf/${initial.acceptanceId}`} className="mh-btn-primary inline-flex items-center gap-2">
                <Download className="w-3.5 h-3.5" strokeWidth={3} /> PDF
              </Link>
            ) : null}
          </div>
        </div>
      )}

      <section className="space-y-4">
        <Label>Start from template (optional)</Label>
        <div className="flex flex-wrap gap-3">
          <TemplateChip selected={!data.templateId} onClick={() => applyTemplate('')} label="Blank" />
          {templates.map((t) => (
            <TemplateChip key={t.id} selected={data.templateId === t.id} onClick={() => applyTemplate(t.id)} label={t.name} />
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-8">
        <div className="space-y-2 md:col-span-2">
          <Label>Proposal title</Label>
          <input className="mh-input" value={data.title} onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))} required placeholder="e.g. Growth website + WhatsApp automations" />
        </div>
        <div className="space-y-2">
          <Label>Client name</Label>
          <input className="mh-input" value={data.clientName} onChange={(e) => setData((d) => ({ ...d, clientName: e.target.value }))} required placeholder="e.g. Lorenzo Rossi" />
        </div>
        <div className="space-y-2">
          <Label>Client email</Label>
          <input type="email" className="mh-input" value={data.clientEmail} onChange={(e) => setData((d) => ({ ...d, clientEmail: e.target.value }))} required placeholder="client@email.com" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Company (optional)</Label>
          <input className="mh-input" value={data.companyName ?? ''} onChange={(e) => setData((d) => ({ ...d, companyName: e.target.value }))} placeholder="Company name" />
        </div>
      </section>

      <section className="space-y-2">
        <Label>Description (what the client sees first)</Label>
        <textarea className="mh-input min-h-[120px] resize-vertical" value={data.description} onChange={(e) => setData((d) => ({ ...d, description: e.target.value }))} required placeholder="Briefly describe the project, goals and value." />
      </section>

      <section className="grid md:grid-cols-3 gap-8">
        <div className="space-y-2">
          <Label>One-time price (€)</Label>
          <input type="number" min="0" step="1" className="mh-input" placeholder="e.g. 499" value={data.oneTimePrice ?? ''} onChange={(e) => setData((d) => ({ ...d, oneTimePrice: e.target.value === '' ? null : Number(e.target.value) }))} />
        </div>
        <div className="space-y-2">
          <Label>Monthly fee (€)</Label>
          <input type="number" min="0" step="1" className="mh-input" placeholder="e.g. 199" value={data.monthlyFee ?? ''} onChange={(e) => setData((d) => ({ ...d, monthlyFee: e.target.value === '' ? null : Number(e.target.value) }))} />
        </div>
        <div className="space-y-2">
          <Label>Duration</Label>
          <select className="mh-input" value={data.duration} onChange={(e) => setData((d) => ({ ...d, duration: e.target.value as Duration }))}>
            <option value="ONE_TIME">One-time</option>
            <option value="MONTHS_3">3 months</option>
            <option value="MONTHS_6">6 months</option>
            <option value="MONTHS_12">12 months</option>
          </select>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <Label>Timeline (optional)</Label>
          <input className="mh-input" value={data.timeline ?? ''} onChange={(e) => setData((d) => ({ ...d, timeline: e.target.value }))} placeholder="e.g. Online in 7 days" />
        </div>
        <div className="space-y-2">
          <Label>Expires at (optional)</Label>
          <input type="date" className="mh-input" value={data.expiresAt ?? ''} onChange={(e) => setData((d) => ({ ...d, expiresAt: e.target.value || null }))} />
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-8">
        <ListEditor label="Deliverables" items={data.deliverables} onChange={(deliverables) => setData((d) => ({ ...d, deliverables }))} placeholder="e.g. 3-page professional website" />
        <ListEditor label="Included services" items={data.includedServices} onChange={(includedServices) => setData((d) => ({ ...d, includedServices }))} placeholder="e.g. Hosting & domain" />
      </section>

      <section>
        <ListEditor accent="mute" label="Excluded / not included" items={data.excludedServices} onChange={(excludedServices) => setData((d) => ({ ...d, excludedServices }))} placeholder="e.g. Premium SEO" />
      </section>

      <div className="sticky bottom-0 -mx-6 md:-mx-12 px-6 md:px-12 py-5 bg-navy/95 backdrop-blur border-t border-cream/10 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <p className="text-xs text-cream/45">Every change is saved on submit. Share the link only after status → PENDING.</p>
        <div className="flex gap-3">
          {!isEdit ? (
            <>
              <button type="button" disabled={pending} onClick={(e) => submit(e as unknown as React.FormEvent<HTMLFormElement>, 'DRAFT')} className="mh-btn-dark">Save as draft</button>
              <button type="submit" disabled={pending} onClick={() => setData((d) => ({ ...d, status: 'PENDING' }))} className="mh-btn-primary inline-flex items-center gap-2">
                <Save className="w-4 h-4" strokeWidth={3} /> {pending ? 'Saving…' : 'Create & ready to send'}
              </button>
            </>
          ) : (
            <>
              <select value={data.status ?? 'DRAFT'} onChange={(e) => setData((d) => ({ ...d, status: e.target.value as ProposalStatus }))} className="mh-input w-auto">
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending (share link)</option>
                <option value="EXPIRED">Expired</option>
              </select>
              <button type="submit" disabled={pending} className="mh-btn-primary inline-flex items-center gap-2">
                <Save className="w-4 h-4" strokeWidth={3} /> {pending ? 'Saving…' : 'Save changes'}
              </button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[0.62rem] font-bold uppercase tracking-wider-2 text-cream/45">{children}</label>;
}

function TemplateChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`text-[0.7rem] uppercase tracking-wider-2 font-semibold px-4 py-2 border transition-colors ${
        selected ? 'bg-orange border-orange text-navy' : 'border-cream/15 text-cream/70 hover:border-orange hover:text-orange-pale'
      }`}>{label}</button>
  );
}
