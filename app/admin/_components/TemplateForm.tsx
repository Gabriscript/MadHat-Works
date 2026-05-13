'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ListEditor } from './ListEditor';
import { createTemplate, updateTemplate, deleteTemplate } from '@/lib/actions/templates';
import { Save, Trash2 } from 'lucide-react';
import type { Duration } from '@/lib/types';

type Initial = {
  id?: string;
  name: string;
  description: string;
  deliverables: string[];
  includedServices: string[];
  excludedServices: string[];
  oneTimePrice: number | null;
  monthlyFee: number | null;
  suggestedDuration: Duration;
};

const BLANK: Initial = {
  name: '',
  description: '',
  deliverables: [],
  includedServices: [],
  excludedServices: [],
  oneTimePrice: null,
  monthlyFee: null,
  suggestedDuration: 'ONE_TIME',
};

export function TemplateForm({ initial }: { initial?: Initial }) {
  const [data, setData] = useState<Initial>(initial ?? BLANK);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set('name', data.name);
    fd.set('description', data.description);
    fd.set('deliverables', JSON.stringify(data.deliverables));
    fd.set('includedServices', JSON.stringify(data.includedServices));
    fd.set('excludedServices', JSON.stringify(data.excludedServices));
    fd.set('oneTimePrice', data.oneTimePrice == null ? '' : String(data.oneTimePrice));
    fd.set('monthlyFee', data.monthlyFee == null ? '' : String(data.monthlyFee));
    fd.set('suggestedDuration', data.suggestedDuration);

    startTransition(async () => {
      try {
        if (isEdit && initial?.id) {
          const r = await updateTemplate(initial.id, null, fd);
          if (r && 'ok' in r && r.ok === false) toast.error(r.error);
        } else {
          const r = await createTemplate(null, fd);
          if (r && 'ok' in r && r.ok === false) toast.error(r.error);
        }
      } catch {
        // redirect throws on success — ignore
      }
    });
  };

  const remove = () => {
    if (!initial?.id) return;
    if (!confirm('Delete this template? Proposals already created from it are unaffected.')) return;
    startTransition(async () => {
      await deleteTemplate(initial.id!);
      toast.success('Template deleted');
      router.push('/admin/templates');
    });
  };

  return (
    <form onSubmit={submit} className="space-y-10">
      <section className="grid md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <Label>Name</Label>
          <input className="mh-input" value={data.name} onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Growth" required />
        </div>
        <div className="space-y-2">
          <Label>Suggested duration</Label>
          <select className="mh-input" value={data.suggestedDuration} onChange={(e) => setData((d) => ({ ...d, suggestedDuration: e.target.value as Duration }))}>
            <option value="ONE_TIME">One-time</option>
            <option value="MONTHS_3">3 months</option>
            <option value="MONTHS_6">6 months</option>
            <option value="MONTHS_12">12 months</option>
          </select>
        </div>
      </section>

      <section className="space-y-2">
        <Label>Description</Label>
        <textarea className="mh-input min-h-[110px] resize-vertical" value={data.description} onChange={(e) => setData((d) => ({ ...d, description: e.target.value }))} placeholder="Short description shown to the client." required />
      </section>

      <section className="grid md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <Label>One-time price (€)</Label>
          <input type="number" min="0" step="1" className="mh-input" placeholder="e.g. 499" value={data.oneTimePrice ?? ''} onChange={(e) => setData((d) => ({ ...d, oneTimePrice: e.target.value === '' ? null : Number(e.target.value) }))} />
        </div>
        <div className="space-y-2">
          <Label>Monthly fee (€)</Label>
          <input type="number" min="0" step="1" className="mh-input" placeholder="e.g. 199" value={data.monthlyFee ?? ''} onChange={(e) => setData((d) => ({ ...d, monthlyFee: e.target.value === '' ? null : Number(e.target.value) }))} />
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-8">
        <ListEditor label="Deliverables" items={data.deliverables} onChange={(deliverables) => setData((d) => ({ ...d, deliverables }))} placeholder="e.g. One-page professional website" />
        <ListEditor label="Included services" items={data.includedServices} onChange={(includedServices) => setData((d) => ({ ...d, includedServices }))} placeholder="e.g. Hosting & domain" />
      </section>

      <section>
        <ListEditor accent="mute" label="Excluded / not included" items={data.excludedServices} onChange={(excludedServices) => setData((d) => ({ ...d, excludedServices }))} placeholder="e.g. Advanced SEO" />
      </section>

      <div className="flex items-center justify-between pt-6 border-t border-cream/10">
        <div>
          {isEdit && (
            <button type="button" onClick={remove} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider-2 text-red-300 hover:text-red-200">
              <Trash2 className="w-3.5 h-3.5" /> Delete template
            </button>
          )}
        </div>
        <button type="submit" disabled={pending} className="mh-btn-primary inline-flex items-center gap-2">
          <Save className="w-4 h-4" strokeWidth={3} /> {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create template'}
        </button>
      </div>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[0.62rem] font-bold uppercase tracking-wider-2 text-cream/45">{children}</label>;
}
