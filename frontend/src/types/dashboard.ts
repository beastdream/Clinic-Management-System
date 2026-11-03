export interface AppointmentStatusCount {
  status: string;
  label: string;
  count: number;
  color: string;
}

export interface DailyAppointmentCount {
  date: string;
  count: number;
}

export interface RecentAppointmentItem {
  id: string;
  appointmentCode: string;
  patientName: string;
  patientCode: string;
  doctorName: string;
  specialtyName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  reason?: string;
}

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  todayAppointments: number;
  waitingAppointments: number;
  completedEncounters: number;
  paidRevenue: number;
  statusBreakdown: AppointmentStatusCount[];
  dailyAppointments: DailyAppointmentCount[];
  recentAppointments: RecentAppointmentItem[];
  systemHealth: {
    status: string;
    database: string;
    flywayVersion: string;
    environment: string;
  };
}

