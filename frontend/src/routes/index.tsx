import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { HealthDashboardPage } from '@/pages/HealthDashboardPage';
import { PatientsPage } from '@/pages/PatientsPage';
import { AppointmentsPage } from '@/pages/AppointmentsPage';
import { DoctorsPage } from '@/pages/DoctorsPage';
import { ClinicalEncountersPage } from '@/pages/clinical/ClinicalEncountersPage';
import { BillingInvoicesPage } from '@/pages/billing/BillingInvoicesPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<HealthDashboardPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="clinical" element={<ClinicalEncountersPage />} />
        <Route path="billing" element={<BillingInvoicesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
