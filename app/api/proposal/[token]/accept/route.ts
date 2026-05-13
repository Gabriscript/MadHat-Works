import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { prisma } from '@/lib/db';
import { loadTerms } from '@/lib/terms';
import { ProposalPdf } from '@/lib/pdf';
import { parseJsonArr, ensurePdfDir, rateLimit, sha256 } from '@/lib/utils-server';
import type { Duration, ProposalStatus } from '@/lib/types';

const AcceptanceSchema = z.object({
  clientName: z.string().trim().min(1, 'Name is required').max(120),
  clientEmail: z.string().trim().email('Valid email required'),
  typedSignature: z.string().trim().min(1, 'Signature is required').max(120),
  checkboxTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept the Terms.' }) }),
  checkboxPrivacy: z.literal(true, { errorMap: () => ({ message: 'You must accept the Privacy Policy.' }) }),
  browserLanguage: z.string().nullable().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  // --- 1. Same-origin / CSRF check ----------------------------------------
  // Server Actions handle this automatically; here we enforce manually.
  const origin = req.headers.get('origin') || '';
  const host = req.headers.get('host') || '';
  if (origin) {
    try {
      const url = new URL(origin);
      if (url.host !== host) {
        return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Bad origin' }, { status: 403 });
    }
  }

  // --- 2. Rate limit per IP -----------------------------------------------
  const fwd = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const ip = fwd || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const acceptLang = req.headers.get('accept-language') || null;
  const rl = rateLimit(`accept:${ip}`, { limit: 6, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a minute and try again.' },
      { status: 429 }
    );
  }

  // --- 3. Parse + validate body ------------------------------------------
  let body: Record<string, unknown>;
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    body = (await req.json()) as Record<string, unknown>;
  } else {
    const fd = await req.formData();
    body = {
      clientName: fd.get('clientName'),
      clientEmail: fd.get('clientEmail'),
      typedSignature: fd.get('typedSignature'),
      checkboxTerms: fd.get('checkboxTerms') === 'on' || fd.get('checkboxTerms') === 'true',
      checkboxPrivacy: fd.get('checkboxPrivacy') === 'on' || fd.get('checkboxPrivacy') === 'true',
      browserLanguage: fd.get('browserLanguage'),
    };
  }
  // Normalize boolean strings from JSON too
  if (typeof body.checkboxTerms === 'string') body.checkboxTerms = body.checkboxTerms === 'true' || body.checkboxTerms === 'on';
  if (typeof body.checkboxPrivacy === 'string') body.checkboxPrivacy = body.checkboxPrivacy === 'true' || body.checkboxPrivacy === 'on';

  const v = AcceptanceSchema.safeParse(body);
  if (!v.success) {
    return NextResponse.json({ error: v.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  // --- 4. Look up proposal ------------------------------------------------
  const proposal = await prisma.proposal.findUnique({
    where: { token: params.token },
    include: { acceptance: true },
  });
  if (!proposal) return NextResponse.json({ error: 'Proposal not found.' }, { status: 404 });
  if (proposal.status === 'ACCEPTED' || proposal.acceptance) {
    return NextResponse.json({ error: 'This proposal has already been accepted.' }, { status: 409 });
  }
  if (proposal.status === 'EXPIRED' || (proposal.expiresAt && proposal.expiresAt < new Date())) {
    return NextResponse.json({ error: 'This proposal has expired.' }, { status: 410 });
  }

  // --- 5. Terms / Privacy hash + version ---------------------------------
  const lang: 'EN' | 'IT' = (v.data.browserLanguage || acceptLang || '').toLowerCase().startsWith('it') ? 'IT' : 'EN';
  const terms = loadTerms('terms', lang);
  const privacy = loadTerms('privacy', lang);
  const acceptedTermsVersion = `terms-${terms.version}+privacy-${privacy.version}`;
  const acceptedTermsHash = sha256(`${terms.hash}|${privacy.hash}|${terms.lang}`).slice(0, 32);

  // --- 6. Persist acceptance + flip status (transactional) ---------------
  const acceptance = await prisma.$transaction(async (tx) => {
    const a = await tx.proposalAcceptance.create({
      data: {
        proposalId: proposal.id,
        clientName: v.data.clientName,
        clientEmail: v.data.clientEmail,
        typedSignature: v.data.typedSignature,
        acceptedTermsVersion,
        acceptedTermsHash,
        ipAddress: ip,
        userAgent,
        browserLanguage: v.data.browserLanguage ?? acceptLang ?? null,
        checkboxTerms: v.data.checkboxTerms,
        checkboxPrivacy: v.data.checkboxPrivacy,
      },
    });
    await tx.proposal.update({
      where: { id: proposal.id },
      data: { status: 'ACCEPTED' as ProposalStatus },
    });
    return a;
  });

  // --- 7. Generate branded PDF (best-effort) -----------------------------
  let pdfId: string | null = null;
  try {
    const dir = ensurePdfDir();
    const pdfPath = path.join(dir, `${acceptance.id}.pdf`);
    const buffer = await renderToBuffer(
      React.createElement(ProposalPdf, {
        proposal: {
          title: proposal.title,
          clientName: v.data.clientName,
          clientEmail: v.data.clientEmail,
          companyName: proposal.companyName,
          description: proposal.description,
          deliverables: parseJsonArr(proposal.deliverables),
          includedServices: parseJsonArr(proposal.includedServices),
          excludedServices: parseJsonArr(proposal.excludedServices),
          oneTimePrice: proposal.oneTimePrice,
          monthlyFee: proposal.monthlyFee,
          duration: proposal.duration as Duration,
          timeline: proposal.timeline,
        },
        acceptance: {
          acceptedAt: acceptance.acceptedAt,
          typedSignature: v.data.typedSignature,
          acceptedTermsVersion,
          acceptedTermsHash,
          ipAddress: ip,
        },
      }) as Parameters<typeof renderToBuffer>[0]
    );
    fs.writeFileSync(pdfPath, buffer);
    await prisma.proposalAcceptance.update({
      where: { id: acceptance.id },
      data: { pdfPath: `public/pdfs/${acceptance.id}.pdf` },
    });
    pdfId = acceptance.id;
  } catch (err) {
    console.error('PDF generation failed', err);
  }

  return NextResponse.json({ ok: true, acceptanceId: acceptance.id, pdfId });
}
