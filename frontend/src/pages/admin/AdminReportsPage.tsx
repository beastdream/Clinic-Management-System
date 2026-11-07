import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Download,
  Users,
  Stethoscope,
  Building2,
  FileCheck2,
  RefreshCw,
  TrendingUp,
  Award,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/LoadingSkeleton';

export const AdminReportsPage: React.FC = () => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Queries
  const {
    data: summaryData,
    isLoading: isLoadingSummary,
    refetch: refetchSummary,
    isFetching: isFetchingSummary,
  } = useQuery({
    queryKey: ['admin', 'reports', 'summary'],
    queryFn: async () => {
      const res = await adminService.getReportSummary();
      return res.data;
    },
  });

  const {
    data: specialtyStats,
    isLoading: isLoadingSpecialty,
    refetch: refetchSpecialty,
  } = useQuery({
    queryKey: ['admin', 'reports', 'specialty-stats'],
    queryFn: async () => {
      const res = await adminService.getSpecialtyReports();
      return res.data;
    },
  });

  const {
    data: doctorWorkload,
    isLoading: isLoadingWorkload,
    refetch: refetchWorkload,
  } = useQuery({
    queryKey: ['admin', 'reports', 'doctor-workload'],
    queryFn: async () => {
      const res = await adminService.getDoctorWorkloadReports();
      return res.data;
    },
  });

  const handleExportCSV = () => {
    // Generate UTF-8 BOM CSV (Excel-ready)
    let csvContent = '\uFEFF'; // Byte Order Mark for Excel utf-8 recognition

    // Section 1: Summary KPI
    csvContent += 'BÁO CÁO THỐNG KÊ QUẢN TRỊ PHÒNG KHÁM\n';
    csvContent += `Thời điểm xuất:;${new Date().toLocaleString('vi-VN')}\n\n`;

    csvContent += 'CHỈ SỐ TỔNG QUAN;\n';
    csvContent += `Tổng số Bác sĩ:;${summaryData?.totalDoctors || 0}\n`;
    csvContent += `Tổng số Nhân sự:;${summaryData?.totalStaff || 0}\n`;
    csvContent += `Tổng số Chuyên khoa:;${summaryData?.totalSpecialties || 0}\n`;
    csvContent += `Tổng số Phòng ban:;${summaryData?.totalRooms || 0}\n`;
    csvContent += `Tổng dịch vụ kỹ thuật:;${summaryData?.totalServices || 0}\n`;
    csvContent += `Tổng lượt khám hoàn tất:;${summaryData?.totalEncounters || 0}\n\n`;

    // Section 2: Specialty Stats
    csvContent += 'PHÂN BỐ LƯỢT KHÁM THEO CHUYÊN KHOA;\n';
    csvContent += 'Mã Chuyên Khoa;Tên Chuyên Khoa;Số Bác Sĩ;Số Ca Khám Hoàn Tất\n';
    (specialtyStats || []).forEach((s) => {
      csvContent += `"${s.specialtyCode}";"${s.specialtyName}";${s.doctorCount};${s.encounterCount}\n`;
    });
    csvContent += '\n';

    // Section 3: Doctor Workload
    csvContent += 'TẢI CÔNG VIỆC VÀ NĂNG SUẤT BÁC SĨ;\n';
    csvContent += 'Mã Bác Sĩ;Họ Và Tên;Chuyên Khoa;Số Điện Thoại;Số Ca Khám Đã Hoàn Thành\n';
    (doctorWorkload || []).forEach((d) => {
      csvContent += `"${d.staffCode}";"${d.fullName}";"${d.specialtyName}";"${d.phone}";${d.completedEncounters}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Quan_Tri_Phong_Kham_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const getRoleLabelVi = (role: string) => {
    switch (role) {
      case 'ROLE_DOCTOR':
        return 'Bác Sĩ Điều Trị';
      case 'ROLE_RECEPTIONIST':
        return 'Lễ Tân & Tiếp Đón';
      case 'ROLE_CASHIER':
        return 'Thu Ngân & Viện Phí';
      case 'ROLE_PHARMACIST':
        return 'Dược Sĩ Kho Thuốc';
      case 'ROLE_ADMIN':
        return 'Quản Trị Viên (Admin)';
      case 'ROLE_NURSE':
        return 'Điều Dưỡng / KTV';
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Download Toast */}
      {downloadSuccess && (
        <div className="p-4 rounded-xl flex items-center justify-between border shadow-sm bg-emerald-50 text-emerald-800 border-emerald-200">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-medium text-sm">Xuất báo cáo định dạng Excel (CSV UTF-8) thành công! Đang tải file...</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-teal-300 text-sm font-semibold mb-1">
                <BarChart3 className="w-4 h-4" />
                <span>KHU VỰC QUẢN TRỊ VIÊN (ADMIN)</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Báo Cáo Thống Kê & Phân Tích Quản Trị</h1>
              <p className="text-teal-100 text-sm mt-1 max-w-2xl">
                Tổng hợp hiệu suất hoạt động, số ca khám theo từng chuyên khoa và tải công việc của đội ngũ bác sĩ theo đúng nguyên tắc bảo vệ quyền riêng tư bệnh án (Clinical Privacy).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-2"
                onClick={() => {
                  refetchSummary();
                  refetchSpecialty();
                  refetchWorkload();
                }}
              >
                <RefreshCw className={`w-4 h-4 ${isFetchingSummary ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
              <Button
                onClick={handleExportCSV}
                className="bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                Xuất Báo Cáo CSV (Excel)
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Notice Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center space-x-3 text-blue-900 text-sm">
        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div>
          <span className="font-bold">Tuân thủ nguyên tắc Quyền riêng tư lâm sàng (Clinical Privacy):</span>{' '}
          Báo cáo quản trị viên chỉ tổng hợp số lượng ca khám và phân bổ tải công việc; tuyệt đối không hiển thị chi tiết chẩn đoán ICD, bệnh án hoặc dữ liệu nhạy cảm của bệnh nhân.
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Đội Ngũ Bác Sĩ</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {isLoadingSummary ? '...' : summaryData?.totalDoctors || 0}
              </p>
              <span className="text-xs text-teal-600 font-medium">Khám chữa bệnh</span>
            </div>
            <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
              <Stethoscope className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng Nhân Sự</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {isLoadingSummary ? '...' : summaryData?.totalStaff || 0}
              </p>
              <span className="text-xs text-blue-600 font-medium">Toàn hệ thống</span>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lượt Khám Hoàn Tất</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {isLoadingSummary ? '...' : summaryData?.totalEncounters || 0}
              </p>
              <span className="text-xs text-emerald-600 font-medium">Bệnh án đã khóa</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <FileCheck2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chuyên Khoa / Phòng</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {isLoadingSummary ? '...' : `${summaryData?.totalSpecialties || 0} / ${summaryData?.totalRooms || 0}`}
              </p>
              <span className="text-xs text-purple-600 font-medium">{summaryData?.totalServices || 0} dịch vụ</span>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
              <Building2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Specialty Stats & Staff Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Specialty Stats (2 Cols) */}
        <Card className="shadow-sm border-gray-200 lg:col-span-2">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              Phân Bố Ca Khám Theo Chuyên Khoa Y Tế
            </CardTitle>
            <CardDescription>
              Số lượng ca khám lâm sàng đã hoàn tất và số bác sĩ đang công tác tại từng khoa
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoadingSpecialty ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : !specialtyStats || specialtyStats.length === 0 ? (
              <div className="py-8 text-center text-gray-500">Chưa có dữ liệu thống kê chuyên khoa</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-600">
                    <tr>
                      <th className="px-4 py-2.5">Chuyên Khoa</th>
                      <th className="px-4 py-2.5 text-center">Bác Sĩ</th>
                      <th className="px-4 py-2.5 text-right">Lượt Khám</th>
                      <th className="px-4 py-2.5">Tỷ Lệ Khám</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {specialtyStats.map((item) => {
                      const totalEnc = summaryData?.totalEncounters || 1;
                      const percent = totalEnc > 0 ? Math.round((item.encounterCount / totalEnc) * 100) : 0;
                      return (
                        <tr key={item.specialtyId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            <div>{item.specialtyName}</div>
                            <span className="font-mono text-xs text-gray-400 font-normal">{item.specialtyCode}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-semibold text-gray-700">{item.doctorCount}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-teal-700">
                            {item.encounterCount} ca
                          </td>
                          <td className="px-4 py-3 min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-teal-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(100, Math.max(5, percent))}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-gray-600 w-8">{percent}%</span>
                            </div>
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

        {/* Staff Role Breakdown (1 Col) */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              Cơ Cấu Nhân Sự Theo Vai Trò
            </CardTitle>
            <CardDescription>Phân bổ đa vai trò của nhân viên phòng khám</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoadingSummary ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : !summaryData?.staffByRole || Object.keys(summaryData.staffByRole).length === 0 ? (
              <div className="py-8 text-center text-gray-500">Chưa có dữ liệu nhân sự</div>
            ) : (
              <div className="space-y-3">
                {Object.entries(summaryData.staffByRole).map(([role, count]) => (
                  <div
                    key={role}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm text-gray-900">{getRoleLabelVi(role)}</div>
                      <div className="text-xs font-mono text-gray-400">{role}</div>
                    </div>
                    <span className="font-bold text-base text-teal-800 bg-teal-100 px-3 py-1 rounded-full">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Doctor Workload Ranking */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Tải Công Việc & Năng Suất Đội Ngũ Bác Sĩ
          </CardTitle>
          <CardDescription>
            Thống kê số lượng ca bệnh án đã hoàn thành theo từng bác sĩ điều trị
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoadingWorkload ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !doctorWorkload || doctorWorkload.length === 0 ? (
            <div className="py-8 text-center text-gray-500">Chưa có dữ liệu lượt khám của bác sĩ</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Bác Sĩ Điều Trị</th>
                    <th className="px-4 py-3">Mã Nhân Viên</th>
                    <th className="px-4 py-3">Chuyên Khoa Phụ Trách</th>
                    <th className="px-4 py-3">Số Điện Thoại</th>
                    <th className="px-4 py-3 text-right">Lượt Khám Hoàn Thành</th>
                    <th className="px-4 py-3 text-center">Đánh Giá Tải Việc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {doctorWorkload.map((doc) => (
                    <tr key={doc.doctorId} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                          {doc.fullName?.charAt(0) || 'B'}
                        </div>
                        <span>{doc.fullName}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-teal-700">
                        {doc.staffCode}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{doc.specialtyName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{doc.phone}</td>
                      <td className="px-4 py-3 text-right font-bold text-base text-teal-700">
                        {doc.completedEncounters} ca
                      </td>
                      <td className="px-4 py-3 text-center">
                        {doc.completedEncounters >= 5 ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Tích Cực Cao</Badge>
                        ) : doc.completedEncounters > 0 ? (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">Đang Phục Vụ</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 border-gray-200">Sẵn Sàng Tiếp Nhận</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
