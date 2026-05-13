'use server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import type { TemplateFormData } from '@/lib/types';
import { parseJsonArr } from '@/lib/utils-server';

const TemplateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  description: z.string().trim().min(1, 'Description is required'),
  deliverables: z.array(z.string().trim().min(1)),
  includedServices: z.array(z.string().trim().min(1)),
  excludedServices: z.array(z.string().trim().min(1)),
  oneTimePrice: z.number().nullable(),
  monthlyFee: z.number().nullable(),
  suggestedDuration: z.enum(['ONE_TIME', 'MONTHS_3', 'MONTHS_6', 'MONTHS_12']),
});

export async function listTemplates() {
  const items = await prisma.proposalTemplate.findMany({ orderBy: { createdAt: 'asc' } });
  return items.map((t) => ({
    ...t,
    deliverables: parseJsonArr(t.deliverables),
    includedServices: parseJsonArr(t.includedServices),
    excludedServices: parseJsonArr(t.excludedServices),
  }));
}

export async function getTemplate(id: string) {
  const t = await prisma.proposalTemplate.findUnique({ where: { id } });
  if (!t) return null;
  return {
    ...t,
    deliverables: parseJsonArr(t.deliverables),
    includedServices: parseJsonArr(t.includedServices),
    excludedServices: parseJsonArr(t.excludedServices),
  };
}

export async function createTemplate(_prev: unknown, formData: FormData) {
  const parsed = parseFormData(formData);
  const v = TemplateSchema.safeParse(parsed);
  if (!v.success) {
    return { ok: false as const, error: v.error.issues[0]?.message ?? 'Invalid input' };
  }
  await prisma.proposalTemplate.create({
    data: serialize(v.data),
  });
  revalidatePath('/admin/templates');
  redirect('/admin/templates');
}

export async function updateTemplate(id: string, _prev: unknown, formData: FormData) {
  const parsed = parseFormData(formData);
  const v = TemplateSchema.safeParse(parsed);
  if (!v.success) {
    return { ok: false as const, error: v.error.issues[0]?.message ?? 'Invalid input' };
  }
  await prisma.proposalTemplate.update({ where: { id }, data: serialize(v.data) });
  revalidatePath('/admin/templates');
  revalidatePath(`/admin/templates/edit/${id}`);
  redirect('/admin/templates');
}

export async function deleteTemplate(id: string) {
  await prisma.proposalTemplate.delete({ where: { id } });
  revalidatePath('/admin/templates');
  return { ok: true as const };
}

function parseFormData(formData: FormData): TemplateFormData {
  const oneTimeStr = (formData.get('oneTimePrice') as string) || '';
  const monthlyStr = (formData.get('monthlyFee') as string) || '';
  return {
    name: (formData.get('name') as string) || '',
    description: (formData.get('description') as string) || '',
    deliverables: JSON.parse((formData.get('deliverables') as string) || '[]'),
    includedServices: JSON.parse((formData.get('includedServices') as string) || '[]'),
    excludedServices: JSON.parse((formData.get('excludedServices') as string) || '[]'),
    oneTimePrice: oneTimeStr === '' ? null : Number(oneTimeStr),
    monthlyFee: monthlyStr === '' ? null : Number(monthlyStr),
    suggestedDuration: ((formData.get('suggestedDuration') as string) || 'ONE_TIME') as TemplateFormData['suggestedDuration'],
  };
}

function serialize(data: TemplateFormData) {
  return {
    name: data.name,
    description: data.description,
    deliverables: JSON.stringify(data.deliverables),
    includedServices: JSON.stringify(data.includedServices),
    excludedServices: JSON.stringify(data.excludedServices),
    oneTimePrice: data.oneTimePrice,
    monthlyFee: data.monthlyFee,
    suggestedDuration: data.suggestedDuration,
  };
}
