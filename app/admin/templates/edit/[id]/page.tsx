import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTemplate } from '@/lib/actions/templates';
import { TemplateForm } from '@/app/admin/_components/TemplateForm';
import { ChevronLeft } from 'lucide-react';
import type { Duration } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  const t = await getTemplate(params.id);
  if (!t) notFound();
  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/admin/templates" className="inline-flex items-center gap-2 text-xs uppercase tracking-wider-2 text-cream/45 hover:text-orange-pale mb-8">
        <ChevronLeft className="w-3.5 h-3.5" /> Back to templates
      </Link>
      <p className="mh-label mb-5">Edit template</p>
      <h1 className="mh-headline text-4xl mb-12">{t.name}</h1>
      <TemplateForm initial={{
        id: t.id,
        name: t.name,
        description: t.description,
        deliverables: t.deliverables,
        includedServices: t.includedServices,
        excludedServices: t.excludedServices,
        oneTimePrice: t.oneTimePrice,
        monthlyFee: t.monthlyFee,
        suggestedDuration: t.suggestedDuration as Duration,
      }} />
    </div>
  );
}
