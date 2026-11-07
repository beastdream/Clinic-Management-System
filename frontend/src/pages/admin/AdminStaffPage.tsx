import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Phone,
  Mail,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Save,
  Award,
  KeyRound
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import {
  AdminStaff,
  CreateStaffPayload,
  UpdateStaffPayload
} from '@/types/admin';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/LoadingSkeleton';

const AVAILABLE_ROLES = [
  { code: 'ROLE_DOCTOR', label: 'Bác Sĩ Điều Trị', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { code: 'ROLE_RECEPTIONIST', label: 'Lễ Tân & Tiếp Đón', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { code: 'ROLE_CASHIER', label: 'Thu Ngân & Viện Phí', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { code: 'ROLE_PHARMACIST', label: 'Dược Sĩ Kho Thuốc', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { code: 'ROLE_ADMIN', label: 'Quản Trị Viên (Admin)', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  { code: 'ROLE_NURSE', label: 'Điều Dưỡng / KTV', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
];

export const AdminStaffPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isOpenCreateModal, setIsOpenCreateModal] = useState(false);
  const [isOpenEditModal, setIsOpenEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<AdminStaff | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState<CreateStaffPayload>({
    username: '',
    password: '',
    staffCode: '',
    fullName: '',
    gender: 'MALE',
    dateOfBirth: '',
    phone: '',
    email: '',
    specialtyId: '',
    roomId: '',
    licenseNumber: '',
    qualification: 'Bác sĩ Đa khoa',
    roles: ['ROLE_DOCTOR'],
  });

  const [editForm, setEditForm] = useState<UpdateStaffPayload>({
    fullName: '',
    gender: 'MALE',
    dateOfBirth: '',
    phone: '',
    email: '',
    specialtyId: '',
    roomId: '',
    licenseNumber: '',
    qualification: '',
    status: 'ACTIVE',
    roles: [],
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Queries
  const {
    data: staffList,
    isLoading: isLoadingStaff,
    refetch: refetchStaff,
    isFetching: isFetchingStaff,
  } = useQuery({
    queryKey: ['admin', 'staff'],
    queryFn: async () => {
      const res = await adminService.getAllStaff();
      return res.data;
    },
  });

  const { data: specialties } = useQuery({
    queryKey: ['admin', 'master', 'specialties'],
    queryFn: async () => {
      const res = await adminService.getAllSpecialties();
      return res.data;
    },
  });

  const { data: rooms } = useQuery({
    queryKey: ['admin', 'master', 'rooms'],
    queryFn: async () => {
      const res = await adminService.getAllRooms();
      return res.data;
    },
  });

  // Mutations
  const createStaffMutation = useMutation({
    mutationFn: (payload: CreateStaffPayload) => adminService.createStaff(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
      setIsOpenCreateModal(false);
      showNotification('success', 'Tạo tài khoản và hồ sơ nhân sự thành công!');
    },
    onError: (err: any) => {
      showNotification('error', err?.message || 'Không thể tạo nhân sự. Tên đăng nhập hoặc mã nhân viên có thể đã tồn tại.');
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStaffPayload }) =>
      adminService.updateStaff(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
      setIsOpenEditModal(false);
      showNotification('success', 'Cập nhật nhân sự và phân quyền thành công!');
    },
    onError: (err: any) => {
      showNotification('error', err?.message || 'Không thể cập nhật nhân sự.');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminService.updateStaffStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
      showNotification('success', 'Cập nhật trạng thái công tác thành công!');
    },
    onError: (err: any) => {
      showNotification('error', err?.message || 'Lỗi khi cập nhật trạng thái.');
    },
  });

  // Filter staff list
  const filteredStaff = (staffList || []).filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staffCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery);

    const matchesRole = !roleFilter || (s.roles && s.roles.includes(roleFilter));
    const matchesStatus = !statusFilter || s.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleToggleRoleInCreate = (roleCode: string) => {
    const current = createForm.roles || [];
    if (current.includes(roleCode)) {
      if (current.length > 1) {
        setCreateForm({ ...createForm, roles: current.filter((r) => r !== roleCode) });
      }
    } else {
      setCreateForm({ ...createForm, roles: [...current, roleCode] });
    }
  };

  const handleToggleRoleInEdit = (roleCode: string) => {
    const current = editForm.roles || [];
    if (current.includes(roleCode)) {
      if (current.length > 1) {
        setEditForm({ ...editForm, roles: current.filter((r) => r !== roleCode) });
      }
    } else {
      setEditForm({ ...editForm, roles: [...current, roleCode] });
    }
  };

  const getRoleBadge = (roleCode: string) => {
    const found = AVAILABLE_ROLES.find((r) => r.code === roleCode);
    return (
      <span
        key={roleCode}
        className={`inline-block px-2 py-0.5 rounded text-xs font-medium border mr-1 mb-1 ${
          found?.color || 'bg-gray-100 text-gray-800 border-gray-200'
        }`}
      >
        {found?.label || roleCode}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Đang công tác</Badge>;
      case 'ON_LEAVE':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Nghỉ phép</Badge>;
      case 'TERMINATED':
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Đã thôi việc</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border shadow-sm transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span className="font-medium text-sm">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-teal-300 text-sm font-semibold mb-1">
                <Users className="w-4 h-4" />
                <span>KHU VỰC QUẢN TRỊ VIÊN (ADMIN)</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Hồ Sơ Nhân Sự & Phân Vai Trò Đa Nhiệm</h1>
              <p className="text-teal-100 text-sm mt-1 max-w-2xl">
                Quản lý nhân sự y tế (Bác sĩ, Dược sĩ, Thu ngân, Tiếp đón), cấp tài khoản và gán đa vai trò (Multi-role Staff) theo chuẩn kiến trúc.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-2"
                onClick={() => refetchStaff()}
              >
                <RefreshCw className={`w-4 h-4 ${isFetchingStaff ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
              <Button
                onClick={() => {
                  setCreateForm({
                    username: '',
                    password: '',
                    staffCode: `NV-${Math.floor(1000 + Math.random() * 9000)}`,
                    fullName: '',
                    gender: 'MALE',
                    dateOfBirth: '',
                    phone: '',
                    email: '',
                    specialtyId: specialties?.[0]?.id || '',
                    roomId: rooms?.[0]?.id || '',
                    licenseNumber: '',
                    qualification: 'Bác sĩ CKI',
                    roles: ['ROLE_DOCTOR'],
                  });
                  setIsOpenCreateModal(true);
                }}
                className="bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Thêm Nhân Sự Mới
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Staff Card */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b">
          <div>
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              Danh Sách Nhân Viên & Đội Ngũ Y Tế ({filteredStaff.length} nhân sự)
            </CardTitle>
            <CardDescription>
              Theo dõi và điều chỉnh thông tin hành chính, chuyên khoa công tác và quyền hạn đăng nhập
            </CardDescription>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm tên, mã, số ĐT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="py-1.5 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">-- Tất cả vai trò --</option>
              {AVAILABLE_ROLES.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">-- Tất cả trạng thái --</option>
              <option value="ACTIVE">Đang công tác</option>
              <option value="ON_LEAVE">Nghỉ phép</option>
              <option value="TERMINATED">Đã thôi việc</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {isLoadingStaff ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium">Không tìm thấy nhân viên nào phù hợp</p>
              <p className="text-xs text-gray-400 mt-1">Vui lòng điều chỉnh điều kiện lọc hoặc tạo thêm nhân sự mới</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Mã & Họ Tên Nhân Sự</th>
                    <th className="px-4 py-3">Tài Khoản Đăng Nhập</th>
                    <th className="px-4 py-3">Vai Trò Phân Quyền (RBAC)</th>
                    <th className="px-4 py-3">Chuyên Khoa & Phòng</th>
                    <th className="px-4 py-3">Liên Hệ</th>
                    <th className="px-4 py-3 text-center">Trạng Thái</th>
                    <th className="px-4 py-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{staff.fullName}</div>
                        <div className="text-xs font-mono text-teal-700 font-semibold">{staff.staffCode}</div>
                        {staff.qualification && (
                          <div className="text-xs text-gray-500">{staff.qualification}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded">
                          @{staff.username}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        {staff.roles && staff.roles.length > 0 ? (
                          staff.roles.map((r) => getRoleBadge(r))
                        ) : (
                          <span className="text-gray-400 text-xs italic">Chưa gán vai trò</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-gray-900">
                          {staff.specialtyName || <span className="text-gray-400 italic">Dùng chung</span>}
                        </div>
                        {staff.roomName && (
                          <div className="text-xs text-teal-700 font-medium">{staff.roomName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{staff.phone}</span>
                        </div>
                        {staff.email && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="truncate max-w-[140px]">{staff.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(staff.status)}</td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingStaff(staff);
                            setEditForm({
                              fullName: staff.fullName,
                              gender: staff.gender,
                              dateOfBirth: staff.dateOfBirth || '',
                              phone: staff.phone,
                              email: staff.email || '',
                              specialtyId: staff.specialtyId || '',
                              roomId: staff.roomId || '',
                              licenseNumber: staff.licenseNumber || '',
                              qualification: staff.qualification || '',
                              status: staff.status,
                              roles: staff.roles || [],
                            });
                            setIsOpenEditModal(true);
                          }}
                          className="text-teal-600 hover:text-teal-800 hover:bg-teal-50"
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Sửa & Phân Quyền
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const nextStatus = staff.status === 'ACTIVE' ? 'ON_LEAVE' : 'ACTIVE';
                            updateStatusMutation.mutate({ id: staff.id, status: nextStatus });
                          }}
                          className={staff.status === 'ACTIVE' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}
                        >
                          {staff.status === 'ACTIVE' ? 'Nghỉ phép' : 'Kích hoạt'}
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

      {/* ==================== MODAL: TẠO NHÂN VIÊN MỚI ==================== */}
      {isOpenCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 overflow-hidden">
            <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Thêm Mới Nhân Sự & Cấp Tài Khoản</h3>
                <p className="text-teal-200 text-xs">
                  Tạo hồ sơ nhân viên y tế và gán đa vai trò (Multi-role Staff)
                </p>
              </div>
              <button onClick={() => setIsOpenCreateModal(false)} className="text-teal-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createStaffMutation.mutate(createForm);
              }}
              className="p-6 space-y-4 max-h-[75vh] overflow-y-auto"
            >
              {/* Account Credentials */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                  <KeyRound className="w-4 h-4 text-teal-600" />
                  <span>1. Tài Khoản Đăng Nhập Hệ Thống</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tên đăng nhập *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: dr_nam"
                      value={createForm.username}
                      onChange={(e) => setCreateForm({ ...createForm, username: e.target.value.toLowerCase().trim() })}
                      className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mật khẩu khởi tạo *</label>
                    <input
                      type="password"
                      required
                      placeholder="Tối thiểu 6 ký tự"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Staff Profile Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                  <Award className="w-4 h-4 text-teal-600" />
                  <span>2. Thông Tin Nhân Sự Y Tế</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mã Nhân Viên *</label>
                    <input
                      type="text"
                      required
                      value={createForm.staffCode}
                      onChange={(e) => setCreateForm({ ...createForm, staffCode: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border rounded-lg text-sm font-mono font-semibold text-teal-700 uppercase"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Họ Và Tên Đầy Đủ *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: BS. CKI Nguyễn Văn Nam"
                      value={createForm.fullName}
                      onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Giới tính *</label>
                    <select
                      value={createForm.gender}
                      onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Số Điện Thoại *</label>
                    <input
                      type="tel"
                      required
                      placeholder="VD: 0987654321"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email Công Tác</label>
                    <input
                      type="email"
                      placeholder="VD: nam.bs@medicare.vn"
                      value={createForm.email || ''}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Học vị / Học hàm</label>
                    <input
                      type="text"
                      placeholder="VD: Bác sĩ CKI, ThS, BS, Cử nhân"
                      value={createForm.qualification || ''}
                      onChange={(e) => setCreateForm({ ...createForm, qualification: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Số Chứng Chỉ Hành Nghề (CCHN)</label>
                    <input
                      type="text"
                      placeholder="VD: 012345/BYT-CCHN"
                      value={createForm.licenseNumber || ''}
                      onChange={(e) => setCreateForm({ ...createForm, licenseNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Chuyên Khoa Phụ Trách</label>
                    <select
                      value={createForm.specialtyId || ''}
                      onChange={(e) => setCreateForm({ ...createForm, specialtyId: e.target.value || undefined })}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                    >
                      <option value="">-- Không trực thuộc chuyên khoa cụ thể --</option>
                      {specialties?.map((spec) => (
                        <option key={spec.id} value={spec.id}>
                          {spec.name} ({spec.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phòng Làm Việc Mặc Định</label>
                    <select
                      value={createForm.roomId || ''}
                      onChange={(e) => setCreateForm({ ...createForm, roomId: e.target.value || undefined })}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                    >
                      <option value="">-- Chưa gán phòng cụ thể --</option>
                      {rooms?.map((rm) => (
                        <option key={rm.id} value={rm.id}>
                          {rm.name} ({rm.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Multi-role selection */}
              <div className="bg-teal-50/60 p-4 rounded-xl border border-teal-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-teal-900 text-sm">
                    <Shield className="w-4 h-4 text-teal-700" />
                    <span>3. Phân Vai Trò Hệ Thống (Multi-role Staff)</span>
                  </div>
                  <span className="text-xs text-teal-700 font-medium">Chọn một hoặc nhiều vai trò</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_ROLES.map((role) => (
                    <label
                      key={role.code}
                      className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-all ${
                        createForm.roles.includes(role.code)
                          ? 'bg-teal-600 text-white border-teal-700 font-medium'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={createForm.roles.includes(role.code)}
                        onChange={() => handleToggleRoleInCreate(role.code)}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-xs">{role.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsOpenCreateModal(false)}>
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={createStaffMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                >
                  <Save className="w-4 h-4" />
                  Tạo Nhân Viên & Cấp Quyền
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CẬP NHẬT NHÂN SỰ & VAI TRÒ ==================== */}
      {isOpenEditModal && editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 overflow-hidden">
            <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Cập Nhật Thông Tin & Phân Quyền</h3>
                <p className="text-teal-200 text-xs">
                  Nhân sự: {editingStaff.fullName} ({editingStaff.staffCode}) - Tài khoản: @{editingStaff.username}
                </p>
              </div>
              <button onClick={() => setIsOpenEditModal(false)} className="text-teal-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateStaffMutation.mutate({
                  id: editingStaff.id,
                  payload: editForm,
                });
              }}
              className="p-6 space-y-4 max-h-[75vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Họ Và Tên *</label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Trạng Thái Công Tác *</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-semibold text-teal-800"
                  >
                    <option value="ACTIVE">Đang công tác</option>
                    <option value="ON_LEAVE">Nghỉ phép</option>
                    <option value="TERMINATED">Đã thôi việc</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Giới tính</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Số Điện Thoại *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Công Tác</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Học vị / Chức danh</label>
                  <input
                    type="text"
                    value={editForm.qualification || ''}
                    onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Số CCHN</label>
                  <input
                    type="text"
                    value={editForm.licenseNumber || ''}
                    onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Chuyên Khoa Phụ Trách</label>
                  <select
                    value={editForm.specialtyId || ''}
                    onChange={(e) => setEditForm({ ...editForm, specialtyId: e.target.value || undefined })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="">-- Dùng chung --</option>
                    {specialties?.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name} ({spec.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phòng Làm Việc</label>
                  <select
                    value={editForm.roomId || ''}
                    onChange={(e) => setEditForm({ ...editForm, roomId: e.target.value || undefined })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="">-- Chưa gán phòng --</option>
                    {rooms?.map((rm) => (
                      <option key={rm.id} value={rm.id}>
                        {rm.name} ({rm.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi-role selection */}
              <div className="bg-teal-50/60 p-4 rounded-xl border border-teal-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-teal-900 text-sm">
                    <Shield className="w-4 h-4 text-teal-700" />
                    <span>Cập Nhật Vai Trò Đa Nhiệm (Roles)</span>
                  </div>
                  <span className="text-xs text-teal-700 font-medium">Bấm để thêm hoặc bớt vai trò</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_ROLES.map((role) => (
                    <label
                      key={role.code}
                      className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-all ${
                        editForm.roles.includes(role.code)
                          ? 'bg-teal-600 text-white border-teal-700 font-medium'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={editForm.roles.includes(role.code)}
                        onChange={() => handleToggleRoleInEdit(role.code)}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-xs">{role.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsOpenEditModal(false)}>
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={updateStaffMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                >
                  <Save className="w-4 h-4" />
                  Lưu Thay Đổi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
