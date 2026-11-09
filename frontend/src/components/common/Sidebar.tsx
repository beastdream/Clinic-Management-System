import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard,
  Users, 
  Stethoscope, 
  UserCheck,
  Settings,
  X,
  Layers,
  UserCog,
  ShieldAlert,
  BarChart3,
  CalendarCheck,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authService } from '@/services/authService';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  allowedRoles?: string[]; // If undefined, visible to everyone
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    groupTitle: 'Tổng Quan',
    items: [
      { 
        name: 'Bảng Điều Khiển', 
        href: '/', 
        icon: LayoutDashboard,
      },
    ],
  },
  {
    groupTitle: 'Tiếp Đón & Thu Ngân',
    items: [
      {
        name: 'Lịch hẹn & Tiếp đón',
        href: '/appointments',
        icon: CalendarCheck,
        badge: 'Tiếp tân',
        allowedRoles: ['ROLE_RECEPTIONIST'],
      },
      {
        name: 'Thu ngân & Viện phí',
        href: '/billing',
        icon: Receipt,
        badge: 'Thu ngân',
        allowedRoles: ['ROLE_CASHIER'],
      },
    ],
  },
  {
    groupTitle: 'Khám & Điều Trị',
    items: [
      { 
        name: 'Khám bệnh & Bệnh án', 
        href: '/clinical', 
        icon: Stethoscope, 
        badge: 'Bác sĩ',
        allowedRoles: ['ROLE_DOCTOR'],
      },
      { 
        name: 'Hồ sơ Bệnh nhân', 
        href: '/patients', 
        icon: Users, 
        badge: 'Bác sĩ',
        allowedRoles: ['ROLE_DOCTOR'],
      },
      { 
        name: 'Đội ngũ Bác sĩ', 
        href: '/doctors', 
        icon: UserCheck,
        allowedRoles: ['ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_RECEPTIONIST', 'ROLE_CASHIER'],
      },
    ],
  },
  {
    groupTitle: 'Hệ Thống & Cài Đặt',
    items: [
      { 
        name: 'Cài Đặt Hệ Thống', 
        href: '/admin/settings', 
        icon: Settings, 
        badge: 'Admin',
        allowedRoles: ['ROLE_ADMIN'],
      },
      { 
        name: 'Danh Mục Dùng Chung', 
        href: '/admin/master-data', 
        icon: Layers, 
        badge: 'Admin',
        allowedRoles: ['ROLE_ADMIN'],
      },
      { 
        name: 'Quản Lý Nhân Sự', 
        href: '/admin/staff', 
        icon: UserCog, 
        badge: 'Admin',
        allowedRoles: ['ROLE_ADMIN'],
      },
      { 
        name: 'Nhật Ký Kiểm Toán', 
        href: '/admin/audit-logs', 
        icon: ShieldAlert, 
        badge: 'Admin',
        allowedRoles: ['ROLE_ADMIN'],
      },
      { 
        name: 'Báo Cáo Quản Trị', 
        href: '/admin/reports', 
        icon: BarChart3, 
        badge: 'Admin',
        allowedRoles: ['ROLE_ADMIN'],
      },
    ],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    const updateRoles = () => {
      const user = authService.getCurrentUser();
      setUserRoles(user?.roles || []);
    };
    updateRoles();
    window.addEventListener('storage', updateRoles);
    return () => window.removeEventListener('storage', updateRoles);
  }, []);

  // Filter items by role (or show all if guest)
  const isItemVisible = (item: NavItem): boolean => {
    if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
    if (userRoles.length === 0) return true; // Show demo items to guests

    return userRoles.some((role) =>
      item.allowedRoles!.some(
        (allowed) =>
          role.toUpperCase() === allowed.toUpperCase() ||
          `ROLE_${role.toUpperCase()}` === allowed.toUpperCase() ||
          role.toUpperCase() === `ROLE_${allowed.toUpperCase()}`
      )
    );
  };

  const content = (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        {onCloseMobile && (
          <div className="flex items-center justify-between px-2 md:hidden">
            <span className="text-sm font-bold text-slate-800">Menu Hệ Thống</span>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {navGroups.map((group) => {
          const visibleItems = group.items.filter(isItemVisible);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.groupTitle} className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {group.groupTitle}
              </div>
              <nav className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all group',
                          isActive
                            ? 'bg-teal-600 text-white shadow-xs font-semibold'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={cn(
                                'h-4 w-4 shrink-0 transition-colors',
                                isActive
                                  ? 'text-white'
                                  : 'text-slate-400 group-hover:text-slate-700'
                              )}
                            />
                            <span>{item.name}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={cn(
                                'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-teal-50 text-teal-700 border border-teal-200/60'
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          );
        })}
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
