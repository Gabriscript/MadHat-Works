import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const acceptance = await prisma.proposalAcceptance.findUnique({
    where: { id: params.id },
    include: { proposal: { select: { title: true, clientName: true } } },
  });
  if (!acceptance || !acceptance.pdfPath) {
    return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
  }
  const filePath = path.join(process.cwd(), acceptance.pdfPath);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'PDF missing on disk' }, { status: 404 });
  }
  const buf = fs.readFileSync(filePath);
  const safeTitle = (acceptance.proposal?.title || 'proposal').replace(/[^a-z0-9-_]+/gi, '_').slice(0, 60);
  const filename = `MadHat_${safeTitle}_${acceptance.id.slice(0, 6)}.pdf`;
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
