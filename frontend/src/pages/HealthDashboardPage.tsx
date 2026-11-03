import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Stethoscope, 
  Clock, 
  CheckCircle2, 
  CreditCard, 
  ArrowRight, 
  RefreshCw,
  Database,
  Sparkles,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  BarChart3,
  CalendarCheck
} from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import { authService } from '@/services/authService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { RoleSwitcherModal } from '@/components/common/RoleSwitcherModal';
import { formatVND, formatDate } from '@/lib/utils';

export const HealthDashboardPage: React.FC = () => {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const currentUser = authService.getCurrentUser();
  const currentRole = currentUser?.roles?.[0]?.replace('ROLE_', '') || 'GUEST';

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
              Theo dõi trực tiếp các chỉ số y tế, tiến độ lượt khám, hàng chờ và doanh thu viện phí từ cơ sở dữ liệu MySQL thời gian thực.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRoleModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold gap-1.5 h-9 backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-300" />
              Đổi vai trò ({currentRole})
            </Button>
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

      {/* 2. 6 Core Real-time KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* KPI 1: Tổng số Bệnh nhân */}
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
          <Link to="/appointments" className="group">
            <Card className="p-4 border-slate-200/80 hover:border-indigo-400 hover:shadow-md transition-all h-full bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Lịch Hẹn Hôm Nay</span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {stats.todayAppointments}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-indigo-700 font-medium mt-1">
                  <span>Ca đăng ký trong ngày</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Card>
          </Link>

          {/* KPI 4: Lịch hẹn đang chờ khám */}
          <Link to="/appointments" className="group">
            <Card className="p-4 border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all h-full bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Đang Chờ Khám</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-amber-600 font-mono tracking-tight">
                  {stats.waitingAppointments}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-amber-700 font-medium mt-1">
                  <span>Hàng chờ phòng khám</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Card>
          </Link>

          {/* KPI 5: Số lượt khám đã hoàn thành */}
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

          {/* KPI 6: Doanh thu viện phí đã thu */}
          <Link to="/billing" className="group">
            <Card className="p-4 border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition-all h-full bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Doanh Thu Viện Phí</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-lg font-black text-emerald-800 font-mono tracking-tight truncate" title={formatVND(stats.paidRevenue)}>
                  {formatVND(stats.paidRevenue)}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium mt-1">
                  <span>Thực thu qua MySQL</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Card>
          </Link>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Action 1: Tiếp đón / Đặt lịch (Receptionist / Admin) */}
          <Link
            to="/appointments"
            className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-teal-800">
                  Tiếp Đón & Check-in
                </div>
                <div className="text-[11px] text-slate-500">Phân luồng hàng chờ</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
          </Link>

          {/* Action 2: Khám bệnh (Doctor) */}
          <Link
            to="/clinical"
            className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-100 text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-sky-800">
                  Phòng Khám Lâm Sàng
                </div>
                <div className="text-[11px] text-slate-500">Khám & Chẩn đoán ICD-10</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
          </Link>

          {/* Action 3: Thu ngân & Viện phí (Cashier) */}
          <Link
            to="/billing"
            className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                  Thu Ngân & Hóa Đơn
                </div>
                <div className="text-[11px] text-slate-500">Lập HĐ & Thu tiền viện phí</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </Link>

          {/* Action 4: Quản lý Bệnh nhân (Tất cả) */}
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
                <div className="text-[11px] text-slate-500">Tìm kiếm & Đăng ký mới</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </div>

      {/* 5. Recent Appointments Table (5 latest from MySQL) */}
      <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-600" />
                Danh Sách Tiếp Đón & Lịch Hẹn Gần Đây
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                5 bản ghi mới nhất được lưu trong bảng `appointments`
              </CardDescription>
            </div>
            <Link to="/appointments">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                Xem tất cả lịch hẹn
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {stats?.recentAppointments && stats.recentAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-4 font-mono">Mã Hẹn</th>
                    <th className="py-2.5 px-4">Bệnh nhân</th>
                    <th className="py-2.5 px-4">Bác sĩ phụ trách</th>
                    <th className="py-2.5 px-4">Chuyên khoa</th>
                    <th className="py-2.5 px-4">Ngày / Giờ</th>
                    <th className="py-2.5 px-4">Lý do khám</th>
                    <th className="py-2.5 px-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {stats.recentAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-teal-800">
                        {apt.appointmentCode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{apt.patientName || '—'}</div>
                        {apt.patientCode && (
                          <div className="font-mono text-[10px] text-slate-400">[{apt.patientCode}]</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {apt.doctorName || 'Chưa chỉ định'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {apt.specialtyName || 'Đa khoa'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        <div>{formatDate(apt.appointmentDate)}</div>
                        <div className="text-[10px] text-slate-400">{apt.appointmentTime}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={apt.reason}>
                        {apt.reason || 'Khám bệnh'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            apt.status === 'COMPLETED'
                              ? 'success'
                              : apt.status === 'CHECKED_IN'
                              ? 'warning'
                              : apt.status === 'CANCELLED'
                              ? 'destructive'
                              : 'default'
                          }
                          className="text-[10px] font-mono"
                        >
                          {apt.status === 'COMPLETED'
                            ? 'Đã khám'
                            : apt.status === 'CHECKED_IN'
                            ? 'Đã đến'
                            : apt.status === 'CANCELLED'
                            ? 'Đã hủy'
                            : apt.status === 'CONFIRMED'
                            ? 'Đã xác nhận'
                            : apt.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 italic">
              Chưa có lịch hẹn nào gần đây.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. System & Infrastructure Integrity Footer */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-800">
              Trạng thái CSDL: MySQL 8.0/8.4 LTS • Flyway Version: v7
            </div>
            <div className="text-[11px] text-slate-500">
              Mã hóa UTF-8 (utf8mb4), kiểm soát ACID transaction và toàn vẹn dữ liệu
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="success" className="gap-1 py-0.5 px-2 text-[10px]">
            <CheckCircle2 className="h-3 w-3" />
            Backend Port 8080 Active
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono">
            Spring Boot 3.3.5
          </Badge>
        </div>
      </div>

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
