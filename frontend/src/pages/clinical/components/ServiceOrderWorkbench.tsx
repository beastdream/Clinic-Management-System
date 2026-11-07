import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Plus,
  Trash2,
  FileCheck2,
  Printer,
  X
} from 'lucide-react';
import { clinicalService, AvailableServiceItem } from '@/services/clinicalService';
import { ServiceOrder, CreateServiceOrderPayload, UpdateServiceOrderResultPayload } from '@/types/clinical';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/LoadingSkeleton';

interface ServiceOrderWorkbenchProps {
  encounterId: string;
  patientId?: string;
  isLocked?: boolean;
  onPrintOrders: (orders: ServiceOrder[]) => void;
}

export const ServiceOrderWorkbench: React.FC<ServiceOrderWorkbenchProps> = ({
  encounterId,
  isLocked = false,
  onPrintOrders,
}) => {
  const queryClient = useQueryClient();

  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [selectedOrderForResults, setSelectedOrderForResults] = useState<ServiceOrder | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT'>('ROUTINE');
  const [orderNotes, setOrderNotes] = useState('');

  // Results modal state
  const [resultText, setResultText] = useState('');
  const [conclusionText, setConclusionText] = useState('');

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Queries
  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['clinical', 'service-orders', encounterId],
    queryFn: () => clinicalService.getServiceOrdersByEncounter(encounterId),
  });

  const orders: ServiceOrder[] = ordersResponse?.data || [];

  const { data: servicesResponse } = useQuery({
    queryKey: ['services', 'active'],
    queryFn: () => clinicalService.getActiveServices(),
  });

  const services: AvailableServiceItem[] = servicesResponse?.data || [];

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: (payload: CreateServiceOrderPayload) => clinicalService.createServiceOrder(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['clinical', 'service-orders', encounterId] });
      setIsOpenAddModal(false);
      setSelectedServiceId('');
      setOrderNotes('');
      showNotification('success', `Đã chỉ định dịch vụ "${res.data.serviceName}" và đẩy vào viện phí!`);
    },
    onError: (err: any) => {
      showNotification('error', err?.response?.data?.message || 'Không thể chỉ định dịch vụ.');
    },
  });

  const updateResultMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateServiceOrderResultPayload }) =>
      clinicalService.updateServiceOrderResult(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical', 'service-orders', encounterId] });
      setSelectedOrderForResults(null);
      showNotification('success', 'Đã lưu kết quả cận lâm sàng thành công!');
    },
    onError: (err: any) => {
      showNotification('error', err?.response?.data?.message || 'Lỗi khi cập nhật kết quả.');
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (orderId: string) => clinicalService.deleteServiceOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical', 'service-orders', encounterId] });
      showNotification('success', 'Đã hủy chỉ định dịch vụ.');
    },
    onError: (err: any) => {
      showNotification('error', err?.response?.data?.message || 'Không thể hủy chỉ định.');
    },
  });

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Đã có kết quả</Badge>;
      case 'PROCESSING':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Đang thực hiện</Badge>;
      case 'PAID':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Đã thanh toán viện phí</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Đã hủy</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Chờ thực hiện</Badge>;
    }
  };

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

      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-teal-50 to-slate-50 border-b border-teal-100 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                Chỉ Định Dịch Vụ Kỹ Thuật & Cận Lâm Sàng
                {orders.length > 0 && (
                  <span className="font-mono text-xs font-normal text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                    {orders.length} chỉ định
                  </span>
                )}
              </CardTitle>
              <p className="text-xs text-slate-500">
                Chỉ định xét nghiệm, siêu âm, X-quang, tự động liên thông với Thu ngân và xem kết quả
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isLocked && (
              <Button
                type="button"
                size="sm"
                onClick={() => setIsOpenAddModal(true)}
                className="text-xs h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Chỉ định dịch vụ
              </Button>
            )}

            {orders.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPrintOrders(orders)}
                className="text-xs h-8 gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Printer className="h-3.5 w-3.5 text-slate-600" />
                In phiếu chỉ định
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Activity className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">Chưa có chỉ định cận lâm sàng nào</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Bác sĩ bấm "+ Chỉ định dịch vụ" để gửi yêu cầu xét nghiệm hoặc chẩn đoán hình ảnh
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase text-[11px] font-semibold text-slate-600 border-b">
                <tr>
                  <th className="px-3 py-2.5">Mã Chỉ Định</th>
                  <th className="px-3 py-2.5">Tên Dịch Vụ Kỹ Thuật</th>
                  <th className="px-3 py-2.5 text-right">Đơn Giá</th>
                  <th className="px-3 py-2.5 text-center">Mức Độ</th>
                  <th className="px-3 py-2.5 text-center">Trạng Thái</th>
                  <th className="px-3 py-2.5">Kết Quả / Kết Luận</th>
                  <th className="px-3 py-2.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2.5 font-mono font-bold text-indigo-700">{ord.orderCode}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-slate-900">{ord.serviceName}</div>
                      {ord.notes && <div className="text-[11px] text-slate-500 italic">{ord.notes}</div>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">
                      {formatVND(ord.price)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {ord.priority === 'URGENT' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                          CẤP CỨU / KHẨN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                          Thường quy
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">{getStatusBadge(ord.status)}</td>
                    <td className="px-3 py-2.5 max-w-xs">
                      {ord.conclusion ? (
                        <div>
                          <div className="font-semibold text-slate-900 truncate">{ord.conclusion}</div>
                          {ord.results && <div className="text-[11px] text-slate-400 truncate">{ord.results}</div>}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Chưa có kết quả</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right space-x-1 whitespace-nowrap">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrderForResults(ord);
                          setResultText(ord.results || '');
                          setConclusionText(ord.conclusion || '');
                        }}
                        className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 text-xs h-7"
                      >
                        {ord.conclusion ? 'Xem / Sửa KQ' : 'Nhập Kết Quả'}
                      </Button>
                      {!isLocked && ord.status !== 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => deleteOrderMutation.mutate(ord.id)}
                          className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          title="Hủy chỉ định"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* ==================== MODAL 1: THÊM CHỈ ĐỊNH DỊCH VỤ ==================== */}
      {isOpenAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-indigo-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Chỉ Định Dịch Vụ Kỹ Thuật Mới
              </h3>
              <button onClick={() => setIsOpenAddModal(false)} className="text-indigo-200 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedServiceId) {
                  showNotification('error', 'Vui lòng chọn dịch vụ.');
                  return;
                }
                createOrderMutation.mutate({
                  encounterId,
                  serviceId: selectedServiceId,
                  priority,
                  notes: orderNotes,
                });
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn Dịch Vụ Kỹ Thuật *
                </label>
                <select
                  required
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Chọn xét nghiệm hoặc kỹ thuật chẩn đoán --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) - [{s.serviceType}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mức Độ Ưu Tiên</label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs cursor-pointer font-medium ${
                      priority === 'ROUTINE' ? 'bg-indigo-50 border-indigo-400 text-indigo-800' : 'bg-white text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value="ROUTINE"
                      checked={priority === 'ROUTINE'}
                      onChange={() => setPriority('ROUTINE')}
                      className="hidden"
                    />
                    <span>Thường quy</span>
                  </label>
                  <label
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs cursor-pointer font-medium ${
                      priority === 'URGENT' ? 'bg-rose-50 border-rose-400 text-rose-800 font-bold' : 'bg-white text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value="URGENT"
                      checked={priority === 'URGENT'}
                      onChange={() => setPriority('URGENT')}
                      className="hidden"
                    />
                    <span>Cấp cứu / Khẩn</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi Chú Thăm Khám / Vị Trí Khảo Sát</label>
                <textarea
                  rows={2}
                  placeholder="VD: Kiểm tra tình trạng gan nhiễm mỡ, đo đường huyết lúc đói..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsOpenAddModal(false)}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createOrderMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {createOrderMutation.isPending ? 'Đang tạo...' : 'Xác Nhận Chỉ Định'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: CẬP NHẬT KẾT QUẢ CLS ==================== */}
      {selectedOrderForResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-indigo-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Kết Quả: {selectedOrderForResults.serviceName}</h3>
                <p className="text-indigo-200 text-xs font-mono">{selectedOrderForResults.orderCode}</p>
              </div>
              <button onClick={() => setSelectedOrderForResults(null)} className="text-indigo-200 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateResultMutation.mutate({
                  id: selectedOrderForResults.id,
                  payload: {
                    results: resultText,
                    conclusion: conclusionText,
                    status: 'COMPLETED',
                  },
                });
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chỉ Số / Kết Quả Chi Tiết
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="VD: WBC: 6.8 K/uL, RBC: 4.6 M/uL, HGB: 13.8 g/dL... Các chỉ số trong giới hạn bình thường."
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kết Luận Cận Lâm Sàng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Công thức máu bình thường; hoặc Gan nhiễm mỡ độ 1..."
                  value={conclusionText}
                  onChange={(e) => setConclusionText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedOrderForResults(null)}>
                  Đóng
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateResultMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                >
                  <FileCheck2 className="h-4 w-4" />
                  {updateResultMutation.isPending ? 'Đang lưu...' : 'Lưu Kết Quả & Hoàn Tất'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
};
