import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar as CalendarIcon, 
  Search, 
  Plus, 
  UserCheck, 
  RefreshCw, 
  AlertCircle, 
  Filter, 
  Check, 
  Ban, 
  ChevronLeft, 
  ChevronRight,
  Stethoscope
} from 'lucide-react';
import { 
  appointmentService, 
  AppointmentItem, 
  CreateAppointmentInput 
} from '@/services/appointmentService';
import { patientService, PatientItem } from '@/services/patientService';
import { clinicService, SpecialtyItem, DoctorItem, RoomItem } from '@/services/clinicService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';

export const AppointmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState<AppointmentItem | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');

  // Alerts
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'destructive' | 'warning';
    title: string;
    message: string;
  } | null>(null);

  // New appointment form state
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

  // Query: Appointments with filters
  const {
    data: appointmentsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['appointments', statusFilter, dateFilter, currentPage, pageSize],
    queryFn: () =>
      appointmentService.getAppointments({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        date: dateFilter || undefined,
        page: currentPage,
        size: pageSize,
        sortBy: 'appointmentDate',
        direction: 'desc',
      }),
  });

  // Queries for Dropdowns: Patients, Specialties, Doctors, Rooms
  const { data: patientsResponse } = useQuery({
    queryKey: ['topPatients'],
    queryFn: () => patientService.getTopPatients(),
  });

  const { data: specialtiesResponse } = useQuery({
    queryKey: ['specialties'],
    queryFn: clinicService.getSpecialties,
  });

  const { data: doctorsResponse } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => clinicService.getDoctors(),
  });

  const { data: roomsResponse } = useQuery({
    queryKey: ['rooms'],
    queryFn: clinicService.getRooms,
  });

  const appointmentPage = appointmentsResponse?.data;
  const appointmentsList: AppointmentItem[] = appointmentPage?.items || appointmentPage?.content || [];
  const totalElements = appointmentPage?.totalElements || 0;
  const totalPages = appointmentPage?.totalPages || 0;

  const patientsList: PatientItem[] = patientsResponse?.data || [];
  const specialtiesList: SpecialtyItem[] = specialtiesResponse?.data || [];
  const doctorsList: DoctorItem[] = doctorsResponse?.data || [];
  const roomsList: RoomItem[] = roomsResponse?.data || [];

  // Filtered appointments by search query (client-side search on current page)
  const filteredAppointments = appointmentsList.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const pName = a.patientName?.toLowerCase() || '';
    const pPhone = a.patientPhone || '';
    const aptCode = a.appointmentCode.toLowerCase();
    const docName = a.doctorName?.toLowerCase() || '';
    return pName.includes(q) || pPhone.includes(q) || aptCode.includes(q) || docName.includes(q);
  });

  // Mutation: Create Appointment (with slot conflict handling)
  const createMutation = useMutation({
    mutationFn: (input: CreateAppointmentInput) => appointmentService.createAppointment(input),
    onSuccess: (res) => {
      setAlertMessage({
        type: 'success',
        title: 'Đặt lịch hẹn thành công',
        message: `Mã lịch hẹn: ${res.data.appointmentCode} cho bệnh nhân ${res.data.patientName || 'bệnh nhân'}`,
      });
      setShowCreateModal(false);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (err: any) => {
      const msg = err?.message || 'Có lỗi xảy ra khi đặt lịch hẹn. Vui lòng kiểm tra lại.';
      setAlertMessage({
        type: 'destructive',
        title: 'Lỗi đặt lịch hẹn (Xung đột lịch)',
        message: msg,
      });
    },
  });

  // Mutation: Check-in (Tiếp đón)
  const checkInMutation = useMutation({
    mutationFn: (id: string) => appointmentService.checkInAppointment(id),
    onSuccess: (res) => {
      setAlertMessage({
        type: 'success',
        title: 'Tiếp đón thành công',
        message: `Lịch hẹn ${res.data.appointmentCode} đã chuyển sang trạng thái ĐÃ TIẾP ĐÓN (CHECKED_IN).`,
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (err: any) => {
      setAlertMessage({
        type: 'destructive',
        title: 'Lỗi tiếp đón',
        message: err?.message || 'Không thể chuyển trạng thái tiếp đón.',
      });
    },
  });

  // Mutation: Complete Appointment
  const completeMutation = useMutation({
    mutationFn: (id: string) => appointmentService.completeAppointment(id),
    onSuccess: (res) => {
      setAlertMessage({
        type: 'success',
        title: 'Hoàn thành lượt khám',
        message: `Lịch hẹn ${res.data.appointmentCode} đã được đánh dấu HOÀN THÀNH.`,
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (err: any) => {
      setAlertMessage({
        type: 'destructive',
        title: 'Lỗi hoàn thành khám',
        message: err?.message || 'Không thể hoàn thành lượt khám.',
      });
    },
  });

  // Mutation: Cancel Appointment
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      appointmentService.cancelAppointment(id, reason),
    onSuccess: (res) => {
      setAlertMessage({
        type: 'warning',
        title: 'Đã hủy lịch hẹn',
        message: `Lịch hẹn ${res.data.appointmentCode} đã được chuyển sang trạng thái ĐÃ HỦY.`,
      });
      setCancellingAppointment(null);
      setCancellationReason('');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (err: any) => {
      setAlertMessage({
        type: 'destructive',
        title: 'Lỗi hủy lịch hẹn',
        message: err?.message || 'Không thể hủy lịch hẹn.',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge variant="secondary">Đã xác nhận</Badge>;
      case 'CHECKED_IN':
        return <Badge variant="warning">Đã tiếp đón</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="info">Đang khám</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Hoàn thành</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Đã hủy</Badge>;
      case 'PENDING':
        return <Badge variant="outline">Chờ xác nhận</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Quản Lý Lịch Hẹn Khám Bệnh
            </h2>
            <Badge variant="info">Tổng: {totalElements} lịch hẹn</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Đặt lịch khám, kiểm tra lịch trùng với bác sĩ, phân luồng tiếp đón (Check-in) và hoàn thành lượt khám
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            isLoading={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>

          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Đặt Lịch Khám Mới
          </Button>
        </div>
      </div>

      {/* Global Alert Notification */}
      {alertMessage && (
        <Alert
          variant={alertMessage.type}
          title={alertMessage.title}
        >
          <div className="flex items-center justify-between">
            <span>{alertMessage.message}</span>
            <button
              onClick={() => setAlertMessage(null)}
              className="text-xs font-semibold underline hover:no-underline ml-4"
            >
              Đóng
            </button>
          </div>
        </Alert>
      )}

      {/* Filter and Search Bar Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo Tên bệnh nhân, SĐT, Mã lịch hẹn (LH-...), hoặc Bác sĩ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <CalendarIcon className="h-4 w-4 text-slate-500 shrink-0" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(0);
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none bg-white text-slate-700 font-medium"
              />
              {dateFilter && (
                <button
                  onClick={() => {
                    setDateFilter('');
                    setCurrentPage(0);
                  }}
                  className="text-xs text-indigo-600 hover:underline shrink-0"
                >
                  Bỏ ngày
                </button>
              )}
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
            <span className="font-semibold text-slate-500 flex items-center gap-1 mr-2">
              <Filter className="h-3.5 w-3.5" /> Trạng thái:
            </span>
            {[
              { id: 'ALL', label: 'Tất cả trạng thái' },
              { id: 'CONFIRMED', label: 'Đã xác nhận' },
              { id: 'CHECKED_IN', label: 'Đã tiếp đón' },
              { id: 'IN_PROGRESS', label: 'Đang khám' },
              { id: 'COMPLETED', label: 'Hoàn thành' },
              { id: 'CANCELLED', label: 'Đã hủy' },
              { id: 'PENDING', label: 'Chờ duyệt' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setStatusFilter(st.id);
                  setCurrentPage(0);
                }}
                className={`rounded-full px-3 py-1 font-medium transition-colors ${
                  statusFilter === st.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-indigo-600" />
              Danh Sách Lịch Hẹn Khám
            </CardTitle>
            <span className="text-xs text-slate-500">
              Trang {currentPage + 1} / {totalPages || 1} (Hiển thị tối đa {pageSize} lịch hẹn/trang)
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
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
                  <th className="py-3 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
                        <span>Đang tải danh sách lịch hẹn từ MySQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CalendarIcon className="h-8 w-8 text-slate-300" />
                        <span className="font-medium text-slate-600">Không có lịch hẹn nào phù hợp</span>
                        <p className="text-xs text-slate-400">
                          Thử thay đổi bộ lọc trạng thái, ngày hẹn hoặc bấm "Đặt Lịch Khám Mới".
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((apt) => {
                    const isCheckInAvailable = apt.status === 'CONFIRMED' || apt.status === 'PENDING';
                    const isCompleteAvailable = apt.status === 'CHECKED_IN' || apt.status === 'IN_PROGRESS';
                    const isCancelAvailable = apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED';

                    return (
                      <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-indigo-700 whitespace-nowrap">
                          {apt.appointmentCode}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{apt.patientName || 'Bệnh nhân'}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{apt.patientPhone || '—'}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                          {apt.specialtyName || 'Đa khoa'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {apt.doctorName ? (
                            <span className="font-semibold text-teal-800">{apt.doctorName}</span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa xếp bác sĩ</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                          {apt.roomName || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{apt.appointmentDate}</div>
                          <div className="text-[11px] text-slate-500">{apt.appointmentTime} ({apt.shift})</div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 truncate max-w-[180px]" title={apt.reason}>
                          {apt.reason || 'Khám thông thường'}
                          {apt.cancellationReason && (
                            <span className="block text-[11px] text-rose-600 truncate" title={apt.cancellationReason}>
                              Lý do hủy: {apt.cancellationReason}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getStatusBadge(apt.status)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Check-in button */}
                            {isCheckInAvailable && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => checkInMutation.mutate(apt.id)}
                                isLoading={checkInMutation.isPending && checkInMutation.variables === apt.id}
                                className="h-7 px-2 text-[11px] border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 gap-1"
                                title="Tiếp đón bệnh nhân"
                              >
                                <UserCheck className="h-3 w-3 text-amber-600" />
                                Check-in
                              </Button>
                            )}

                            {/* Clinical Encounter button */}
                            {(apt.status === 'CHECKED_IN' || apt.status === 'IN_PROGRESS') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/clinical?appointmentId=${apt.id}`)}
                                className="h-7 px-2 text-[11px] border-teal-300 text-teal-800 bg-teal-50 hover:bg-teal-100 gap-1"
                                title="Vào phòng khám bệnh"
                              >
                                <Stethoscope className="h-3 w-3 text-teal-600" />
                                Khám bệnh
                              </Button>
                            )}

                            {/* Complete button */}
                            {isCompleteAvailable && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => completeMutation.mutate(apt.id)}
                                isLoading={completeMutation.isPending && completeMutation.variables === apt.id}
                                className="h-7 px-2 text-[11px] border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 gap-1"
                                title="Hoàn tất khám"
                              >
                                <Check className="h-3 w-3 text-emerald-600" />
                                Hoàn thành
                              </Button>
                            )}

                            {/* Cancel button */}
                            {isCancelAvailable && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCancellingAppointment(apt)}
                                className="h-7 px-2 text-[11px] border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 gap-1"
                                title="Hủy lịch hẹn"
                              >
                                <Ban className="h-3 w-3 text-rose-600" />
                                Hủy lịch
                              </Button>
                            )}

                            {!isCheckInAvailable && !isCompleteAvailable && !isCancelAvailable && (
                              <span className="text-slate-400 italic text-[11px]">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/50">
              <div className="text-xs text-slate-500">
                Hiển thị từ <strong className="font-semibold text-slate-800">{currentPage * pageSize + 1}</strong> đến{' '}
                <strong className="font-semibold text-slate-800">
                  {Math.min((currentPage + 1) * pageSize, totalElements)}
                </strong>{' '}
                trong tổng số <strong className="font-semibold text-slate-800">{totalElements}</strong> lịch hẹn
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="gap-1 h-8 px-2 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Trang trước
                </Button>
                <span className="text-xs font-semibold px-2">
                  {currentPage + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="gap-1 h-8 px-2 text-xs"
                >
                  Trang sau
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===================================================================== */}
      {/* MODAL 1: ĐẶT LỊCH HẸN KHÁM MỚI (VỚI KIỂM TRA TRÙNG LỊCH)              */}
      {/* ===================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 bg-indigo-50 px-6 py-4">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-base">
                <CalendarIcon className="h-5 w-5 text-indigo-600" />
                Đặt Lịch Hẹn Khám Bệnh Mới
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newAppointment.patientId) {
                  setAlertMessage({
                    type: 'destructive',
                    title: 'Chưa chọn bệnh nhân',
                    message: 'Vui lòng chọn hồ sơ bệnh nhân trong danh mục.',
                  });
                  return;
                }
                if (!newAppointment.specialtyId) {
                  setAlertMessage({
                    type: 'destructive',
                    title: 'Chưa chọn chuyên khoa',
                    message: 'Vui lòng chọn chuyên khoa khám bệnh.',
                  });
                  return;
                }
                createMutation.mutate(newAppointment);
              }}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs"
            >
              <div className="rounded-lg bg-indigo-50/50 p-3 border border-indigo-100 text-indigo-900 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Cơ chế tự động kiểm tra lịch trùng:</strong> Hệ thống sẽ xác minh lịch làm việc của bác sĩ trong cùng ngày và giờ. Nếu bác sĩ đã có lịch hẹn chưa hủy, hệ thống sẽ báo lỗi và ngăn chặn đặt trùng giờ.
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Chọn Bệnh nhân */}
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700">Chọn bệnh nhân khám *</label>
                  <select
                    required
                    value={newAppointment.patientId}
                    onChange={(e) => setNewAppointment({ ...newAppointment, patientId: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="">-- Chọn bệnh nhân từ CSDL --</option>
                    {patientsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.patientCode} - {p.fullName} ({p.phone}) - Nhóm máu: {p.bloodType || 'Chưa rõ'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chọn Chuyên khoa */}
                <div>
                  <label className="font-semibold text-slate-700">Chuyên khoa khám *</label>
                  <select
                    required
                    value={newAppointment.specialtyId}
                    onChange={(e) => {
                      const specId = e.target.value;
                      // Tìm bác sĩ đầu tiên của chuyên khoa nếu có
                      const matchedDoc = doctorsList.find((d) => d.specialtyId === specId);
                      setNewAppointment({
                        ...newAppointment,
                        specialtyId: specId,
                        doctorId: matchedDoc ? matchedDoc.id : newAppointment.doctorId,
                        roomId: matchedDoc?.roomId || newAppointment.roomId,
                      });
                    }}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="">-- Chọn chuyên khoa --</option>
                    {specialtiesList.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name} ({spec.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chọn Bác sĩ */}
                <div>
                  <label className="font-semibold text-slate-700">Bác sĩ khám (Tùy chọn)</label>
                  <select
                    value={newAppointment.doctorId}
                    onChange={(e) => {
                      const docId = e.target.value;
                      const doc = doctorsList.find((d) => d.id === docId);
                      setNewAppointment({
                        ...newAppointment,
                        doctorId: docId,
                        roomId: doc?.roomId || newAppointment.roomId,
                        specialtyId: doc?.specialtyId || newAppointment.specialtyId,
                      });
                    }}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="">-- Để phòng khám tự sắp xếp --</option>
                    {doctorsList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} ({d.qualification || 'Bác sĩ'}) - {d.specialtyName || ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chọn Buồng khám */}
                <div>
                  <label className="font-semibold text-slate-700">Buồng khám chỉ định</label>
                  <select
                    value={newAppointment.roomId}
                    onChange={(e) => setNewAppointment({ ...newAppointment, roomId: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="">-- Tự động theo bác sĩ / chuyên khoa --</option>
                    {roomsList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ngày hẹn khám */}
                <div>
                  <label className="font-semibold text-slate-700">Ngày hẹn khám *</label>
                  <input
                    type="date"
                    required
                    value={newAppointment.appointmentDate}
                    onChange={(e) => setNewAppointment({ ...newAppointment, appointmentDate: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Giờ hẹn khám */}
                <div>
                  <label className="font-semibold text-slate-700">Giờ hẹn khám *</label>
                  <input
                    type="time"
                    required
                    value={newAppointment.appointmentTime.substring(0, 5)}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        appointmentTime: `${e.target.value}:00`,
                      })
                    }
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Ca khám */}
                <div>
                  <label className="font-semibold text-slate-700">Ca khám</label>
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

                {/* Loại hẹn */}
                <div>
                  <label className="font-semibold text-slate-700">Phương thức đặt hẹn</label>
                  <select
                    value={newAppointment.appointmentType}
                    onChange={(e) => setNewAppointment({ ...newAppointment, appointmentType: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="WALK_IN">Tại quầy tiếp đón (Walk-in)</option>
                    <option value="ONLINE_PORTAL">Cổng trực tuyến (Online Portal)</option>
                    <option value="PHONE">Qua tổng đài điện thoại</option>
                  </select>
                </div>

                {/* Lý do khám */}
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700">Lý do khám / Triệu chứng lâm sàng ban đầu</label>
                  <textarea
                    rows={2}
                    placeholder="Mô tả triệu chứng bệnh nhân đang gặp phải..."
                    value={newAppointment.reason}
                    onChange={(e) => setNewAppointment({ ...newAppointment, reason: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  isLoading={createMutation.isPending}
                >
                  Xác Nhận Đặt Lịch (Ghi MySQL)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: HỦY LỊCH HẸN VỚI LÝ DO                                       */}
      {/* ===================================================================== */}
      {cancellingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-rose-50 px-6 py-4">
              <Ban className="h-5 w-5 text-rose-600" />
              <h3 className="font-bold text-rose-900 text-sm">Xác Nhận Hủy Lịch Hẹn</h3>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Bạn sắp hủy lịch hẹn{' '}
                <strong className="font-mono text-indigo-700">{cancellingAppointment.appointmentCode}</strong> của bệnh nhân{' '}
                <strong className="text-slate-900">{cancellingAppointment.patientName}</strong> vào ngày{' '}
                <strong className="text-slate-900">{cancellingAppointment.appointmentDate}</strong>.
              </p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Lý do hủy lịch hẹn (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Bệnh nhân bận việc đột xuất, đổi lịch khám khác..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2 text-xs focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCancellingAppointment(null);
                    setCancellationReason('');
                  }}
                >
                  Đóng
                </Button>
                <Button
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  isLoading={cancelMutation.isPending}
                  onClick={() =>
                    cancelMutation.mutate({
                      id: cancellingAppointment.id,
                      reason: cancellationReason,
                    })
                  }
                >
                  Xác Nhận Hủy Lịch
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
