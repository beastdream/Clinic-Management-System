import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  History,
  Activity,
  AlertTriangle,
  Pill,
  X
} from 'lucide-react';
import { clinicalService } from '@/services/clinicalService';
import { PatientEmrTimeline } from '@/types/clinical';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/LoadingSkeleton';

interface PatientEmrTimelineModalProps {
  patientId: string;
  onClose: () => void;
}

export const PatientEmrTimelineModal: React.FC<PatientEmrTimelineModalProps> = ({
  patientId,
  onClose,
}) => {
  const { data: emrResponse, isLoading } = useQuery({
    queryKey: ['clinical', 'emr-timeline', patientId],
    queryFn: () => clinicalService.getPatientEmrTimeline(patientId),
  });

  const emr: PatientEmrTimeline | undefined = emrResponse?.data;

  const vitalTrends = emr?.vitalTrends || [];
  const visits = emr?.visits || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                Hồ Sơ Bệnh Án Điện Tử Dọc & Diễn Tiến Sinh Hiệu (EMR Timeline)
              </h2>
              <p className="text-teal-200 text-xs">
                Bệnh nhân: {emr?.fullName || '...'} ({emr?.patientCode || ''}) •{' '}
                {emr?.gender === 'MALE' ? 'Nam' : 'Nữ'} • SĐT: {emr?.phone || '—'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-teal-200 hover:text-white p-1 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : !emr ? (
            <div className="py-12 text-center text-slate-400">Không tìm thấy dữ liệu bệnh án</div>
          ) : (
            <>
              {/* Box 1: Allergies & Chronic Conditions */}
              {(emr.allergies || emr.medicalHistorySummary) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {emr.allergies && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5 shadow-xs">
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-rose-800">Tiền sử Dị ứng ghi nhận:</strong>
                        <p className="mt-0.5 text-rose-700">{emr.allergies}</p>
                      </div>
                    </div>
                  )}
                  {emr.medicalHistorySummary && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-xs">
                      <History className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-amber-800">Tiền sử bệnh lý bản thân / gia đình:</strong>
                        <p className="mt-0.5 text-amber-700">{emr.medicalHistorySummary}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Box 2: Visual Vital Trends Graph */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-teal-600" />
                    <h3 className="font-bold text-sm text-slate-800">
                      Diễn Tiến Sinh Hiệu Qua Các Lần Khám ({vitalTrends.length} mốc thời gian)
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-rose-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                      HA Tâm Thu (Systolic)
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-blue-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                      HA Tâm Trương (Diastolic)
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-teal-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
                      BMI
                    </span>
                  </div>
                </div>

                {vitalTrends.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 italic">Chưa có chỉ số sinh hiệu</div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[500px] h-48 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-200">
                      {vitalTrends.map((point) => {
                        const systolic = point.systolicBp || 120;
                        const diastolic = point.diastolicBp || 80;
                        const sysHeightPercent = Math.min(100, Math.max(20, ((systolic - 60) / 140) * 100));
                        const diaHeightPercent = Math.min(100, Math.max(15, ((diastolic - 40) / 100) * 100));

                        return (
                          <div
                            key={point.encounterId}
                            className="flex-1 flex flex-col items-center justify-end h-full group relative"
                          >
                            {/* Tooltip on hover */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[10px] p-1.5 rounded shadow-lg pointer-events-none whitespace-nowrap z-10 font-mono">
                              <div>HA: {point.bloodPressure || '—'} mmHg</div>
                              <div>Mạch: {point.heartRate || '—'} bpm • BMI: {point.bmi || '—'}</div>
                            </div>

                            {/* Dual Bars for BP */}
                            <div className="flex items-end gap-1 w-full max-w-[36px] justify-center">
                              <div
                                className="w-3 rounded-t bg-rose-500 group-hover:bg-rose-600 transition-all shadow-xs"
                                style={{ height: `${sysHeightPercent}%` }}
                                title={`Tâm thu: ${systolic}`}
                              />
                              <div
                                className="w-3 rounded-t bg-blue-500 group-hover:bg-blue-600 transition-all shadow-xs"
                                style={{ height: `${diaHeightPercent}%` }}
                                title={`Tâm trương: ${diastolic}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Timeline date axis */}
                    <div className="min-w-[500px] flex justify-between gap-3 text-[10px] font-mono text-slate-500 mt-2">
                      {vitalTrends.map((point) => (
                        <div key={point.encounterId} className="flex-1 text-center truncate">
                          {new Date(point.encounterDateTime).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                          <div className="font-bold text-slate-700">{point.bloodPressure || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Box 3: Longitudinal Past Encounters Timeline */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-teal-600" />
                  <h3 className="font-bold text-sm text-slate-800">
                    Trục Thời Gian Các Ca Khám Cũ ({visits.length} lần khám)
                  </h3>
                </div>

                {visits.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 italic">
                    Chưa có lịch sử các đợt khám trước đó
                  </div>
                ) : (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-teal-200">
                    {visits.map((visit) => (
                      <div key={visit.encounterId} className="relative pl-8">
                        {/* Dot on timeline */}
                        <div className="absolute left-2 top-2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-teal-600 border-2 border-white shadow-xs" />

                        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                {visit.encounterCode}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                {new Date(visit.encounterDateTime).toLocaleString('vi-VN')}
                              </span>
                              <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                                {visit.status === 'COMPLETED' ? 'Đã hoàn tất' : visit.status}
                              </Badge>
                            </div>
                            <span className="text-xs font-semibold text-slate-700">
                              BS. {visit.doctorName} {visit.doctorSpecialty ? `(${visit.doctorSpecialty})` : ''}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                            <div>
                              <span className="text-slate-400 block text-[11px]">Lý do đến khám:</span>
                              <p className="font-medium text-slate-800">{visit.chiefComplaint || '—'}</p>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[11px]">Chẩn đoán xác định:</span>
                              <p className="font-bold text-teal-900">
                                {visit.icd10Code && <span className="font-mono mr-1.5 text-teal-700">[{visit.icd10Code}]</span>}
                                {visit.diagnosis}
                              </p>
                            </div>
                          </div>

                          {/* Prescribed medicines in this visit */}
                          {visit.prescription && visit.prescription.items && visit.prescription.items.length > 0 && (
                            <div className="text-xs pt-1 border-t border-slate-100 space-y-1">
                              <div className="flex items-center gap-1.5 text-teal-700 font-semibold text-[11px]">
                                <Pill className="h-3.5 w-3.5" />
                                <span>Đơn thuốc đã kê ({visit.prescription.prescriptionCode}):</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-600 pl-4">
                                {visit.prescription.items.map((it, idx) => (
                                  <div key={idx}>
                                    • <strong>{it.medicineName}</strong>: {it.quantity} {it.unit} ({it.usageTiming})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Service Orders in this visit */}
                          {visit.serviceOrders && visit.serviceOrders.length > 0 && (
                            <div className="text-xs pt-1 border-t border-slate-100 space-y-1">
                              <div className="flex items-center gap-1.5 text-indigo-700 font-semibold text-[11px]">
                                <Activity className="h-3.5 w-3.5" />
                                <span>Chỉ định CLS & Kết quả:</span>
                              </div>
                              <div className="space-y-1 text-[11px] text-slate-600 pl-4">
                                {visit.serviceOrders.map((ord, idx) => (
                                  <div key={idx} className="flex items-center justify-between">
                                    <span>• <strong>{ord.serviceName}</strong></span>
                                    <span className="font-medium text-slate-800 font-italic">
                                      {ord.conclusion ? `Kết luận: ${ord.conclusion}` : ord.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
          <Button onClick={onClose} className="bg-teal-600 hover:bg-teal-700 text-white text-xs">
            Đóng cửa sổ EMR
          </Button>
        </div>
      </div>
    </div>
  );
};
