import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Shield, 
  Stethoscope, 
  UserCheck, 
  CreditCard, 
  User, 
  LogOut, 
  Check, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { authService } from '@/services/authService';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface DemoAccount {
  username: string;
  name: string;
  roleTitle: string;
  roleCode: string;
  password: string;
  icon: React.ElementType;
  color: string;
  badgeVariant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary';
  description: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    username: 'admin',
    name: 'Quản trị viên Hệ thống',
    roleTitle: 'QUẢN TRỊ VIÊN (ADMIN)',
    roleCode: 'ROLE_ADMIN',
    password: 'Admin@123456',
    icon: Shield,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    badgeVariant: 'secondary',
    description: 'Quản lý toàn bộ danh mục, tài khoản, nhân viên, bảng giá. Không xem nội dung bệnh án lâm sàng.',
  },
  {
    username: 'bs_minh',
    name: 'BS. CKI Nguyễn Văn Minh',
    roleTitle: 'BÁC SĨ KHÁM BỆNH (DOCTOR)',
    roleCode: 'ROLE_DOCTOR',
    password: 'Doctor@123456',
    icon: Stethoscope,
    color: 'text-teal-600 bg-teal-50 border-teal-200',
    badgeVariant: 'success',
    description: 'Tiếp nhận hàng chờ khám, ghi nhận sinh hiệu, chẩn đoán ICD-10, chỉ định xử trí và hoàn tất bệnh án.',
  },
  {
    username: 'tieptan_mai',
    name: 'Nguyễn Thị Mai',
    roleTitle: 'LỄ TÂN TIẾP ĐÓN (RECEPTIONIST)',
    roleCode: 'ROLE_RECEPTIONIST',
    password: 'Staff@123456',
    icon: UserCheck,
    color: 'text-sky-600 bg-sky-50 border-sky-200',
    badgeVariant: 'default',
    description: 'Đăng ký hồ sơ bệnh nhân mới, tạo lịch hẹn, check-in tiếp đón bệnh nhân vào hàng chờ phòng khám.',
  },
  {
    username: 'thungan_hang',
    name: 'Lê Thị Thu Hằng',
    roleTitle: 'THU NGÂN VIỆN PHÍ (CASHIER)',
    roleCode: 'ROLE_CASHIER',
    password: 'Staff@123456',
    icon: CreditCard,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    badgeVariant: 'success',
    description: 'Lập hóa đơn viện phí từ bảng giá dịch vụ, thu tiền mặt hoặc QR chuyển khoản, hủy hóa đơn và đối soát doanh thu.',
  },
  {
    username: 'benhnhan_an',
    name: 'Nguyễn Văn An',
    roleTitle: 'BỆNH NHÂN (PATIENT)',
    roleCode: 'ROLE_PATIENT',
    password: 'Patient@123456',
    icon: User,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    badgeVariant: 'warning',
    description: 'Xem hồ sơ sức khỏe cá nhân, xem lịch sử các lần khám và hóa đơn viện phí của chính mình.',
  },
];

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [loadingUsername, setLoadingUsername] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentUser = authService.getCurrentUser();

  if (!isOpen) return null;

  const handleSelectAccount = async (account: DemoAccount) => {
    setLoadingUsername(account.username);
    setErrorMessage(null);
    try {
      await authService.login({
        username: account.username,
        password: account.password,
      });
      // Invalidate all react-query cache to reload permissions & data
      queryClient.invalidateQueries();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setLoadingUsername(null);
    }
  };

  const handleLogout = () => {
    authService.logout();
    queryClient.invalidateQueries();
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-teal-700 to-teal-800 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-teal-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Chuyển Đổi Vai Trò Phân Quyền</h3>
              <p className="text-xs text-teal-100">Chọn tài khoản demo để kiểm thử RBAC thực tế</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-xl font-bold p-1 rounded hover:bg-white/10 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Current User Status Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Đang đăng nhập: </span>
            {currentUser ? (
              <strong className="text-slate-900 font-semibold">
                {currentUser.username} ({currentUser.roles?.join(', ')})
              </strong>
            ) : (
              <span className="text-slate-500 italic">Khách vãng lai (Chưa đăng nhập)</span>
            )}
          </div>
          {currentUser && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-medium"
            >
              <LogOut className="h-3.5 w-3.5" />
              Đăng xuất
            </button>
          )}
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Accounts List */}
        <div className="p-6 space-y-3">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon;
            const isCurrent = currentUser?.username === acc.username;
            const isLoading = loadingUsername === acc.username;

            return (
              <button
                key={acc.username}
                onClick={() => handleSelectAccount(acc)}
                disabled={isLoading}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 group hover:shadow-md ${
                  isCurrent
                    ? 'border-teal-500 bg-teal-50/50 ring-1 ring-teal-500/30'
                    : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2.5 rounded-lg border shrink-0 ${acc.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition-colors">
                      {acc.name}
                    </span>
                    <Badge variant={acc.badgeVariant} className="text-[10px] shrink-0 font-mono">
                      {acc.roleCode.replace('ROLE_', '')}
                    </Badge>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    Username: <span className="text-slate-800 font-semibold">{acc.username}</span> • Mật khẩu: {acc.password}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {acc.description}
                  </p>
                </div>
                {isCurrent && (
                  <div className="shrink-0 text-teal-600 p-1">
                    <Check className="h-5 w-5 font-bold" />
                  </div>
                )}
                {isLoading && (
                  <div className="shrink-0 text-xs text-teal-600 font-medium">
                    Đang đăng nhập...
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between text-[11px] text-slate-500">
          <span>Mỗi vai trò sẽ mở khóa đúng các trang & phân quyền tương ứng</span>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};

