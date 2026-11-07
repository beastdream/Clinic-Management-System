import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  Building2,
  Stethoscope,
  Receipt,
  Plus,
  Search,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Save
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import {
  Specialty,
  CreateSpecialtyPayload,
  UpdateSpecialtyPayload,
  RoomItem,
  CreateRoomPayload,
  UpdateRoomPayload,
  AdminServiceItem,
  CreateServiceItemPayload,
  UpdateServiceItemPayload,
} from '@/types/admin';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/LoadingSkeleton';

export const AdminMasterDataPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'specialties' | 'rooms' | 'services'>('specialties');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search filter states
  const [searchSpecialty, setSearchSpecialty] = useState('');
  const [searchRoom, setSearchRoom] = useState('');
  const [searchService, setSearchService] = useState('');

  // Modals state: Specialty
  const [isOpenSpecialtyModal, setIsOpenSpecialtyModal] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [specialtyForm, setSpecialtyForm] = useState<CreateSpecialtyPayload>({
    code: '',
    name: '',
    description: '',
    active: true,
  });

  // Modals state: Room
  const [isOpenRoomModal, setIsOpenRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null);
  const [roomForm, setRoomForm] = useState<CreateRoomPayload>({
    code: '',
    name: '',
    roomType: 'CLINICAL',
    specialtyId: '',
    active: true,
  });

  // Modals state: Service
  const [isOpenServiceModal, setIsOpenServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<AdminServiceItem | null>(null);
  const [serviceForm, setServiceForm] = useState<CreateServiceItemPayload>({
    code: '',
    name: '',
    serviceType: 'CONSULTATION',
    specialtyId: '',
    description: '',
    price: 150000,
    active: true,
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // ==================== QUERIES ====================
  const {
    data: specialtiesData,
    isLoading: isLoadingSpecialties,
    refetch: refetchSpecialties,
    isFetching: isFetchingSpecialties,
  } = useQuery({
    queryKey: ['admin', 'master', 'specialties'],
    queryFn: async () => {
      const res = await adminService.getAllSpecialties();
      return res.data;
    },
  });

  const {
    data: roomsData,
    isLoading: isLoadingRooms,
    refetch: refetchRooms,
    isFetching: isFetchingRooms,
  } = useQuery({
    queryKey: ['admin', 'master', 'rooms'],
    queryFn: async () => {
      const res = await adminService.getAllRooms();
      return res.data;
    },
  });

  const {
    data: servicesData,
    isLoading: isLoadingServices,
    refetch: refetchServices,
    isFetching: isFetchingServices,
  } = useQuery({
    queryKey: ['admin', 'master', 'services'],
    queryFn: async () => {
      const res = await adminService.getAllServices();
      return res.data;
    },
  });

  // ==================== MUTATIONS: SPECIALTY ====================
  const createSpecialtyMutation = useMutation({
    mutationFn: (payload: CreateSpecialtyPayload) => adminService.createSpecialty(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'master', 'specialties'] });
      setIsOpenSpecialtyModal(false);
      showNotification('success', 'Thêm mới chuyên khoa thành công!');
    },
    onError: (err: any) => {
      showNotification('error', err?.message || 'Không thể tạo chuyên khoa. Mã có thể đã tồn tại.');
    },
  });

  const updateSpecialtyMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSpecialtyPayload }) =>
      adminService.updateSpecialty(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'master', 'specialties'] });
      setIsOpenSpecialtyModal(false);
      showNotification('success', 'Cập nhật chuyên khoa thành công!');
    },
    onError: (err: any) => {
      showNotification('error', err?.message || 'Không thể cập nhật chuyên khoa.');
    },
  });

  const toggleSpecialtyMutation = useMutation({
    mutationFn: (id: string) => adminService.toggleSpecialty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'master', 'specialties'] });
      showNotification('success', 'Đổi trạng thái chuyên khoa thành công!');
    },
    onError: (err: any) => {
      showNotification('error', err?.message || 'Lỗi khi đổi trạng thái chuyên khoa.');
    },
  });

  // ==================== MUTATIONS: ROOM ====================
  const createRoomMutation = useMutation({
    mutationFn: (payload: CreateRoomPayload) => adminService.createRoom(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'master', 'rooms'] });
      setIsOpenRoomModal(false);
      showNotification('success', 'Thêm mới phòng chức năng thành công!');
    },
    onError: (err: any) => {
      showNotification('error', err?.message || 'Không thể tạo phòng khám. Mã phòng có thể đã tồn tại.');
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRoomPayload }) =>
      adminService.updateRoom(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'master', 'rooms'] });
      setIsOpenRoomModal(false);
      showNotification('success', 'Cập nhật phòng thành công!');
    },
    onError: (err: any) => {
      showNotification('error', err?.message || 'Không thể cập nhật phòng.');
    },
  });

  const toggleRoomMutation = useMutation({
    mutationFn: (id: string) => adminService.toggleRoom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'master', 'rooms'] });
      showNotification('success', 'Đổi trạng thái phòng thành công!');
    },
    onError: (err: any) => {
      showNotification('error', err?.message || 'Lỗi khi đổi trạng thái phòng.');
    },
  });

  // ==================== MUTATIONS: SERVICE ====================
  const createServiceMutation = useMutation({
    mutationFn: (payload: CreateServiceItemPayload) => adminService.createService(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'master', 'services'] });
      setIsOpenServiceModal(false);
      showNotification('success', 'Thêm dịch vụ & bảng giá thành công!');
    },
    onError: (err: any) => {
      showNotification('error', err?.message || 'Không thể tạo dịch vụ.');
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateServiceItemPayload }) =>
      adminService.updateService(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'master', 'services'] });
      setIsOpenServiceModal(false);
      showNotification('success', 'Cập nhật dịch vụ & bảng giá thành công!');
    },
    onError: (err: any) => {
      showNotification('error', err?.message || 'Không thể cập nhật dịch vụ.');
    },
  });

  // Filtered lists
  const filteredSpecialties = (specialtiesData || []).filter(
    (s) =>
      s.name.toLowerCase().includes(searchSpecialty.toLowerCase()) ||
      s.code.toLowerCase().includes(searchSpecialty.toLowerCase())
  );

  const filteredRooms = (roomsData || []).filter(
    (r) =>
      r.name.toLowerCase().includes(searchRoom.toLowerCase()) ||
      r.code.toLowerCase().includes(searchRoom.toLowerCase()) ||
      (r.specialtyName && r.specialtyName.toLowerCase().includes(searchRoom.toLowerCase()))
  );

  const filteredServices = (servicesData || []).filter(
    (s) =>
      s.name.toLowerCase().includes(searchService.toLowerCase()) ||
      s.code.toLowerCase().includes(searchService.toLowerCase()) ||
      (s.specialtyName && s.specialtyName.toLowerCase().includes(searchService.toLowerCase()))
  );

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case 'CLINICAL':
        return 'Phòng Khám Lâm Sàng';
      case 'LABORATORY':
        return 'Phòng Xét Nghiệm';
      case 'RADIOLOGY':
        return 'Chẩn Đoán Hình Ảnh';
      case 'PHARMACY':
        return 'Kho & Cấp Phát Dược';
      case 'CASHIER':
        return 'Quầy Thu Ngân';
      case 'RECEPTION':
        return 'Bàn Tiếp Đón';
      default:
        return type;
    }
  };

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'CONSULTATION':
        return 'Khám Lâm Sàng';
      case 'LAB_TEST':
        return 'Xét Nghiệm';
      case 'IMAGING':
        return 'CĐHA / X-Quang / Siêu Âm';
      case 'PROCEDURE':
        return 'Thủ Thuật / Tiễu Phẫu';
      default:
        return type;
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
                <Layers className="w-4 h-4" />
                <span>KHU VỰC QUẢN TRỊ VIÊN (ADMIN)</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Quản Lý Danh Mục Dùng Chung</h1>
              <p className="text-teal-100 text-sm mt-1 max-w-2xl">
                Cấu hình nền tảng các Chuyên khoa y tế, Phòng ban chức năng và Bảng giá Dịch vụ Kỹ thuật thống nhất toàn hệ thống.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-2"
                onClick={() => {
                  refetchSpecialties();
                  refetchRooms();
                  refetchServices();
                }}
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    isFetchingSpecialties || isFetchingRooms || isFetchingServices ? 'animate-spin' : ''
                  }`}
                />
                Làm mới
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 space-x-2 bg-white px-4 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab('specialties')}
          className={`flex items-center space-x-2 py-4 px-4 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'specialties'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>1. Chuyên Khoa Y Tế</span>
          <span className="bg-teal-50 text-teal-700 text-xs px-2 py-0.5 rounded-full font-bold">
            {specialtiesData?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex items-center space-x-2 py-4 px-4 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'rooms'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>2. Phòng Ban & Phòng Khám</span>
          <span className="bg-teal-50 text-teal-700 text-xs px-2 py-0.5 rounded-full font-bold">
            {roomsData?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center space-x-2 py-4 px-4 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'services'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>3. Bảng Giá Dịch Vụ Kỹ Thuật</span>
          <span className="bg-teal-50 text-teal-700 text-xs px-2 py-0.5 rounded-full font-bold">
            {servicesData?.length || 0}
          </span>
        </button>
      </div>

      {/* ==================== TAB 1: CHUYÊN KHOA ==================== */}
      {activeTab === 'specialties' && (
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
            <div>
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                Danh Mục Chuyên Khoa Lâm Sàng
              </CardTitle>
              <CardDescription>
                Các chuyên khoa điều trị hiện hành phục vụ phân công bác sĩ và đặt lịch hẹn
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm chuyên khoa..."
                  value={searchSpecialty}
                  onChange={(e) => setSearchSpecialty(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <Button
                onClick={() => {
                  setEditingSpecialty(null);
                  setSpecialtyForm({ code: '', name: '', description: '', active: true });
                  setIsOpenSpecialtyModal(true);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                Thêm Chuyên Khoa
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoadingSpecialties ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredSpecialties.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium">Không tìm thấy chuyên khoa nào</p>
                <p className="text-xs text-gray-400 mt-1">Vui lòng thay đổi từ khóa hoặc bấm thêm chuyên khoa mới</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-600">
                    <tr>
                      <th className="px-4 py-3">Mã Chuyên Khoa</th>
                      <th className="px-4 py-3">Tên Chuyên Khoa</th>
                      <th className="px-4 py-3">Mô Tả / Giới Thiệu</th>
                      <th className="px-4 py-3 text-center">Trạng Thái</th>
                      <th className="px-4 py-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredSpecialties.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-teal-700">{item.code}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{item.description || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          {item.active ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                              Đang hoạt động
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                              Tạm ngừng
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingSpecialty(item);
                              setSpecialtyForm({
                                code: item.code,
                                name: item.name,
                                description: item.description || '',
                                active: item.active,
                              });
                              setIsOpenSpecialtyModal(true);
                            }}
                            className="text-teal-600 hover:text-teal-800 hover:bg-teal-50"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Sửa
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSpecialtyMutation.mutate(item.id)}
                            className={item.active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}
                          >
                            {item.active ? 'Tạm tắt' : 'Kích hoạt'}
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
      )}

      {/* ==================== TAB 2: PHÒNG KHÁM ==================== */}
      {activeTab === 'rooms' && (
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
            <div>
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                Danh Sách Phòng Khám & Phòng Chức Năng
              </CardTitle>
              <CardDescription>
                Phòng khám lâm sàng, phòng xét nghiệm, kho dược và quầy thu ngân thực tế tại cơ sở
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm phòng theo tên, mã..."
                  value={searchRoom}
                  onChange={(e) => setSearchRoom(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <Button
                onClick={() => {
                  setEditingRoom(null);
                  setRoomForm({
                    code: '',
                    name: '',
                    roomType: 'CLINICAL',
                    specialtyId: specialtiesData?.[0]?.id || '',
                    active: true,
                  });
                  setIsOpenRoomModal(true);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                Thêm Phòng Mới
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoadingRooms ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium">Không tìm thấy phòng ban nào</p>
                <p className="text-xs text-gray-400 mt-1">Vui lòng thay đổi từ khóa hoặc thêm phòng chức năng mới</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-600">
                    <tr>
                      <th className="px-4 py-3">Mã Phòng</th>
                      <th className="px-4 py-3">Tên Phòng</th>
                      <th className="px-4 py-3">Loại Phòng</th>
                      <th className="px-4 py-3">Chuyên Khoa Trực Thuộc</th>
                      <th className="px-4 py-3 text-center">Trạng Thái</th>
                      <th className="px-4 py-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredRooms.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-teal-700">{item.code}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                            {getRoomTypeLabel(item.roomType)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {item.specialtyName ? (
                            <span className="inline-flex items-center text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-1 rounded">
                              {item.specialtyName}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Dùng chung</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.active ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                              Đang hoạt động
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                              Tạm ngừng
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingRoom(item);
                              setRoomForm({
                                code: item.code,
                                name: item.name,
                                roomType: item.roomType,
                                specialtyId: item.specialtyId || '',
                                active: item.active,
                              });
                              setIsOpenRoomModal(true);
                            }}
                            className="text-teal-600 hover:text-teal-800 hover:bg-teal-50"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Sửa
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRoomMutation.mutate(item.id)}
                            className={item.active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}
                          >
                            {item.active ? 'Tạm tắt' : 'Kích hoạt'}
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
      )}

      {/* ==================== TAB 3: DỊCH VỤ & BẢNG GIÁ ==================== */}
      {activeTab === 'services' && (
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
            <div>
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-600" />
                Bảng Giá Dịch Vụ Khám & Kỹ Thuật Y Tế
              </CardTitle>
              <CardDescription>
                Bảng giá niêm yết áp dụng khi kê chỉ định lâm sàng và xuất hóa đơn thu ngân
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm dịch vụ theo tên, mã..."
                  value={searchService}
                  onChange={(e) => setSearchService(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <Button
                onClick={() => {
                  setEditingService(null);
                  setServiceForm({
                    code: '',
                    name: '',
                    serviceType: 'CONSULTATION',
                    specialtyId: specialtiesData?.[0]?.id || '',
                    description: '',
                    price: 150000,
                    active: true,
                  });
                  setIsOpenServiceModal(true);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                Thêm Dịch Vụ Mới
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoadingServices ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium">Không tìm thấy dịch vụ nào</p>
                <p className="text-xs text-gray-400 mt-1">Vui lòng thay đổi từ khóa hoặc thêm dịch vụ mới</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-600">
                    <tr>
                      <th className="px-4 py-3">Mã Dịch Vụ</th>
                      <th className="px-4 py-3">Tên Dịch Vụ Kỹ Thuật</th>
                      <th className="px-4 py-3">Phân Loại</th>
                      <th className="px-4 py-3">Chuyên Khoa</th>
                      <th className="px-4 py-3 text-right">Đơn Giá Niêm Yết</th>
                      <th className="px-4 py-3 text-center">Trạng Thái</th>
                      <th className="px-4 py-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredServices.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-teal-700">{item.code}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <div>{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-gray-400 line-clamp-1">{item.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                            {getServiceTypeLabel(item.serviceType)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {item.specialtyName || <span className="text-gray-400 italic">Dùng chung</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                          {formatVND(item.currentPrice)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.active ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                              Áp dụng
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                              Ngừng áp dụng
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingService(item);
                              setServiceForm({
                                code: item.code,
                                name: item.name,
                                serviceType: item.serviceType,
                                specialtyId: item.specialtyId || '',
                                description: item.description || '',
                                price: item.currentPrice,
                                active: item.active,
                              });
                              setIsOpenServiceModal(true);
                            }}
                            className="text-teal-600 hover:text-teal-800 hover:bg-teal-50"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Sửa / Cập nhật giá
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
      )}

      {/* ==================== MODAL: SPECIALTY ==================== */}
      {isOpenSpecialtyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {editingSpecialty ? 'Cập Nhật Chuyên Khoa' : 'Thêm Mới Chuyên Khoa'}
              </h3>
              <button
                onClick={() => setIsOpenSpecialtyModal(false)}
                className="text-teal-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingSpecialty) {
                  updateSpecialtyMutation.mutate({
                    id: editingSpecialty.id,
                    payload: {
                      name: specialtyForm.name,
                      description: specialtyForm.description,
                      active: specialtyForm.active,
                    },
                  });
                } else {
                  createSpecialtyMutation.mutate(specialtyForm);
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mã Chuyên Khoa *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingSpecialty}
                  placeholder="VD: CK-TIM-MACH"
                  value={specialtyForm.code}
                  onChange={(e) => setSpecialtyForm({ ...specialtyForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg text-sm uppercase font-mono disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên Chuyên Khoa *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tim Mạch Can Thiệp"
                  value={specialtyForm.name}
                  onChange={(e) => setSpecialtyForm({ ...specialtyForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mô Tả Chuyên Khoa</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả phạm vi khám và chẩn đoán..."
                  value={specialtyForm.description || ''}
                  onChange={(e) => setSpecialtyForm({ ...specialtyForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="specialty-active"
                  checked={specialtyForm.active}
                  onChange={(e) => setSpecialtyForm({ ...specialtyForm, active: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                />
                <label htmlFor="specialty-active" className="text-sm font-medium text-gray-700">
                  Kích hoạt hoạt động ngay sau khi lưu
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpenSpecialtyModal(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={createSpecialtyMutation.isPending || updateSpecialtyMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingSpecialty ? 'Lưu Thay Đổi' : 'Tạo Chuyên Khoa'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ROOM ==================== */}
      {isOpenRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {editingRoom ? 'Cập Nhật Phòng Ban' : 'Thêm Phòng Chức Năng Mới'}
              </h3>
              <button
                onClick={() => setIsOpenRoomModal(false)}
                className="text-teal-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingRoom) {
                  updateRoomMutation.mutate({
                    id: editingRoom.id,
                    payload: {
                      name: roomForm.name,
                      roomType: roomForm.roomType,
                      specialtyId: roomForm.specialtyId || undefined,
                      active: roomForm.active,
                    },
                  });
                } else {
                  createRoomMutation.mutate(roomForm);
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mã Phòng *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingRoom}
                  placeholder="VD: P105"
                  value={roomForm.code}
                  onChange={(e) => setRoomForm({ ...roomForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg text-sm uppercase font-mono disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên Phòng *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phòng Khám Nhi Đồng 02"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Loại Phòng Chức Năng *</label>
                <select
                  value={roomForm.roomType}
                  onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="CLINICAL">Phòng Khám Lâm Sàng</option>
                  <option value="LABORATORY">Phòng Xét Nghiệm</option>
                  <option value="RADIOLOGY">Phòng Chẩn Đoán Hình Ảnh</option>
                  <option value="PHARMACY">Kho & Cấp Phát Thuốc</option>
                  <option value="CASHIER">Quầy Thu Ngân</option>
                  <option value="RECEPTION">Bàn Tiếp Đón Bệnh Nhân</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Chuyên Khoa Trực Thuộc (nếu có)</label>
                <select
                  value={roomForm.specialtyId || ''}
                  onChange={(e) => setRoomForm({ ...roomForm, specialtyId: e.target.value || undefined })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="">-- Dùng chung / Không trực thuộc --</option>
                  {specialtiesData?.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name} ({spec.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="room-active"
                  checked={roomForm.active}
                  onChange={(e) => setRoomForm({ ...roomForm, active: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                />
                <label htmlFor="room-active" className="text-sm font-medium text-gray-700">
                  Phòng đang sẵn sàng hoạt động
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpenRoomModal(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={createRoomMutation.isPending || updateRoomMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingRoom ? 'Lưu Thay Đổi' : 'Tạo Phòng'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: SERVICE ==================== */}
      {isOpenServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {editingService ? 'Cập Nhật Dịch Vụ & Bảng Giá' : 'Thêm Dịch Vụ Mới'}
              </h3>
              <button
                onClick={() => setIsOpenServiceModal(false)}
                className="text-teal-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingService) {
                  updateServiceMutation.mutate({
                    id: editingService.id,
                    payload: {
                      name: serviceForm.name,
                      serviceType: serviceForm.serviceType,
                      specialtyId: serviceForm.specialtyId || undefined,
                      description: serviceForm.description,
                      price: serviceForm.price,
                      active: serviceForm.active,
                    },
                  });
                } else {
                  createServiceMutation.mutate(serviceForm);
                }
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Mã Dịch Vụ *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingService}
                    placeholder="VD: DV-XN-001"
                    value={serviceForm.code}
                    onChange={(e) => setServiceForm({ ...serviceForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg text-sm uppercase font-mono disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Loại Dịch Vụ *</label>
                  <select
                    value={serviceForm.serviceType}
                    onChange={(e) => setServiceForm({ ...serviceForm, serviceType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="CONSULTATION">Khám Lâm Sàng</option>
                    <option value="LAB_TEST">Xét Nghiệm Sinh Hóa / Huyết Học</option>
                    <option value="IMAGING">CĐHA (X-Quang, Siêu Âm)</option>
                    <option value="PROCEDURE">Thủ Thuật / Phẫu Thuật</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên Dịch Vụ Kỹ Thuật *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Siêu âm ổ bụng tổng quát 4D"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Chuyên Khoa Liên Quan</label>
                  <select
                    value={serviceForm.specialtyId || ''}
                    onChange={(e) => setServiceForm({ ...serviceForm, specialtyId: e.target.value || undefined })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="">-- Dùng chung toàn viện --</option>
                    {specialtiesData?.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Đơn Giá Niêm Yết (VNĐ) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1000}
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-semibold text-emerald-700 focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-xs text-gray-500 mt-0.5 block">
                    {formatVND(serviceForm.price || 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mô Tả Kỹ Thuật / Ghi Chú</label>
                <textarea
                  rows={2}
                  placeholder="Quy chuẩn thực hiện hoặc chỉ định..."
                  value={serviceForm.description || ''}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="service-active"
                  checked={serviceForm.active}
                  onChange={(e) => setServiceForm({ ...serviceForm, active: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                />
                <label htmlFor="service-active" className="text-sm font-medium text-gray-700">
                  Dịch vụ đang sẵn sàng chỉ định cho bệnh nhân
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpenServiceModal(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingService ? 'Cập Nhật Giá & Dịch Vụ' : 'Tạo Dịch Vụ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
