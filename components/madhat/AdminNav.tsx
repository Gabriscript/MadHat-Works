'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { Logo } from './Logo';
import { LayoutDashboard, FilePlus, Files, LogOut } from 'lucide-react';
import { logoutAction } from '@/app/login/actions';

const items = [
  { href: '/admin',           label: 'Proposals',  icon: LayoutDashboard, exact: true },
  { href: '/admin/new',       label: 'New',        icon: FilePlus,        exact: false },
  { href: '/admin/templates', label: 'Templates',  icon: Files,           exact: false },
];

export function AdminNav() {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const logout = () => {
    if (!confirm('Log out of the admin dashboard?')) return;
    startTransition(() => {
      // Server action; redirect happens server-side.
      logoutAction().catch(() => {});
    });
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-40 px-6 md:px-12 py-4 flex items-center justify-between bg-navy/95 backdrop-blur border-b border-orange/20">
      <div className="flex items-center gap-10">
        <Logo href="/admin" size="sm" />
        <ul className="hidden md:flex items-center gap-6">
          {items.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-wider-2 font-semibold transition-colors ${
                    active ? 'text-orange' : 'text-cream/55 hover:text-orange-pale'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[0.6rem] uppercase tracking-widest-2 text-cream/35 hidden sm:inline">Internal · Admin</span>
        <button
          type="button"
          onClick={logout}
          disabled={pending}
          className="inline-flex items-center gap-1.5 text-[0.7rem] uppercase tracking-wider-2 font-semibold text-cream/55 hover:text-orange-pale transition-colors disabled:opacity-50"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span className="hidden sm:inline">{pending ? 'Bye…' : 'Sign out'}</span>
        </button>
      </div>
    </nav>
  );
}
