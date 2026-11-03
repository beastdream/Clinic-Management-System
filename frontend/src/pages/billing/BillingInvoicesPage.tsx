import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  Ban,
  Printer,
  Eye,
  DollarSign,
  Wallet,
  Trash2,
  Receipt,
  Calendar,
  AlertCircle,
  QrCode,
  Building2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { LoadingCard } from '@/components/ui/LoadingSkeleton';
import { billingService, InvoiceQueryParams } from '@/services/billingService';
import { patientService } from '@/services/patientService';
import {
  Invoice,
  CreateInvoicePayload,
  PayInvoicePayload,
  CancelInvoicePayload,
} from '@/types/billing';
import { formatVND, formatDateTime, formatDate } from '@/lib/utils';

interface SelectedServiceItem {
  serviceId: string;
  quantity: number;
}

export const BillingInvoicesPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const pageSize = 10;

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [cancellingInvoice, setCancellingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // Form state: Create Invoice
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [invoiceNotes, setInvoiceNotes] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<SelectedServiceItem[]>([
    { serviceId: '', quantity: 1 },
  ]);

  // Form state: Pay Invoice
  const [payMethod, setPayMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');

  // Form state: Cancel Invoice
  const [cancelReason, setCancelReason] = useState<string>('');

  // Alert message
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'destructive' | 'info';
    title: string;
    message: string;
  } | null>(null);

  // 1. Query: Billing Summary (Doanh thu & Số lượng)
  const {
    data: summaryData,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['billing', 'summary'],
    queryFn: () => billingService.getBillingSummary(),
  });

  // 2. Query: Invoices list
  const queryParams: InvoiceQueryParams = {
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    search: searchQuery || undefined,
    page: currentPage,
    size: pageSize,
  };

  const {
    data: invoicesData,
    isLoading: isInvoicesLoading,
    refetch: refetchInvoices,
  } = useQuery({
    queryKey: ['billing', 'invoices', queryParams],
    queryFn: () => billingService.getInvoices(queryParams),
  });

  // 3. Query: Available Services for Create Invoice
  const { data: servicesData } = useQuery({
    queryKey: ['billing', 'services'],
    queryFn: () => billingService.getAvailableServices(),
    enabled: showCreateModal,
  });

  // 4. Query: Patients for Create Invoice
  const { data: patientsData } = useQuery({
    queryKey: ['patients', 'list-all'],
    queryFn: () => patientService.getTopPatients(),
    enabled: showCreateModal,
  });

  // Mutation: Create Invoice
  const createInvoiceMutation = useMutation({
    mutationFn: (payload: CreateInvoicePayload) => billingService.createInvoice(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      setShowCreateModal(false);
      resetCreateForm();
      setAlertMessage({
        type: 'success',
        title: 'Lập hóa đơn thành công',
        message: `Hóa đơn ${res.data.invoiceCode} cho bệnh nhân ${res.data.patientName} với tổng tiền ${formatVND(res.data.totalAmount)} đã được tạo.`,
      });
    },
    onError: (err: any) => {
      setAlertMessage({
        type: 'destructive',
        title: 'Không thể lập hóa đơn',
        message: err.response?.data?.message || 'Vui lòng kiểm tra lại thông tin dịch vụ.',
      });
    },
  });

  // Mutation: Pay Invoice
  const payInvoiceMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PayInvoicePayload }) =>
      billingService.payInvoice(id, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      setPayingInvoice(null);
      setAlertMessage({
        type: 'success',
        title: 'Thanh toán thành công',
        message: `Hóa đơn ${res.data.invoiceCode} đã thanh toán thành công số tiền ${formatVND(res.data.paidAmount)} qua hình thức ${res.data.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}.`,
      });
    },
    onError: (err: any) => {
      setAlertMessage({
        type: 'destructive',
        title: 'Thanh toán thất bại',
        message: err.response?.data?.message || 'Có lỗi xảy ra khi xác nhận thanh toán.',
      });
    },
  });

  // Mutation: Cancel Invoice
  const cancelInvoiceMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CancelInvoicePayload }) =>
      billingService.cancelInvoice(id, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      setCancellingInvoice(null);
      setCancelReason('');
      setAlertMessage({
        type: 'info',
        title: 'Hủy hóa đơn thành công',
        message: `Hóa đơn ${res.data.invoiceCode} đã chuyển sang trạng thái ĐÃ HỦY.`,
      });
    },
    onError: (err: any) => {
      setAlertMessage({
        type: 'destructive',
        title: 'Không thể hủy hóa đơn',
        message: err.response?.data?.message || 'Không thể hủy hóa đơn này.',
      });
    },
  });

  const resetCreateForm = () => {
    setSelectedPatientId('');
    setInvoiceNotes('');
    setSelectedServices([{ serviceId: '', quantity: 1 }]);
  };

  const handleAddServiceRow = () => {
    setSelectedServices([...selectedServices, { serviceId: '', quantity: 1 }]);
  };

  const handleRemoveServiceRow = (index: number) => {
    if (selectedServices.length > 1) {
      setSelectedServices(selectedServices.filter((_, i) => i !== index));
    }
  };

  const handleServiceChange = (index: number, serviceId: string) => {
    const updated = [...selectedServices];
    updated[index].serviceId = serviceId;
    setSelectedServices(updated);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updated = [...selectedServices];
    updated[index].quantity = Math.max(1, quantity);
    setSelectedServices(updated);
  };

  const calculateEstimateTotal = () => {
    const services = servicesData?.data || [];
    return selectedServices.reduce((sum, item) => {
      const s = services.find((srv) => srv.id === item.serviceId);
      if (s) {
        return sum + Number(s.price) * item.quantity;
      }
      return sum;
    }, 0);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setAlertMessage({
        type: 'destructive',
        title: 'Thiếu thông tin',
        message: 'Vui lòng chọn bệnh nhân cần lập hóa đơn.',
      });
      return;
    }

    const validItems = selectedServices.filter((s) => s.serviceId.trim() !== '');
    if (validItems.length === 0) {
      setAlertMessage({
        type: 'destructive',
        title: 'Thiếu dịch vụ',
        message: 'Hóa đơn phải có ít nhất một dịch vụ y tế hợp lệ.',
      });
      return;
    }

    createInvoiceMutation.mutate({
      patientId: selectedPatientId,
      notes: invoiceNotes,
      items: validItems,
    });
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;

    payInvoiceMutation.mutate({
      id: payingInvoice.id,
      payload: {
        paymentMethod: payMethod,
        transactionReference: transactionRef,
        notes: payNotes,
      },
    });
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingInvoice) return;
    if (!cancelReason.trim()) {
      setAlertMessage({
        type: 'destructive',
        title: 'Thiếu lý do hủy',
        message: 'Vui lòng nhập lý do hủy hóa đơn.',
      });
      return;
    }

    cancelInvoiceMutation.mutate({
      id: cancellingInvoice.id,
      payload: {
        cancellationReason: cancelReason,
      },
    });
  };

  const summary = summaryData?.data;
  const invoices = invoicesData?.data?.items || [];
  const totalPages = invoicesData?.data?.totalPages || 0;
  const totalElements = invoicesData?.data?.totalElements || 0;
  const availableServices = servicesData?.data || [];
  const availablePatients = patientsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-teal-600" />
            Thu ngân & Viện phí (Billing & Invoices)
          </h1>
          <p className="text-sm text-slate-500">
            Quản lý hóa đơn khám bệnh, tính tổng chi phí theo bảng giá y tế, ghi nhận thanh toán tiền mặt và chuyển khoản
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchSummary();
              refetchInvoices();
            }}
            className="gap-1.5 text-xs text-slate-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Làm mới
          </Button>

          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="gap-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Lập hóa đơn mới
          </Button>
        </div>
      </div>

      {/* Alert Notification */}
      {alertMessage && (
        <Alert
          variant={alertMessage.type}
          title={alertMessage.title}
          className="relative cursor-pointer"
          onClick={() => setAlertMessage(null)}
        >
          {alertMessage.message}
        </Alert>
      )}

      {/* 1. Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh thu đã thanh toán */}
        <Card className="border-teal-200 bg-gradient-to-br from-teal-50/70 to-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
                Doanh thu thực thu (PAID)
              </p>
              <h3 className="text-xl font-bold text-teal-900 mt-1">
                {formatVND(summary?.totalPaidRevenue)}
              </h3>
              <span className="text-[11px] text-teal-700 mt-0.5 block">
                {summary?.paidInvoicesCount || 0} hóa đơn đã thanh toán
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Viện phí chờ thanh toán */}
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50/70 to-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                Chờ thanh toán (UNPAID)
              </p>
              <h3 className="text-xl font-bold text-amber-900 mt-1">
                {formatVND(summary?.totalUnpaidAmount)}
              </h3>
              <span className="text-[11px] text-amber-700 mt-0.5 block">
                {summary?.unpaidInvoicesCount || 0} hóa đơn đang chờ
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Hóa đơn đã hủy */}
        <Card className="border-rose-100 bg-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Hóa đơn đã hủy
              </p>
              <h3 className="text-xl font-bold text-rose-700 mt-1">
                {summary?.cancelledInvoicesCount || 0}
              </h3>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Không tính vào doanh thu
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <Ban className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Tổng số hóa đơn */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tổng số hóa đơn
              </p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">
                {summary?.totalInvoices || 0}
              </h3>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Toàn bộ chứng từ phát sinh
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Filter & Search Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Status tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {[
                { label: 'Tất cả', value: 'ALL' },
                { label: 'Chờ thanh toán', value: 'UNPAID' },
                { label: 'Đã thanh toán', value: 'PAID' },
                { label: 'Đã hủy', value: 'CANCELLED' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    setStatusFilter(tab.value);
                    setCurrentPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    statusFilter === tab.value
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Date range & search input */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Từ:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-600">
                <span>Đến:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              {(fromDate || toDate) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                    setCurrentPage(0);
                  }}
                  className="h-7 px-2 text-[11px] text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Xóa lọc ngày
                </Button>
              )}

              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm mã HĐ, tên BN, SĐT..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="text-xs rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 w-56 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Invoices Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-base text-slate-800">
            Danh sách hóa đơn viện phí
          </CardTitle>
          <span className="text-xs text-slate-500">
            Tổng cộng: <strong className="text-slate-800">{totalElements}</strong> hóa đơn
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {isInvoicesLoading ? (
            <div className="p-6">
              <LoadingCard />
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Chưa có hóa đơn nào</p>
              <p className="text-xs text-slate-400 mt-1">
                Không tìm thấy dữ liệu phù hợp với điều kiện tìm kiếm và lọc.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Mã hóa đơn</th>
                    <th className="py-3 px-4 font-semibold">Thời gian tạo</th>
                    <th className="py-3 px-4 font-semibold">Bệnh nhân</th>
                    <th className="py-3 px-4 font-semibold">Dịch vụ</th>
                    <th className="py-3 px-4 font-semibold text-right">Tổng tiền</th>
                    <th className="py-3 px-4 font-semibold">Trạng thái</th>
                    <th className="py-3 px-4 font-semibold">Hình thức TT</th>
                    <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => {
                    const isUnpaid = inv.status === 'UNPAID';
                    const isPaid = inv.status === 'PAID';
                    const isCancelled = inv.status === 'CANCELLED';

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {inv.invoiceCode}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600">
                          {formatDateTime(inv.createdAt)}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{inv.patientName || 'Bệnh nhân'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {inv.patientCode} • SĐT: {inv.patientPhone || '—'}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                            {inv.items?.length || 0} dịch vụ
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <strong className="text-sm font-bold text-slate-900">
                            {formatVND(inv.totalAmount)}
                          </strong>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {isPaid && (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Đã thanh toán
                            </Badge>
                          )}
                          {isUnpaid && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1 animate-pulse">
                              <Clock className="h-3 w-3 text-amber-600" />
                              Chưa thanh toán
                            </Badge>
                          )}
                          {isCancelled && (
                            <Badge className="bg-rose-100 text-rose-800 border-rose-200 gap-1">
                              <Ban className="h-3 w-3 text-rose-600" />
                              Đã hủy
                            </Badge>
                          )}
                        </td>

                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          {isPaid ? (
                            inv.paymentMethod === 'CASH' ? (
                              <span className="flex items-center gap-1 text-slate-700 font-medium">
                                <Wallet className="h-3.5 w-3.5 text-teal-600" /> Tiền mặt
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-indigo-700 font-medium">
                                <Building2 className="h-3.5 w-3.5 text-indigo-600" /> Chuyển khoản
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Nút Thanh toán khi UNPAID */}
                            {isUnpaid && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setPayingInvoice(inv);
                                  setPayMethod('CASH');
                                  setTransactionRef('');
                                  setPayNotes('');
                                }}
                                className="h-7 px-2.5 text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1"
                                title="Thu tiền hóa đơn"
                              >
                                <CreditCard className="h-3 w-3" />
                                Thu tiền
                              </Button>
                            )}

                            {/* Nút Xem chi tiết / In */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingInvoice(inv)}
                              className="h-7 px-2 text-xs gap-1 border-slate-200 hover:bg-slate-50"
                              title="Xem chi tiết và in"
                            >
                              <Eye className="h-3 w-3" />
                              Xem
                            </Button>

                            {/* Nút Hủy khi UNPAID */}
                            {isUnpaid && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCancellingInvoice(inv);
                                  setCancelReason('');
                                }}
                                className="h-7 px-2 text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
                                title="Hủy hóa đơn"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/50">
              <div className="text-xs text-slate-500">
                Hiển thị trang <strong className="font-semibold text-slate-800">{currentPage + 1}</strong> /{' '}
                <strong className="font-semibold text-slate-800">{totalPages}</strong> (Tổng cộng {totalElements} hóa đơn)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p: number) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="h-7 px-2 text-xs"
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p: number) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="h-7 px-2 text-xs"
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL 1: TẠO HÓA ĐƠN MỚI                                                  */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">Lập Hóa Đơn Viện Phí Mới</h3>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {/* Chọn bệnh nhân */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn bệnh nhân <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:border-teal-500"
                >
                  <option value="">-- Chọn bệnh nhân từ danh sách --</option>
                  {availablePatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.patientCode} - {p.fullName} ({p.phone} - {p.gender === 'MALE' ? 'Nam' : 'Nữ'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Bảng chọn danh sách dịch vụ */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Danh mục dịch vụ y tế & Bảng giá <span className="text-rose-500">*</span>
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddServiceRow}
                    className="h-6 text-[11px] px-2 text-teal-700 border-teal-200 hover:bg-teal-50 gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Thêm dòng dịch vụ
                  </Button>
                </div>

                <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  {selectedServices.map((row, index) => {
                    const currentService = availableServices.find((s) => s.id === row.serviceId);
                    const linePrice = currentService ? Number(currentService.price) * row.quantity : 0;

                    return (
                      <div key={index} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-100 shadow-2xs">
                        <span className="text-xs font-mono text-slate-400 w-5 text-center">{index + 1}.</span>

                        {/* Chọn dịch vụ */}
                        <div className="flex-1">
                          <select
                            value={row.serviceId}
                            onChange={(e) => handleServiceChange(index, e.target.value)}
                            required
                            className="w-full text-xs rounded border border-slate-200 px-2 py-1.5 bg-white focus:outline-none focus:border-teal-500"
                          >
                            <option value="">-- Chọn dịch vụ khám / xét nghiệm --</option>
                            {availableServices.map((srv) => (
                              <option key={srv.id} value={srv.id}>
                                [{srv.code}] {srv.name} — ({formatVND(srv.price)})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Số lượng */}
                        <div className="w-20">
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                            className="w-full text-xs rounded border border-slate-200 px-2 py-1.5 text-center font-bold focus:outline-none focus:border-teal-500"
                            title="Số lượng"
                          />
                        </div>

                        {/* Thành tiền tạm tính */}
                        <div className="w-28 text-right font-mono text-xs font-bold text-slate-800">
                          {formatVND(linePrice)}
                        </div>

                        {/* Xóa dòng */}
                        <button
                          type="button"
                          onClick={() => handleRemoveServiceRow(index)}
                          disabled={selectedServices.length === 1}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Tổng tiền tạm tính */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 px-2 font-bold text-xs text-slate-800">
                    <span>Tổng tiền tạm tính (Server tính chính xác từ DB):</span>
                    <span className="text-sm font-bold text-teal-800 font-mono">
                      {formatVND(calculateEstimateTotal())}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú hóa đơn (tùy chọn)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm về ca khám, chỉ định viện phí..."
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  disabled={createInvoiceMutation.isPending}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createInvoiceMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5"
                >
                  {createInvoiceMutation.isPending ? 'Đang tạo...' : 'Lập hóa đơn'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: GHI NHẬN THANH TOÁN (PAY INVOICE)                                */}
      {/* ========================================================================= */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 bg-teal-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-teal-700" />
                <h3 className="font-bold text-teal-900 text-sm">Xác Nhận Thu Tiền Viện Phí</h3>
              </div>
              <button
                onClick={() => setPayingInvoice(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="p-6 space-y-4">
              {/* Tóm tắt hóa đơn */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã hóa đơn:</span>
                  <span className="font-mono font-bold text-teal-800">{payingInvoice.invoiceCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bệnh nhân:</span>
                  <span className="font-semibold text-slate-800">{payingInvoice.patientName}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-sm">
                  <span className="text-slate-800">Số tiền cần thu:</span>
                  <span className="text-emerald-700 font-mono text-base">
                    {formatVND(payingInvoice.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Chọn hình thức thanh toán */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Hình thức thanh toán <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPayMethod('CASH')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-colors ${
                      payMethod === 'CASH'
                        ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Wallet className="h-4 w-4 text-teal-600" />
                    Tiền mặt tại quầy
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod('BANK_TRANSFER')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-colors ${
                      payMethod === 'BANK_TRANSFER'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-800 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="h-4 w-4 text-indigo-600" />
                    Chuyển khoản (QR)
                  </button>
                </div>
              </div>

              {/* Mã tham chiếu chuyển khoản (nếu BANK_TRANSFER) */}
              {payMethod === 'BANK_TRANSFER' && (
                <div className="space-y-2 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-xs">
                  <div className="flex items-center gap-2 text-indigo-800 font-semibold">
                    <QrCode className="h-4 w-4" />
                    <span>Mô phỏng chuyển khoản Napas 24/7</span>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">
                      Mã tham chiếu ngân hàng / Số bút toán (tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: FT26110398472"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full text-xs rounded border border-slate-200 p-2 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Ghi chú thanh toán */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú thanh toán
                </label>
                <input
                  type="text"
                  placeholder="Người nộp, số biên lai hoặc ghi chú..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full text-xs rounded border border-slate-200 p-2 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPayingInvoice(null)}
                  disabled={payInvoiceMutation.isPending}
                >
                  Đóng
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={payInvoiceMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-bold"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {payInvoiceMutation.isPending ? 'Đang xử lý...' : 'Xác nhận đã thu tiền'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CHI TIẾT & IN PHIẾU HÓA ĐƠN VIỆN PHÍ                             */}
      {/* ========================================================================= */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Action Bar at Top */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3 print:hidden">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Xem chi tiết chứng từ viện phí
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="text-xs gap-1.5 text-slate-700 hover:bg-slate-100"
                >
                  <Printer className="h-3.5 w-3.5" />
                  In hóa đơn
                </Button>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold ml-2"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div className="p-8 space-y-6 text-slate-800 bg-white" id="invoice-print-area">
              {/* Clinic Header */}
              <div className="text-center border-b border-slate-200 pb-4 space-y-1">
                <h2 className="text-base font-bold text-teal-800 uppercase tracking-wider">
                  PHÒNG KHÁM ĐA KHOA HOÀNG MAI
                </h2>
                <p className="text-xs text-slate-500">
                  Địa chỉ: 123 Đường Giải Phóng, Q. Hoàng Mai, Hà Nội • Hotline: 1900 6868
                </p>
                <h1 className="text-lg font-extrabold text-slate-900 pt-2 uppercase">
                  HÓA ĐƠN THU TIỀN VIỆN PHÍ
                </h1>
                <div className="flex items-center justify-center gap-3 text-xs text-slate-500 font-mono">
                  <span>Số HĐ: <strong className="text-slate-800 font-bold">{viewingInvoice.invoiceCode}</strong></span>
                  <span>•</span>
                  <span>Ngày tạo: {formatDateTime(viewingInvoice.createdAt)}</span>
                </div>
              </div>

              {/* Patient Demographics */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-lg border border-slate-100">
                <div><strong>Họ và tên bệnh nhân:</strong> {viewingInvoice.patientName}</div>
                <div><strong>Mã bệnh nhân:</strong> <span className="font-mono">{viewingInvoice.patientCode}</span></div>
                <div>
                  <strong>Giới tính / Năm sinh:</strong>{' '}
                  {viewingInvoice.patientGender === 'MALE' ? 'Nam' : 'Nữ'} •{' '}
                  {viewingInvoice.patientDateOfBirth ? formatDate(viewingInvoice.patientDateOfBirth) : '—'}
                </div>
                <div><strong>Số điện thoại:</strong> {viewingInvoice.patientPhone || '—'}</div>
                {viewingInvoice.patientAddress && (
                  <div className="col-span-2"><strong>Địa chỉ:</strong> {viewingInvoice.patientAddress}</div>
                )}
                {viewingInvoice.encounterCode && (
                  <div className="col-span-2 font-mono text-[11px] text-teal-800">
                    <strong>Lượt khám liên kết:</strong> {viewingInvoice.encounterCode}
                  </div>
                )}
              </div>

              {/* Services Itemized Table */}
              <div>
                <table className="w-full text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                    <tr>
                      <th className="border border-slate-200 p-2 text-center w-10">STT</th>
                      <th className="border border-slate-200 p-2 text-left">Tên dịch vụ y tế</th>
                      <th className="border border-slate-200 p-2 text-right w-24">Đơn giá</th>
                      <th className="border border-slate-200 p-2 text-center w-14">SL</th>
                      <th className="border border-slate-200 p-2 text-right w-28">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingInvoice.items?.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="border border-slate-200 p-2 text-center font-mono">{idx + 1}</td>
                        <td className="border border-slate-200 p-2 font-medium">
                          {item.serviceName}
                          <span className="block text-[10px] text-slate-400 font-mono">[{item.serviceCode}]</span>
                        </td>
                        <td className="border border-slate-200 p-2 text-right font-mono">{formatVND(item.unitPrice)}</td>
                        <td className="border border-slate-200 p-2 text-center font-mono font-bold">{item.quantity}</td>
                        <td className="border border-slate-200 p-2 text-right font-mono font-bold">{formatVND(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold text-xs">
                      <td colSpan={4} className="border border-slate-200 p-2 text-right uppercase">
                        Tổng cộng viện phí:
                      </td>
                      <td className="border border-slate-200 p-2 text-right text-sm font-mono text-emerald-800">
                        {formatVND(viewingInvoice.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Status Summary */}
              <div className="border border-dashed border-slate-200 p-3 rounded-lg text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span>Trạng thái thanh toán:</span>
                  <span className="font-bold">
                    {viewingInvoice.status === 'PAID' ? (
                      <span className="text-emerald-700">ĐÃ THANH TOÁN ĐỦ ({formatVND(viewingInvoice.paidAmount)})</span>
                    ) : viewingInvoice.status === 'CANCELLED' ? (
                      <span className="text-rose-600">HÓA ĐƠN ĐÃ HỦY ({viewingInvoice.cancellationReason || '—'})</span>
                    ) : (
                      <span className="text-amber-600">CHƯA THANH TOÁN (Còn nợ {formatVND(viewingInvoice.totalAmount)})</span>
                    )}
                  </span>
                </div>

                {viewingInvoice.status === 'PAID' && (
                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                    <span>
                      Hình thức: {viewingInvoice.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'} • Thời gian:{' '}
                      {viewingInvoice.paidAt ? formatDateTime(viewingInvoice.paidAt) : '—'}
                    </span>
                    <span>Thu ngân: {viewingInvoice.cashierName || 'Quầy thu ngân'}</span>
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 text-center pt-4 text-xs">
                <div>
                  <p className="font-bold">Bệnh nhân / Người nộp tiền</p>
                  <p className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</p>
                </div>
                <div>
                  <p className="font-bold">Người thu tiền (Thu ngân)</p>
                  <p className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</p>
                  <p className="mt-8 font-semibold text-slate-700">{viewingInvoice.cashierName || ''}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: HỦY HÓA ĐƠN (CANCEL INVOICE)                                     */}
      {/* ========================================================================= */}
      {cancellingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-200 bg-rose-50 px-6 py-4">
              <div className="p-2 bg-rose-100 rounded-full text-rose-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-rose-900 text-sm">Xác Nhận Hủy Hóa Đơn</h3>
                <p className="text-xs text-rose-700">Mã: {cancellingInvoice.invoiceCode}</p>
              </div>
            </div>

            <form onSubmit={handleCancelSubmit} className="p-6 space-y-3 text-xs">
              <p className="text-slate-600">
                Bạn có chắc chắn muốn hủy hóa đơn{' '}
                <strong className="text-slate-900">{cancellingInvoice.invoiceCode}</strong> của bệnh nhân{' '}
                <strong className="text-slate-900">{cancellingInvoice.patientName}</strong> với tổng tiền{' '}
                <strong className="text-rose-700">{formatVND(cancellingInvoice.totalAmount)}</strong>?
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lý do hủy hóa đơn <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Nhập lý do hủy hóa đơn (VD: Bệnh nhân đổi ý, lập sai danh mục dịch vụ...)"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                  className="w-full rounded border border-slate-200 p-2.5 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCancellingInvoice(null)}
                  disabled={cancelInvoiceMutation.isPending}
                >
                  Đóng
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={cancelInvoiceMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {cancelInvoiceMutation.isPending ? 'Đang hủy...' : 'Xác nhận hủy hóa đơn'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
