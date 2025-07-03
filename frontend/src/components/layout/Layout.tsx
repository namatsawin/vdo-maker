import type { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { Breadcrumb } from './Breadcrumb';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 px-8 py-6 max-w-7xl mx-auto w-full">
          <div className="space-y-6">
            <Breadcrumb />
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
