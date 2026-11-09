import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  LogIn,
  Stethoscope,
  XCircle,
} from 'lucide-react';
import { appointmentService, AppointmentItem } from '@/services/appointmentService';
import { getApiErrorMessage } from '@/services/authService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/LoadingSkeleton';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Chờ xác nhận', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  CONFIRMED: { label: 'Đã xác nhận', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  CHECKED_IN: { label: 'Đã tiếp đón', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  IN_PROGRESS: { label: 'Đang khám', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  COMPLETED: { label: 'Hoàn thành', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-rose-50 text-rose-700 border-rose-200' },
};

/** Ngày hôm nay theo giờ máy, dạng YYYY-MM-DD (không dùng toISOString vì lệch múi giờ UTC). */
function todayIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const isAwaitingCheckIn = (a: AppointmentItem) => a.status === 'PENDING' || a.status === 'CONFIRMED';

export const ReceptionistDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const today = todayIso();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['appointments', 'reception-today', today],
    queryFn: () =>
      appointmentService.getAppointments({
        date: today,
        page: 0,
        size: 200,
        sortBy: 'appointmentTime',
        direction: 'asc',
      }),
    refetchInterval: 30000,
  });

  const checkInMutation = useMutation({
    mutationFn: (id: string) => appointmentService.checkInAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const appointments = data?.data?.content ?? data?.data?.items ?? [];
  const count = (...statuses: string[]) => appointments.filter((a) => statuses.includes(a.status)).length;

  const kpis = [
    { label: 'Lịch hẹn hôm nay', value: appointments.length, hint: 'Tổng ca đăng ký trong ngày', icon: CalendarClock, tone: 'text-slate-900', iconTone: 'bg-teal-50 text-teal-600' },
    { label: 'Chờ tiếp đón', value: count('PENDING', 'CONFIRMED'), hint: 'Chưa check-in tại quầy', icon: LogIn, tone: 'text-sky-700', iconTone: 'bg-sky-50 text-sky-600' },
    { label: 'Đang chờ khám', value: count('CHECKED_IN'), hint: 'Đã tiếp đón, chờ bác sĩ', icon: Clock, tone: 'text-amber-600', iconTone: 'bg-amber-50 text-amber-600' },
    { label: 'Đã khám xong', value: count('COMPLETED'), hint: 'Hoàn thành trong ngày', icon: CheckCircle2, tone: 'text-emerald-700', iconTone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Đã hủy', value: count('CANCELLED'), hint: 'Hủy hoặc không đến', icon: XCircle, tone: 'text-rose-600', iconTone: 'bg-rose-50 text-rose-600' },
  ];

  const queue = appointments.filter((a) => a.status !== 'CANCELLED' && a.status !== 'COMPLETED');

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <CalendarCheck className="h-4 w-4 text-teal-600" />
        Tiếp Đón Hôm Nay
      </div>

      {isError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>Không tải được lịch hẹn hôm nay: {getApiErrorMessage(error, 'Lỗi kết nối máy chủ.')}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs h-8">
            Thử lại
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Card key={k.label} className="p-4 border-slate-200/80 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">{k.label}</span>
                  <div className={`p-2 rounded-xl ${k.iconTone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className={`text-2xl font-black font-mono tracking-tight ${k.tone}`}>{k.value}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{k.hint}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">Hàng Chờ Tiếp Đón</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Lịch hẹn hôm nay chưa khám xong, sắp theo giờ hẹn. Bấm "Tiếp đón" khi bệnh nhân đến quầy.
              </CardDescription>
            </div>
            <Link to="/appointments">
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1">
                Xem tất cả <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {checkInMutation.isError && (
            <div className="mx-4 mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              Tiếp đón thất bại: {getApiErrorMessage(checkInMutation.error, 'Vui lòng thử lại.')}
            </div>
          )}
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : queue.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 italic">
              Không còn bệnh nhân nào trong hàng chờ hôm nay.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Giờ hẹn</th>
                    <th className="py-2.5 px-4 font-semibold">Bệnh nhân</th>
                    <th className="py-2.5 px-4 font-semibold">Chuyên khoa / Bác sĩ</th>
                    <th className="py-2.5 px-4 font-semibold">Trạng thái</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queue.map((a) => {
                    const status = STATUS_LABELS[a.status] ?? { label: a.status, className: '' };
                    const pendingThis = checkInMutation.isPending && checkInMutation.variables === a.id;
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-4 font-mono font-semibold text-slate-800">
                          {a.appointmentTime?.slice(0, 5)}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900">{a.patientName || '—'}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{a.patientPhone || a.appointmentCode}</div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">
                          <div>{a.specialtyName || '—'}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Stethoscope className="h-3 w-3" /> {a.doctorName || 'Chưa phân bác sĩ'}
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge variant="outline" className={`text-[11px] ${status.className}`}>
                            {status.label}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {isAwaitingCheckIn(a) ? (
                            <Button
                              size="sm"
                              className="h-7 text-[11px] gap-1"
                              disabled={checkInMutation.isPending}
                              onClick={() => checkInMutation.mutate(a.id)}
                            >
                              <LogIn className="h-3 w-3" />
                              {pendingThis ? 'Đang tiếp đón...' : 'Tiếp đón'}
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};
