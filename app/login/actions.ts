'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, checkPassword, signSession } from '@/lib/auth';

export async function loginAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const password = String(formData.get('password') ?? '');
  const fromRaw = String(formData.get('from') ?? '/admin');
  // Only allow internal redirect targets (must start with / and not //).
  const from = fromRaw.startsWith('/') && !fromRaw.startsWith('//') ? fromRaw : '/admin';

  if (!password) {
    return { error: 'Please enter the access password.' };
  }
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 600));
    return { error: 'Wrong password.' };
  }

  const { token, maxAgeSec } = await signSession();
  cookies().set({
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSec,
  });

  redirect(from);
}

export async function logoutAction(): Promise<void> {
  cookies().set({
    name: ADMIN_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  redirect('/login');
}
