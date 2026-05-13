'use client';
import { useState } from 'react';
import { X, Plus } from 'lucide-react';

export function ListEditor({
  label, items, onChange, placeholder, accent = 'orange',
}: {
  label: string; items: string[]; onChange: (next: string[]) => void; placeholder?: string; accent?: 'orange' | 'mute';
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft('');
  };
  const remove = (i: number) => onChange(items.filter((_, ix) => ix !== i));

  const bullet = accent === 'orange' ? '→' : '×';
  const bulletColor = accent === 'orange' ? 'text-orange-pale' : 'text-cream/45';

  return (
    <div>
      <div className="text-[0.62rem] font-bold uppercase tracking-wider-2 text-cream/45 mb-2">{label}</div>
      {items.length > 0 && (
        <ul className="mb-3 divide-y divide-cream/5 border border-cream/8">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-3 px-3 py-2.5 bg-cream/[0.02]">
              <span className={`${bulletColor} text-base shrink-0`}>{bullet}</span>
              <span className="flex-1 text-sm text-cream/90 leading-snug">{item}</span>
              <button type="button" onClick={() => remove(i)} className="text-cream/35 hover:text-red-400 transition-colors p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add(); }
          }}
          placeholder={placeholder || 'Type and press Enter…'}
          className="mh-input flex-1"
        />
        <button type="button" onClick={add} className="mh-btn-dark px-4">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
