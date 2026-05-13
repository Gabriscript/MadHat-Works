import Link from 'next/link';
import { listTemplates } from '@/lib/actions/templates';
import { formatEUR } from '@/lib/format';
import { Plus, Pencil } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  const templates = await listTemplates();
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <p className="mh-label mb-5">Library · Templates</p>
          <h1 className="mh-headline text-[clamp(2rem,4vw,3.5rem)]">Reusable <em>blueprints</em>.</h1>
          <p className="text-cream/55 text-sm mt-3 max-w-lg">Edit anything you want — every field is overridable when you create a proposal.</p>
        </div>
        <Link href="/admin/templates/new" className="mh-btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" strokeWidth={3} /> New template
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-orange/10">
        {templates.map((t) => (
          <Link key={t.id} href={`/admin/templates/edit/${t.id}`} className="bg-navy-mid p-7 hover:bg-navy-light transition-colors group flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-serif font-bold text-2xl group-hover:text-orange-pale transition-colors">{t.name}</h3>
              <Pencil className="w-3.5 h-3.5 text-cream/35 group-hover:text-orange transition-colors" />
            </div>
            <p className="text-cream/55 text-sm leading-relaxed mb-5 flex-1">{t.description || 'No description yet.'}</p>
            <div className="flex items-end justify-between pt-4 border-t border-cream/8">
              <div>
                <div className="font-serif font-black text-2xl text-cream">{formatEUR(t.oneTimePrice)}<span className="text-cream/40 text-xs font-sans font-normal ml-1">setup</span></div>
                {t.monthlyFee != null && <div className="text-xs text-cream/45 mt-1">{formatEUR(t.monthlyFee)} / month</div>}
              </div>
              <span className="text-[0.6rem] uppercase tracking-widest-2 text-orange font-semibold">
                {t.includedServices.length + t.deliverables.length} items
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
