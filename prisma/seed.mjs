// Seed script — runs with `prisma db seed`
// Imports the same dev client and inserts 4 default templates + initial Terms versions.
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const prisma = new PrismaClient();

function sha256(s) {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

async function seedTermsVersions() {
  const docs = [
    { kind: 'terms', lang: 'EN' },
    { kind: 'terms', lang: 'IT' },
    { kind: 'privacy', lang: 'EN' },
    { kind: 'privacy', lang: 'IT' },
  ];
  for (const d of docs) {
    const file = fs.readFileSync(
      path.join(process.cwd(), 'content', `${d.kind}-${d.lang.toLowerCase()}.md`),
      'utf-8'
    );
    const { content, data } = matter(file);
    const version = (data?.version) || '1.0.0';
    const hash = sha256(content).slice(0, 16);
    await prisma.termsVersion.upsert({
      where: { version_lang: { version, lang: d.lang } },
      update: { hash },
      create: { version, lang: d.lang, hash },
    });
  }
}

async function seedTemplates() {
  const templates = [
    {
      name: 'Starter',
      description:
        'Il modo più veloce per essere online e credibile. Un sito professionale, mobile-first, pronto in pochi giorni.',
      deliverables: [
        'Sito web one-page professionale',
        'Design su misura ottimizzato mobile',
        'Hosting & dominio inclusi',
        'Pubblicazione e go-live',
      ],
      includedServices: [
        'Sito professionale pronto in pochi giorni',
        'Design su misura ottimizzato per mobile',
        'Hosting & dominio inclusi',
        'Aggiustamenti minori inclusi (menu, orari, testi)',
      ],
      excludedServices: [
        'Pagine extra (+50€/pagina)',
        'Aggiornamenti contenuti frequenti',
        'Ottimizzazione SEO avanzata',
      ],
      oneTimePrice: 349,
      monthlyFee: 29,
      suggestedDuration: 'ONE_TIME',
    },
    {
      name: 'Growth',
      description:
        'Per chi vuole più richieste e meno clienti persi. Sito, automazioni WhatsApp e ottimizzazione Google Business in un unico piano.',
      deliverables: [
        'Sito web fino a 3 pagine',
        'Setup Segretaria digitale (form → WhatsApp)',
        'Ottimizzazione SEO & Google Business Profile',
        'Setup promemoria WhatsApp e recupero clienti',
      ],
      includedServices: [
        'Tutto del piano Starter',
        'Segretaria digitale (form → WhatsApp)',
        'Ottimizzazione SEO & Google Business Profile',
        'Promemoria WhatsApp e recupero clienti',
        'Gestione attiva e risposta personalizzata recensioni',
        'Report mensile con Analytics',
        'Aggiornamenti contenuti inclusi',
      ],
      excludedServices: ['ChatBot dedicato sul sito', 'Gestione social media'],
      oneTimePrice: 499,
      monthlyFee: 199,
      suggestedDuration: 'MONTHS_6',
    },
    {
      name: 'Full Service',
      description:
        'Tu lavori. Noi gestiamo la presenza online e la visibilità. Soluzione completa per chi vuole delegare tutto.',
      deliverables: [
        'Sito web fino a 5 pagine',
        'ChatBot FAQ integrato',
        'Pagina di autorità professionale',
        'Calendario contenuti social',
      ],
      includedServices: [
        'Tutto del piano Growth',
        'ChatBot incluso',
        'Gestione social media',
        'Pagina di autorità professionale',
        'Aggiornamenti via vocale o testo',
        'Modifiche pubblicate entro 24 ore',
        'Supporto prioritario diretto',
      ],
      excludedServices: [],
      oneTimePrice: 799,
      monthlyFee: 599,
      suggestedDuration: 'MONTHS_12',
    },
    {
      name: 'Custom',
      description:
        'Una proposta su misura. Parti da zero e compila ogni campo a partire dalle esigenze specifiche del cliente.',
      deliverables: [],
      includedServices: [],
      excludedServices: [],
      oneTimePrice: null,
      monthlyFee: null,
      suggestedDuration: 'ONE_TIME',
    },
  ];

  for (const t of templates) {
    // Upsert by name (no unique constraint on name, so check existence)
    const existing = await prisma.proposalTemplate.findFirst({ where: { name: t.name } });
    if (existing) {
      await prisma.proposalTemplate.update({
        where: { id: existing.id },
        data: {
          description: t.description,
          deliverables: JSON.stringify(t.deliverables),
          includedServices: JSON.stringify(t.includedServices),
          excludedServices: JSON.stringify(t.excludedServices),
          oneTimePrice: t.oneTimePrice,
          monthlyFee: t.monthlyFee,
          suggestedDuration: t.suggestedDuration,
        },
      });
    } else {
      await prisma.proposalTemplate.create({
        data: {
          name: t.name,
          description: t.description,
          deliverables: JSON.stringify(t.deliverables),
          includedServices: JSON.stringify(t.includedServices),
          excludedServices: JSON.stringify(t.excludedServices),
          oneTimePrice: t.oneTimePrice,
          monthlyFee: t.monthlyFee,
          suggestedDuration: t.suggestedDuration,
        },
      });
    }
  }
}

async function main() {
  console.log('Seeding TermsVersions…');
  await seedTermsVersions();
  console.log('Seeding ProposalTemplates…');
  await seedTemplates();
  console.log('Seed complete.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
