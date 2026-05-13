import { TemplateForm } from '@/app/admin/_components/TemplateForm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
export default function NewTemplatePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/admin/templates" className="inline-flex items-center gap-2 text-xs uppercase tracking-wider-2 text-cream/45 hover:text-orange-pale mb-8">
        <ChevronLeft className="w-3.5 h-3.5" /> Back to templates
      </Link>
      <p className="mh-label mb-5">New template</p>
      <h1 className="mh-headline text-4xl mb-12">Create a <em>blueprint</em>.</h1>
      <TemplateForm />
    </div>
  );
}
