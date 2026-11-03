import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Activity, 
  Database, 
  Layers, 
  Users, 
  FileText, 
  Calendar, 
  Pill, 
  CreditCard,
  Building2,
  Stethoscope,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  phase?: string;
}

const navItems: NavItem[] = [
  { name: 'Kiểm tra Hệ thống', href: '/', icon: Activity },
  { name: 'Hồ sơ Bệnh nhân', href: '/patients', icon: Users, badge: 'Core' },
  { name: 'Lịch hẹn Khám', href: '/appointments', icon: Calendar, badge: 'Core' },
  { name: 'Đội ngũ Bác sĩ', href: '/doctors', icon: Stethoscope, badge: 'Core' },
  { name: 'Kho Dược & Thuốc', href: '/#pharmacy', icon: Pill, phase: 'Phase 04' },
  { name: 'Thu ngân & Viện phí', href: '/#billing', icon: CreditCard, phase: 'Phase 05' },
  { name: 'Bệnh án & Lâm sàng', href: '/#clinical', icon: FileText, phase: 'Phase 03' },
  { name: 'Cổng Bệnh nhân (Portal)', href: '/#portal', icon: Building2, phase: 'Phase 06' },
  { name: 'Cơ sở dữ liệu & Flyway', href: '/#database', icon: Database, phase: 'Phase 01' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const content = (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        <div className="mb-4 flex items-center justify-between px-2 py-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Phân hệ nghiệp vụ
          </span>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded text-slate-400 hover:text-slate-600 md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-800">
                    {item.badge}
                  </span>
                )}
                {item.phase && !item.badge && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                    {item.phase}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50/60 to-slate-50 p-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-800">
          <Layers className="h-4 w-4 text-teal-600" />
          <span>Modular Monolith</span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Spring Boot 3 + Java 21 kết nối MySQL 8.4 LTS, quản lý bởi Flyway.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">
        {content}
      </aside>

      {/* Mobile drawer backdrop and sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-50 flex w-72 flex-col bg-white shadow-xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
