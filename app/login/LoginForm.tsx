'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { loginAction } from './actions';
import { Lock, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

type State = { error?: string };
const initial: State = {};

export function LoginForm({ from }: { from: string }) {
  const [state, action] = useFormState<State, FormData>(loginAction, initial);
  const [hasError, setHasError] = useState<boolean>(false);
  useEffect(() => {
    setHasError(Boolean(state.error));
  }, [state.error]);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="from" value={from} />

      <div className="space-y-2">
        <label className="block text-[0.62rem] font-bold uppercase tracking-wider-2 text-cream/45">
          Access password
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cream/40 pointer-events-none" />
          <input
            name="password"
            type="password"
            autoFocus
            autoComplete="current-password"
            placeholder="••••••••"
            className={`mh-input pl-10 text-base ${hasError ? 'border-red-400/60' : ''}`}
            aria-invalid={hasError}
          />
        </div>
        {state.error ? (
          <p className="text-xs text-red-300 mt-2">{state.error}</p>
        ) : null}
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mh-btn-primary w-full inline-flex items-center justify-center gap-2"
    >
      {pending ? 'Checking…' : 'Enter'}
      {!pending ? <ArrowRight className="w-4 h-4" strokeWidth={3} /> : null}
    </button>
  );
}
