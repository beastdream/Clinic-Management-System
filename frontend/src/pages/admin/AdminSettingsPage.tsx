import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Shield, 
  Users, 
  Lock, 
  Unlock, 
  KeyRound, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  SlidersHorizontal,
  Power,
  UserCheck,
  Clock,
  Mail,
  Phone,
  Save,
  X
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { SystemSettings, AdminUser } from '@/types/admin';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import { formatDate } from '@/lib/utils';
import { authService } from '@/services/authService';

export const AdminSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const currentLoggedInUser = authService.getCurrentUser();

  const [activeTab, setActiveTab] = useState<'settings' | 'users'>('settings');

  // Search & Filter state for Users tab
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modals state
  const [selectedUserForStatus, setSelectedUserForStatus] = useState<AdminUser | null>(null);
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'LOCKED' | 'SUSPENDED'>('ACTIVE');
  const [statusReason, setStatusReason] = useState('');

  const [selectedUserForPassword, setSelectedUserForPassword] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Local settings form state
  const [settingsForm, setSettingsForm] = useState<Partial<SystemSettings>>({});
  const [formInitialized, setFormInitialized] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Query: System Settings
  const {
    data: settingsData,
    isLoading: isLoadingSettings,
    refetch: refetchSettings,
    isFetching: isFetchingSettings
  } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const res = await adminService.getSettings();
      if (!formInitialized && res.data) {
        setSettingsForm(res.data);
        setFormInitialized(true);
      }
      return res.data;
    },
  });

  // Query: Users List
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    refetch: refetchUsers,
    isFetching: isFetchingUsers
  } = useQuery({
    queryKey: ['admin', 'users', searchQuery, statusFilter, roleFilter],
    queryFn: async () => {
      const res = await adminService.getUsers({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
      });
      return res.data;
    },
  });

  // Mutation: Update Settings
  const updateSettingsMutation = useMutation({
    mutationFn: (payload: Partial<SystemSettings>) => adminService.updateSettings(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setSettingsForm(res.data);
      showNotification('success', 'Cập nhật cài đặt hệ thống thành công!');
    },
    onError: (err: any) => {
      showNotification('error', err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật cài đặt');
    },
  });

  // Mutation: Unlock User
  const unlockUserMutation = useMutation({
    mutationFn: (userId: string) => adminService.unlockUser(userId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      showNotification('success', `Đã mở khóa tài khoản [${res.data.username}] thành công!`);
    },
    onError: (err: any) => {
      showNotification('error', err.response?.data?.message || 'Không thể mở khóa tài khoản');
    },
  });

  // Mutation: Update User Status
  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, status, reason }: { userId: string; status: 'ACTIVE' | 'LOCKED' | 'SUSPENDED'; reason?: string }) =>
      adminService.updateUserStatus(userId, { status, reason }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setSelectedUserForStatus(null);
      showNotification('success', `Đã đổi trạng thái tài khoản [${res.data.username}] sang ${res.data.status}`);
    },
    onError: (err: any) => {
      showNotification('error', err.response?.data?.message || 'Không thể cập nhật trạng thái');
    },
  });

  // Mutation: Reset User Password
  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
      adminService.resetUserPassword(userId, { newPassword }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setSelectedUserForPassword(null);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      showNotification('success', 'Đã đặt lại mật khẩu cho tài khoản thành công!');
    },
    onError: (err: any) => {
      setPasswordError(err.response?.data?.message || 'Không thể đặt lại mật khẩu');
    },
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      maxFailedLoginAttempts: Number(settingsForm.maxFailedLoginAttempts) || 5,
      lockoutDurationMinutes: Number(settingsForm.lockoutDurationMinutes) || 15,
      passwordMinLength: Number(settingsForm.passwordMinLength) || 8,
      maintenanceMode: Boolean(settingsForm.maintenanceMode),
      maintenanceMessage: settingsForm.maintenanceMessage,
      allowPatientRegistration: Boolean(settingsForm.allowPatientRegistration),
    });
  };

  const handleOpenStatusModal = (user: AdminUser) => {
    setSelectedUserForStatus(user);
    setNewStatus(user.status);
    setStatusReason('');
  };

  const handleConfirmStatusChange = () => {
    if (!selectedUserForStatus) return;
    updateStatusMutation.mutate({
      userId: selectedUserForStatus.id,
      status: newStatus,
      reason: statusReason,
    });
  };

  const handleOpenPasswordModal = (user: AdminUser) => {
    setSelectedUserForPassword(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const handleConfirmPasswordReset = () => {
    if (!selectedUserForPassword) return;
    const minLen = settingsData?.passwordMinLength || 8;
    if (newPassword.length < minLen) {
      setPasswordError(`Mật khẩu mới phải có tối thiểu ${minLen} ký tự`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }
    resetPasswordMutation.mutate({
      userId: selectedUserForPassword.id,
      newPassword,
    });
  };

  // Helper stats
  const totalUsers = usersData?.length || 0;
  const activeCount = usersData?.filter(u => u.status === 'ACTIVE').length || 0;
  const lockedCount = usersData?.filter(u => u.status === 'LOCKED').length || 0;
  const suspendedCount = usersData?.filter(u => u.status === 'SUSPENDED').length || 0;

  const currentSettings = settingsForm;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-800 p-6 md:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-300">
              <Shield className="h-4 w-4" />
              <span>Phân Hệ Quản Trị Hệ Thống (System Administration)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Cài Đặt & Quản Lý Toàn Bộ Tài Khoản
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Thiết lập ngưỡng khóa đăng nhập sai, chế độ bảo trì toàn phòng khám và kiểm soát trạng thái, mật khẩu của người dùng.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchSettings();
                refetchUsers();
              }}
              disabled={isFetchingSettings || isFetchingUsers}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-9 gap-1.5 backdrop-blur"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetchingSettings || isFetchingUsers ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-teal-500/10 pointer-events-none blur-2xl" />
        <div className="absolute right-40 -top-10 w-32 h-32 rounded-full bg-indigo-500/10 pointer-events-none blur-xl" />
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-slate-200/50 rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Maintenance Mode Alert Banner if active */}
      {settingsData?.maintenanceMode && (
        <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-amber-800 flex items-center gap-2">
              Chế độ bảo trì hệ thống đang được kích hoạt!
              <Badge variant="warning" className="text-[10px]">Đang Bật</Badge>
            </h4>
            <p className="text-xs text-amber-700 leading-relaxed">
              Tất cả các tài khoản nhân viên (Bác sĩ, Lễ tân, Thu ngân) và Bệnh nhân đang bị tạm chặn đăng nhập.
              Chỉ Quản trị viên (ADMIN) mới có quyền truy cập hệ thống lúc này.
            </p>
          </div>
        </div>
      )}

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'settings'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Cấu Hình Bảo Mật & Hệ Thống</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Quản Lý Toàn Bộ Tài Khoản</span>
          {totalUsers > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {totalUsers}
            </span>
          )}
          {lockedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-500 text-white font-bold animate-pulse">
              {lockedCount} khóa
            </span>
          )}
        </button>
      </div>

      {/* 3. Tab Content 1: System Settings Form */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {isLoadingSettings && !formInitialized ? (
            <div className="space-y-4">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Section 1: Chính sách Đăng nhập & Khóa tài khoản */}
              <Card className="border-slate-200 bg-white">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-900">
                    <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">
                        Chính Sách Bảo Mật & Khóa Tài Khoản
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Kiểm soát số lần đăng nhập sai trước khi tài khoản bị khóa và thời hạn khóa an toàn
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Setting 1: Max failed attempts */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>Số lần nhập sai mật khẩu tối đa</span>
                        <span className="text-[11px] font-mono text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {currentSettings.maxFailedLoginAttempts || 5} lần
                        </span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={currentSettings.maxFailedLoginAttempts ?? 5}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            maxFailedLoginAttempts: parseInt(e.target.value) || 1,
                          }))
                        }
                        className="w-full h-10 px-3 text-sm font-medium rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                        required
                      />
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Khi nhập sai vượt quá số lần này, tài khoản sẽ tự động chuyển sang trạng thái <strong>BỊ KHÓA (LOCKED)</strong> và ghi nhận audit log bảo mật.
                      </p>
                    </div>

                    {/* Setting 2: Lockout duration in minutes */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>Thời gian tạm khóa tài khoản (phút)</span>
                        <span className="text-[11px] font-mono text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {currentSettings.lockoutDurationMinutes || 15} phút
                        </span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1440"
                        value={currentSettings.lockoutDurationMinutes ?? 15}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            lockoutDurationMinutes: parseInt(e.target.value) || 1,
                          }))
                        }
                        className="w-full h-10 px-3 text-sm font-medium rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                        required
                      />
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Thời gian tài khoản tự động được mở lại sau khi bị khóa. Quản trị viên luôn có thể mở khóa ngay lập tức trong bảng tài khoản.
                      </p>
                    </div>

                    {/* Setting 3: Min password length */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>Độ dài mật khẩu tối thiểu</span>
                        <span className="text-[11px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {currentSettings.passwordMinLength || 8} ký tự
                        </span>
                      </label>
                      <input
                        type="number"
                        min="6"
                        max="32"
                        value={currentSettings.passwordMinLength ?? 8}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            passwordMinLength: parseInt(e.target.value) || 6,
                          }))
                        }
                        className="w-full h-10 px-3 text-sm font-medium rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                        required
                      />
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Áp dụng khi bệnh nhân đăng ký mới hoặc khi Quản trị viên đổi/đặt lại mật khẩu cho tài khoản.
                      </p>
                    </div>

                    {/* Setting 4: Allow patient registration */}
                    <div className="space-y-2 flex flex-col justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Cổng đăng ký tài khoản bệnh nhân
                      </label>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-900">
                            {currentSettings.allowPatientRegistration ? 'Đang mở đăng ký trực tuyến' : 'Đang đóng cổng đăng ký'}
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Cho phép người bệnh tự tạo tài khoản khám qua cổng trực tuyến
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              allowPatientRegistration: !prev.allowPatientRegistration,
                            }))
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            currentSettings.allowPatientRegistration ? 'bg-teal-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              currentSettings.allowPatientRegistration ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 2: Chế độ Bảo trì Hệ thống */}
              <Card className="border-slate-200 bg-white">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-900">
                    <div className={`p-2 rounded-lg ${currentSettings.maintenanceMode ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                      <Power className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">
                        Chế Độ Bảo Trì Hệ Thống (Maintenance Mode)
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Kích hoạt khi cần nâng cấp cơ sở dữ liệu, sửa đổi hạ tầng hoặc bảo dưỡng định kỳ
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Maintenance Mode Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          Trạng Thái Chế Độ Bảo Trì:
                        </span>
                        <Badge
                          variant={currentSettings.maintenanceMode ? 'warning' : 'outline'}
                          className="font-bold text-xs"
                        >
                          {currentSettings.maintenanceMode ? 'ĐANG BẢO TRÌ' : 'HOẠT ĐỘNG BÌNH THƯỜNG'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                        Khi bật bảo trì, toàn bộ nhân viên (Bác sĩ, Lễ tân, Thu ngân) và Bệnh nhân sẽ không thể đăng nhập. Chỉ duy nhất tài khoản Quản trị viên (ADMIN) được phép đăng nhập.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          maintenanceMode: !prev.maintenanceMode,
                        }))
                      }
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                        currentSettings.maintenanceMode ? 'bg-amber-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                          currentSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Maintenance Message */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800">
                      Thông báo hiển thị cho người dùng khi đang bảo trì
                    </label>
                    <textarea
                      rows={3}
                      value={currentSettings.maintenanceMessage || ''}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          maintenanceMessage: e.target.value,
                        }))
                      }
                      className="w-full p-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Nhập thông báo gửi đến bệnh nhân và nhân viên..."
                      required
                    />
                    <p className="text-[11px] text-slate-500">
                      Thông báo này sẽ xuất hiện trên màn hình khi người dùng cố gắng đăng nhập trong lúc bảo trì.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (settingsData) setSettingsForm(settingsData);
                  }}
                  className="text-xs"
                >
                  Khôi phục ban đầu
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateSettingsMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs gap-1.5 h-9 px-5 shadow-xs"
                >
                  <Save className="h-4 w-4" />
                  {updateSettingsMutation.isPending ? 'Đang lưu cài đặt...' : 'Lưu Thay Đổi Cài Đặt'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 4. Tab Content 2: User Account Management */}
      {activeTab === 'users' && (
        <div className="space-y-5">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500">Tổng Tài Khoản</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{totalUsers}</div>
            </div>
            <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50 shadow-2xs">
              <span className="text-[11px] font-semibold text-emerald-700">Đang Hoạt Động (ACTIVE)</span>
              <div className="text-xl font-bold font-mono text-emerald-800 mt-0.5">{activeCount}</div>
            </div>
            <div className={`p-3.5 rounded-xl border shadow-2xs ${lockedCount > 0 ? 'border-rose-200 bg-rose-50/70 text-rose-800' : 'border-slate-200 bg-white'}`}>
              <span className={`text-[11px] font-semibold ${lockedCount > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                Đang Bị Khóa (LOCKED)
              </span>
              <div className={`text-xl font-bold font-mono mt-0.5 ${lockedCount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                {lockedCount}
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500">Tạm Ngưng (SUSPENDED)</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{suspendedCount}</div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo username, họ tên, email, SĐT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                <option value="LOCKED">Bị khóa (LOCKED)</option>
                <option value="SUSPENDED">Tạm ngưng (SUSPENDED)</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Tất cả vai trò</option>
                <option value="ROLE_ADMIN">Quản trị viên (ADMIN)</option>
                <option value="ROLE_DOCTOR">Bác sĩ (DOCTOR)</option>
                <option value="ROLE_RECEPTIONIST">Lễ tân (RECEPTIONIST)</option>
                <option value="ROLE_CASHIER">Thu ngân (CASHIER)</option>
                <option value="ROLE_PATIENT">Bệnh nhân (PATIENT)</option>
              </select>

              {(searchQuery || statusFilter || roleFilter) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('');
                    setRoleFilter('');
                  }}
                  className="h-9 text-xs"
                >
                  Xóa lọc
                </Button>
              )}
            </div>
          </div>

          {/* User Table */}
          <Card className="border-slate-200 bg-white overflow-hidden shadow-2xs">
            {isLoadingUsers ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : usersData && usersData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Tài Khoản / Tên</th>
                      <th className="py-3 px-4">Liên Hệ</th>
                      <th className="py-3 px-4">Vai Trò</th>
                      <th className="py-3 px-4">Trạng Thái / Đăng Nhập Sai</th>
                      <th className="py-3 px-4">Phương Thức</th>
                      <th className="py-3 px-4 text-right">Thao Tác Quản Trị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {usersData.map((user) => {
                      const isLocked = user.status === 'LOCKED';
                      const isCurrentUser = currentLoggedInUser?.username === user.username;

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Col 1: Account / Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0 border border-teal-200 uppercase">
                                {user.username.slice(0, 2)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{user.username}</span>
                                  {isCurrentUser && (
                                    <span className="text-[10px] font-mono bg-teal-100 text-teal-800 px-1 py-0.2 rounded font-semibold">
                                      Bạn
                                    </span>
                                  )}
                                  {user.isStaff && (
                                    <span className="text-[9px] font-bold uppercase bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded">
                                      Nhân viên
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-normal">
                                  {user.fullName || '(Chưa liên kết hồ sơ)'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Col 2: Contact */}
                          <td className="py-3.5 px-4 text-slate-600">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <Mail className="h-3 w-3 text-slate-400" />
                                <span>{user.email || '—'}</span>
                              </div>
                              {user.phone && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                                  <Phone className="h-3 w-3 text-slate-400" />
                                  <span>{user.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Col 3: Roles */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {user.roles.map((r) => {
                                const cleanRole = r.replace('ROLE_', '');
                                let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
                                if (cleanRole === 'ADMIN') colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
                                if (cleanRole === 'DOCTOR') colorClass = 'bg-sky-50 text-sky-700 border-sky-200';
                                if (cleanRole === 'RECEPTIONIST') colorClass = 'bg-teal-50 text-teal-700 border-teal-200';
                                if (cleanRole === 'CASHIER') colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';

                                return (
                                  <span
                                    key={r}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${colorClass}`}
                                  >
                                    {cleanRole}
                                  </span>
                                );
                              })}
                            </div>
                          </td>

                          {/* Col 4: Status & Failed Attempts */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <div>
                                {user.status === 'ACTIVE' && (
                                  <Badge variant="success" className="text-[10px]">
                                    Hoạt động
                                  </Badge>
                                )}
                                {user.status === 'LOCKED' && (
                                  <Badge variant="destructive" className="text-[10px] gap-1">
                                    <Lock className="h-3 w-3" />
                                    Bị Khóa
                                  </Badge>
                                )}
                                {user.status === 'SUSPENDED' && (
                                  <Badge variant="warning" className="text-[10px]">
                                    Tạm Ngưng
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500">
                                Sai mật khẩu:{' '}
                                <span className={user.failedLoginAttempts > 0 ? 'font-bold text-rose-600' : 'text-slate-600'}>
                                  {user.failedLoginAttempts} / {settingsData?.maxFailedLoginAttempts || 5} lần
                                </span>
                              </div>
                              {user.lockedUntil && (
                                <div className="text-[10px] text-rose-600 flex items-center gap-1 font-mono">
                                  <Clock className="h-3 w-3" />
                                  <span>Khóa đến: {formatDate(user.lockedUntil)}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Col 5: Auth Provider */}
                          <td className="py-3.5 px-4">
                            <span className="text-[11px] font-mono text-slate-600 px-2 py-0.5 rounded bg-slate-100">
                              {user.authProvider || 'LOCAL'}
                            </span>
                          </td>

                          {/* Col 6: Admin Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Unlock Button: active if user is locked or has failed attempts */}
                              {(isLocked || user.failedLoginAttempts > 0) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => unlockUserMutation.mutate(user.id)}
                                  disabled={unlockUserMutation.isPending}
                                  className="h-7 text-[11px] px-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-1 font-bold"
                                  title="Mở khóa tài khoản ngay lập tức"
                                >
                                  <Unlock className="h-3 w-3" />
                                  Mở Khóa
                                </Button>
                              )}

                              {/* Change Status Button */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenStatusModal(user)}
                                disabled={isCurrentUser}
                                className="h-7 text-[11px] px-2 text-slate-700 hover:bg-slate-100"
                                title="Đổi trạng thái tài khoản"
                              >
                                Đổi Trạng Thái
                              </Button>

                              {/* Reset Password Button */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenPasswordModal(user)}
                                className="h-7 text-[11px] px-2 text-teal-700 border-teal-200 hover:bg-teal-50 gap-1"
                                title="Đặt lại mật khẩu cho tài khoản"
                              >
                                <KeyRound className="h-3 w-3" />
                                Đặt Mật Khẩu
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                <Users className="h-8 w-8 text-slate-300 mx-auto" />
                <p>Không tìm thấy tài khoản người dùng phù hợp với điều kiện tìm kiếm.</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Modal 1: Change User Status */}
      {selectedUserForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-teal-600" />
                Đổi Trạng Thái Tài Khoản
              </h3>
              <button
                onClick={() => setSelectedUserForStatus(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-slate-800">
                Tài khoản: <span className="text-teal-700">{selectedUserForStatus.username}</span>
              </div>
              <div className="text-slate-500">
                Họ tên: {selectedUserForStatus.fullName || '(Chưa liên kết hồ sơ)'}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800">Chọn trạng thái mới:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNewStatus('ACTIVE')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    newStatus === 'ACTIVE'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  ACTIVE
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Hoạt động</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewStatus('LOCKED')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    newStatus === 'LOCKED'
                      ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  LOCKED
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Khóa tài khoản</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewStatus('SUSPENDED')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    newStatus === 'SUSPENDED'
                      ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  SUSPENDED
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Tạm ngưng</span>
                </button>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-xs font-semibold text-slate-700">Lý do thay đổi (ghi nhận audit):</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Theo yêu cầu của người dùng, hoặc vi phạm bảo mật..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUserForStatus(null)}
                className="text-xs h-8"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmStatusChange}
                disabled={updateStatusMutation.isPending}
                className="text-xs h-8 bg-teal-600 hover:bg-teal-700 text-white font-bold"
              >
                {updateStatusMutation.isPending ? 'Đang cập nhật...' : 'Xác Nhận'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Reset User Password */}
      {selectedUserForPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-teal-600" />
                Đặt Lại Mật Khẩu Tài Khoản
              </h3>
              <button
                onClick={() => setSelectedUserForPassword(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-slate-800">
                Tài khoản: <span className="text-teal-700">{selectedUserForPassword.username}</span>
              </div>
              <div className="text-slate-500">
                Email: {selectedUserForPassword.email || '(Chưa có email)'}
              </div>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Mật khẩu mới:</label>
                <input
                  type="password"
                  placeholder={`Tối thiểu ${settingsData?.passwordMinLength || 8} ký tự`}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Xác nhận mật khẩu mới:</label>
                <input
                  type="password"
                  placeholder="Nhập lại mật khẩu mới..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Sau khi đặt lại mật khẩu, tài khoản sẽ được tự động mở khóa và reset số lần đăng nhập sai về 0. Người dùng có thể đăng nhập ngay bằng mật khẩu mới này.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUserForPassword(null)}
                className="text-xs h-8"
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmPasswordReset}
                disabled={resetPasswordMutation.isPending}
                className="text-xs h-8 bg-teal-600 hover:bg-teal-700 text-white font-bold"
              >
                {resetPasswordMutation.isPending ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
