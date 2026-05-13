'use server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { generateProposalToken, parseJsonArr } from '@/lib/utils-server';
import type { ProposalFormData, ProposalStatus } from '@/lib/types';

const ProposalSchema = z.object({
  templateId: z.string().nullable().optional(),
  title: z.string().trim().min(1, 'Title is required').max(140),
  clientName: z.string().trim().min(1, 'Client name is required').max(120),
  clientEmail: z.string().trim().email('Valid email required'),
  companyName: z.string().trim().max(120).nullable().optional(),
  description: z.string().trim().min(1, 'Description is required'),
  deliverables: z.array(z.string().trim().min(1)),
  includedServices: z.array(z.string().trim().min(1)),
  excludedServices: z.array(z.string().trim().min(1)),
  oneTimePrice: z.number().nullable(),
  monthlyFee: z.number().nullable(),
  duration: z.enum(['ONE_TIME', 'MONTHS_3', 'MONTHS_6', 'MONTHS_12']),
  timeline: z.string().nullable().optional(),
  expiresAt: z.date().nullable().optional(),
});

export async function listProposals() {
  const items = await prisma.proposal.findMany({
    orderBy: { createdAt: 'desc' },
    include: { acceptance: true, template: { select: { name: true } } },
  });
  return items.map((p) => ({ ...p, deliverables: parseJsonArr(p.deliverables) }));
}

export async function getProposal(id: string) {
  const p = await prisma.proposal.findUnique({
    where: { id },
    include: { acceptance: true, template: true },
  });
  if (!p) return null;
  return {
    ...p,
    deliverables: parseJsonArr(p.deliverables),
    includedServices: parseJsonArr(p.includedServices),
    excludedServices: parseJsonArr(p.excludedServices),
  };
}

export async function getProposalByToken(token: string) {
  const p = await prisma.proposal.findUnique({
    where: { token },
    include: { acceptance: true },
  });
  if (!p) return null;
  return {
    ...p,
    deliverables: parseJsonArr(p.deliverables),
    includedServices: parseJsonArr(p.includedServices),
    excludedServices: parseJsonArr(p.excludedServices),
  };
}

export async function createProposal(_prev: unknown, formData: FormData) {
  const parsed = parseFormData(formData);
  const v = ProposalSchema.safeParse(parsed);
  if (!v.success) {
    return { ok: false as const, error: v.error.issues[0]?.message ?? 'Invalid input' };
  }
  const status = (formData.get('status') as string) || 'PENDING';
  const proposal = await prisma.proposal.create({
    data: {
      ...serialize(v.data),
      status: status as ProposalStatus,
      token: generateProposalToken(),
    },
  });
  revalidatePath('/admin');
  redirect(`/admin/edit/${proposal.id}`);
}

export async function updateProposal(id: string, _prev: unknown, formData: FormData) {
  const parsed = parseFormData(formData);
  const v = ProposalSchema.safeParse(parsed);
  if (!v.success) {
    return { ok: false as const, error: v.error.issues[0]?.message ?? 'Invalid input' };
  }
  const status = (formData.get('status') as string);
  await prisma.proposal.update({
    where: { id },
    data: { ...serialize(v.data), ...(status ? { status } : {}) },
  });
  revalidatePath('/admin');
  revalidatePath(`/admin/edit/${id}`);
  return { ok: true as const };
}

export async function deleteProposal(id: string) {
  await prisma.proposal.delete({ where: { id } });
  revalidatePath('/admin');
  return { ok: true as const };
}

export async function duplicateProposal(id: string) {
  const src = await prisma.proposal.findUnique({ where: { id } });
  if (!src) return { ok: false as const, error: 'Not found' };
  const created = await prisma.proposal.create({
    data: {
      token: generateProposalToken(),
      templateId: src.templateId,
      title: src.title + ' (copy)',
      clientName: src.clientName,
      clientEmail: src.clientEmail,
      companyName: src.companyName,
      description: src.description,
      deliverables: src.deliverables,
      includedServices: src.includedServices,
      excludedServices: src.excludedServices,
      oneTimePrice: src.oneTimePrice,
      monthlyFee: src.monthlyFee,
      duration: src.duration,
      timeline: src.timeline,
      expiresAt: src.expiresAt,
      status: 'DRAFT',
    },
  });
  revalidatePath('/admin');
  return { ok: true as const, id: created.id };
}

function parseFormData(formData: FormData): ProposalFormData {
  const oneTimeStr = (formData.get('oneTimePrice') as string) || '';
  const monthlyStr = (formData.get('monthlyFee') as string) || '';
  const expires = (formData.get('expiresAt') as string) || '';
  return {
    templateId: ((formData.get('templateId') as string) || null) || null,
    title: (formData.get('title') as string) || '',
    clientName: (formData.get('clientName') as string) || '',
    clientEmail: (formData.get('clientEmail') as string) || '',
    companyName: ((formData.get('companyName') as string) || '') || null,
    description: (formData.get('description') as string) || '',
    deliverables: JSON.parse((formData.get('deliverables') as string) || '[]'),
    includedServices: JSON.parse((formData.get('includedServices') as string) || '[]'),
    excludedServices: JSON.parse((formData.get('excludedServices') as string) || '[]'),
    oneTimePrice: oneTimeStr === '' ? null : Number(oneTimeStr),
    monthlyFee: monthlyStr === '' ? null : Number(monthlyStr),
    duration: ((formData.get('duration') as string) || 'ONE_TIME') as ProposalFormData['duration'],
    timeline: ((formData.get('timeline') as string) || '') || null,
    expiresAt: expires ? new Date(expires) : null,
  };
}

function serialize(data: ProposalFormData) {
  return {
    templateId: data.templateId ?? null,
    title: data.title,
    clientName: data.clientName,
    clientEmail: data.clientEmail,
    companyName: data.companyName ?? null,
    description: data.description,
    deliverables: JSON.stringify(data.deliverables),
    includedServices: JSON.stringify(data.includedServices),
    excludedServices: JSON.stringify(data.excludedServices),
    oneTimePrice: data.oneTimePrice,
    monthlyFee: data.monthlyFee,
    duration: data.duration,
    timeline: data.timeline ?? null,
    expiresAt: data.expiresAt ?? null,
  };
}
