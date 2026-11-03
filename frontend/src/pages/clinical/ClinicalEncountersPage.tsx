import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Stethoscope,
  Users,
  History,
  Clock,
  Activity,
  Heart,
  Thermometer,
  Weight,
  Ruler,
  AlertCircle,
  CheckCircle2,
  Lock,
  Printer,
  RefreshCw,
  Search,
  Eye,
  ArrowRight,
  FileText,
  AlertTriangle,
  Check
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { LoadingCard } from '@/components/ui/LoadingSkeleton';
import { clinicalService } from '@/services/clinicalService';
import { Encounter } from '@/types/clinical';
import { formatDateTime, formatDate } from '@/lib/utils';

export const ClinicalEncountersPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'queue' | 'encounter' | 'history'>('queue');
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);

  // Form state
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [examinationNotes, setExaminationNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [temperature, setTemperature] = useState<string>('');
  const [bloodPressure, setBloodPressure] = useState<string>('');
  const [heartRate, setHeartRate] = useState<string>('');
  const [respiratoryRate, setRespiratoryRate] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');

  // History search state
  const [historySearch, setHistorySearch] = useState('');
  const [historyPatientFilter, setHistoryPatientFilter] = useState('');
  const [viewDetailModal, setViewDetailModal] = useState<Encounter | null>(null);
  const [confirmCompleteModal, setConfirmCompleteModal] = useState(false);

  // Alert banner
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // 1. Fetch Doctor Queue
  const {
    data: queueData,
    isLoading: isQueueLoading,
    refetch: refetchQueue,
  } = useQuery({
    queryKey: ['clinical', 'doctor-queue'],
    queryFn: () => clinicalService.getDoctorQueue(),
    refetchInterval: 30000, // Poll every 30s
  });

  // 2. Fetch Encounters History
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['clinical', 'encounters', historySearch, historyPatientFilter],
    queryFn: () =>
      clinicalService.searchEncounters({
        search: historySearch || undefined,
        patientId: historyPatientFilter || undefined,
        size: 50,
      }),
  });

  // Auto-fill form when an encounter is selected
  useEffect(() => {
    if (selectedEncounter) {
      setChiefComplaint(selectedEncounter.chiefComplaint || '');
      setExaminationNotes(selectedEncounter.examinationNotes || '');
      setDiagnosis(selectedEncounter.diagnosis || '');
      setTreatmentPlan(selectedEncounter.treatmentPlan || '');
      setTemperature(selectedEncounter.temperature != null ? String(selectedEncounter.temperature) : '');
      setBloodPressure(selectedEncounter.bloodPressure || '');
      setHeartRate(selectedEncounter.heartRate != null ? String(selectedEncounter.heartRate) : '');
      setRespiratoryRate(selectedEncounter.respiratoryRate != null ? String(selectedEncounter.respiratoryRate) : '');
      setWeight(selectedEncounter.weight != null ? String(selectedEncounter.weight) : '');
      setHeight(selectedEncounter.height != null ? String(selectedEncounter.height) : '');
    }
  }, [selectedEncounter]);

  // Handle URL query parameters (e.g. ?appointmentId=... or ?encounterId=...)
  useEffect(() => {
    const aptId = searchParams.get('appointmentId');
    const encId = searchParams.get('encounterId');
    const patId = searchParams.get('patientId');

    if (aptId) {
      handleStartEncounter(aptId);
    } else if (encId) {
      clinicalService.getEncounterById(encId).then((res) => {
        setSelectedEncounter(res.data);
        setActiveTab('encounter');
      }).catch((err) => {
        setAlertMessage({ type: 'error', message: err.response?.data?.message || 'Không thể tải phiếu khám' });
      });
    } else if (patId) {
      setHistoryPatientFilter(patId);
      setActiveTab('history');
    }
  }, [searchParams]);

  // Mutation: Start encounter from appointment
  const startEncounterMutation = useMutation({
    mutationFn: (appointmentId: string) => clinicalService.startEncounterFromAppointment(appointmentId),
    onSuccess: (res) => {
      setSelectedEncounter(res.data);
      setActiveTab('encounter');
      queryClient.invalidateQueries({ queryKey: ['clinical', 'doctor-queue'] });
      setAlertMessage({
        type: 'success',
        message: `Đã mở phiếu khám ${res.data.encounterCode} cho bệnh nhân ${res.data.patientName || ''}.`,
      });
    },
    onError: (err: any) => {
      setAlertMessage({
        type: 'error',
        message: err.response?.data?.message || 'Không thể bắt đầu lượt khám.',
      });
    },
  });

  // Mutation: Save / Update Draft Encounter
  const updateEncounterMutation = useMutation({
    mutationFn: (data: { id: string; payload: any }) => clinicalService.updateEncounter(data.id, data.payload),
    onSuccess: (res) => {
      setSelectedEncounter(res.data);
      queryClient.invalidateQueries({ queryKey: ['clinical'] });
      setAlertMessage({
        type: 'success',
        message: `Đã lưu nháp phiếu khám ${res.data.encounterCode} thành công.`,
      });
    },
    onError: (err: any) => {
      setAlertMessage({
        type: 'error',
        message: err.response?.data?.message || 'Không thể lưu phiếu khám.',
      });
    },
  });

  // Mutation: Complete Encounter
  const completeEncounterMutation = useMutation({
    mutationFn: (id: string) => clinicalService.completeEncounter(id),
    onSuccess: (res) => {
      setSelectedEncounter(res.data);
      setConfirmCompleteModal(false);
      queryClient.invalidateQueries({ queryKey: ['clinical'] });
      setAlertMessage({
        type: 'success',
        message: `Hoàn tất lượt khám ${res.data.encounterCode} thành công! Phiếu khám đã được khóa an toàn.`,
      });
    },
    onError: (err: any) => {
      setAlertMessage({
        type: 'error',
        message: err.response?.data?.message || 'Không thể hoàn tất lượt khám.',
      });
    },
  });

  const handleStartEncounter = (appointmentId: string) => {
    startEncounterMutation.mutate(appointmentId);
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncounter) return;

    updateEncounterMutation.mutate({
      id: selectedEncounter.id,
      payload: {
        chiefComplaint,
        examinationNotes,
        diagnosis,
        treatmentPlan,
        temperature: temperature ? parseFloat(temperature) : undefined,
        bloodPressure: bloodPressure || undefined,
        heartRate: heartRate ? parseInt(heartRate) : undefined,
        respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
      },
    });
  };

  const handleCompleteEncounter = () => {
    if (!selectedEncounter) return;
    if (!diagnosis.trim() || diagnosis.startsWith('Đang tiến hành')) {
      setAlertMessage({
        type: 'error',
        message: 'Vui lòng nhập chẩn đoán cụ thể trước khi hoàn tất lượt khám.',
      });
      return;
    }
    // Save draft first then complete
    updateEncounterMutation.mutate(
      {
        id: selectedEncounter.id,
        payload: {
          chiefComplaint,
          examinationNotes,
          diagnosis,
          treatmentPlan,
          temperature: temperature ? parseFloat(temperature) : undefined,
          bloodPressure: bloodPressure || undefined,
          heartRate: heartRate ? parseInt(heartRate) : undefined,
          respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : undefined,
          weight: weight ? parseFloat(weight) : undefined,
          height: height ? parseFloat(height) : undefined,
        },
      },
      {
        onSuccess: (res) => {
          completeEncounterMutation.mutate(res.data.id);
        },
      }
    );
  };

  // Helper: calculate BMI
  const calcBMI = (): string | null => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (w > 0 && h > 0) {
      const hMeter = h / 100;
      const bmi = w / (hMeter * hMeter);
      return bmi.toFixed(1);
    }
    return null;
  };
  const bmiValue = calcBMI();

  const isFormLocked = selectedEncounter?.status === 'COMPLETED';
  const queueItems = queueData?.data || [];
  const historyEncounters = historyData?.data?.items || [];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Stethoscope className="h-7 w-7 text-teal-600" />
            Bệnh án & Lượt khám Lâm sàng
          </h1>
          <p className="text-sm text-slate-500">
            Tiếp nhận hàng chờ bệnh nhân, ghi nhận triệu chứng, sinh hiệu, chẩn đoán ICD và hướng xử trí
          </p>
        </div>

        {/* Global Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchQueue();
              refetchHistory();
            }}
            className="gap-1.5 text-xs text-slate-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Alert Notification */}
      {alertMessage && (
        <Alert
          variant={alertMessage.type === 'error' ? 'destructive' : alertMessage.type === 'success' ? 'success' : 'info'}
          title={alertMessage.type === 'error' ? 'Có lỗi xảy ra' : 'Thông báo'}
          className="relative cursor-pointer"
          onClick={() => setAlertMessage(null)}
        >
          {alertMessage.message}
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'queue'
              ? 'border-teal-600 text-teal-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Hàng chờ khám bệnh</span>
          <span className="rounded-full bg-teal-100 text-teal-800 px-2 py-0.5 text-xs font-bold">
            {queueItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('encounter')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'encounter'
              ? 'border-teal-600 text-teal-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Phiếu khám lâm sàng</span>
          {selectedEncounter && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                selectedEncounter.status === 'COMPLETED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800 animate-pulse'
              }`}
            >
              {selectedEncounter.status === 'COMPLETED' ? 'Đã hoàn tất' : 'Đang khám'}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'history'
              ? 'border-teal-600 text-teal-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Lịch sử khám bệnh</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HÀNG CHỜ KHÁM BỆNH (DOCTOR QUEUE)                                  */}
      {/* ========================================================================= */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-slate-800">
                    Danh sách bệnh nhân chờ khám trong ca trực
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Các bệnh nhân đã được tiếp đón tại quầy (CHECKED_IN) hoặc đang trong tiến trình khám bệnh
                  </p>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-teal-600" />
                  Tự động làm mới mỗi 30 giây
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isQueueLoading ? (
                <div className="p-6">
                  <LoadingCard />
                </div>
              ) : queueItems.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600 mb-3">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">Hiện không có bệnh nhân nào trong hàng chờ</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Bệnh nhân sau khi được lễ tân tiếp đón (Check-in) sẽ xuất hiện tại đây để bác sĩ tiến hành thăm khám.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Giờ hẹn</th>
                        <th className="py-3 px-4 font-semibold">Mã & Họ tên bệnh nhân</th>
                        <th className="py-3 px-4 font-semibold">Năm sinh / Giới tính</th>
                        <th className="py-3 px-4 font-semibold">Điện thoại</th>
                        <th className="py-3 px-4 font-semibold">Lý do khám / Triệu chứng</th>
                        <th className="py-3 px-4 font-semibold">Phòng khám</th>
                        <th className="py-3 px-4 font-semibold">Trạng thái</th>
                        <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {queueItems.map((item) => {
                        const isInProgress = item.appointmentStatus === 'IN_PROGRESS';
                        return (
                          <tr
                            key={item.appointmentId}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isInProgress ? 'bg-amber-50/40 font-medium' : ''
                            }`}
                          >
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                                <Clock className="h-3.5 w-3.5 text-teal-600" />
                                {item.appointmentTime?.substring(0, 5)}
                              </div>
                              <span className="text-[11px] text-slate-400">{item.appointmentDate}</span>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">{item.patientName || 'Chưa cập nhật'}</div>
                              <span className="text-xs font-mono text-teal-700 bg-teal-50 px-1 rounded">
                                {item.patientCode || item.appointmentCode}
                              </span>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <div>{item.dateOfBirth ? formatDate(item.dateOfBirth) : '—'}</div>
                              <span className="text-xs text-slate-400">
                                {item.gender === 'MALE' ? 'Nam' : item.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                              </span>
                            </td>

                            <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                              {item.phone || '—'}
                            </td>

                            <td className="py-3 px-4 max-w-xs truncate text-xs text-slate-700" title={item.appointmentReason}>
                              {item.appointmentReason || 'Khám tổng quát theo lịch'}
                            </td>

                            <td className="py-3 px-4 text-xs whitespace-nowrap">
                              <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                {item.roomName || 'Phòng khám tổng quát'}
                              </span>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              {isInProgress ? (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                  Đang khám
                                </Badge>
                              ) : (
                                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                  Đã tiếp đón
                                </Badge>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <Button
                                size="sm"
                                onClick={() => handleStartEncounter(item.appointmentId)}
                                disabled={startEncounterMutation.isPending}
                                className={`gap-1.5 text-xs h-8 ${
                                  isInProgress
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                                }`}
                              >
                                <Stethoscope className="h-3.5 w-3.5" />
                                {isInProgress ? 'Tiếp tục khám' : 'Bắt đầu khám'}
                              </Button>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PHIẾU KHÁM LÂM SÀNG (ACTIVE ENCOUNTER FORM)                         */}
      {/* ========================================================================= */}
      {activeTab === 'encounter' && (
        <div className="space-y-6">
          {!selectedEncounter ? (
            <Card className="py-16 text-center border-dashed">
              <CardContent>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-4">
                  <Stethoscope className="h-7 w-7 text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">Chưa chọn phiếu khám nào</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
                  Vui lòng chọn một bệnh nhân từ Hàng chờ khám bệnh để bắt đầu quá trình thăm khám lâm sàng.
                </p>
                <Button onClick={() => setActiveTab('queue')} className="gap-2 bg-teal-600 hover:bg-teal-700 text-white">
                  <Users className="h-4 w-4" />
                  Mở hàng chờ tiếp đón
                </Button>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSaveDraft} className="space-y-6">
              {/* Patient Banner */}
              <div className="rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50/80 via-white to-slate-50 p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-lg shadow-sm">
                      {selectedEncounter.patientName?.charAt(0) || 'BN'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold text-slate-900">
                          {selectedEncounter.patientName || 'Bệnh nhân'}
                        </h2>
                        <span className="font-mono text-xs font-semibold bg-white border border-teal-200 text-teal-800 px-2 py-0.5 rounded">
                          {selectedEncounter.patientCode || 'Mã BN'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {selectedEncounter.patientGender === 'MALE' ? 'Nam' : 'Nữ'} •{' '}
                          {selectedEncounter.patientDateOfBirth ? formatDate(selectedEncounter.patientDateOfBirth) : ''}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-4 flex-wrap">
                        <span>SĐT: <strong className="text-slate-700 font-mono">{selectedEncounter.patientPhone || '—'}</strong></span>
                        <span>Mã phiếu: <strong className="text-slate-700 font-mono">{selectedEncounter.encounterCode}</strong></span>
                        <span>Bác sĩ phụ trách: <strong className="text-slate-700">{selectedEncounter.doctorName || 'Bác sĩ'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isFormLocked ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 py-1 px-3 text-xs gap-1.5 font-semibold">
                        <Lock className="h-3.5 w-3.5 text-emerald-700" />
                        ĐÃ HOÀN TẤT & KHÓA AN TOÀN
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 py-1 px-3 text-xs gap-1.5 font-semibold animate-pulse">
                        <Activity className="h-3.5 w-3.5 text-amber-700" />
                        ĐANG KHÁM LÂM SÀNG
                      </Badge>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setHistoryPatientFilter(selectedEncounter.patientId);
                        setActiveTab('history');
                      }}
                      className="text-xs h-8 gap-1.5"
                    >
                      <History className="h-3.5 w-3.5" />
                      Lịch sử khám
                    </Button>
                  </div>
                </div>

                {/* Medical Alerts (Allergies & Medical History) */}
                {(selectedEncounter.patientAllergies || selectedEncounter.patientMedicalHistory) && (
                  <div className="mt-4 pt-3 border-t border-teal-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {selectedEncounter.patientAllergies && (
                      <div className="flex items-start gap-2 bg-rose-50 text-rose-800 p-2.5 rounded-lg border border-rose-200">
                        <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold">Cảnh báo Dị ứng:</strong>{' '}
                          <span>{selectedEncounter.patientAllergies}</span>
                        </div>
                      </div>
                    )}
                    {selectedEncounter.patientMedicalHistory && (
                      <div className="flex items-start gap-2 bg-amber-50 text-amber-800 p-2.5 rounded-lg border border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold">Tiền sử bệnh lý:</strong>{' '}
                          <span>{selectedEncounter.patientMedicalHistory}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 1: VITAL SIGNS (DẤU HIỆU SINH TỒN) */}
              <Card>
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-teal-600" />
                      1. Chỉ số sinh hiệu lâm sàng (Vital Signs)
                    </CardTitle>
                    {bmiValue && (
                      <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded font-semibold">
                        Chỉ số BMI: {bmiValue} kg/m²
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                        <Thermometer className="h-3.5 w-3.5 text-rose-500" /> Thân nhiệt (°C)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="36.5"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        disabled={isFormLocked}
                        className="w-full text-xs font-semibold rounded-lg border border-slate-200 px-2.5 py-2 focus:border-teal-500 focus:outline-none disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5 text-rose-500" /> Huyết áp (mmHg)
                      </label>
                      <input
                        type="text"
                        placeholder="120/80"
                        value={bloodPressure}
                        onChange={(e) => setBloodPressure(e.target.value)}
                        disabled={isFormLocked}
                        className="w-full text-xs font-semibold rounded-lg border border-slate-200 px-2.5 py-2 focus:border-teal-500 focus:outline-none disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5 text-amber-500" /> Nhịp tim (lần/phút)
                      </label>
                      <input
                        type="number"
                        placeholder="75"
                        value={heartRate}
                        onChange={(e) => setHeartRate(e.target.value)}
                        disabled={isFormLocked}
                        className="w-full text-xs font-semibold rounded-lg border border-slate-200 px-2.5 py-2 focus:border-teal-500 focus:outline-none disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                        <Activity className="h-3.5 w-3.5 text-blue-500" /> Nhịp thở (lần/phút)
                      </label>
                      <input
                        type="number"
                        placeholder="18"
                        value={respiratoryRate}
                        onChange={(e) => setRespiratoryRate(e.target.value)}
                        disabled={isFormLocked}
                        className="w-full text-xs font-semibold rounded-lg border border-slate-200 px-2.5 py-2 focus:border-teal-500 focus:outline-none disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                        <Weight className="h-3.5 w-3.5 text-emerald-500" /> Cân nặng (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="65"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        disabled={isFormLocked}
                        className="w-full text-xs font-semibold rounded-lg border border-slate-200 px-2.5 py-2 focus:border-teal-500 focus:outline-none disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                        <Ruler className="h-3.5 w-3.5 text-indigo-500" /> Chiều cao (cm)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="168"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        disabled={isFormLocked}
                        className="w-full text-xs font-semibold rounded-lg border border-slate-200 px-2.5 py-2 focus:border-teal-500 focus:outline-none disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 2: CHIEF COMPLAINT & HISTORY */}
              <Card>
                <CardHeader className="pb-2 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-800">
                    2. Triệu chứng do bệnh nhân khai báo & Lý do đến khám <span className="text-rose-500">*</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <textarea
                    rows={3}
                    placeholder="Mô tả cụ thể triệu chứng, thời gian khởi phát bệnh, mức độ đau, vị trí đau..."
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    disabled={isFormLocked}
                    required
                    className="w-full text-sm rounded-lg border border-slate-200 p-3 focus:border-teal-500 focus:outline-none disabled:bg-slate-50"
                  />
                </CardContent>
              </Card>

              {/* SECTION 3: PHYSICAL EXAMINATION */}
              <Card>
                <CardHeader className="pb-2 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-800">
                    3. Ghi chú thăm khám lâm sàng & Thực thể
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <textarea
                    rows={4}
                    placeholder="Ghi nhận khám tổng quát (tri giác, niêm mạc, hạch), khám các cơ quan chuyên khoa (tim mạch, hô hấp, tiêu hóa, thần kinh, cơ xương khớp)..."
                    value={examinationNotes}
                    onChange={(e) => setExaminationNotes(e.target.value)}
                    disabled={isFormLocked}
                    className="w-full text-sm rounded-lg border border-slate-200 p-3 focus:border-teal-500 focus:outline-none disabled:bg-slate-50"
                  />
                </CardContent>
              </Card>

              {/* SECTION 4: DIAGNOSIS (CHẨN ĐOÁN) */}
              <Card className="border-teal-200">
                <CardHeader className="pb-2 border-b border-teal-100 bg-teal-50/40">
                  <CardTitle className="text-sm font-bold text-teal-900 flex items-center gap-1.5">
                    <Stethoscope className="h-4 w-4 text-teal-700" />
                    4. Chẩn đoán y khoa của Bác sĩ <span className="text-rose-500">*</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <textarea
                    rows={2}
                    placeholder="Nhập chẩn đoán xác định, chẩn đoán phân biệt hoặc mã bệnh ICD-10 (ví dụ: Tăng huyết áp vô căn I10, Viêm phế quản cấp J20)..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    disabled={isFormLocked}
                    required
                    className="w-full text-sm font-semibold rounded-lg border border-slate-200 p-3 focus:border-teal-500 focus:outline-none disabled:bg-slate-50"
                  />
                </CardContent>
              </Card>

              {/* SECTION 5: TREATMENT PLAN */}
              <Card>
                <CardHeader className="pb-2 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-800">
                    5. Hướng xử trí, lời dặn điều trị & Hẹn tái khám
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <textarea
                    rows={4}
                    placeholder="Kế hoạch điều trị, đơn thuốc ngoại trú, chế độ dinh dưỡng vận động, dấu hiệu nguy hiểm cần nhập viện, thời gian hẹn tái khám..."
                    value={treatmentPlan}
                    onChange={(e) => setTreatmentPlan(e.target.value)}
                    disabled={isFormLocked}
                    className="w-full text-sm rounded-lg border border-slate-200 p-3 focus:border-teal-500 focus:outline-none disabled:bg-slate-50"
                  />
                </CardContent>
              </Card>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm sticky bottom-4">
                <div className="text-xs text-slate-500">
                  {isFormLocked ? (
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <Check className="h-4 w-4" /> Phiếu khám đã hoàn tất và lưu trữ vào MySQL
                    </span>
                  ) : (
                    <span>Nhấn "Lưu nháp" để ghi nhận tạm thời hoặc "Hoàn tất khám" để đóng phiếu</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isFormLocked ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.print()}
                      className="gap-2 text-xs"
                    >
                      <Printer className="h-4 w-4" />
                      In phiếu khám
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="submit"
                        variant="outline"
                        disabled={updateEncounterMutation.isPending}
                        className="gap-2 text-xs border-teal-300 text-teal-800 hover:bg-teal-50"
                      >
                        Lưu nháp
                      </Button>

                      <Button
                        type="button"
                        onClick={() => setConfirmCompleteModal(true)}
                        disabled={completeEncounterMutation.isPending}
                        className="gap-2 text-xs bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Hoàn tất lượt khám
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* Modal: Confirm Complete Encounter */}
          {confirmCompleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-150">
                <div className="flex items-center gap-3 text-amber-600">
                  <div className="p-2 bg-amber-50 rounded-full">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Xác nhận hoàn tất lượt khám</h3>
                </div>

                <div className="text-sm text-slate-600 space-y-2">
                  <p>
                    Bạn có chắc chắn muốn hoàn tất lượt khám cho bệnh nhân{' '}
                    <strong className="text-slate-800">{selectedEncounter?.patientName}</strong>?
                  </p>
                  <div className="p-3 bg-slate-50 rounded-lg text-xs font-mono space-y-1">
                    <div>Chẩn đoán: <strong>{diagnosis || 'Chưa có'}</strong></div>
                    <div>Thân nhiệt: {temperature ? `${temperature}°C` : '—'} • Huyết áp: {bloodPressure || '—'}</div>
                  </div>
                  <p className="text-xs text-rose-600 italic">
                    Lưu ý: Theo nguyên tắc y khoa, sau khi hoàn tất, phiếu khám sẽ được khóa an toàn và không thể chỉnh sửa.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmCompleteModal(false)}
                    disabled={completeEncounterMutation.isPending}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCompleteEncounter}
                    disabled={completeEncounterMutation.isPending}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    {completeEncounterMutation.isPending ? 'Đang hoàn tất...' : 'Xác nhận hoàn tất'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LỊCH SỬ KHÁM BỆNH (PATIENT HISTORY & ENCOUNTERS ARCHIVE)            */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base text-slate-800">
                  Hồ sơ lịch sử các lượt khám bệnh
                </CardTitle>
                <div className="flex items-center gap-2">
                  {historyPatientFilter && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setHistoryPatientFilter('')}
                      className="text-xs h-8 text-rose-600 hover:bg-rose-50 border-rose-200"
                    >
                      Bỏ lọc bệnh nhân
                    </Button>
                  )}
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm mã phiếu, chẩn đoán..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="text-xs rounded-lg border border-slate-200 pl-8 pr-3 py-2 w-56 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isHistoryLoading ? (
                <div className="p-6">
                  <LoadingCard />
                </div>
              ) : historyEncounters.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Chưa có phiếu khám nào phù hợp điều kiện tìm kiếm</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Mã phiếu</th>
                        <th className="py-3 px-4 font-semibold">Thời gian khám</th>
                        <th className="py-3 px-4 font-semibold">Bệnh nhân</th>
                        <th className="py-3 px-4 font-semibold">Bác sĩ phụ trách</th>
                        <th className="py-3 px-4 font-semibold">Chẩn đoán</th>
                        <th className="py-3 px-4 font-semibold">Sinh hiệu</th>
                        <th className="py-3 px-4 font-semibold">Trạng thái</th>
                        <th className="py-3 px-4 font-semibold text-right">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyEncounters.map((enc) => (
                        <tr key={enc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs font-semibold text-teal-800 whitespace-nowrap">
                            {enc.encounterCode}
                          </td>
                          <td className="py-3 px-4 text-xs whitespace-nowrap">
                            {formatDateTime(enc.encounterDateTime)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{enc.patientName || '—'}</div>
                            <span className="text-[11px] font-mono text-slate-400">{enc.patientCode}</span>
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {enc.doctorName || 'Bác sĩ'}
                          </td>
                          <td className="py-3 px-4 text-xs max-w-xs truncate font-medium text-slate-800" title={enc.diagnosis}>
                            {enc.diagnosis}
                          </td>
                          <td className="py-3 px-4 text-xs font-mono whitespace-nowrap">
                            {enc.bloodPressure ? `${enc.bloodPressure} mmHg` : '—'} • {enc.temperature ? `${enc.temperature}°C` : '—'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {enc.status === 'COMPLETED' ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                Hoàn thành
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                Đang khám
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewDetailModal(enc)}
                              className="h-7 px-2 text-xs gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Xem
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal: View Full Completed Encounter Detail */}
          {viewDetailModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl border border-slate-100 space-y-4 my-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-teal-600" />
                      Chi tiết Phiếu khám: {viewDetailModal.encounterCode}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Thời gian khám: {formatDateTime(viewDetailModal.encounterDateTime)}
                    </p>
                  </div>
                  <Badge className={viewDetailModal.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                    {viewDetailModal.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang xử lý'}
                  </Badge>
                </div>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg">
                    <div><strong>Bệnh nhân:</strong> {viewDetailModal.patientName} ({viewDetailModal.patientCode})</div>
                    <div><strong>Bác sĩ:</strong> {viewDetailModal.doctorName}</div>
                    <div><strong>Phòng khám:</strong> {viewDetailModal.roomName || 'Phòng khám đa khoa'}</div>
                    <div><strong>Lịch hẹn liên kết:</strong> {viewDetailModal.appointmentCode || '—'}</div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-teal-50/50 p-2.5 rounded-lg border border-teal-100 font-mono text-center">
                    <div>
                      <div className="text-[10px] text-slate-400">Thân nhiệt</div>
                      <div className="font-bold">{viewDetailModal.temperature ? `${viewDetailModal.temperature}°C` : '—'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Huyết áp</div>
                      <div className="font-bold">{viewDetailModal.bloodPressure || '—'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Nhịp tim</div>
                      <div className="font-bold">{viewDetailModal.heartRate ? `${viewDetailModal.heartRate} bpm` : '—'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Nhịp thở</div>
                      <div className="font-bold">{viewDetailModal.respiratoryRate ? `${viewDetailModal.respiratoryRate}/p` : '—'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Cân nặng</div>
                      <div className="font-bold">{viewDetailModal.weight ? `${viewDetailModal.weight} kg` : '—'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Chiều cao</div>
                      <div className="font-bold">{viewDetailModal.height ? `${viewDetailModal.height} cm` : '—'}</div>
                    </div>
                  </div>

                  <div>
                    <strong className="block text-slate-800 mb-0.5">Triệu chứng & Lý do khám:</strong>
                    <p className="bg-slate-50 p-2.5 rounded border border-slate-100 whitespace-pre-line">{viewDetailModal.chiefComplaint}</p>
                  </div>

                  {viewDetailModal.examinationNotes && (
                    <div>
                      <strong className="block text-slate-800 mb-0.5">Thăm khám lâm sàng:</strong>
                      <p className="bg-slate-50 p-2.5 rounded border border-slate-100 whitespace-pre-line">{viewDetailModal.examinationNotes}</p>
                    </div>
                  )}

                  <div>
                    <strong className="block text-teal-800 mb-0.5">Chẩn đoán y khoa:</strong>
                    <p className="bg-teal-50/60 p-2.5 rounded border border-teal-100 font-semibold text-slate-900 whitespace-pre-line">{viewDetailModal.diagnosis}</p>
                  </div>

                  {viewDetailModal.treatmentPlan && (
                    <div>
                      <strong className="block text-slate-800 mb-0.5">Hướng xử trí & Lời dặn:</strong>
                      <p className="bg-slate-50 p-2.5 rounded border border-slate-100 whitespace-pre-line">{viewDetailModal.treatmentPlan}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedEncounter(viewDetailModal);
                      setViewDetailModal(null);
                      setActiveTab('encounter');
                    }}
                    className="gap-1.5 text-xs text-teal-700 hover:bg-teal-50 border-teal-200"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    Mở phiếu khám này
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.print()}
                      className="gap-1.5 text-xs"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      In phiếu
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setViewDetailModal(null)}
                      className="text-xs"
                    >
                      Đóng
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
