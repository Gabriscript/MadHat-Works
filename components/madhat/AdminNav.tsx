'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { LayoutDashboard, FilePlus, Files } from 'lucide-react';

const items = [
  { href: '/admin',           label: 'Proposals',  icon: LayoutDashboard, exact: true },
  { href: '/admin/new',       label: 'New',        icon: FilePlus,        exact: false },
  { href: '/admin/templates', label: 'Templates',  icon: Files,           exact: false },
];

export function AdminNav() {
  const pathname = usePathname();
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
      <span className="text-[0.6rem] uppercase tracking-widest-2 text-cream/35 hidden sm:inline">Internal · Admin</span>
    </nav>
  );
}
