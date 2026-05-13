import { loadTermsBoth } from '@/lib/terms';
import { TermsView } from '@/app/terms/TermsView';
import { Logo } from '@/components/madhat/Logo';
import Link from 'next/link';

export default async function PrivacyPage() {
  const { en, it } = loadTermsBoth('privacy');
  return (
    <div className="min-h-screen bg-navy">
      <nav className="sticky top-0 z-40 px-6 md:px-16 py-5 bg-navy/95 backdrop-blur border-b border-orange/10 flex items-center justify-between">
        <Logo href="/" />
        <Link href="/terms" className="text-[0.7rem] uppercase tracking-wider-2 text-cream/55 hover:text-orange-pale">Terms</Link>
      </nav>
      <TermsView en={en} it={it} kind="privacy" />
    </div>
  );
}
