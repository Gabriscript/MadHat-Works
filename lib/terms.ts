import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { sha256 } from './utils-server';
import type { TermsLang } from './types';

export type TermsKind = 'terms' | 'privacy';

export type TermsContent = {
  html: string;
  raw: string;
  version: string;
  hash: string;
  lang: TermsLang;
  kind: TermsKind;
  toc: { id: string; text: string; level: number }[];
};

export function loadTerms(kind: TermsKind, lang: TermsLang): TermsContent {
  const filePath = path.join(process.cwd(), 'content', `${kind}-${lang.toLowerCase()}.md`);
  const file = fs.readFileSync(filePath, 'utf-8');
  const { content, data } = matter(file);
  const version = (data?.version as string) || '1.0.0';

  // Build a TOC from H2 headings and inject anchor ids.
  const toc: { id: string; text: string; level: number }[] = [];
  const renderer = new marked.Renderer();
  renderer.heading = ({ tokens, depth }) => {
    const rawText = tokens
      .map((t) => (t as { raw?: string; text?: string }).text || (t as { raw?: string }).raw || '')
      .join('');
    // Decode common HTML entities so the TOC reads naturally.
    const text = rawText
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    if (depth === 2) toc.push({ id, text, level: depth });
    return `<h${depth} id="${id}">${text}</h${depth}>`;
  };

  marked.setOptions({ gfm: true, breaks: false });
  const html = marked.parse(content, { renderer, async: false }) as string;
  const hash = sha256(content).slice(0, 16);

  return { html, raw: content, version, hash, lang, kind, toc };
}

export function loadTermsBoth(kind: TermsKind): { en: TermsContent; it: TermsContent } {
  return {
    en: loadTerms(kind, 'EN'),
    it: loadTerms(kind, 'IT'),
  };
}
