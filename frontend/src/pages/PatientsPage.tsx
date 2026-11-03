import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  RefreshCw, 
  AlertCircle, 
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { 
  patientService, 
  PatientItem, 
  CreatePatientInput, 
  UpdatePatientInput 
} from '@/services/patientService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';

export const PatientsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filter & Pagination state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientItem | null>(null);
  const [viewingPatient, setViewingPatient] = useState<PatientItem | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<PatientItem | null>(null);

  // Form notification state
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'destructive';
    title: string;
    message: string;
  } | null>(null);

  // Form states
  const [createFormData, setCreateFormData] = useState<CreatePatientInput>({
    fullName: '',
    phone: '',
    dateOfBirth: '1990-01-01',
    gender: 'NAM',
    identityCardNo: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodType: 'O+',
    allergies: 'Không',
    medicalHistorySummary: '',
  });

  const [editFormData, setEditFormData] = useState<UpdatePatientInput>({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: 'NAM',
    identityCardNo: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodType: 'O+',
    allergies: '',
    medicalHistorySummary: '',
    status: 'ACTIVE',
  });

  // Query: Get Patients
  const {
    data: patientsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['patients', currentPage, pageSize, searchKeyword],
    queryFn: () => patientService.getPatients(currentPage, pageSize, searchKeyword),
  });

  const patientPage = patientsResponse?.data;
  const patientsList: PatientItem[] = patientPage?.items || patientPage?.content || [];
  const totalElements = patientPage?.totalElements || 0;
  const totalPages = patientPage?.totalPages || 0;

  // Mutation: Create Patient
  const createMutation = useMutation({
    mutationFn: (input: CreatePatientInput) => patientService.createPatient(input),
    onSuccess: (res) => {
      setAlertMessage({
        type: 'success',
        title: 'Thêm bệnh nhân thành công',
        message: `Đã đăng ký hồ sơ bệnh nhân ${res.data.fullName} (Mã: ${res.data.patientCode})`,
      });
      setShowCreateModal(false);
      resetCreateForm();
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
    onError: (err: any) => {
      setAlertMessage({
        type: 'destructive',
        title: 'Lỗi thêm bệnh nhân',
        message: err?.message || 'Không thể tạo bệnh nhân. Vui lòng kiểm tra dữ liệu nhập liệu.',
      });
    },
  });

  // Mutation: Update Patient
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePatientInput }) =>
      patientService.updatePatient(id, data),
    onSuccess: (res) => {
      setAlertMessage({
        type: 'success',
        title: 'Cập nhật thành công',
        message: `Đã cập nhật thông tin bệnh nhân ${res.data.fullName} (${res.data.patientCode})`,
      });
      setEditingPatient(null);
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
    onError: (err: any) => {
      setAlertMessage({
        type: 'destructive',
        title: 'Lỗi cập nhật',
        message: err?.message || 'Không thể cập nhật hồ sơ bệnh nhân.',
      });
    },
  });

  // Mutation: Soft Delete Patient
  const deleteMutation = useMutation({
    mutationFn: (id: string) => patientService.deletePatient(id),
    onSuccess: () => {
      setAlertMessage({
        type: 'success',
        title: 'Lưu trữ thành công',
        message: `Đã chuyển hồ sơ bệnh nhân ${deletingPatient?.fullName} vào trạng thái lưu trữ (Soft Delete).`,
      });
      setDeletingPatient(null);
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
    onError: (err: any) => {
      setAlertMessage({
        type: 'destructive',
        title: 'Lỗi lưu trữ',
        message: err?.message || 'Không thể lưu trữ hồ sơ bệnh nhân.',
      });
    },
  });

  const resetCreateForm = () => {
    setCreateFormData({
      fullName: '',
      phone: '',
      dateOfBirth: '1990-01-01',
      gender: 'NAM',
      identityCardNo: '',
      email: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      bloodType: 'O+',
      allergies: 'Không',
      medicalHistorySummary: '',
    });
  };

  const handleOpenEdit = (patient: PatientItem) => {
    setEditingPatient(patient);
    setEditFormData({
      fullName: patient.fullName,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      identityCardNo: patient.identityCardNo || '',
      email: patient.email || '',
      address: patient.address || '',
      emergencyContactName: patient.emergencyContactName || '',
      emergencyContactPhone: patient.emergencyContactPhone || '',
      bloodType: patient.bloodType || 'O+',
      allergies: patient.allergies || '',
      medicalHistorySummary: patient.medicalHistorySummary || '',
      status: patient.status || 'ACTIVE',
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
    setCurrentPage(0);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Quản Lý Hồ Sơ Bệnh Nhân
            </h2>
            <Badge variant="success">Tổng: {totalElements} bệnh nhân</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Tìm kiếm, tiếp nhận hồ sơ mới, chỉnh sửa thông tin hành chính và lưu trữ bệnh nhân
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
            className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Tiếp Nhận Bệnh Nhân Mới
          </Button>
        </div>
      </div>

      {/* Global Alerts */}
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

      {/* Search and Filters Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo Họ tên, Số điện thoại (SĐT), hoặc Mã bệnh nhân (BN-...)"
                value={searchKeyword}
                onChange={handleSearchChange}
                className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-2 text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>
            {searchKeyword && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchKeyword('');
                  setCurrentPage(0);
                }}
              >
                Xóa tìm kiếm
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patients Table Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-600" />
              Danh Sách Bệnh Nhân Đang Hoạt Động
            </CardTitle>
            <span className="text-xs text-slate-500">
              Trang {currentPage + 1} / {totalPages || 1} (Hiển thị tối đa {pageSize} bệnh nhân/trang)
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Mã BN</th>
                  <th className="py-3 px-4">Họ và Tên</th>
                  <th className="py-3 px-4">Giới tính</th>
                  <th className="py-3 px-4">Ngày sinh</th>
                  <th className="py-3 px-4">Số điện thoại</th>
                  <th className="py-3 px-4">Số CCCD</th>
                  <th className="py-3 px-4">Nhóm máu / Dị ứng</th>
                  <th className="py-3 px-4">Địa chỉ</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-teal-600" />
                        <span>Đang tải danh sách bệnh nhân từ MySQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : patientsList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="h-8 w-8 text-slate-300" />
                        <span className="font-medium text-slate-600">Không tìm thấy hồ sơ bệnh nhân nào</span>
                        <p className="text-xs text-slate-400">
                          {searchKeyword ? 'Thử tìm với từ khóa khác' : 'Hãy bấm "Tiếp Nhận Bệnh Nhân Mới" để tạo hồ sơ đầu tiên.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  patientsList.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-teal-700 whitespace-nowrap">
                        {p.patientCode}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {p.fullName}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={p.gender === 'NAM' ? 'info' : 'secondary'}>
                          {p.gender === 'NAM' ? 'Nam' : p.gender === 'NU' ? 'Nữ' : 'Khác'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {p.dateOfBirth}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {p.phone}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {p.identityCardNo || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-rose-600">{p.bloodType || '—'}</span>
                        {p.allergies && p.allergies !== 'Không' && (
                          <span className="block text-[11px] text-amber-700 truncate max-w-[140px]" title={p.allergies}>
                            ⚠️ {p.allergies}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 truncate max-w-[160px]" title={p.address}>
                        {p.address || '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant={p.status === 'ACTIVE' ? 'success' : 'secondary'}>
                          {p.status === 'ACTIVE' ? 'Đang khám' : p.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingPatient(p)}
                            title="Xem chi tiết"
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-teal-700 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Chỉnh sửa thông tin"
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-indigo-700 transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingPatient(p)}
                            title="Lưu trữ (Xóa)"
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
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
                trong tổng số <strong className="font-semibold text-slate-800">{totalElements}</strong> bệnh nhân
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
      {/* MODAL 1: TẠO MỚI BỆNH NHÂN                                            */}
      {/* ===================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 bg-teal-50 px-6 py-4">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-base">
                <Users className="h-5 w-5 text-teal-600" />
                Tiếp Nhận & Đăng Ký Hồ Sơ Bệnh Nhân Mới
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
                if (!createFormData.fullName.trim() || !createFormData.phone.trim()) {
                  setAlertMessage({
                    type: 'destructive',
                    title: 'Thiếu thông tin bắt buộc',
                    message: 'Vui lòng nhập họ và tên và số điện thoại.',
                  });
                  return;
                }
                createMutation.mutate(createFormData);
              }}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-semibold text-slate-700">Họ và tên bệnh nhân *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={createFormData.fullName}
                    onChange={(e) => setCreateFormData({ ...createFormData, fullName: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0912345678"
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Ngày sinh *</label>
                  <input
                    type="date"
                    required
                    value={createFormData.dateOfBirth}
                    onChange={(e) => setCreateFormData({ ...createFormData, dateOfBirth: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Giới tính *</label>
                  <select
                    value={createFormData.gender}
                    onChange={(e) => setCreateFormData({ ...createFormData, gender: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none"
                  >
                    <option value="NAM">Nam</option>
                    <option value="NU">Nữ</option>
                    <option value="KHAC">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Số CCCD / Định danh</label>
                  <input
                    type="text"
                    placeholder="079201000123"
                    value={createFormData.identityCardNo}
                    onChange={(e) => setCreateFormData({ ...createFormData, identityCardNo: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Nhóm máu</label>
                  <select
                    value={createFormData.bloodType}
                    onChange={(e) => setCreateFormData({ ...createFormData, bloodType: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none"
                  >
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="O+">O+</option>
                    <option value="AB+">AB+</option>
                    <option value="A-">A-</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700">Địa chỉ liên hệ</label>
                  <input
                    type="text"
                    placeholder="Số 123 Đường Hai Bà Trưng, Quận 1, TP. Hồ Chí Minh"
                    value={createFormData.address}
                    onChange={(e) => setCreateFormData({ ...createFormData, address: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Họ tên người liên hệ khẩn cấp</label>
                  <input
                    type="text"
                    placeholder="Nguyễn Thị B (Vợ/Chồng/Mẹ)"
                    value={createFormData.emergencyContactName}
                    onChange={(e) => setCreateFormData({ ...createFormData, emergencyContactName: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">SĐT người thân khẩn cấp</label>
                  <input
                    type="tel"
                    placeholder="0987654321"
                    value={createFormData.emergencyContactPhone}
                    onChange={(e) => setCreateFormData({ ...createFormData, emergencyContactPhone: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700">Tiền sử dị ứng (Thuốc / Thức ăn)</label>
                  <input
                    type="text"
                    placeholder="Dị ứng Penicillin, Aspirin, hoặc 'Không có dị ứng'..."
                    value={createFormData.allergies}
                    onChange={(e) => setCreateFormData({ ...createFormData, allergies: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700">Tóm tắt tiền sử bệnh lý</label>
                  <textarea
                    rows={2}
                    placeholder="Tăng huyết áp, Đái tháo đường Tuýp 2, Viêm loét dạ dày..."
                    value={createFormData.medicalHistorySummary}
                    onChange={(e) => setCreateFormData({ ...createFormData, medicalHistorySummary: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-teal-500 focus:outline-none"
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
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                  isLoading={createMutation.isPending}
                >
                  Lưu Hồ Sơ Vào MySQL
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: CHỈNH SỬA THÔNG TIN BỆNH NHÂN                                */}
      {/* ===================================================================== */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 bg-indigo-50 px-6 py-4">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-base">
                <Edit3 className="h-5 w-5 text-indigo-600" />
                Chỉnh Sửa Hồ Sơ Bệnh Nhân: <span className="font-mono text-teal-700">{editingPatient.patientCode}</span>
              </div>
              <button
                onClick={() => setEditingPatient(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({
                  id: editingPatient.id,
                  data: editFormData,
                });
              }}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-semibold text-slate-700">Họ và tên bệnh nhân *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Ngày sinh *</label>
                  <input
                    type="date"
                    required
                    value={editFormData.dateOfBirth}
                    onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Giới tính *</label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="NAM">Nam</option>
                    <option value="NU">Nữ</option>
                    <option value="KHAC">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Số CCCD / Định danh</label>
                  <input
                    type="text"
                    value={editFormData.identityCardNo || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, identityCardNo: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Nhóm máu</label>
                  <select
                    value={editFormData.bloodType || 'O+'}
                    onChange={(e) => setEditFormData({ ...editFormData, bloodType: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="O+">O+</option>
                    <option value="AB+">AB+</option>
                    <option value="A-">A-</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700">Địa chỉ liên hệ</label>
                  <input
                    type="text"
                    value={editFormData.address || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Người liên hệ khẩn cấp</label>
                  <input
                    type="text"
                    value={editFormData.emergencyContactName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, emergencyContactName: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">SĐT người thân khẩn cấp</label>
                  <input
                    type="tel"
                    value={editFormData.emergencyContactPhone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, emergencyContactPhone: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700">Tiền sử dị ứng</label>
                  <input
                    type="text"
                    value={editFormData.allergies || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, allergies: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700">Tóm tắt tiền sử bệnh lý</label>
                  <textarea
                    rows={2}
                    value={editFormData.medicalHistorySummary || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, medicalHistorySummary: e.target.value })}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPatient(null)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  isLoading={updateMutation.isPending}
                >
                  Lưu Thay Đổi (MySQL)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: XEM CHI TIẾT BỆNH NHÂN (DETAIL DRAWER)                       */}
      {/* ===================================================================== */}
      {viewingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-teal-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Hồ Sơ Chi Tiết Bệnh Nhân</h3>
                  <span className="font-mono text-xs text-teal-700 font-semibold">{viewingPatient.patientCode}</span>
                </div>
              </div>
              <button
                onClick={() => setViewingPatient(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="rounded-lg bg-teal-50/50 p-4 border border-teal-100 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">{viewingPatient.fullName}</div>
                  <div className="text-slate-500">
                    {viewingPatient.gender === 'NAM' ? 'Nam' : viewingPatient.gender === 'NU' ? 'Nữ' : 'Khác'} • Sinh ngày {viewingPatient.dateOfBirth}
                  </div>
                </div>
                <Badge variant="success">Hoạt động</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Số điện thoại:</span>
                  <span className="font-mono font-semibold text-slate-800">{viewingPatient.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Số CCCD / Định danh:</span>
                  <span className="font-mono font-semibold text-slate-800">{viewingPatient.identityCardNo || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Nhóm máu:</span>
                  <span className="font-bold text-rose-600">{viewingPatient.bloodType || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email:</span>
                  <span className="font-mono text-slate-700">{viewingPatient.email || '—'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block">Địa chỉ thường trú:</span>
                <span className="font-medium text-slate-800">{viewingPatient.address || '—'}</span>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Cảnh báo Y tế & Dị ứng
                </div>
                <div className="bg-amber-50 p-2.5 rounded border border-amber-200 text-amber-900">
                  {viewingPatient.allergies ? viewingPatient.allergies : 'Không ghi nhận dị ứng đặc biệt.'}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-sky-600" />
                  Tiền sử bệnh án tóm tắt
                </div>
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">
                  {viewingPatient.medicalHistorySummary ? viewingPatient.medicalHistorySummary : 'Chưa có ghi nhận tiền sử bệnh lý.'}
                </p>
              </div>

              {viewingPatient.emergencyContactName && (
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-slate-400 block">Liên hệ khẩn cấp:</span>
                  <span className="font-semibold text-slate-800">
                    {viewingPatient.emergencyContactName} ({viewingPatient.emergencyContactPhone || 'Không có SĐT'})
                  </span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setViewingPatient(null)}
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: XÁC NHẬN LƯU TRỮ (SOFT DELETE) BỆNH NHÂN                     */}
      {/* ===================================================================== */}
      {deletingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-200 bg-rose-50 px-6 py-4">
              <ShieldAlert className="h-6 w-6 text-rose-600 shrink-0" />
              <div>
                <h3 className="font-bold text-rose-900 text-sm">Xác Nhận Lưu Trữ Bệnh Nhân</h3>
                <p className="text-xs text-rose-700">Tuân thủ nguyên tắc No Hard Delete y tế</p>
              </div>
            </div>

            <div className="p-6 space-y-3 text-xs text-slate-600">
              <p>
                Bạn có chắc chắn muốn lưu trữ (Soft Delete) hồ sơ bệnh nhân{' '}
                <strong className="text-slate-900">{deletingPatient.fullName}</strong> (Mã:{' '}
                <strong className="font-mono text-teal-700">{deletingPatient.patientCode}</strong>)?
              </p>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-slate-500">
                • Hồ sơ sẽ được chuyển trạng thái <code>ARCHIVED</code> và ẩn khỏi danh sách tiếp đón thường quy.<br/>
                • Dữ liệu lịch hẹn và lịch sử khám vẫn được bảo toàn nguyên vẹn trong cơ sở dữ liệu MySQL.
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingPatient(null)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  isLoading={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(deletingPatient.id)}
                >
                  Xác Nhận Lưu Trữ
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
