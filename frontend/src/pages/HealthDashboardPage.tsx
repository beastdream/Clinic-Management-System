import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Stethoscope, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw,
  Sparkles,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  BarChart3,
  CalendarCheck,
  Settings,
  UserCheck,
  Layers,
  ShieldAlert,
  Pill,
  Activity
} from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import { authService } from '@/services/authService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { formatDate } from '@/lib/utils';
import { ReceptionistDashboard } from '@/pages/receptionist/ReceptionistDashboard';
import { CashierDashboard } from '@/pages/cashier/CashierDashboard';

export const HealthDashboardPage: React.FC = () => {
  const currentUser = authService.getCurrentUser();
  const currentRole = currentUser?.roles?.[0]?.replace('ROLE_', '') || 'GUEST';
  const hasRole = (role: string) =>
    (currentUser?.roles ?? []).some((r) => r.toUpperCase().replace('ROLE_', '') === role);
  const isReceptionist = hasRole('RECEPTIONIST');
  const isCashier = hasRole('CASHIER');
  // Tiếp tân / Thu ngân có bảng điều khiển riêng; Bác sĩ & Admin giữ giao diện tổng quan bên dưới
  const isFrontDesk = (isReceptionist || isCashier) && !hasRole('DOCTOR') && !hasRole('ADMIN');

  const {
    data: statsResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardService.getStats,
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !isFrontDesk,
  });

  const stats = statsResponse?.data;

  // Calculate total for status breakdown percentage
  const totalBreakdownCount = stats?.statusBreakdown?.reduce((sum, item) => sum + item.count, 0) || 1;

  // Find max daily count for bar chart scaling
  const maxDailyCount = stats?.dailyAppointments && stats.dailyAppointments.length > 0
    ? Math.max(...stats.dailyAppointments.map(d => d.count), 1)
    : 1;

  // Format today's date in Vietnamese
  const todayFormatted = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  if (isFrontDesk) {
    const roleTitle = isReceptionist && isCashier
      ? 'Tiếp Tân & Thu Ngân'
      : isReceptionist ? 'Tiếp Tân' : 'Thu Ngân';
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-800 via-teal-700 to-slate-800 p-6 md:p-8 text-white shadow-lg">
          <div className="relative z-10 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-200">
              <CalendarCheck className="h-4 w-4" />
              <span>{todayFormatted}</span>
              <span className="text-teal-300">•</span>
              <span>Quầy {roleTitle}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Xin chào, {currentUser?.fullName || currentUser?.username}
            </h1>
            <p className="text-sm text-teal-100 max-w-2xl leading-relaxed">
              {isReceptionist && isCashier
                ? 'Tiếp đón bệnh nhân theo lịch hẹn và thu viện phí trong ngày.'
                : isReceptionist
                  ? 'Tiếp đón bệnh nhân theo lịch hẹn, theo dõi hàng chờ khám trong ngày.'
                  : 'Theo dõi hóa đơn chờ thanh toán và số tiền đã thu.'}
            </p>
          </div>
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        </div>

        {isReceptionist && <ReceptionistDashboard />}
        {isCashier && <CashierDashboard />}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-800 via-teal-700 to-slate-800 p-6 md:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-200">
              <CalendarCheck className="h-4 w-4" />
              <span>{todayFormatted}</span>
              <span className="text-teal-300">•</span>
              <span className="capitalize">Khu vực điều hành</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Bảng Điều Khiển Phòng Khám (Executive Dashboard)
            </h1>
            <p className="text-sm text-teal-100 max-w-2xl leading-relaxed">
              Theo dõi trực tiếp các chỉ số y tế, tiến độ lượt khám, hàng chờ và hoạt động phòng khám từ cơ sở dữ liệu MySQL thời gian thực.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-9 gap-1.5 backdrop-blur"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Làm mới số liệu
            </Button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-40 -top-10 w-40 h-40 rounded-full bg-teal-500/10 pointer-events-none blur-2xl" />
      </div>

      {/* Error state if backend down */}
      {isError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>
              Không thể tải dữ liệu thống kê từ Backend: {(error as any)?.message || 'Lỗi kết nối máy chủ.'}
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs h-8">
            Thử lại
          </Button>
        </div>
      )}

      {/* 2. 5 Core Real-time KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* KPI 1: Tổng số Bệnh nhân */}
          {currentRole === 'DOCTOR' ? (
            <Link to="/patients" className="group">
              <Card className="p-4 border-slate-200/80 hover:border-teal-400 hover:shadow-md transition-all h-full bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Tổng Bệnh Nhân</span>
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {stats.totalPatients}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-teal-700 font-medium mt-1">
                    <span>Hồ sơ lưu trữ CSDL</span>
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Card>
            </Link>
          ) : (
            <div className="group">
              <Card className="p-4 border-slate-200/80 transition-all h-full bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Tổng Bệnh Nhân</span>
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {stats.totalPatients}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    <span>Hồ sơ lưu trữ CSDL</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* KPI 2: Tổng số Bác sĩ */}
          <Link to="/doctors" className="group">
            <Card className="p-4 border-slate-200/80 hover:border-sky-400 hover:shadow-md transition-all h-full bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Đội Ngũ Bác Sĩ</span>
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                  <Stethoscope className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {stats.totalDoctors}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-sky-700 font-medium mt-1">
                  <span>Đa chuyên khoa</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Card>
          </Link>

          {/* KPI 3: Lịch hẹn Hôm nay */}
          <div className="group">
            <Card className="p-4 border-slate-200/80 transition-all h-full bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Lịch Hẹn Hôm Nay</span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {stats.todayAppointments}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  <span>Ca đăng ký trong ngày</span>
                </div>
              </div>
            </Card>
          </div>

          {/* KPI 4: Lịch hẹn đang chờ khám */}
          <div className="group">
            <Card className="p-4 border-slate-200/80 transition-all h-full bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Đang Chờ Khám</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-amber-600 font-mono tracking-tight">
                  {stats.waitingAppointments}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  <span>Hàng chờ phòng khám</span>
                </div>
              </div>
            </Card>
          </div>

          {/* KPI 5: Số lượt khám đã hoàn thành */}
          {currentRole === 'DOCTOR' ? (
            <Link to="/clinical" className="group">
              <Card className="p-4 border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition-all h-full bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Đã Hoàn Thành</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
                    {stats.completedEncounters}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium mt-1">
                    <span>Bệnh án đã khóa</span>
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Card>
            </Link>
          ) : (
            <div className="group">
              <Card className="p-4 border-slate-200/80 transition-all h-full bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Đã Hoàn Thành</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
                    {stats.completedEncounters}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    <span>Bệnh án đã khóa</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      ) : null}

      {/* 3. Analytics Section: Status Breakdown & Daily Chart */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Phân bố lịch hẹn theo trạng thái (MySQL Group By) */}
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-teal-600" />
                    Phân Bố Trạng Thái Lịch Hẹn
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Dữ liệu thời gian thực được tổng hợp theo cột `status` từ bảng `appointments`
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {totalBreakdownCount} lịch hẹn
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {stats.statusBreakdown && stats.statusBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {stats.statusBreakdown.map((item) => {
                    const percentage = Math.round((item.count / totalBreakdownCount) * 100);
                    return (
                      <div key={item.status} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700 flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.label}
                            <span className="font-mono text-slate-400 font-normal">[{item.status}]</span>
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            {item.count}{' '}
                            <span className="text-slate-400 font-normal text-[11px]">({percentage}%)</span>
                          </span>
                        </div>
                        {/* Visual Progress Bar */}
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  Chưa có dữ liệu lịch hẹn để phân tích.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart 2: Thống kê lịch hẹn theo ngày (Daily Activity Chart) */}
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-indigo-600" />
                    Hoạt Động Lịch Hẹn Theo Ngày
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Số lượng ca khám phân bố trong các ngày gần đây từ MySQL
                  </CardDescription>
                </div>
                <Badge variant="default" className="text-xs font-mono">
                  Gần đây
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {stats.dailyAppointments && stats.dailyAppointments.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-200">
                    {stats.dailyAppointments.map((d) => {
                      const heightPercent = Math.max(15, Math.round((d.count / maxDailyCount) * 100));
                      return (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                          {/* Tooltip on hover */}
                          <div className="text-[11px] font-bold font-mono text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60 opacity-90 group-hover:scale-110 transition-transform">
                            {d.count} ca
                          </div>
                          {/* Bar */}
                          <div
                            className="w-full max-w-[42px] rounded-t-md bg-gradient-to-t from-teal-600 to-teal-400 group-hover:from-teal-700 group-hover:to-teal-500 transition-all shadow-xs"
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {/* Date labels */}
                  <div className="flex justify-between gap-2 text-[11px] font-mono text-slate-500">
                    {stats.dailyAppointments.map((d) => (
                      <div key={d.date} className="flex-1 text-center truncate" title={d.date}>
                        {formatDate(d.date)}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  Chưa có lịch hẹn theo ngày.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. Role Quick Navigation Shortcuts */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Sparkles className="h-4 w-4 text-teal-600" />
            <span>Phím Tắt Nghiệp Vụ Theo Vai Trò ({currentRole})</span>
          </div>
          <span className="text-[11px] text-slate-400">Chọn tác vụ thường dùng</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* ========================================================================= */}
          {/* ROLE DOCTOR SHORTCUTS: 100% Chuyên môn lâm sàng, không lẫn quản trị        */}
          {/* ========================================================================= */}
          {currentRole === 'DOCTOR' ? (
            <>
              {/* Doctor Shortcut 1: Khám bệnh & ICD-10 */}
              <Link
                to="/clinical"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-100 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-teal-800">
                      Khám Bệnh & ICD-10
                    </div>
                    <div className="text-[11px] text-slate-500">Mở phiếu khám, chuẩn hóa mã ICD-10</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* Doctor Shortcut 2: Kê đơn thuốc */}
              <Link
                to="/clinical"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Pill className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                      Kê Đơn Thuốc Điện Tử
                    </div>
                    <div className="text-[11px] text-slate-500">Kê đơn kho dược & cảnh báo dị ứng</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* Doctor Shortcut 3: Chỉ định CLS */}
              <Link
                to="/clinical"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-800">
                      Chỉ Định & Kết Quả CLS
                    </div>
                    <div className="text-[11px] text-slate-500">Chỉ định xét nghiệm & kết luận</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* Doctor Shortcut 4: Hồ sơ bệnh nhân */}
              <Link
                to="/patients"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-800">
                      Hồ Sơ Bệnh Nhân
                    </div>
                    <div className="text-[11px] text-slate-500">Tra cứu tiền sử, bệnh án & dị ứng</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* Doctor Shortcut 5: Bệnh án dọc & EMR */}
              <Link
                to="/clinical"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-purple-800">
                      Bệnh Án Dọc & EMR
                    </div>
                    <div className="text-[11px] text-slate-500">Biểu đồ sinh hiệu & lịch sử ca khám</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* Doctor Shortcut 6: Đội ngũ Bác sĩ */}
              <Link
                to="/doctors"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-100 text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-sky-800">
                      Đội Ngũ Bác Sĩ
                    </div>
                    <div className="text-[11px] text-slate-500">Danh bạ chuyên khoa & Bác sĩ</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </>
          ) : currentRole === 'ADMIN' ? (
            /* ========================================================================= */
            /* ROLE ADMIN SHORTCUTS: 100% Nghiệp vụ quản trị hệ thống                    */
            /* ========================================================================= */
            <>
              {/* Admin Shortcut 1: Cài đặt hệ thống */}
              <Link
                to="/admin/settings"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-100 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <Settings className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-teal-800">
                      Cài Đặt Hệ Thống
                    </div>
                    <div className="text-[11px] text-slate-500">Bảo mật & Quản lý tài khoản</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* Admin Shortcut 2: Danh Mục Dùng Chung */}
              <Link
                to="/admin/master-data"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                      Danh Mục Dùng Chung
                    </div>
                    <div className="text-[11px] text-slate-500">Chuyên khoa, Phòng, Giá dịch vụ</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* Admin Shortcut 3: Quản Lý Nhân Sự */}
              <Link
                to="/admin/staff"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-purple-800">
                      Quản Lý Nhân Sự
                    </div>
                    <div className="text-[11px] text-slate-500">Hồ sơ & Phân quyền đa vai trò</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* Admin Shortcut 4: Nhật Ký Kiểm Toán */}
              <Link
                to="/admin/audit-logs"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-rose-800">
                      Nhật Ký Kiểm Toán
                    </div>
                    <div className="text-[11px] text-slate-500">Giám sát an toàn & Audit log</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* Admin Shortcut 5: Báo Cáo Quản Trị */}
              <Link
                to="/admin/reports"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-800">
                      Báo Cáo Quản Trị
                    </div>
                    <div className="text-[11px] text-slate-500">Thống kê ca khám & Xuất CSV</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* Admin Shortcut 6: Đội ngũ Bác sĩ */}
              <Link
                to="/doctors"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-100 text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-sky-800">
                      Đội Ngũ Bác Sĩ
                    </div>
                    <div className="text-[11px] text-slate-500">Danh sách chuyên khoa & Bác sĩ</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </>
          ) : (
            /* ========================================================================= */
            /* OTHER ROLES (CASHIER, RECEPTIONIST, GUEST)                                */
            /* ========================================================================= */
            <>
              <Link
                to="/billing"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                      Thu Ngân & Viện Phí
                    </div>
                    <div className="text-[11px] text-slate-500">Quản lý hóa đơn và thanh toán</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to="/doctors"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-100 text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-sky-800">
                      Đội Ngũ Bác Sĩ
                    </div>
                    <div className="text-[11px] text-slate-500">Danh bạ chuyên khoa & Bác sĩ</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
