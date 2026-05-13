'use client';

import { useState } from 'react';
import type { TermsContent } from '@/lib/terms';

export function TermsView({ en, it, kind }: { en: TermsContent; it: TermsContent; kind: 'terms' | 'privacy' }) {
  const [lang, setLang] = useState<'EN' | 'IT'>('EN');
  const content = lang === 'EN' ? en : it;

  return (
    <article className="px-6 md:px-16 py-16 md:py-24 max-w-6xl mx-auto grid md:grid-cols-12 gap-12">
      <aside className="md:col-span-3 md:sticky md:top-24 md:self-start space-y-6">
        <div className="flex border border-cream/15">
          {(['EN', 'IT'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`flex-1 text-[0.7rem] uppercase tracking-wider-2 py-2.5 font-bold transition-colors ${
                lang === l ? 'bg-orange text-navy' : 'text-cream/45 hover:text-cream'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <nav className="hidden md:block">
          <p className="text-[0.6rem] uppercase tracking-widest-2 text-cream/35 mb-3 font-semibold">Contents</p>
          <ul className="space-y-2 text-sm border-l border-cream/10">
            {content.toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="block pl-4 -ml-px border-l border-transparent hover:border-orange hover:text-orange-pale text-cream/65 py-1 transition-colors">
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="text-[0.62rem] uppercase tracking-wider-2 text-cream/35 space-y-1 pt-4 border-t border-cream/10">
          <div>Version: <span className="text-cream/65">{content.version}</span></div>
          <div>Hash: <code className="text-cream/65">{content.hash}</code></div>
        </div>
      </aside>

      <main className="md:col-span-9">
        <p className="mh-label mb-6">{kind === 'terms' ? 'Legal · Terms' : 'Legal · Privacy'}</p>
        <div className="prose-mh" dangerouslySetInnerHTML={{ __html: content.html }} />
      </main>

      <style jsx global>{`
        .prose-mh h1 { font-family: var(--font-serif); font-weight: 900; font-size: clamp(2.4rem, 4vw, 3.6rem); line-height: 1.05; letter-spacing: -0.02em; margin-bottom: 1.25rem; }
        .prose-mh h2 { font-family: var(--font-serif); font-weight: 800; font-size: 1.65rem; margin-top: 2.75rem; margin-bottom: 1rem; color: #F5F0E8; }
        .prose-mh h2::before { content: '— '; color: #C4561A; }
        .prose-mh p, .prose-mh li { font-size: 0.97rem; line-height: 1.85; color: rgba(245, 240, 232, 0.75); margin-bottom: 1rem; }
        .prose-mh strong { color: #F5F0E8; font-weight: 700; }
        .prose-mh em { font-style: italic; color: #F4A56A; }
        .prose-mh a { color: #F4A56A; text-decoration: underline; text-underline-offset: 3px; }
        .prose-mh a:hover { color: #C4561A; }
        .prose-mh ul { padding-left: 1.25rem; margin-bottom: 1rem; list-style: disc; }
        .prose-mh ul li::marker { color: #C4561A; }
        .prose-mh hr { border: none; border-top: 1px solid rgba(245, 240, 232, 0.1); margin: 2rem 0; }
        .prose-mh code { background: rgba(245, 240, 232, 0.06); padding: 0.1rem 0.4rem; font-size: 0.85em; }
      `}</style>
    </article>
  );
}
