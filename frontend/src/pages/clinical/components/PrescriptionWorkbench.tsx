import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pill,
  Plus,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Printer,
  Save,
  Search,
  X,
  FileText
} from 'lucide-react';
import { clinicalService, AvailableMedicine } from '@/services/clinicalService';
import { Prescription, PrescriptionItem, CreatePrescriptionPayload, AllergyAlert } from '@/types/clinical';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/LoadingSkeleton';

interface PrescriptionWorkbenchProps {
  encounterId: string;
  patientId: string;
  patientName: string;
  patientAllergies?: string;
  diagnosis?: string;
  isLocked?: boolean;
  onPrintPrescription: (prescription: Prescription) => void;
}

export const PrescriptionWorkbench: React.FC<PrescriptionWorkbenchProps> = ({
  encounterId,
  patientId,
  patientName,
  patientAllergies,
  diagnosis,
  isLocked = false,
  onPrintPrescription,
}) => {
  const queryClient = useQueryClient();

  // Local state
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [advice, setAdvice] = useState('');
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [isOpenPastPrescriptionModal, setIsOpenPastPrescriptionModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New item form
  const [selectedMedId, setSelectedMedId] = useState('');
  const [medSearch, setMedSearch] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [morningDose, setMorningDose] = useState('1');
  const [noonDose, setNoonDose] = useState('0');
  const [eveningDose, setEveningDose] = useState('1');
  const [nightDose, setNightDose] = useState('0');
  const [usageTiming, setUsageTiming] = useState('Sau ăn 30 phút');
  const [usageRoute, setUsageRoute] = useState('UONG');
  const [daysCount, setDaysCount] = useState<number>(5);
  const [instructions, setInstructions] = useState('');

  // Allergy warning alert state
  const [allergyAlert, setAllergyAlert] = useState<AllergyAlert | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Fetch current prescription
  const { data: prescriptionResponse, isLoading: isLoadingPrescription } = useQuery({
    queryKey: ['clinical', 'prescriptions', encounterId],
    queryFn: () => clinicalService.getPrescriptionByEncounter(encounterId),
  });

  const currentPrescription = prescriptionResponse?.data;

  // 2. Fetch available medicines
  const { data: medicinesResponse } = useQuery({
    queryKey: ['medicines', 'active'],
    queryFn: () => clinicalService.getActiveMedicines(),
  });

  const medicines: AvailableMedicine[] = medicinesResponse?.data || [];

  // 3. Fetch past prescriptions for re-prescribing
  const { data: pastPrescriptionsResponse } = useQuery({
    queryKey: ['clinical', 'past-prescriptions', patientId],
    queryFn: () => clinicalService.getPastPrescriptions(patientId),
    enabled: isOpenPastPrescriptionModal,
  });

  const pastPrescriptions: Prescription[] = pastPrescriptionsResponse?.data || [];

  // Sync loaded prescription into local state
  useEffect(() => {
    if (currentPrescription) {
      setItems(currentPrescription.items || []);
      setAdvice(currentPrescription.advice || '');
    }
  }, [currentPrescription]);

  // Check allergy whenever items change
  useEffect(() => {
    if (items.length > 0 && patientId) {
      const medIds = items.map((i) => i.medicineId);
      clinicalService.checkAllergy(patientId, medIds).then((res) => {
        if (res.data && res.data.hasAllergyRisk) {
          setAllergyAlert(res.data);
        } else {
          setAllergyAlert(null);
        }
      }).catch(() => {});
    } else {
      setAllergyAlert(null);
    }
  }, [items, patientId]);

  // Mutation: Save Prescription
  const savePrescriptionMutation = useMutation({
    mutationFn: (payload: CreatePrescriptionPayload) => clinicalService.savePrescription(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['clinical', 'prescriptions', encounterId] });
      showNotification('success', `Đã lưu đơn thuốc ${res.data.prescriptionCode} thành công!`);
    },
    onError: (err: any) => {
      showNotification('error', err?.response?.data?.message || 'Không thể lưu đơn thuốc.');
    },
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const med = medicines.find((m) => m.id === selectedMedId);
    if (!med) {
      showNotification('error', 'Vui lòng chọn thuốc từ danh mục.');
      return;
    }

    const newItem: PrescriptionItem = {
      medicineId: med.id,
      medicineName: med.name,
      unit: med.unit,
      quantity,
      morningDose,
      noonDose,
      eveningDose,
      nightDose,
      usageTiming,
      usageRoute,
      daysCount,
      instructions: instructions || `Uống ${usageTiming.toLowerCase()}, ngày ${[morningDose, noonDose, eveningDose, nightDose].filter(d => d !== '0' && d !== '').length} lần`,
    };

    setItems([...items, newItem]);
    setIsOpenAddModal(false);
    // Reset form
    setSelectedMedId('');
    setMedSearch('');
    setQuantity(10);
    setInstructions('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCopyPastPrescription = (pastPres: Prescription) => {
    if (pastPres.items && pastPres.items.length > 0) {
      setItems([...pastPres.items]);
      if (pastPres.advice) {
        setAdvice(pastPres.advice);
      }
      setIsOpenPastPrescriptionModal(false);
      showNotification('success', `Đã sao chép ${pastPres.items.length} loại thuốc từ đơn thuốc ${pastPres.prescriptionCode}!`);
    }
  };

  const handleSavePrescription = () => {
    if (items.length === 0) {
      showNotification('error', 'Đơn thuốc cần có ít nhất 1 loại thuốc.');
      return;
    }

    const payload: CreatePrescriptionPayload = {
      encounterId,
      diagnosis,
      advice,
      items: items.map((i) => ({
        medicineId: i.medicineId,
        quantity: i.quantity,
        morningDose: i.morningDose,
        noonDose: i.noonDose,
        eveningDose: i.eveningDose,
        nightDose: i.nightDose,
        usageTiming: i.usageTiming,
        usageRoute: i.usageRoute,
        daysCount: i.daysCount,
        instructions: i.instructions,
      })),
    };

    savePrescriptionMutation.mutate(payload);
  };

  const filteredMedicines = medicines.filter((m) =>
    m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
    m.genericName.toLowerCase().includes(medSearch.toLowerCase()) ||
    m.code.toLowerCase().includes(medSearch.toLowerCase())
  );

  return (
    <Card className="border-teal-200 shadow-sm overflow-hidden">
      {/* Toast */}
      {notification && (
        <div
          className={`p-3 text-xs font-semibold flex items-center justify-between ${
            notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Card Header */}
      <CardHeader className="bg-gradient-to-r from-teal-50 to-slate-50 border-b border-teal-100 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                Kê Đơn Thuốc Điện Tử (E-Prescription)
                {currentPrescription && (
                  <span className="font-mono text-xs font-normal text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                    {currentPrescription.prescriptionCode}
                  </span>
                )}
              </CardTitle>
              <p className="text-xs text-slate-500">
                Kê đơn ngoại trú kết nối kho dược, hướng dẫn liều dùng và kiểm soát dị ứng
                {patientAllergies && (
                  <span className="ml-2 font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                    Dị ứng ghi nhận: {patientAllergies}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isLocked && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpenPastPrescriptionModal(true)}
                  className="text-xs h-8 gap-1.5 border-teal-300 text-teal-800 hover:bg-teal-50"
                  title="Sao chép đơn thuốc cũ của bệnh nhân này"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-teal-600" />
                  Tái kê đơn cũ
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsOpenAddModal(true)}
                  className="text-xs h-8 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm thuốc
                </Button>
              </>
            )}

            {currentPrescription && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPrintPrescription(currentPrescription)}
                className="text-xs h-8 gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Printer className="h-3.5 w-3.5 text-slate-600" />
                In đơn thuốc
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Allergy Warning Alert Banner */}
        {allergyAlert && allergyAlert.hasAllergyRisk && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-3 shadow-xs animate-pulse">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-800">{allergyAlert.warningMessage}</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-rose-700">
                {allergyAlert.matchedAllergens.map((alg, i) => (
                  <li key={i} className="font-medium">{alg}</li>
                ))}
              </ul>
              <p className="mt-1 text-[11px] text-rose-600 italic">
                * Bác sĩ vui lòng cân nhắc thay đổi thuốc khác để đảm bảo an toàn tính mạng người bệnh!
              </p>
            </div>
          </div>
        )}

        {/* Prescription Items Table */}
        {isLoadingPrescription ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Pill className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">Chưa có thuốc nào trong đơn</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Bấm "+ Thêm thuốc" hoặc "Tái kê đơn cũ" để bắt đầu kê toa
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase text-[11px] font-semibold text-slate-600 border-b">
                <tr>
                  <th className="px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">Tên Thuốc & Quy Cách</th>
                  <th className="px-3 py-2.5 text-center">Số Lượng</th>
                  <th className="px-3 py-2.5">Liều Dùng (Sáng - Trưa - Chiều - Tối)</th>
                  <th className="px-3 py-2.5">Cách Dùng & Thời Điểm</th>
                  {!isLocked && <th className="px-3 py-2.5 text-right">Xóa</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2.5 font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-slate-900">{item.medicineName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Đơn vị: {item.unit}</div>
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-teal-700 text-sm">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded font-semibold text-[11px]">
                        Sáng: {item.morningDose || 0} • Trưa: {item.noonDose || 0} • Chiều: {item.eveningDose || 0} • Tối: {item.nightDose || 0}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-slate-800 font-medium">{item.usageTiming || 'Sau ăn'}</div>
                      {item.instructions && (
                        <div className="text-[11px] text-slate-500 italic">{item.instructions}</div>
                      )}
                    </td>
                    {!isLocked && (
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          title="Xóa thuốc khỏi đơn"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Doctor's Advice */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Lời Dặn & Hướng Dẫn Dinh Dưỡng Của Bác Sĩ
          </label>
          <textarea
            rows={2}
            disabled={isLocked}
            placeholder="VD: Uống đủ 2 lít nước mỗi ngày; Kiêng ăn mặn, giảm mỡ; Không uống rượu bia..."
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100"
          />
        </div>

        {/* Save Prescription Action */}
        {!isLocked && items.length > 0 && (
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={handleSavePrescription}
              disabled={savePrescriptionMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-2 text-xs"
            >
              <Save className="h-4 w-4" />
              {savePrescriptionMutation.isPending ? 'Đang lưu...' : 'Lưu Đơn Thuốc Điện Tử'}
            </Button>
          </div>
        )}
      </CardContent>

      {/* ==================== MODAL 1: THÊM THUỐC MỚI ==================== */}
      {isOpenAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Thêm Thuốc Vào Đơn
              </h3>
              <button onClick={() => setIsOpenAddModal(false)} className="text-teal-200 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              {/* Medicine Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn Thuốc Từ Danh Mục *
                </label>
                <div className="relative mb-2">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Gõ tên thuốc hoặc hoạt chất..."
                    value={medSearch}
                    onChange={(e) => setMedSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <select
                  required
                  size={4}
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-teal-500"
                >
                  {filteredMedicines.map((m) => (
                    <option key={m.id} value={m.id} className="py-1">
                      {m.name} ({m.genericName}) - [{m.unit}] - Tồn: {m.currentStock}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số lượng kê *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-teal-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số ngày uống</label>
                  <input
                    type="number"
                    min={1}
                    value={daysCount}
                    onChange={(e) => setDaysCount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Dosage breakdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Liều Dùng (Sáng - Trưa - Chiều - Tối)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Sáng</span>
                    <input
                      type="text"
                      value={morningDose}
                      onChange={(e) => setMorningDose(e.target.value)}
                      className="w-full px-2 py-1 text-center border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Trưa</span>
                    <input
                      type="text"
                      value={noonDose}
                      onChange={(e) => setNoonDose(e.target.value)}
                      className="w-full px-2 py-1 text-center border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Chiều</span>
                    <input
                      type="text"
                      value={eveningDose}
                      onChange={(e) => setEveningDose(e.target.value)}
                      className="w-full px-2 py-1 text-center border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Tối</span>
                    <input
                      type="text"
                      value={nightDose}
                      onChange={(e) => setNightDose(e.target.value)}
                      className="w-full px-2 py-1 text-center border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Timing & Route */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thời điểm uống</label>
                  <select
                    value={usageTiming}
                    onChange={(e) => setUsageTiming(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Sau ăn 30 phút">Sau ăn 30 phút</option>
                    <option value="Trước ăn 30 phút">Trước ăn 30 phút</option>
                    <option value="Trong bữa ăn">Trong bữa ăn</option>
                    <option value="Trước khi đi ngủ">Trước khi đi ngủ</option>
                    <option value="Khi đau sốt">Khi đau sốt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Đường dùng</label>
                  <select
                    value={usageRoute}
                    onChange={(e) => setUsageRoute(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="UONG">Đường uống</option>
                    <option value="TIEM">Đường tiêm</option>
                    <option value="BOI">Bôi ngoài da</option>
                    <option value="NHO">Nhỏ mắt / mũi / tai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hướng dẫn cụ thể</label>
                <input
                  type="text"
                  placeholder="VD: Uống nguyên viên với nhiều nước ấm..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsOpenAddModal(false)}>
                  Hủy
                </Button>
                <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                  Thêm vào đơn
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: TÁI KÊ ĐƠN CŨ ==================== */}
      {isOpenPastPrescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Sao Chép Đơn Thuốc Cũ (Tái Kê Đơn 1-Click)
                </h3>
                <p className="text-teal-200 text-xs">Bệnh nhân: {patientName}</p>
              </div>
              <button onClick={() => setIsOpenPastPrescriptionModal(false)} className="text-teal-200 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {pastPrescriptions.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs">Bệnh nhân này chưa có đơn thuốc nào trước đây</p>
                </div>
              ) : (
                pastPrescriptions.map((past) => (
                  <div
                    key={past.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                          {past.prescriptionCode}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(past.createdAt).toLocaleDateString('vi-VN')} • BS. {past.doctorName}
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleCopyPastPrescription(past)}
                        className="h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        Sao chép đơn này
                      </Button>
                    </div>

                    <div className="text-xs font-semibold text-slate-800">
                      Chẩn đoán: {past.diagnosis || '—'}
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 pl-2 border-l-2 border-teal-400">
                      {past.items?.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span>• <strong>{it.medicineName}</strong>: {it.quantity} {it.unit}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ({it.morningDose}-{it.noonDose}-{it.eveningDose}-{it.nightDose})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
