import Link from 'next/link';
import { Logo } from '@/components/madhat/Logo';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <nav className="fixed top-0 inset-x-0 z-40 px-6 md:px-16 py-5 flex items-center justify-between">
        <Logo />
      </nav>
      <section className="flex-1 flex items-center justify-center px-6 md:px-16 bg-grid-orange">
        <div className="max-w-3xl text-center">
          <p className="mh-label justify-center mb-8">Internal Tool · Proposal Engine</p>
          <h1 className="mh-headline text-[clamp(2.8rem,7vw,5.5rem)] mb-8">
            Proposals that <em>convert</em>.<br /> Numbers that <em>protect</em>.
          </h1>
          <p className="text-cream/60 text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-12">
            The MadHat internal system for creating, sending and legally accepting proposals —
            templates, branded links, typed signatures and PDF archive in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/admin" className="mh-btn-primary">Open dashboard</Link>
            <Link href="/terms" className="mh-btn-ghost">Read Terms</Link>
          </div>
        </div>
      </section>
      <footer className="text-center text-[0.7rem] uppercase tracking-widest-2 text-cream/30 py-6 border-t border-orange/10">
        © {new Date().getFullYear()} MadHat Works — Proposals
      </footer>
    </main>
  );
}
