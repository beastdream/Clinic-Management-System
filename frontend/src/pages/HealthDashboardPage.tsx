import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Database, 
  Server, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Shield, 
  ExternalLink, 
  KeyRound,
  FileCode2,
  Users,
  Calendar,
  Pill,
  Stethoscope,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { healthService } from '@/services/healthService';
import { authService } from '@/services/authService';
import { patientService, PatientItem, CreatePatientInput } from '@/services/patientService';
import { appointmentService, AppointmentItem, CreateAppointmentInput } from '@/services/appointmentService';
import { clinicService, SpecialtyItem, DoctorItem, MedicineItem } from '@/services/clinicService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { formatDateTime, formatVND } from '@/lib/utils';
import { LoginResponse } from '@/types/auth';

type ActiveTab = 'overview' | 'patients' | 'appointments' | 'medicines' | 'doctors';

export const HealthDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  
  // Auth & Role testing states
  const [activeRoleName, setActiveRoleName] = useState<string>('Khách vãng lai / Chưa đăng nhập');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginResult, setLoginResult] = useState<{
    success: boolean;
    message: string;
    data?: LoginResponse;
  } | null>(null);

  // Search & Filter states
  const [patientSearch, setPatientSearch] = useState('');
  const [appointmentFilter, setAppointmentFilter] = useState('ALL');

  // Form Modals / Panels
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showAddAppointmentModal, setShowAddAppointmentModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // New Patient Form State
  const [newPatient, setNewPatient] = useState<CreatePatientInput>({
    fullName: '',
    phone: '',
    gender: 'NAM',
    dateOfBirth: '1990-01-01',
    identityCardNo: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodType: 'O+',
    allergies: 'Không',
    medicalHistorySummary: '',
  });

  // New Appointment Form State
  const [newAppointment, setNewAppointment] = useState<CreateAppointmentInput>({
    patientId: '',
    specialtyId: '',
    doctorId: '',
    roomId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '08:30:00',
    shift: 'MORNING',
    appointmentType: 'WALK_IN',
    reason: 'Khám kiểm tra sức khỏe tổng quát',
  });

  // 1. Query: Health & Specs
  const {
    data: healthResponse,
    refetch: refetchHealth,
    isFetching: isHealthFetching,
  } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: healthService.checkHealth,
    refetchInterval: 15000,
  });

  // 2. Query: Patients (Real DB)
  const {
    data: patientsResponse,
    isLoading: isPatientsLoading,
    refetch: refetchPatients,
  } = useQuery({
    queryKey: ['topPatients'],
    queryFn: () => patientService.getTopPatients(),
  });

  // 3. Query: Appointments (Real DB)
  const {
    data: appointmentsResponse,
    isLoading: isAppointmentsLoading,
    refetch: refetchAppointments,
  } = useQuery({
    queryKey: ['recentAppointments'],
    queryFn: () => appointmentService.getRecentAppointments(),
  });

  // 4. Query: Specialties (Real DB)
  const { data: specialtiesResponse } = useQuery({
    queryKey: ['specialties'],
    queryFn: () => clinicService.getSpecialties(),
  });

  // 5. Query: Doctors (Real DB)
  const { data: doctorsResponse } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => clinicService.getDoctors(),
  });

  // 6. Query: Medicines (Real DB)
  const { data: medicinesResponse } = useQuery({
    queryKey: ['medicines'],
    queryFn: () => clinicService.getMedicines(),
  });

  const healthData = healthResponse?.data;
  const isDbConnected = healthData?.database?.status === 'CONNECTED';
  const patientsList: PatientItem[] = patientsResponse?.data || [];
  const appointmentsList: AppointmentItem[] = appointmentsResponse?.data || [];
  const specialtiesList: SpecialtyItem[] = specialtiesResponse?.data || [];
  const doctorsList: DoctorItem[] = doctorsResponse?.data || [];
  const medicinesList: MedicineItem[] = medicinesResponse?.data || [];

  // Mutation: Create Patient
  const createPatientMutation = useMutation({
    mutationFn: (input: CreatePatientInput) => patientService.createPatient(input),
    onSuccess: (res) => {
      setFormSuccess(`Đăng ký thành công bệnh nhân: ${res.data.fullName} (Mã: ${res.data.patientCode})`);
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['topPatients'] });
      setShowAddPatientModal(false);
      // Reset form
      setNewPatient({
        fullName: '',
        phone: '',
        gender: 'NAM',
        dateOfBirth: '1990-01-01',
        identityCardNo: '',
        email: '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        bloodType: 'O+',
        allergies: 'Không',
        medicalHistorySummary: '',
      });
    },
    onError: (err: any) => {
      const msg = err?.message || 'Có lỗi xảy ra khi tạo bệnh nhân. Vui lòng kiểm tra dữ liệu.';
      setFormError(msg);
      setFormSuccess(null);
    },
  });

  // Mutation: Create Appointment
  const createAppointmentMutation = useMutation({
    mutationFn: (input: CreateAppointmentInput) => appointmentService.createAppointment(input),
    onSuccess: (res) => {
      setFormSuccess(`Đặt lịch khám thành công! Mã phiếu hẹn: ${res.data.appointmentCode}`);
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['recentAppointments'] });
      setShowAddAppointmentModal(false);
    },
    onError: (err: any) => {
      const msg = err?.message || 'Có lỗi xảy ra khi đặt lịch hẹn. Vui lòng kiểm tra ràng buộc khóa ngoại.';
      setFormError(msg);
      setFormSuccess(null);
    },
  });

  // Quick Role Authentication Switcher
  const handleRoleLogin = async (username: string, pass: string, roleTitle: string) => {
    setLoginLoading(true);
    setLoginResult(null);
    try {
      const res = await authService.login({ username, password: pass });
      localStorage.setItem('access_token', res.data.accessToken);
      localStorage.setItem('user_info', JSON.stringify(res.data));
      setActiveRoleName(`${roleTitle} (${res.data.username})`);
      setLoginResult({
        success: true,
        message: `Đăng nhập thành công với vai trò ${roleTitle}! Mã token JWT đã được kích hoạt.`,
        data: res.data,
      });
      // Invalidate and refresh queries
      queryClient.invalidateQueries();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Đăng nhập thất bại. Kiểm tra backend hoặc mật khẩu.';
      setLoginResult({
        success: false,
        message: errorMsg,
      });
    } finally {
      setLoginLoading(false);
    }
  };

  // Filtered Patients
  const filteredPatients = patientsList.filter(p => 
    p.fullName?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.patientCode?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.phone?.includes(patientSearch)
  );

  // Filtered Appointments
  const filteredAppointments = appointmentsList.filter(a => {
    if (appointmentFilter === 'ALL') return true;
    return a.status === appointmentFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Đã hoàn thành</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="info">Đang khám</Badge>;
      case 'CHECKED_IN':
        return <Badge variant="warning">Đã tiếp đón</Badge>;
      case 'CONFIRMED':
        return <Badge variant="secondary">Đã xác nhận</Badge>;
      case 'PENDING':
        return <Badge variant="outline">Chờ xác nhận</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Đã hủy</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Top Banner / Hero */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Bảng Quản Trị Trung Tâm Phòng Khám
            </h2>
            <Badge variant="success">Flyway V4 Applied</Badge>
            <Badge variant="info">MySQL 8.4 Live</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Hệ sinh thái y tế toàn diện: Hồ sơ Bệnh nhân, Lịch hẹn, Danh mục Thuốc, Bác sĩ & Xác thực RBAC
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchHealth();
              refetchPatients();
              refetchAppointments();
            }}
            isLoading={isHealthFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isHealthFetching ? 'animate-spin' : ''}`} />
            Đồng bộ dữ liệu
          </Button>
          <a
            href="http://localhost:8080/swagger-ui/index.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" className="gap-2 bg-teal-600 hover:bg-teal-700">
              <FileCode2 className="h-4 w-4" />
              Swagger API Docs
              <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
        </div>
      </div>

      {/* Global Alerts for Form Feedback */}
      {formSuccess && (
        <Alert variant="success" title="Thao tác thành công">
          <div className="flex items-center justify-between">
            <span>{formSuccess}</span>
            <Button size="sm" variant="ghost" onClick={() => setFormSuccess(null)}>Đóng</Button>
          </div>
        </Alert>
      )}

      {formError && (
        <Alert variant="destructive" title="Lỗi thực thi nghiệp vụ">
          <div className="flex items-center justify-between">
            <span>{formError}</span>
            <Button size="sm" variant="ghost" onClick={() => setFormError(null)}>Đóng</Button>
          </div>
        </Alert>
      )}

      {/* Realtime Metric Overview Cards (Live MySQL Data) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Metric 1: Patients */}
        <Card 
          className={`cursor-pointer transition-all border-l-4 ${activeTab === 'patients' ? 'ring-2 ring-teal-500 border-l-teal-600' : 'border-l-teal-600 hover:bg-slate-50'}`}
          onClick={() => setActiveTab('patients')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Bệnh Nhân (DB)</span>
              <Users className="h-5 w-5 text-teal-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {isPatientsLoading ? '...' : patientsList.length}
              </span>
              <span className="text-xs text-slate-500">hồ sơ thực</span>
            </div>
            <p className="mt-1 text-[11px] text-teal-700 font-medium">Bấm xem danh sách & tạo mới &rarr;</p>
          </CardContent>
        </Card>

        {/* Metric 2: Appointments */}
        <Card 
          className={`cursor-pointer transition-all border-l-4 ${activeTab === 'appointments' ? 'ring-2 ring-indigo-500 border-l-indigo-600' : 'border-l-indigo-600 hover:bg-slate-50'}`}
          onClick={() => setActiveTab('appointments')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Lịch Hẹn Khám</span>
              <Calendar className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {isAppointmentsLoading ? '...' : appointmentsList.length}
              </span>
              <span className="text-xs text-slate-500">phiếu hẹn</span>
            </div>
            <p className="mt-1 text-[11px] text-indigo-700 font-medium">Bấm phân luồng & đặt lịch &rarr;</p>
          </CardContent>
        </Card>

        {/* Metric 3: Medicines */}
        <Card 
          className={`cursor-pointer transition-all border-l-4 ${activeTab === 'medicines' ? 'ring-2 ring-emerald-500 border-l-emerald-600' : 'border-l-emerald-600 hover:bg-slate-50'}`}
          onClick={() => setActiveTab('medicines')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Kho Dược Phẩm</span>
              <Pill className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{medicinesList.length}</span>
              <span className="text-xs text-slate-500">mặt hàng</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-700 font-medium">Danh mục & tồn kho an toàn &rarr;</p>
          </CardContent>
        </Card>

        {/* Metric 4: Doctors */}
        <Card 
          className={`cursor-pointer transition-all border-l-4 ${activeTab === 'doctors' ? 'ring-2 ring-sky-500 border-l-sky-600' : 'border-l-sky-600 hover:bg-slate-50'}`}
          onClick={() => setActiveTab('doctors')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Đội Ngũ Bác Sĩ</span>
              <Stethoscope className="h-5 w-5 text-sky-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{doctorsList.length}</span>
              <span className="text-xs text-slate-500">chuyên gia</span>
            </div>
            <p className="mt-1 text-[11px] text-sky-700 font-medium">{specialtiesList.length} chuyên khoa &rarr;</p>
          </CardContent>
        </Card>

        {/* Metric 5: MySQL Database */}
        <Card 
          className={`cursor-pointer transition-all border-l-4 ${activeTab === 'overview' ? 'ring-2 ring-amber-500 border-l-amber-600' : 'border-l-amber-600 hover:bg-slate-50'}`}
          onClick={() => setActiveTab('overview')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Cơ Sở Dữ Liệu</span>
              <Database className="h-5 w-5 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {isDbConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-amber-700 font-medium">Flyway v4 & RBAC &rarr;</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-semibold transition-colors ${
            activeTab === 'overview'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Server className="h-4 w-4" />
          Hệ Thống & Phân Quyền (RBAC)
        </button>

        <button
          onClick={() => setActiveTab('patients')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-semibold transition-colors ${
            activeTab === 'patients'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          Hồ Sơ Bệnh Nhân ({patientsList.length})
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-semibold transition-colors ${
            activeTab === 'appointments'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Lịch Hẹn Khám ({appointmentsList.length})
        </button>

        <button
          onClick={() => setActiveTab('medicines')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-semibold transition-colors ${
            activeTab === 'medicines'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="h-4 w-4" />
          Kho Dược & Thuốc ({medicinesList.length})
        </button>

        <button
          onClick={() => setActiveTab('doctors')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-semibold transition-colors ${
            activeTab === 'doctors'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope className="h-4 w-4" />
          Bác Sĩ & Chuyên Khoa ({doctorsList.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & SYSTEM / RBAC SWITCHER                                   */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick RBAC Role Switcher Bar */}
          <Card className="border-teal-200 bg-teal-50/40">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-teal-900">
                  <KeyRound className="h-5 w-5 text-teal-600" />
                  Chuyển Đổi Nhanh Tài Khoản & Vai Trò Thử Nghiệm (Role Switcher)
                </CardTitle>
                <Badge variant="outline" className="bg-white">
                  Đang hoạt động: <strong className="ml-1 text-teal-700">{activeRoleName}</strong>
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Mỗi tài khoản được mã hóa mật khẩu bằng BCrypt (strength 10), cấp phát token JWT thực tế để gọi các API bảo mật:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRoleLogin('admin', 'Admin@123456', 'Quản Trị Viên (ADMIN)')}
                  isLoading={loginLoading}
                  className="bg-white hover:bg-teal-100 hover:text-teal-900"
                >
                  🛡️ Admin (admin)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRoleLogin('bs_minhanh', 'Doctor@123456', 'Bác Sĩ Trưởng Khoa')}
                  isLoading={loginLoading}
                  className="bg-white hover:bg-teal-100 hover:text-teal-900"
                >
                  🩺 Bác Sĩ (bs_minhanh)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRoleLogin('tiepdon_huong', 'Staff@123456', 'Nhân Viên Tiếp Đón')}
                  isLoading={loginLoading}
                  className="bg-white hover:bg-teal-100 hover:text-teal-900"
                >
                  📋 Tiếp Đón (tiepdon_huong)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRoleLogin('thungan_linh', 'Staff@123456', 'Thu Ngân Viện Phí')}
                  isLoading={loginLoading}
                  className="bg-white hover:bg-teal-100 hover:text-teal-900"
                >
                  💳 Thu Ngân (thungan_linh)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRoleLogin('duocsi_phuong', 'Staff@123456', 'Dược Sĩ Quản Kho')}
                  isLoading={loginLoading}
                  className="bg-white hover:bg-teal-100 hover:text-teal-900"
                >
                  💊 Dược Sĩ (duocsi_phuong)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRoleLogin('bn_minhtri', 'Patient@123456', 'Bệnh Nhân Portal')}
                  isLoading={loginLoading}
                  className="bg-white hover:bg-teal-100 hover:text-teal-900"
                >
                  👤 Bệnh Nhân (bn_minhtri)
                </Button>
              </div>

              {loginResult && (
                <div
                  className={`mt-3 rounded-lg p-3 text-xs border ${
                    loginResult.success
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-rose-200 bg-rose-50 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    {loginResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    )}
                    {loginResult.message}
                  </div>
                  {loginResult.data && (
                    <div className="mt-2 space-y-1 font-mono text-[11px] bg-white/80 p-2 rounded">
                      <div><strong>Vai trò:</strong> {loginResult.data.roles.join(', ')}</div>
                      <div><strong>Quyền hạn cấp phát:</strong> {loginResult.data.permissions.length} permissions</div>
                      <div className="truncate"><strong>Access Token:</strong> {loginResult.data.accessToken.substring(0, 40)}...</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Specs & Architecture Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Database className="h-5 w-5 text-teal-600" />
                    Thông Số Kết Nối MySQL & Backend
                  </CardTitle>
                  <Badge variant={isDbConnected ? 'success' : 'secondary'}>
                    {isDbConnected ? 'Sẵn sàng' : 'Chưa kết nối'}
                  </Badge>
                </div>
                <CardDescription>
                  Thông số thực thi đọc trực tiếp từ Spring Boot Health Endpoint
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-slate-50 p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                    <span className="text-slate-500">Database Engine:</span>
                    <span className="font-semibold text-slate-800">
                      {healthData?.database?.databaseProduct || 'MySQL'} {healthData?.database?.databaseVersion || '8.x'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                    <span className="text-slate-500">Flyway Migrations:</span>
                    <span className="font-semibold text-emerald-700">
                      V1, V2, V3, V4 APPLIED (Version 4)
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                    <span className="text-slate-500">Active Profile:</span>
                    <span className="font-semibold text-slate-800">
                      {healthData?.activeProfile || 'dev'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                    <span className="text-slate-500">Server Time (VN):</span>
                    <span className="font-semibold text-slate-800 truncate">
                      {healthData?.timestampVietnam ? formatDateTime(healthData.timestampVietnam) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Uptime:</span>
                    <span className="font-semibold text-teal-700">
                      {healthData?.uptimeReadable || '—'}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-teal-100 bg-teal-50/50 p-3 text-xs text-teal-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-teal-600" />
                    Tính Toàn Vẹn & Khóa Ngoại
                  </div>
                  <p className="text-teal-800">
                    Hệ thống kiểm tra tính toàn vẹn Referential Integrity trên toàn bộ quan hệ: Bệnh nhân - Lịch hẹn, Bác sĩ - Chuyên khoa, và Khóa chống mồ côi (Orphan-free).
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-5 w-5 text-amber-600" />
                  Quy Tắc Y Tế Bắt Buộc (AGENTS.md)
                </CardTitle>
                <CardDescription>
                  Tuân thủ 10 nguyên tắc kiến trúc và bảo mật y tế
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-slate-600">
                <div className="rounded-lg border border-slate-200 p-2.5 bg-slate-50">
                  <strong className="text-slate-900">1. Tách biệt User & Patient:</strong> Bệnh nhân vãng lai không bắt buộc tài khoản User; liên kết qua <code>patient_user_links</code> khi mở cổng portal.
                </div>
                <div className="rounded-lg border border-slate-200 p-2.5 bg-slate-50">
                  <strong className="text-slate-900">2. Quyền riêng tư (Clinical Privacy):</strong> Tài khoản ADMIN không tự ý đọc bệnh án lâm sàng.
                </div>
                <div className="rounded-lg border border-slate-200 p-2.5 bg-slate-50">
                  <strong className="text-slate-900">3. Cấm xóa vật lý (No Hard Delete):</strong> Hồ sơ bệnh nhân, lịch hẹn, bệnh án và hóa đơn chỉ soft-delete hoặc chuyển trạng thái.
                </div>
                <div className="rounded-lg border border-slate-200 p-2.5 bg-slate-50">
                  <strong className="text-slate-900">4. Dược phẩm FEFO:</strong> Xuất kho ưu tiên lô có hạn dùng gần nhất (First Expired, First Out).
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PATIENTS MANAGEMENT                                                */}
      {/* ========================================================================= */}
      {activeTab === 'patients' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-teal-600" />
                  Danh Sách Hồ Sơ Bệnh Nhân (Truy Xuất Từ MySQL)
                </CardTitle>
                <CardDescription>
                  Tổng số {patientsList.length} hồ sơ bệnh nhân giả lập thực tế được lưu trữ an toàn trong bảng <code>patients</code>
                </CardDescription>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => setShowAddPatientModal(!showAddPatientModal)}
                  className="gap-2 bg-teal-600 hover:bg-teal-700"
                >
                  <Plus className="h-4 w-4" />
                  {showAddPatientModal ? 'Đóng Form' : 'Thêm Bệnh Nhân Mới'}
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mt-4 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo Mã bệnh nhân (BN-...), Họ tên, hoặc Số điện thoại..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-2 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
              <span className="text-xs text-slate-500 shrink-0">
                Hiển thị {filteredPatients.length} / {patientsList.length} bệnh nhân
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Add Patient Modal / Form Drawer */}
            {showAddPatientModal && (
              <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-teal-200/60 pb-2">
                  <h3 className="font-semibold text-teal-900 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-teal-600" />
                    Đăng Ký Hồ Sơ Bệnh Nhân Mới (Gọi API POST /api/v1/patients)
                  </h3>
                  <span className="text-xs text-teal-700">Mã BN sẽ tự động sinh: <code>BN-2026-XXXX</code></span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                  <div>
                    <label className="font-medium text-slate-700">Họ và tên bệnh nhân *</label>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={newPatient.fullName}
                      onChange={(e) => setNewPatient({ ...newPatient, fullName: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-700">Số điện thoại *</label>
                    <input
                      type="text"
                      placeholder="0901234567"
                      value={newPatient.phone}
                      onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-700">Ngày sinh *</label>
                    <input
                      type="date"
                      value={newPatient.dateOfBirth}
                      onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-700">Giới tính *</label>
                    <select
                      value={newPatient.gender}
                      onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none bg-white"
                    >
                      <option value="NAM">Nam</option>
                      <option value="NU">Nữ</option>
                      <option value="KHAC">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-medium text-slate-700">Số CCCD / Định danh</label>
                    <input
                      type="text"
                      placeholder="079201000123"
                      value={newPatient.identityCardNo}
                      onChange={(e) => setNewPatient({ ...newPatient, identityCardNo: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-700">Nhóm máu</label>
                    <select
                      value={newPatient.bloodType}
                      onChange={(e) => setNewPatient({ ...newPatient, bloodType: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none bg-white"
                    >
                      <option value="A+">A+</option>
                      <option value="B+">B+</option>
                      <option value="O+">O+</option>
                      <option value="AB+">AB+</option>
                      <option value="A-">A-</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-medium text-slate-700">Địa chỉ cư trú</label>
                    <input
                      type="text"
                      placeholder="123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh"
                      value={newPatient.address}
                      onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-700">Tiền sử dị ứng thuốc / thức ăn</label>
                    <input
                      type="text"
                      placeholder="Không dị ứng, hoặc Dị ứng Penicillin..."
                      value={newPatient.allergies}
                      onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddPatientModal(false)}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 gap-2"
                    onClick={() => {
                      if (!newPatient.fullName || !newPatient.phone) {
                        setFormError('Vui lòng điền họ tên và số điện thoại bệnh nhân');
                        return;
                      }
                      createPatientMutation.mutate(newPatient);
                    }}
                    isLoading={createPatientMutation.isPending}
                  >
                    Lưu Hồ Sơ Vào MySQL
                  </Button>
                </div>
              </div>
            )}

            {/* Patients Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Mã BN</th>
                    <th className="py-3 px-4">Họ và Tên</th>
                    <th className="py-3 px-4">Giới tính</th>
                    <th className="py-3 px-4">Ngày sinh</th>
                    <th className="py-3 px-4">Số điện thoại</th>
                    <th className="py-3 px-4">Số CCCD</th>
                    <th className="py-3 px-4">Nhóm máu / Dị ứng</th>
                    <th className="py-3 px-4">Địa chỉ cư trú</th>
                    <th className="py-3 px-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {isPatientsLoading ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Đang truy vấn danh sách bệnh nhân từ MySQL...
                      </td>
                    </tr>
                  ) : filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Không tìm thấy bệnh nhân nào phù hợp với từ khóa tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-teal-700">
                          {p.patientCode}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {p.fullName}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={p.gender === 'NAM' ? 'info' : 'secondary'}>
                            {p.gender === 'NAM' ? 'Nam' : p.gender === 'NU' ? 'Nữ' : 'Khác'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {p.dateOfBirth}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-mono">
                          {p.phone}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {p.identityCardNo || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-rose-600">{p.bloodType || '—'}</span>
                          {p.allergies && p.allergies !== 'Không' && (
                            <span className="block text-[11px] text-amber-700 truncate max-w-[150px]">
                              ⚠️ {p.allergies}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 truncate max-w-[180px]">
                          {p.address || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="success">Hoạt động</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: APPOINTMENTS MANAGEMENT                                            */}
      {/* ========================================================================= */}
      {activeTab === 'appointments' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  Quản Lý Lịch Hẹn Khám (Ràng Buộc Khóa Ngoại MySQL)
                </CardTitle>
                <CardDescription>
                  Tổng số {appointmentsList.length} lịch hẹn có liên kết toàn vẹn với bảng <code>patients</code>, <code>specialties</code>, <code>staff_profiles</code>, <code>rooms</code>
                </CardDescription>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => setShowAddAppointmentModal(!showAddAppointmentModal)}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  {showAddAppointmentModal ? 'Đóng Form' : 'Đặt Lịch Hẹn Mới'}
                </Button>
              </div>
            </div>

            {/* Filter by Status */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-slate-600 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Lọc trạng thái:
              </span>
              {['ALL', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'PENDING', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setAppointmentFilter(st)}
                  className={`rounded-full px-3 py-1 font-medium transition-colors ${
                    appointmentFilter === st
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'Tất cả' : st}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Add Appointment Modal / Form Drawer */}
            {showAddAppointmentModal && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2">
                  <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-indigo-600" />
                    Đặt Lịch Hẹn Khám Mới (Gọi API POST /api/v1/appointments)
                  </h3>
                  <span className="text-xs text-indigo-700">Mã lịch hẹn sinh tự động: <code>LH-YYYYMMDD-XXXX</code></span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                  <div>
                    <label className="font-medium text-slate-700">Chọn bệnh nhân *</label>
                    <select
                      value={newAppointment.patientId}
                      onChange={(e) => setNewAppointment({ ...newAppointment, patientId: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                      required
                    >
                      <option value="">-- Chọn bệnh nhân từ CSDL --</option>
                      {patientsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.patientCode} - {p.fullName} ({p.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-medium text-slate-700">Chuyên khoa khám *</label>
                    <select
                      value={newAppointment.specialtyId}
                      onChange={(e) => setNewAppointment({ ...newAppointment, specialtyId: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                      required
                    >
                      <option value="">-- Chọn chuyên khoa --</option>
                      {specialtiesList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-medium text-slate-700">Bác sĩ phụ trách (Tùy chọn)</label>
                    <select
                      value={newAppointment.doctorId}
                      onChange={(e) => {
                        const doc = doctorsList.find(d => d.id === e.target.value);
                        setNewAppointment({
                          ...newAppointment,
                          doctorId: e.target.value,
                          roomId: doc?.roomId || newAppointment.roomId,
                        });
                      }}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                    >
                      <option value="">-- Để phòng khám tự sắp xếp --</option>
                      {doctorsList.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.fullName} ({d.qualification || 'Bác sĩ'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-medium text-slate-700">Ngày hẹn khám *</label>
                    <input
                      type="date"
                      value={newAppointment.appointmentDate}
                      onChange={(e) => setNewAppointment({ ...newAppointment, appointmentDate: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-700">Giờ hẹn khám *</label>
                    <input
                      type="time"
                      value={newAppointment.appointmentTime}
                      onChange={(e) => setNewAppointment({ ...newAppointment, appointmentTime: `${e.target.value}:00` })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-700">Ca khám</label>
                    <select
                      value={newAppointment.shift}
                      onChange={(e) => setNewAppointment({ ...newAppointment, shift: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                    >
                      <option value="MORNING">Buổi sáng (07:30 - 11:30)</option>
                      <option value="AFTERNOON">Buổi chiều (13:30 - 17:00)</option>
                      <option value="EVENING">Buổi tối (17:30 - 20:00)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="font-medium text-slate-700">Lý do khám / Triệu chứng lâm sàng ban đầu</label>
                    <input
                      type="text"
                      placeholder="Đau đầu, sốt nhẹ, kiểm tra tim mạch định kỳ..."
                      value={newAppointment.reason}
                      onChange={(e) => setNewAppointment({ ...newAppointment, reason: e.target.value })}
                      className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddAppointmentModal(false)}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                    onClick={() => {
                      if (!newAppointment.patientId) {
                        setFormError('Vui lòng chọn bệnh nhân');
                        return;
                      }
                      if (!newAppointment.specialtyId) {
                        setFormError('Vui lòng chọn chuyên khoa');
                        return;
                      }
                      createAppointmentMutation.mutate(newAppointment);
                    }}
                    isLoading={createAppointmentMutation.isPending}
                  >
                    Xác Nhận Đặt Lịch (Ghi Vào MySQL)
                  </Button>
                </div>
              </div>
            )}

            {/* Appointments Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Mã Phiếu</th>
                    <th className="py-3 px-4">Bệnh Nhân</th>
                    <th className="py-3 px-4">Chuyên Khoa</th>
                    <th className="py-3 px-4">Bác Sĩ Khám</th>
                    <th className="py-3 px-4">Phòng</th>
                    <th className="py-3 px-4">Thời Gian Khám</th>
                    <th className="py-3 px-4">Lý Do Khám</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {isAppointmentsLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Đang truy vấn danh sách lịch hẹn từ MySQL...
                      </td>
                    </tr>
                  ) : filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Không có lịch hẹn nào tương ứng với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-indigo-700">
                          {apt.appointmentCode}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{apt.patientName || 'Bệnh nhân'}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{apt.patientPhone || ''}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {apt.specialtyName || 'Đa khoa'}
                        </td>
                        <td className="py-3 px-4 text-slate-800">
                          {apt.doctorName ? (
                            <span className="font-medium text-teal-800">{apt.doctorName}</span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa xếp bác sĩ</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {apt.roomName || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <div className="text-slate-900 font-semibold">{apt.appointmentDate}</div>
                          <div className="text-[11px] text-slate-500">{apt.appointmentTime} ({apt.shift})</div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 truncate max-w-[200px]">
                          {apt.reason || 'Khám thông thường'}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(apt.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MEDICINES & INVENTORY                                              */}
      {/* ========================================================================= */}
      {activeTab === 'medicines' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Pill className="h-5 w-5 text-emerald-600" />
                  Kho Dược Phẩm & Thuốc Thiết Yếu (15 Mặt Hàng)
                </CardTitle>
                <CardDescription>
                  Dữ liệu đồng bộ trực tiếp từ bảng <code>medicines</code>, hỗ trợ nguyên tắc xuất kho FEFO (First Expired, First Out)
                </CardDescription>
              </div>
              <Badge variant="success">FEFO Enabled</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Mã Thuốc</th>
                    <th className="py-3 px-4">Tên Biệt Dược</th>
                    <th className="py-3 px-4">Hoạt Chất Chính</th>
                    <th className="py-3 px-4">Đơn Vị Tính</th>
                    <th className="py-3 px-4">Đơn Giá Bán</th>
                    <th className="py-3 px-4">Tồn Kho Khả Dụng</th>
                    <th className="py-3 px-4">Mức Cảnh Báo</th>
                    <th className="py-3 px-4">Phân Loại Kê Đơn</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {medicinesList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Đang đọc danh mục thuốc từ MySQL...
                      </td>
                    </tr>
                  ) : (
                    medicinesList.map((m) => {
                      const isLowStock = m.currentStock <= m.minStockAlert;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-semibold text-emerald-700">
                            {m.code}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {m.name}
                          </td>
                          <td className="py-3 px-4 text-slate-600 italic">
                            {m.genericName}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">
                            {m.unit}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                            {formatVND(m.unitPrice)}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <span className={`font-bold ${isLowStock ? 'text-amber-600' : 'text-emerald-700'}`}>
                              {m.currentStock.toLocaleString('vi-VN')}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">
                            {m.minStockAlert}
                          </td>
                          <td className="py-3 px-4">
                            {m.prescriptionRequired ? (
                              <Badge variant="destructive">Kê đơn bắt buộc</Badge>
                            ) : (
                              <Badge variant="secondary">Thuốc thông thường</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isLowStock ? (
                              <Badge variant="warning">⚠️ Sắp hết hàng</Badge>
                            ) : (
                              <Badge variant="success">✅ Đủ tồn kho</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DOCTORS & SPECIALTIES                                              */}
      {/* ========================================================================= */}
      {activeTab === 'doctors' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-sky-600" />
                Đội Ngũ Bác Sĩ & Chuyên Khoa Lâm Sàng
              </CardTitle>
              <CardDescription>
                5 Bác sĩ chuyên khoa tiêu biểu liên kết phân luồng với buồng khám và bảng phân công lịch trực
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {doctorsList.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 hover:border-sky-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                          BS
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{doc.fullName}</h4>
                          <span className="text-xs text-sky-700 font-mono font-semibold">{doc.staffCode}</span>
                        </div>
                      </div>
                      <Badge variant="info">{doc.qualification || 'Bác sĩ'}</Badge>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3 font-medium">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Chuyên khoa:</span>
                        <span className="text-slate-800 font-semibold">{doc.specialtyName || 'Nội tổng quát'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Phòng làm việc:</span>
                        <span className="text-teal-700 font-semibold">{doc.roomName || 'Phòng Khám Nội 1'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Điện thoại liên hệ:</span>
                        <span className="font-mono text-slate-700">{doc.phone}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
