export type Duration = 'ONE_TIME' | 'MONTHS_3' | 'MONTHS_6' | 'MONTHS_12';
export type ProposalStatus = 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'EXPIRED';
export type TermsLang = 'EN' | 'IT';

export const DURATION_LABELS: Record<Duration, { en: string; it: string }> = {
  ONE_TIME: { en: 'One-time engagement', it: 'Progetto una tantum' },
  MONTHS_3: { en: '3 months', it: '3 mesi' },
  MONTHS_6: { en: '6 months', it: '6 mesi' },
  MONTHS_12: { en: '12 months', it: '12 mesi' },
};

export const STATUS_LABELS: Record<ProposalStatus, string> = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  EXPIRED: 'Expired',
};

export type TemplateFormData = {
  name: string;
  description: string;
  deliverables: string[];
  includedServices: string[];
  excludedServices: string[];
  oneTimePrice: number | null;
  monthlyFee: number | null;
  suggestedDuration: Duration;
};

export type ProposalFormData = {
  templateId?: string | null;
  title: string;
  clientName: string;
  clientEmail: string;
  companyName?: string | null;
  description: string;
  deliverables: string[];
  includedServices: string[];
  excludedServices: string[];
  oneTimePrice: number | null;
  monthlyFee: number | null;
  duration: Duration;
  timeline?: string | null;
  expiresAt?: Date | null;
};

export type AcceptanceFormData = {
  proposalToken: string;
  clientName: string;
  clientEmail: string;
  typedSignature: string;
  checkboxTerms: boolean;
  checkboxPrivacy: boolean;
  browserLanguage?: string | null;
};
