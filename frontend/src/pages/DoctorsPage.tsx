import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Stethoscope, 
  Search, 
  Filter, 
  Phone, 
  Building2, 
  Award, 
  CheckCircle2, 
  RefreshCw,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { clinicService, DoctorItem, SpecialtyItem } from '@/services/clinicService';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const DoctorsPage: React.FC = () => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Query: Specialties for filter dropdown
  const { data: specialtiesResponse } = useQuery({
    queryKey: ['specialties'],
    queryFn: clinicService.getSpecialties,
  });

  // Query: Doctors with specialty and search filters
  const {
    data: doctorsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['doctors', selectedSpecialty, searchQuery],
    queryFn: () => clinicService.getDoctors(selectedSpecialty, searchQuery),
  });

  const specialtiesList: SpecialtyItem[] = specialtiesResponse?.data || [];
  const doctorsList: DoctorItem[] = doctorsResponse?.data || [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Đội Ngũ Bác Sĩ & Chuyên Gia Y Tế
            </h2>
            <Badge variant="info">Tổng: {doctorsList.length} bác sĩ</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Tra cứu thông tin bác sĩ, chuyên khoa lâm sàng, phòng khám phụ trách và lịch trực
          </p>
        </div>

        <div className="flex items-center gap-2">
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

          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Xem dạng thẻ"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'table' ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Xem dạng bảng"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo Tên bác sĩ, Mã nhân viên (NV-BS...), hoặc SĐT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-2 text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-slate-500 shrink-0" />
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full sm:w-64 rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none bg-white font-medium text-slate-700"
              >
                <option value="">-- Tất cả chuyên khoa --</option>
                {specialtiesList.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name} ({spec.code})
                  </option>
                ))}
              </select>
            </div>

            {(searchQuery || selectedSpecialty) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSpecialty('');
                }}
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Doctor Content View */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-teal-600 mb-2" />
          <span>Đang tải thông tin đội ngũ bác sĩ từ MySQL...</span>
        </div>
      ) : doctorsList.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-400">
            <Stethoscope className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <h3 className="font-semibold text-slate-700 text-sm">Không tìm thấy bác sĩ phù hợp</h3>
            <p className="text-xs text-slate-400 mt-1">
              Thử thay đổi từ khóa tìm kiếm hoặc chọn chuyên khoa khác.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {doctorsList.map((doc) => (
            <div
              key={doc.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:border-teal-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-base shadow-inner">
                      BS
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">{doc.fullName}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs font-semibold text-teal-700">{doc.staffCode}</span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                          {doc.gender === 'MALE' ? 'Nam' : 'Nữ'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Badge variant={doc.status === 'ACTIVE' ? 'success' : 'secondary'}>
                    {doc.status === 'ACTIVE' ? 'Đang công tác' : doc.status}
                  </Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-teal-600" />
                      Học vị & Chức danh:
                    </span>
                    <span className="font-semibold text-slate-800 text-right">
                      {doc.qualification || 'Bác sĩ điều trị'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5 text-indigo-600" />
                      Chuyên khoa:
                    </span>
                    <span className="font-bold text-indigo-800 text-right">
                      {doc.specialtyName || 'Nội khoa tổng quát'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-sky-600" />
                      Phòng làm việc:
                    </span>
                    <span className="font-semibold text-teal-700 text-right">
                      {doc.roomName || 'Chưa phân buồng'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      Số điện thoại:
                    </span>
                    <span className="font-mono text-slate-700 font-medium text-right">
                      {doc.phone}
                    </span>
                  </div>

                  {doc.licenseNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Chứng chỉ CCHN:</span>
                      <span className="font-mono text-slate-500 text-[11px] text-right">
                        {doc.licenseNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Sẵn sàng nhận lịch khám
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Mã Bác Sĩ</th>
                    <th className="py-3 px-4">Họ và Tên Bác Sĩ</th>
                    <th className="py-3 px-4">Giới tính</th>
                    <th className="py-3 px-4">Chuyên Khoa</th>
                    <th className="py-3 px-4">Trình Độ Chuyên Môn</th>
                    <th className="py-3 px-4">Phòng Làm Việc</th>
                    <th className="py-3 px-4">Số Điện Thoại</th>
                    <th className="py-3 px-4">Chứng Chỉ CCHN</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {doctorsList.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-teal-700 whitespace-nowrap">
                        {doc.staffCode}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {doc.fullName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="outline">
                          {doc.gender === 'MALE' ? 'Nam' : 'Nữ'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold text-indigo-800 whitespace-nowrap">
                        {doc.specialtyName || 'Đa khoa'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {doc.qualification || 'Bác sĩ'}
                      </td>
                      <td className="py-3 px-4 text-teal-700 font-medium whitespace-nowrap">
                        {doc.roomName || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {doc.phone}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {doc.licenseNumber || '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant={doc.status === 'ACTIVE' ? 'success' : 'secondary'}>
                          {doc.status === 'ACTIVE' ? 'Đang công tác' : doc.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
