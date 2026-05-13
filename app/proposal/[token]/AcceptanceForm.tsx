'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

export function AcceptanceForm({
  token, defaultClientName, defaultClientEmail, proposalTitle,
}: { token: string; defaultClientName: string; defaultClientEmail: string; proposalTitle: string }) {
  const router = useRouter();
  const [clientName, setClientName] = useState(defaultClientName);
  const [clientEmail, setClientEmail] = useState(defaultClientEmail);
  const [typedSignature, setTypedSignature] = useState('');
  const [consent, setConsent] = useState(false);
  const [browserLanguage, setBrowserLanguage] = useState<string>('');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof navigator !== 'undefined') setBrowserLanguage(navigator.language || '');
  }, []);

  const canSubmit =
    consent &&
    typedSignature.trim().length > 0 &&
    clientName.trim().length > 0 &&
    clientEmail.trim().length > 0;

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/proposal/${token}/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName,
            clientEmail,
            typedSignature,
            // Single combined consent flag - mapped to both legal evidence columns server-side
            // (covers Terms + Privacy + 1341/1342 c.c. specific approval per Art. 25.4)
            checkboxTerms: consent,
            checkboxPrivacy: consent,
            browserLanguage,
          }),
        });
        const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          toast.success('Proposal accepted');
          router.refresh();
        } else {
          toast.error(data.error || `Acceptance failed (${res.status})`);
        }
      } catch {
        toast.error('Network error');
      }
    });
  };

  return (
    <form onSubmit={submit} className="p-8 md:p-12 border border-orange/30 bg-navy-mid">
      <p className="mh-label mb-5">Acceptance</p>
      <h2 className="mh-headline text-3xl md:text-4xl mb-3">Make it <em>official</em>.</h2>
      <p className="text-cream/55 text-sm md:text-base leading-relaxed mb-8 max-w-xl">
        By accepting you confirm you have read the proposal “{proposalTitle}” and agree to the Terms &amp; Conditions and Privacy Policy.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <Label>Your full name</Label>
          <input className="mh-input" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <input type="email" className="mh-input" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required />
        </div>
      </div>

      {/* Single consent: covers Terms + Privacy + 1341/1342 c.c. clauses */}
      <div className="mb-2">
        <Checkbox
          checked={consent}
          onChange={setConsent}
          label={
            <>
              Ho letto e accetto i <Link href="/terms" target="_blank" className="text-orange-pale underline underline-offset-2 hover:text-orange">Terms &amp; Conditions</Link> e la <Link href="/privacy" target="_blank" className="text-orange-pale underline underline-offset-2 hover:text-orange">Privacy Policy</Link> di MadHat.
            </>
          }
        />
      </div>
      <p className="text-[0.7rem] text-cream/40 leading-relaxed pl-8 mb-10 max-w-2xl">
        L’accettazione include l’approvazione specifica, ai sensi degli artt. <strong className="text-cream/55">1341 e 1342 c.c.</strong>, delle clausole vessatorie indicate all’art. 25.4 dei Terms &amp; Conditions.
      </p>

      <div className="space-y-2 mb-2">
        <Label>Digital signature — type your full name</Label>
        <input
          className="mh-input font-serif italic text-2xl py-5"
          placeholder="Type your full name"
          value={typedSignature}
          onChange={(e) => setTypedSignature(e.target.value)}
        />
      </div>
      <p className="text-xs text-cream/45 leading-relaxed mb-10 max-w-xl">
        By typing your name, you confirm acceptance of this proposal and the Terms &amp; Conditions.
      </p>

      <button type="submit" disabled={!canSubmit || pending} className="mh-btn-primary inline-flex items-center gap-2 w-full sm:w-auto">
        <CheckCircle2 className="w-4 h-4" strokeWidth={3} />
        {pending ? 'Recording acceptance…' : 'Accept Proposal'}
      </button>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[0.62rem] font-bold uppercase tracking-wider-2 text-cream/45">{children}</label>;
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <span
        onClick={() => onChange(!checked)}
        className={`w-5 h-5 shrink-0 mt-0.5 border flex items-center justify-center transition-colors ${
          checked ? 'bg-orange border-orange' : 'border-cream/30 group-hover:border-orange-pale'
        }`}
      >
        {checked ? <CheckCircle2 className="w-3.5 h-3.5 text-navy" strokeWidth={3} /> : null}
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm text-cream/75 leading-relaxed">{label}</span>
    </label>
  );
}
