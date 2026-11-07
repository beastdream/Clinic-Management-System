import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { CheckEmailPage } from '@/pages/auth/CheckEmailPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { GoogleCompleteProfilePage } from '@/pages/auth/GoogleCompleteProfilePage';
import { HealthDashboardPage } from '@/pages/HealthDashboardPage';
import { PatientsPage } from '@/pages/PatientsPage';
import { DoctorsPage } from '@/pages/DoctorsPage';
import { ClinicalEncountersPage } from '@/pages/clinical/ClinicalEncountersPage';
import { BillingInvoicesPage } from '@/pages/billing/BillingInvoicesPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { AdminMasterDataPage } from '@/pages/admin/AdminMasterDataPage';
import { AdminStaffPage } from '@/pages/admin/AdminStaffPage';
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage';
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage';
import { RoleGuard } from '@/components/guard/RoleGuard';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="register/check-email" element={<CheckEmailPage />} />
        <Route path="register/google" element={<GoogleCompleteProfilePage />} />
      </Route>
      <Route element={<AuthLayout redirectIfAuthenticated={false} />}>
        <Route path="verify-email" element={<VerifyEmailPage />} />
      </Route>

      <Route path="/" element={<DashboardLayout />}>
        {/* Dashboard / Trang chủ: ai cũng truy cập được */}
        <Route index element={<HealthDashboardPage />} />

        {/* Quản lý hồ sơ bệnh nhân: CHỈ CHO PHÉP BÁC SĨ (Admin bị loại bỏ theo quy định bảo mật) */}
        <Route
          path="patients"
          element={
            <RoleGuard
              allowedRoles={['ROLE_DOCTOR']}
              deniedMessage="Chỉ có Bác sĩ phụ trách mới được phép truy cập và xem hồ sơ bệnh nhân. Quản trị viên (ADMIN) và các vai trò khác không có quyền xem hồ sơ bệnh nhân theo quy tắc bảo mật y tế."
            >
              <PatientsPage />
            </RoleGuard>
          }
        />

        {/* Lịch hẹn & tiếp đón: Đã loại bỏ đối với Quản trị viên */}
        <Route
          path="appointments"
          element={<Navigate to="/" replace />}
        />

        {/* Danh sách bác sĩ & chuyên khoa: Mọi vai trò nội bộ */}
        <Route
          path="doctors"
          element={
            <RoleGuard allowedRoles={['ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_RECEPTIONIST', 'ROLE_CASHIER']}>
              <DoctorsPage />
            </RoleGuard>
          }
        />

        {/* Khám bệnh lâm sàng: CHỈ BÁC SĨ (Admin bị chặn theo nguyên tắc Clinical Privacy) */}
        <Route
          path="clinical"
          element={
            <RoleGuard
              allowedRoles={['ROLE_DOCTOR']}
              deniedMessage="Chỉ có Bác sĩ phụ trách mới được phép truy cập và ghi nhận bệnh án lâm sàng. Quản trị viên (ADMIN) và các vai trò khác bị giới hạn theo quy định bảo mật hồ sơ y tế (Clinical Privacy Rule)."
            >
              <ClinicalEncountersPage />
            </RoleGuard>
          }
        />

        {/* Cài đặt & quản trị hệ thống: CHỈ ADMIN */}
        <Route
          path="admin/settings"
          element={
            <RoleGuard
              allowedRoles={['ROLE_ADMIN']}
              deniedMessage="Chỉ có Quản trị viên (ADMIN) mới có quyền truy cập trang Cài đặt & Quản lý tài khoản hệ thống."
            >
              <AdminSettingsPage />
            </RoleGuard>
          }
        />

        {/* Danh mục dùng chung: CHỈ ADMIN */}
        <Route
          path="admin/master-data"
          element={
            <RoleGuard
              allowedRoles={['ROLE_ADMIN']}
              deniedMessage="Chỉ có Quản trị viên (ADMIN) mới có quyền quản lý Danh mục dùng chung."
            >
              <AdminMasterDataPage />
            </RoleGuard>
          }
        />

        {/* Quản lý hồ sơ nhân sự & phân vai trò: CHỈ ADMIN */}
        <Route
          path="admin/staff"
          element={
            <RoleGuard
              allowedRoles={['ROLE_ADMIN']}
              deniedMessage="Chỉ có Quản trị viên (ADMIN) mới có quyền quản lý Nhân sự & Phân quyền vai trò."
            >
              <AdminStaffPage />
            </RoleGuard>
          }
        />

        {/* Nhật ký kiểm toán & an toàn: CHỈ ADMIN */}
        <Route
          path="admin/audit-logs"
          element={
            <RoleGuard
              allowedRoles={['ROLE_ADMIN']}
              deniedMessage="Chỉ có Quản trị viên (ADMIN) mới có quyền xem Nhật ký kiểm toán hệ thống."
            >
              <AdminAuditLogsPage />
            </RoleGuard>
          }
        />

        {/* Báo cáo thống kê quản trị: CHỈ ADMIN */}
        <Route
          path="admin/reports"
          element={
            <RoleGuard
              allowedRoles={['ROLE_ADMIN']}
              deniedMessage="Chỉ có Quản trị viên (ADMIN) mới có quyền xem Báo cáo thống kê quản trị."
            >
              <AdminReportsPage />
            </RoleGuard>
          }
        />

        {/* Thu ngân & viện phí: Thu ngân, Admin, Tiếp tân */}
        <Route
          path="billing"
          element={
            <RoleGuard allowedRoles={['ROLE_CASHIER', 'ROLE_ADMIN', 'ROLE_RECEPTIONIST']}>
              <BillingInvoicesPage />
            </RoleGuard>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
