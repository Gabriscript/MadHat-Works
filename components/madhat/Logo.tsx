import Link from 'next/link';

export function Logo({ href = '/', size = 'md' }: { href?: string; size?: 'sm' | 'md' | 'lg' }) {
  const fontSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl';
  return (
    <Link href={href} className="inline-flex items-center gap-3 no-underline group">
      <span className="w-7 h-7 bg-orange flex items-center justify-center group-hover:bg-orange-bright transition-colors">
        <span className="font-serif font-black text-navy text-sm leading-none translate-y-px">M</span>
      </span>
      <span className={`font-serif font-bold ${fontSize} text-cream tracking-tight`}>
        Mad<span className="text-orange">Hat</span>
      </span>
    </Link>
  );
}
