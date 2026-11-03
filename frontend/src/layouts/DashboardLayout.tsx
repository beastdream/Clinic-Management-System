import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';

export const DashboardLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
      <div className="flex flex-1">
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        Clinic Management System &copy; {new Date().getFullYear()} — Modular Monolith Architecture (Java 21, Spring Boot 3, React 18, MySQL 8.4)
      </footer>
    </div>
  );
};
