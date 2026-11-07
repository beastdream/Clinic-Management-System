import React from 'react';
import { Printer, X } from 'lucide-react';
import { Prescription, ServiceOrder } from '@/types/clinical';
import { Button } from '@/components/ui/Button';

interface PrintPrescriptionModalProps {
  prescription: Prescription;
  onClose: () => void;
}

export const PrintPrescriptionModal: React.FC<PrintPrescriptionModalProps> = ({
  prescription,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Actions Toolbar (Hidden on print) */}
        <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="h-4 w-4 text-teal-400" />
            <span className="font-bold text-sm">Xem Trước Bản In: Đơn Thuốc Ngoại Trú</span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 text-xs">
              <Printer className="h-4 w-4" />
              In Đơn Thuốc (Ctrl + P)
            </Button>
            <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 overflow-y-auto flex-1 text-slate-900 font-sans text-xs space-y-5 print:p-0 print:text-black">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
            <div>
              <h1 className="text-base font-black uppercase text-teal-900 tracking-wider">
                HỆ THỐNG PHÒNG KHÁM ĐA KHOA MEDICARE
              </h1>
              <p className="text-[11px] text-slate-600">Địa chỉ: 123 Đường Y Học, Quận 1, TP. Hồ Chí Minh</p>
              <p className="text-[11px] text-slate-600">Hotline: 1900 8888 • Email: support@medicare.vn</p>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-sm text-slate-800">{prescription.prescriptionCode}</div>
              <p className="text-[10px] text-slate-500">Mã BN: {prescription.patientCode}</p>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
              ĐƠN THUỐC NGOẠI TRÚ
            </h2>
            <p className="text-[11px] text-slate-500 italic">
              (Ban hành theo Thông tư Bộ Y Tế)
            </p>
          </div>

          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-2 text-xs border border-slate-200 p-3 rounded-lg bg-slate-50/50">
            <div>
              <strong>Họ và tên người bệnh:</strong>{' '}
              <span className="font-bold uppercase text-slate-900">{prescription.patientName}</span>
            </div>
            <div>
              <strong>Giới tính:</strong>{' '}
              <span>{prescription.patientGender === 'MALE' ? 'Nam' : 'Nữ'}</span>
              {prescription.patientDateOfBirth && (
                <span className="ml-4">
                  <strong>Ngày sinh:</strong> {prescription.patientDateOfBirth}
                </span>
              )}
            </div>
            <div>
              <strong>Số điện thoại:</strong> <span>{prescription.patientPhone || '—'}</span>
            </div>
            <div className="col-span-2">
              <strong>Chẩn đoán bệnh:</strong>{' '}
              <span className="font-semibold text-slate-900">{prescription.diagnosis || '—'}</span>
            </div>
          </div>

          {/* Medicines List */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider mb-2 text-slate-800 border-b pb-1">
              Danh Mục Thuốc Kê Toa:
            </h3>
            <ol className="list-decimal list-inside space-y-3 pl-1">
              {prescription.items?.map((item, idx) => (
                <li key={idx} className="space-y-0.5 text-xs font-medium">
                  <div className="flex justify-between items-baseline inline">
                    <strong className="text-slate-900 text-sm">{item.medicineName}</strong>
                    <span className="font-bold font-mono text-slate-800 float-right">
                      Số lượng: {item.quantity} {item.unit}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 pl-4 font-normal">
                    <span>Liều dùng: </span>
                    <span className="font-semibold font-mono">
                      Sáng {item.morningDose || 0} • Trưa {item.noonDose || 0} • Chiều {item.eveningDose || 0} • Tối {item.nightDose || 0}
                    </span>
                    <span className="ml-2">({item.usageTiming || 'Sau ăn'})</span>
                  </div>
                  {item.instructions && (
                    <div className="text-[11px] text-slate-500 italic pl-4">
                      * {item.instructions}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* Advice */}
          {prescription.advice && (
            <div className="border-t pt-3">
              <strong className="text-xs">Lời dặn của Bác sĩ:</strong>
              <p className="text-xs text-slate-700 mt-1 italic pl-2 border-l-2 border-teal-500">
                {prescription.advice}
              </p>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 text-center pt-6 text-xs">
            <div>
              <p className="font-semibold">Người bệnh / Thân nhân</p>
              <p className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
            </div>
            <div>
              <p className="text-slate-500 italic">
                Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
              </p>
              <p className="font-bold uppercase mt-1">Bác Sĩ Điều Trị</p>
              <p className="text-[10px] text-slate-400 italic mb-12">(Ký, đóng dấu hoặc chữ ký số)</p>
              <p className="font-bold text-slate-900">{prescription.doctorName}</p>
              <p className="text-[10px] font-mono text-slate-500">{prescription.doctorCode}</p>
            </div>
          </div>

          <div className="border-t pt-3 text-[10px] text-slate-400 text-center italic">
            * Khám lại xin mang theo đơn thuốc này. Đơn thuốc có giá trị mua trong vòng 05 ngày kể từ ngày kê đơn.
          </div>
        </div>
      </div>
    </div>
  );
};

interface PrintServiceOrdersModalProps {
  orders: ServiceOrder[];
  patientName: string;
  patientCode: string;
  doctorName: string;
  onClose: () => void;
}

export const PrintServiceOrdersModal: React.FC<PrintServiceOrdersModalProps> = ({
  orders,
  patientName,
  patientCode,
  doctorName,
  onClose,
}) => {
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const totalAmount = orders.reduce((sum, ord) => sum + (ord.price || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Actions Toolbar */}
        <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="h-4 w-4 text-indigo-400" />
            <span className="font-bold text-sm">Xem Trước Bản In: Phiếu Chỉ Định Dịch Vụ Kỹ Thuật</span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => window.print()} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs">
              <Printer className="h-4 w-4" />
              In Phiếu Chỉ Định
            </Button>
            <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 overflow-y-auto flex-1 text-slate-900 font-sans text-xs space-y-5 print:p-0 print:text-black">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
            <div>
              <h1 className="text-base font-black uppercase text-indigo-900 tracking-wider">
                HỆ THỐNG PHÒNG KHÁM ĐA KHOA MEDICARE
              </h1>
              <p className="text-[11px] text-slate-600">Địa chỉ: 123 Đường Y Học, Quận 1, TP. Hồ Chí Minh</p>
              <p className="text-[11px] text-slate-600">Hotline: 1900 8888</p>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-sm text-slate-800">
                {orders[0]?.orderCode || 'CD-CLS'}
              </div>
              <p className="text-[10px] text-slate-500">Mã BN: {patientCode}</p>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
              PHIẾU CHỈ ĐỊNH DỊCH VỤ CẬN LÂM SÀNG
            </h2>
            <p className="text-[11px] text-slate-500 italic">
              (Xét nghiệm huyết học, sinh hóa & Chẩn đoán hình ảnh)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border border-slate-200 p-3 rounded-lg bg-slate-50/50">
            <div>
              <strong>Họ và tên người bệnh:</strong>{' '}
              <span className="font-bold uppercase text-slate-900">{patientName}</span>
            </div>
            <div>
              <strong>Mã bệnh nhân:</strong> <span className="font-mono">{patientCode}</span>
            </div>
            <div className="col-span-2">
              <strong>Bác sĩ chỉ định:</strong> <span>BS. {doctorName}</span>
            </div>
          </div>

          {/* Orders Table */}
          <div className="rounded-lg border border-slate-300 overflow-hidden">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-100 uppercase text-[11px] font-bold border-b border-slate-300">
                <tr>
                  <th className="px-3 py-2 text-center w-10">STT</th>
                  <th className="px-3 py-2">Tên Dịch Vụ Kỹ Thuật</th>
                  <th className="px-3 py-2">Ghi Chú Y Khoa</th>
                  <th className="px-3 py-2 text-right">Đơn Giá Niêm Yết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orders.map((ord, idx) => (
                  <tr key={ord.id}>
                    <td className="px-3 py-2 text-center font-bold">{idx + 1}</td>
                    <td className="px-3 py-2 font-semibold">{ord.serviceName}</td>
                    <td className="px-3 py-2 text-slate-600 italic">{ord.notes || '—'}</td>
                    <td className="px-3 py-2 text-right font-mono font-medium">{formatVND(ord.price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-300">
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-right uppercase">Tổng Chi Phí Dự Kiến:</td>
                  <td className="px-3 py-2 text-right font-mono text-sm text-indigo-900">
                    {formatVND(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 text-center pt-6 text-xs">
            <div>
              <p className="text-[11px] text-slate-500 italic">
                * Bệnh nhân thanh toán tại Quầy Thu Ngân trước khi vào phòng thực hiện kỹ thuật.
              </p>
            </div>
            <div>
              <p className="text-slate-500 italic">
                Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
              </p>
              <p className="font-bold uppercase mt-1">Bác Sĩ Chỉ Định</p>
              <p className="text-[10px] text-slate-400 italic mb-12">(Ký và ghi rõ họ tên)</p>
              <p className="font-bold text-slate-900">{doctorName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

