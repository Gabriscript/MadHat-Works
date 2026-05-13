import { AdminNav } from '@/components/madhat/AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-navy">
      <AdminNav />
      <main className="pt-24 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
