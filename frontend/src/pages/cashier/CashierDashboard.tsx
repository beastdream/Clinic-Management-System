import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Ban,
  ChevronRight,
  FileClock,
  FileCheck2,
  Receipt,
  Wallet,
} from 'lucide-react';
import { billingService } from '@/services/billingService';
import { getApiErrorMessage } from '@/services/authService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { formatDateTime, formatVND } from '@/lib/utils';

export const CashierDashboard: React.FC = () => {
  const summaryQuery = useQuery({
    queryKey: ['billing', 'summary'],
    queryFn: () => billingService.getBillingSummary(),
    refetchInterval: 30000,
  });

  const unpaidQuery = useQuery({
    queryKey: ['billing', 'invoices', { status: 'UNPAID', page: 0, size: 8 }],
    queryFn: () => billingService.getInvoices({ status: 'UNPAID', page: 0, size: 8 }),
    refetchInterval: 30000,
  });

  const summary = summaryQuery.data?.data;
  const unpaid = unpaidQuery.data?.data?.content ?? unpaidQuery.data?.data?.items ?? [];
  const unpaidTotal = unpaidQuery.data?.data?.totalElements ?? unpaid.length;

  const kpis = summary
    ? [
        { label: 'Đã thu', value: formatVND(summary.totalPaidRevenue), hint: `${summary.paidInvoicesCount} hóa đơn đã thanh toán`, icon: Wallet, tone: 'text-emerald-700', iconTone: 'bg-emerald-50 text-emerald-600' },
        { label: 'Chờ thu', value: formatVND(summary.totalUnpaidAmount), hint: 'Tổng tiền hóa đơn chưa thanh toán', icon: FileClock, tone: 'text-amber-600', iconTone: 'bg-amber-50 text-amber-600' },
        { label: 'Hóa đơn chờ thu', value: String(summary.unpaidInvoicesCount), hint: 'Bệnh nhân cần thanh toán', icon: Receipt, tone: 'text-slate-900', iconTone: 'bg-teal-50 text-teal-600' },
        { label: 'Đã thanh toán', value: String(summary.paidInvoicesCount), hint: `Trên tổng ${summary.totalInvoices} hóa đơn`, icon: FileCheck2, tone: 'text-slate-900', iconTone: 'bg-sky-50 text-sky-600' },
        { label: 'Đã hủy', value: String(summary.cancelledInvoicesCount), hint: 'Hóa đơn bị hủy (không xóa)', icon: Ban, tone: 'text-rose-600', iconTone: 'bg-rose-50 text-rose-600' },
      ]
    : [];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <Receipt className="h-4 w-4 text-teal-600" />
        Thu Ngân & Viện Phí
      </div>

      {summaryQuery.isError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>Không tải được số liệu thu ngân: {getApiErrorMessage(summaryQuery.error, 'Lỗi kết nối máy chủ.')}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => summaryQuery.refetch()} className="text-xs h-8">
            Thử lại
          </Button>
        </div>
      )}

      {summaryQuery.isLoading ? (
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
                  <div className={`text-xl font-black font-mono tracking-tight truncate ${k.tone}`} title={k.value}>
                    {k.value}
                  </div>
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
              <CardTitle className="text-sm font-bold text-slate-800">
                Hóa Đơn Chờ Thanh Toán{unpaidTotal > 0 ? ` (${unpaidTotal})` : ''}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Các hóa đơn mới nhất chưa thu tiền. Mở trang Thu ngân để thu tiền và in biên lai.
              </CardDescription>
            </div>
            <Link to="/billing">
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1">
                Mở trang Thu ngân <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {unpaidQuery.isError ? (
            <div className="p-4 text-xs text-rose-700">
              Không tải được danh sách hóa đơn: {getApiErrorMessage(unpaidQuery.error, 'Lỗi kết nối máy chủ.')}
            </div>
          ) : unpaidQuery.isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : unpaid.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 italic">
              Không có hóa đơn nào đang chờ thanh toán.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Mã hóa đơn</th>
                    <th className="py-2.5 px-4 font-semibold">Bệnh nhân</th>
                    <th className="py-2.5 px-4 font-semibold">Ngày lập</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unpaid.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-800">{inv.invoiceCode}</td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">{inv.patientName || '—'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{inv.patientCode || inv.patientPhone || ''}</div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{formatDateTime(inv.createdAt)}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-700">
                        {formatVND(inv.totalAmount - (inv.paidAmount || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};
