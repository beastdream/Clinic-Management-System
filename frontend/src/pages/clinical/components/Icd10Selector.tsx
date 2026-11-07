import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Tag, X, Check, BookOpen } from 'lucide-react';
import { clinicalService } from '@/services/clinicalService';
import { Icd10Disease } from '@/types/clinical';
import { Badge } from '@/components/ui/Badge';

interface Icd10SelectorProps {
  currentIcd10?: string;
  currentDiagnosis?: string;
  currentSecondary?: string;
  onSelectPrimary: (code: string, nameVi: string) => void;
  onChangeDiagnosis: (text: string) => void;
  onChangeSecondary: (text: string) => void;
  disabled?: boolean;
}

const COMMON_QUICK_TAGS = [
  { code: 'I10', label: 'I10 - Tăng huyết áp vô căn' },
  { code: 'E11', label: 'E11 - Đái tháo đường típ 2' },
  { code: 'J00', label: 'J00 - Cảm thường / Viêm mũi họng' },
  { code: 'J20', label: 'J20 - Viêm phế quản cấp' },
  { code: 'K29.7', label: 'K29.7 - Viêm dạ dày' },
  { code: 'K21.0', label: 'K21.0 - Trào ngược dạ dày' },
  { code: 'M54.5', label: 'M54.5 - Đau lưng dưới' },
  { code: 'H81.0', label: 'H81.0 - Rối loạn tiền đình' },
  { code: 'L20', label: 'L20 - Viêm da cơ địa' },
  { code: 'B34.9', label: 'B34.9 - Sốt siêu vi' },
];

export const Icd10Selector: React.FC<Icd10SelectorProps> = ({
  currentIcd10,
  currentDiagnosis,
  currentSecondary,
  onSelectPrimary,
  onChangeDiagnosis,
  onChangeSecondary,
  disabled = false,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);

  const { data: diseaseResponse, isLoading } = useQuery({
    queryKey: ['clinical', 'icd10', searchKeyword],
    queryFn: () => clinicalService.searchIcd10(searchKeyword),
    enabled: isOpenDropdown || searchKeyword.length > 0,
  });

  const diseases = diseaseResponse?.data || [];

  const handleChooseDisease = (d: Icd10Disease) => {
    onSelectPrimary(d.code, d.nameVi);
    setSearchKeyword('');
    setIsOpenDropdown(false);
  };

  return (
    <div className="space-y-4">
      {/* Search & Code Selection */}
      <div className="relative">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-teal-600" />
            Tra Cứu Mã Bệnh Quốc Tế ICD-10 (Bộ Y Tế)
          </span>
          {currentIcd10 && (
            <Badge className="bg-teal-100 text-teal-800 font-mono font-bold border-teal-200">
              Mã ICD: {currentIcd10}
            </Badge>
          )}
        </label>

        {!disabled && (
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Nhập mã bệnh (VD: I10, E11, J00...) hoặc tên bệnh tiếng Việt..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setIsOpenDropdown(true);
              }}
              onFocus={() => setIsOpenDropdown(true)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Autocomplete Dropdown */}
        {isOpenDropdown && !disabled && (
          <div className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-1 animate-in fade-in">
            <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 border-b pb-1">
              <span>Kết quả tìm kiếm ICD-10</span>
              <button
                type="button"
                onClick={() => setIsOpenDropdown(false)}
                className="hover:text-slate-700"
              >
                Đóng
              </button>
            </div>
            {isLoading ? (
              <div className="py-4 text-center text-xs text-slate-400">Đang tìm mã bệnh...</div>
            ) : diseases.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                Không tìm thấy mã bệnh phù hợp. Bác sĩ có thể nhập trực tiếp vào ô chẩn đoán bên dưới.
              </div>
            ) : (
              diseases.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleChooseDisease(d)}
                  className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between hover:bg-teal-50 transition-colors ${
                    currentIcd10 === d.code ? 'bg-teal-50 border border-teal-200' : ''
                  }`}
                >
                  <div>
                    <span className="font-mono font-bold text-teal-700 mr-2 bg-teal-100 px-1.5 py-0.5 rounded">
                      {d.code}
                    </span>
                    <span className="font-medium text-slate-800">{d.nameVi}</span>
                    {d.nameEn && <span className="text-slate-400 text-[11px] ml-2 italic">({d.nameEn})</span>}
                  </div>
                  {currentIcd10 === d.code && <Check className="h-4 w-4 text-teal-600 shrink-0" />}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Quick Common Tags */}
      {!disabled && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Tag className="h-3 w-3" />
            Mã hay gặp:
          </span>
          {COMMON_QUICK_TAGS.map((t) => (
            <button
              key={t.code}
              type="button"
              onClick={() => {
                const parts = t.label.split(' - ');
                onSelectPrimary(parts[0], parts[1]);
              }}
              className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                currentIcd10 === t.code
                  ? 'bg-teal-600 text-white border-teal-700 font-semibold'
                  : 'bg-slate-50 hover:bg-teal-50 text-slate-700 border-slate-200 hover:border-teal-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Primary Diagnosis & Secondary Diagnoses Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Chẩn Đoán Xác Định (Chính) *
          </label>
          <textarea
            rows={2}
            required
            disabled={disabled}
            placeholder="VD: I10 - Tăng huyết áp vô căn nguyên phát..."
            value={currentDiagnosis}
            onChange={(e) => onChangeDiagnosis(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100 disabled:text-slate-600 font-medium text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Chẩn Đoán Kèm Theo / Bệnh Lý Nền (Comorbidities)
          </label>
          <textarea
            rows={2}
            disabled={disabled}
            placeholder="VD: Rối loạn chuyển hóa lipid máu; Thoái hóa cột sống thắt lưng..."
            value={currentSecondary || ''}
            onChange={(e) => onChangeSecondary(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100 disabled:text-slate-600 text-slate-800"
          />
        </div>
      </div>
    </div>
  );
};

