import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProposalByToken } from '@/lib/actions/proposals';
import { Logo } from '@/components/madhat/Logo';
import { formatEUR, formatDuration, formatDateTime } from '@/lib/format';
import type { Duration } from '@/lib/types';
import { AcceptanceForm } from './AcceptanceForm';
import { CheckCircle2, Download } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProposalPublicPage({ params }: { params: { token: string } }) {
  const proposal = await getProposalByToken(params.token);
  if (!proposal) notFound();
  const expired = proposal.status === 'EXPIRED' || (proposal.expiresAt && proposal.expiresAt < new Date());
  const accepted = proposal.status === 'ACCEPTED' && proposal.acceptance;

  return (
    <div className="min-h-screen bg-navy">
      {/* HERO */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-orange pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-[38%] w-px hidden md:block"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(196, 86, 26, 0.25) 20%, rgba(196, 86, 26, 0.25) 80%, transparent)' }} />
        <nav className="relative z-10 flex items-center justify-between px-6 md:px-16 py-6">
          <Logo href={`/proposal/${proposal.token}`} />
          <span className="text-[0.62rem] uppercase tracking-widest-2 text-cream/35 hidden sm:inline">Proposal · {proposal.token.slice(0, 8).toUpperCase()}</span>
        </nav>
        <div className="relative z-10 px-6 md:px-16 pt-12 pb-24 md:pt-20 md:pb-32 max-w-6xl">
          <p className="mh-label mb-6">Proposal · for {proposal.companyName || proposal.clientName}</p>
          <h1 className="mh-headline text-[clamp(2.4rem,7vw,5.5rem)] max-w-3xl mb-8">
            {renderTitleWithItalic(proposal.title)}
          </h1>
          <p className="text-cream/65 text-lg md:text-xl max-w-2xl leading-relaxed">{proposal.description}</p>
        </div>
      </header>

      {/* PRICING */}
      {(proposal.oneTimePrice != null || proposal.monthlyFee != null) && (
        <section className="px-6 md:px-16 py-16 md:py-24 bg-navy-mid">
          <div className="max-w-6xl mx-auto">
            <p className="mh-label mb-6">Investment</p>
            <div className="grid md:grid-cols-3 gap-px bg-orange/15">
              {proposal.oneTimePrice != null && (
                <PriceBlock big amount={proposal.oneTimePrice} label="One-time setup" sub="Payable on acceptance" />
              )}
              {proposal.monthlyFee != null && (
                <PriceBlock amount={proposal.monthlyFee} suffix="/ month" label="Recurring" sub="Billed monthly in advance" />
              )}
              <div className="bg-navy p-8 md:p-10 flex flex-col justify-between">
                <div>
                  <div className="text-[0.62rem] uppercase tracking-widest-2 text-cream/45 font-semibold mb-3">Duration</div>
                  <div className="font-serif font-black text-3xl md:text-4xl text-cream">{formatDuration(proposal.duration as Duration)}</div>
                </div>
                {proposal.timeline ? <div className="text-cream/55 text-sm mt-4">{proposal.timeline}</div> : null}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* WHAT'S INSIDE */}
      <section className="px-6 md:px-16 py-20 md:py-28">
        <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <p className="mh-label mb-6">What you get</p>
            <h2 className="mh-headline text-3xl md:text-5xl">A clear <em>scope</em>.</h2>
          </div>
          <div className="md:col-span-8 space-y-12">
            {proposal.deliverables.length > 0 && (
              <BulletGroup title="Deliverables" items={proposal.deliverables} />
            )}
            {proposal.includedServices.length > 0 && (
              <BulletGroup title="Included services" items={proposal.includedServices} />
            )}
            {proposal.excludedServices.length > 0 && (
              <BulletGroup title="Not included" items={proposal.excludedServices} muted />
            )}
          </div>
        </div>
      </section>

      {/* ACCEPTANCE / STATUS */}
      <section className="px-6 md:px-16 pb-24">
        <div className="max-w-3xl mx-auto">
          {accepted && proposal.acceptance ? (
            <div className="text-center p-10 md:p-14 border border-emerald-400/40 bg-emerald-500/5">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-300 mb-6" />
              <p className="mh-label justify-center mb-4">Accepted</p>
              <h2 className="mh-headline text-3xl md:text-4xl mb-4">
                Thank you,<br /><em>{proposal.acceptance.clientName.split(' ')[0]}</em>.
              </h2>
              <p className="text-cream/60 text-sm md:text-base leading-relaxed mb-2">
                You accepted this proposal on {formatDateTime(proposal.acceptance.acceptedAt)}.
              </p>
              <p className="text-cream/40 text-xs mb-8">A copy has been generated and is available below.</p>
              <Link href={`/api/pdf/${proposal.acceptance.id}`} className="mh-btn-primary inline-flex items-center gap-2">
                <Download className="w-4 h-4" strokeWidth={3} /> Download PDF
              </Link>
            </div>
          ) : expired ? (
            <div className="text-center p-10 border border-red-400/30 bg-red-500/5">
              <p className="mh-label justify-center mb-4">Expired</p>
              <h2 className="mh-headline text-2xl md:text-3xl mb-4">This proposal is no longer <em>active</em>.</h2>
              <p className="text-cream/60 text-sm leading-relaxed">Please get in touch with MadHat for a renewed version.</p>
            </div>
          ) : (
            <AcceptanceForm
              token={proposal.token}
              defaultClientName={proposal.clientName}
              defaultClientEmail={proposal.clientEmail}
              proposalTitle={proposal.title}
            />
          )}
        </div>
      </section>

      <footer className="border-t border-orange/10 px-6 md:px-16 py-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between text-xs text-cream/35">
        <span>© {new Date().getFullYear()} MadHat Works — All rights reserved.</span>
        <div className="flex gap-6">
          <Link href="/terms" className="hover:text-orange-pale uppercase tracking-wider-2">Terms</Link>
          <Link href="/privacy" className="hover:text-orange-pale uppercase tracking-wider-2">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}

function renderTitleWithItalic(title: string) {
  const words = title.split(' ');
  if (words.length < 2) return title;
  const last = words.pop()!;
  return (
    <>
      {words.join(' ')} <em>{last}</em>
    </>
  );
}

function BulletGroup({ title, items, muted = false }: { title: string; items: string[]; muted?: boolean }) {
  return (
    <div>
      <p className="mh-label mb-5">{title}</p>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-4 items-start">
            <span className={`text-xl leading-none mt-0.5 shrink-0 ${muted ? 'text-cream/30' : 'text-orange-pale'}`}>
              {muted ? '×' : '→'}
            </span>
            <span className={`leading-relaxed text-base ${muted ? 'text-cream/35 line-through' : 'text-cream/85'}`}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PriceBlock({ amount, suffix, label, sub, big }: { amount: number; suffix?: string; label: string; sub?: string; big?: boolean }) {
  return (
    <div className="bg-navy p-8 md:p-10 flex flex-col justify-between">
      <div>
        <div className="text-[0.62rem] uppercase tracking-widest-2 text-cream/45 font-semibold mb-3">{label}</div>
        <div className={`font-serif font-black text-cream ${big ? 'text-5xl md:text-6xl' : 'text-4xl md:text-5xl'}`}>
          {formatEUR(amount)}
          {suffix ? <span className="text-base md:text-lg text-cream/50 font-sans font-normal ml-2">{suffix}</span> : null}
        </div>
      </div>
      {sub ? <div className="text-cream/55 text-sm mt-4">{sub}</div> : null}
    </div>
  );
}
