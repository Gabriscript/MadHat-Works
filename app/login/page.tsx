import { Logo } from '@/components/madhat/Logo';
import { LoginForm } from './LoginForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  const from = searchParams?.from || '/admin';
  return (
    <main className="min-h-screen flex flex-col bg-navy bg-grid-orange">
      <header className="px-6 md:px-16 py-6 flex items-center justify-between">
        <Logo href="/" />
        <span className="text-[0.62rem] uppercase tracking-widest-2 text-cream/35 hidden sm:inline">Internal Access</span>
      </header>

      <section className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-navy-mid border border-cream/8 p-10 md:p-12">
          <p className="mh-label mb-5">Restricted</p>
          <h1 className="mh-headline text-3xl md:text-4xl mb-3">
            Welcome <em>back</em>.
          </h1>
          <p className="text-cream/55 text-sm leading-relaxed mb-8">
            This dashboard is for the MadHat team. Enter the shared access password to continue.
          </p>
          <LoginForm from={from} />
          <p className="text-[0.62rem] uppercase tracking-wider-2 text-cream/35 mt-10 leading-relaxed">
            Lost the password? Ask the admin to share it again — it lives in <code className="text-cream/55">.env</code> as <code className="text-cream/55">ADMIN_PASSWORD</code>.
          </p>
        </div>
      </section>

      <footer className="px-6 md:px-16 py-6 border-t border-orange/10 flex items-center justify-between text-[0.65rem] uppercase tracking-wider-2 text-cream/35">
        <span>© {new Date().getFullYear()} MadHat Works</span>
        <div className="flex gap-6">
          <Link href="/terms" className="hover:text-orange-pale">Terms</Link>
          <Link href="/privacy" className="hover:text-orange-pale">Privacy</Link>
        </div>
      </footer>
    </main>
  );
}
