export function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`mh-label ${className}`}>{children}</p>;
}
