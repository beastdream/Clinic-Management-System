import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { HealthDashboardPage } from '@/pages/HealthDashboardPage';
import { PatientsPage } from '@/pages/PatientsPage';
import { AppointmentsPage } from '@/pages/AppointmentsPage';
import { DoctorsPage } from '@/pages/DoctorsPage';
import { ClinicalEncountersPage } from '@/pages/clinical/ClinicalEncountersPage';
import { BillingInvoicesPage } from '@/pages/billing/BillingInvoicesPage';
import { RoleGuard } from '@/components/guard/RoleGuard';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        {/* Dashboard / Trang chủ: ai cũng truy cập được */}
        <Route index element={<HealthDashboardPage />} />

        {/* Quản lý bệnh nhân: Tiếp tân, Admin, Bác sĩ, Thu ngân */}
        <Route
          path="patients"
          element={
            <RoleGuard allowedRoles={['ROLE_RECEPTIONIST', 'ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_CASHIER']}>
              <PatientsPage />
            </RoleGuard>
          }
        />

        {/* Quản lý lịch hẹn & tiếp đón: Tiếp tân, Admin, Bác sĩ */}
        <Route
          path="appointments"
          element={
            <RoleGuard allowedRoles={['ROLE_RECEPTIONIST', 'ROLE_ADMIN', 'ROLE_DOCTOR']}>
              <AppointmentsPage />
            </RoleGuard>
          }
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
