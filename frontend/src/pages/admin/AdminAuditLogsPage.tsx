import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Search,
  Eye,
  RefreshCw,
  Clock,
  User,
  Activity,
  Globe,
  FileCode,
  X
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { AdminAuditLog } from '@/types/admin';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { formatDate } from '@/lib/utils';

export const AdminAuditLogsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [limit, setLimit] = useState(150);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

  // Query: Audit Logs
  const {
    data: auditLogs,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin', 'audit-logs', actionFilter, searchQuery, limit],
    queryFn: async () => {
      const res = await adminService.getAuditLogs({
        action: actionFilter || undefined,
        search: searchQuery || undefined,
        limit,
      });
      return res.data;
    },
  });

  const getActionBadge = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'LOGIN':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Đăng Nhập</span>;
      case 'LOGOUT':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">Đăng Xuất</span>;
      case 'CREATE':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Tạo Mới</span>;
      case 'UPDATE':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">Cập Nhật</span>;
      case 'DELETE':
      case 'VOID':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Hủy / Xóa</span>;
      case 'SECURITY_ALERT':
      case 'LOGIN_FAILED':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">Cảnh Báo An Toàn</span>;
      case 'STATUS_CHANGE':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Đổi Trạng Thái</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800">{action}</span>;
    }
  };

  const renderJsonPretty = (rawJson?: string) => {
    if (!rawJson) return <span className="text-gray-400 italic">Không có dữ liệu</span>;
    try {
      const parsed = JSON.parse(rawJson);
      return (
        <pre className="bg-slate-900 text-teal-300 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-48 border border-slate-800">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return (
        <pre className="bg-slate-900 text-teal-300 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-48 border border-slate-800">
          {rawJson}
        </pre>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-teal-300 text-sm font-semibold mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>KHU VỰC QUẢN TRỊ VIÊN (ADMIN)</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Trung Tâm Nhật Ký Kiểm Toán (Audit Logs)</h1>
              <p className="text-teal-100 text-sm mt-1 max-w-2xl">
                Giám sát mọi thao tác nghiệp vụ, thay đổi cấu hình, tạo/sửa người dùng và truy cập hệ thống thời gian thực tuân thủ ISO/IEC và an toàn y tế.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-2"
                onClick={() => refetch()}
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                Làm mới nhật ký
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b">
          <div>
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600" />
              Lịch Sử Ghi Nhận Nhật Ký Kiểm Toán ({auditLogs?.length || 0} bản ghi gần nhất)
            </CardTitle>
            <CardDescription>
              Lưu vết định danh người thực hiện, thời điểm, địa chỉ IP và trạng thái dữ liệu trước/sau thay đổi
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm user, hành vi, thực thể..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="py-1.5 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">-- Tất cả hành vi --</option>
              <option value="LOGIN">Đăng Nhập (LOGIN)</option>
              <option value="LOGOUT">Đăng Xuất (LOGOUT)</option>
              <option value="CREATE">Tạo Mới (CREATE)</option>
              <option value="UPDATE">Cập Nhật (UPDATE)</option>
              <option value="DELETE">Xóa / Hủy (DELETE)</option>
              <option value="STATUS_CHANGE">Đổi Trạng Thái</option>
              <option value="SECURITY_ALERT">Cảnh Báo An Toàn</option>
            </select>

            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="py-1.5 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value={50}>50 bản ghi</option>
              <option value={150}>150 bản ghi</option>
              <option value={300}>300 bản ghi</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !auditLogs || auditLogs.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium">Chưa có nhật ký kiểm toán phù hợp bộ lọc</p>
              <p className="text-xs text-gray-400 mt-1">Các thao tác trên hệ thống sẽ tự động được ghi nhận tại đây</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Thời Điểm (Timestamp)</th>
                    <th className="px-4 py-3">Tài Khoản / Vai Trò</th>
                    <th className="px-4 py-3 text-center">Hành Động</th>
                    <th className="px-4 py-3">Thực Thể & Bản Ghi</th>
                    <th className="px-4 py-3">Địa Chỉ IP</th>
                    <th className="px-4 py-3 text-right">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-gray-700">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatDate(log.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-teal-600" />
                          <span className="font-semibold text-gray-900">@{log.username}</span>
                        </div>
                        {log.roleName && (
                          <div className="text-xs text-gray-500 font-mono mt-0.5">{log.roleName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                          {log.entityName}
                        </span>
                        {log.entityId && (
                          <span className="text-xs text-gray-500 font-mono ml-2">ID: {log.entityId}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-gray-400" />
                          <span>{log.ipAddress || '127.0.0.1'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="text-teal-600 hover:text-teal-800 hover:bg-teal-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Xem Thay Đổi
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

      {/* ==================== MODAL: CHI TIẾT NHẬT KÝ ==================== */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8 overflow-hidden">
            <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Chi Tiết Nhật Ký Kiểm Toán #{selectedLog.id}</h3>
                <p className="text-teal-200 text-xs">
                  Thực hiện bởi @{selectedLog.username} lúc {formatDate(selectedLog.createdAt)}
                </p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-teal-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Overview Meta Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <span className="text-xs text-gray-500 block">Người thực hiện</span>
                  <span className="text-sm font-semibold text-gray-900">@{selectedLog.username}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Hành động</span>
                  <div className="mt-0.5">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Thực thể can thiệp</span>
                  <span className="text-sm font-mono font-semibold text-teal-800">{selectedLog.entityName}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">IP Client</span>
                  <span className="text-sm font-mono text-gray-700">{selectedLog.ipAddress || '127.0.0.1'}</span>
                </div>
              </div>

              {/* User Agent */}
              {selectedLog.userAgent && (
                <div>
                  <span className="text-xs font-semibold text-gray-700 block mb-1">Thông tin Trình duyệt & Thiết bị (User-Agent):</span>
                  <div className="p-2.5 bg-gray-100 rounded-lg text-xs font-mono text-gray-600 break-all">
                    {selectedLog.userAgent}
                  </div>
                </div>
              )}

              {/* Data Diff (Old Values vs New Values) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 font-semibold text-sm text-rose-700">
                    <FileCode className="w-4 h-4" />
                    <span>Dữ Liệu Trước Khi Đổi (Old Values)</span>
                  </div>
                  {renderJsonPretty(selectedLog.oldValues)}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2 font-semibold text-sm text-emerald-700">
                    <FileCode className="w-4 h-4" />
                    <span>Dữ Liệu Mới Áp Dụng (New Values)</span>
                  </div>
                  {renderJsonPretty(selectedLog.newValues)}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={() => setSelectedLog(null)} className="bg-teal-600 hover:bg-teal-700 text-white">
                  Đóng cửa sổ
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
