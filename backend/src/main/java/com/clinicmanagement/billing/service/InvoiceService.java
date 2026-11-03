package com.clinicmanagement.billing.service;

import com.clinicmanagement.appointment.repository.AppointmentRepository;
import com.clinicmanagement.audit.entity.AuditLog;
import com.clinicmanagement.audit.repository.AuditLogRepository;
import com.clinicmanagement.billing.dto.*;
import com.clinicmanagement.billing.entity.Invoice;
import com.clinicmanagement.billing.entity.InvoiceItem;
import com.clinicmanagement.billing.entity.Payment;
import com.clinicmanagement.billing.repository.InvoiceItemRepository;
import com.clinicmanagement.billing.repository.InvoiceRepository;
import com.clinicmanagement.billing.repository.PaymentRepository;
import com.clinicmanagement.clinic.entity.ServiceItem;
import com.clinicmanagement.clinic.entity.ServicePrice;
import com.clinicmanagement.clinic.repository.ServiceItemRepository;
import com.clinicmanagement.clinic.repository.ServicePriceRepository;
import com.clinicmanagement.clinical.repository.EncounterRepository;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ErrorCode;
import com.clinicmanagement.common.response.PageResponse;
import com.clinicmanagement.patient.entity.Patient;
import com.clinicmanagement.patient.entity.PatientUserLink;
import com.clinicmanagement.patient.repository.PatientRepository;
import com.clinicmanagement.patient.repository.PatientUserLinkRepository;
import com.clinicmanagement.security.SecurityContextHelper;
import com.clinicmanagement.staff.entity.StaffProfile;
import com.clinicmanagement.staff.repository.StaffProfileRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final PaymentRepository paymentRepository;
    private final PatientRepository patientRepository;
    private final ServiceItemRepository serviceItemRepository;
    private final ServicePriceRepository servicePriceRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final PatientUserLinkRepository patientUserLinkRepository;
    private final AuditLogRepository auditLogRepository;
    private final AppointmentRepository appointmentRepository;
    private final EncounterRepository encounterRepository;

    public InvoiceService(
            InvoiceRepository invoiceRepository,
            InvoiceItemRepository invoiceItemRepository,
            PaymentRepository paymentRepository,
            PatientRepository patientRepository,
            ServiceItemRepository serviceItemRepository,
            ServicePriceRepository servicePriceRepository,
            StaffProfileRepository staffProfileRepository,
            PatientUserLinkRepository patientUserLinkRepository,
            AuditLogRepository auditLogRepository,
            AppointmentRepository appointmentRepository,
            EncounterRepository encounterRepository
    ) {
        this.invoiceRepository = invoiceRepository;
        this.invoiceItemRepository = invoiceItemRepository;
        this.paymentRepository = paymentRepository;
        this.patientRepository = patientRepository;
        this.serviceItemRepository = serviceItemRepository;
        this.servicePriceRepository = servicePriceRepository;
        this.staffProfileRepository = staffProfileRepository;
        this.patientUserLinkRepository = patientUserLinkRepository;
        this.auditLogRepository = auditLogRepository;
        this.appointmentRepository = appointmentRepository;
        this.encounterRepository = encounterRepository;
    }

    /**
     * Lấy danh sách dịch vụ y tế kèm đơn giá hiện hành để lập hóa đơn
     */
    public List<Map<String, Object>> getAvailableServicesWithPrices() {
        List<ServiceItem> services = serviceItemRepository.findByActiveTrue();
        List<Map<String, Object>> result = new ArrayList<>();

        for (ServiceItem s : services) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", s.getId());
            map.put("code", s.getCode());
            map.put("name", s.getName());
            map.put("serviceType", s.getServiceType());
            map.put("description", s.getDescription());

            Optional<ServicePrice> priceOpt = servicePriceRepository
                    .findFirstByServiceIdAndActiveTrueOrderByEffectiveFromDesc(s.getId());
            BigDecimal currentPrice = priceOpt.map(ServicePrice::getPrice).orElse(BigDecimal.ZERO);
            map.put("price", currentPrice);

            result.add(map);
        }

        return result;
    }

    /**
     * Tạo mới hóa đơn viện phí
     * Tổng tiền được tính toán trực tiếp từ cơ sở dữ liệu (Server-side calculation)
     */
    @Transactional
    public InvoiceResponse createInvoice(CreateInvoiceRequest request, String currentUserId) {
        Patient patient = patientRepository.findByIdAndDeletedAtIsNull(request.getPatientId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PATIENT_NOT_FOUND));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "Hóa đơn phải có ít nhất một dịch vụ");
        }

        Invoice invoice = new Invoice();
        invoice.setInvoiceCode(generateInvoiceCode());
        invoice.setPatientId(patient.getId());
        invoice.setEncounterId(request.getEncounterId() != null && !request.getEncounterId().isBlank() ? request.getEncounterId() : null);
        invoice.setAppointmentId(request.getAppointmentId() != null && !request.getAppointmentId().isBlank() ? request.getAppointmentId() : null);
        invoice.setStatus("UNPAID");
        invoice.setNotes(request.getNotes());
        invoice.setCreatedBy(currentUserId);

        BigDecimal calculatedTotal = BigDecimal.ZERO;

        for (CreateInvoiceItemRequest itemReq : request.getItems()) {
            ServiceItem service = serviceItemRepository.findById(itemReq.getServiceId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy dịch vụ y tế mã: " + itemReq.getServiceId()));

            Optional<ServicePrice> priceOpt = servicePriceRepository
                    .findFirstByServiceIdAndActiveTrueOrderByEffectiveFromDesc(service.getId());

            if (priceOpt.isEmpty()) {
                throw new BusinessException(ErrorCode.SERVICE_PRICE_NOT_FOUND, "Không tìm thấy giá cho dịch vụ: " + service.getName());
            }

            BigDecimal unitPrice = priceOpt.get().getPrice();
            int qty = Math.max(1, itemReq.getQuantity());
            BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(qty));

            InvoiceItem item = new InvoiceItem();
            item.setServiceId(service.getId());
            item.setServiceCode(service.getCode());
            item.setServiceName(service.getName());
            item.setUnitPrice(unitPrice);
            item.setQuantity(qty);
            item.setTotalPrice(itemTotal);

            invoice.addItem(item);
            calculatedTotal = calculatedTotal.add(itemTotal);
        }

        invoice.setTotalAmount(calculatedTotal);
        invoice.setPaidAmount(BigDecimal.ZERO);

        Invoice saved = invoiceRepository.save(invoice);

        recordAudit(currentUserId, "CREATE_INVOICE", "invoices", saved.getId(),
                "Tạo hóa đơn " + saved.getInvoiceCode() + " cho bệnh nhân " + patient.getFullName() +
                " với tổng tiền " + calculatedTotal + " VNĐ (" + saved.getItems().size() + " dịch vụ)");

        return mapToResponse(saved);
    }

    /**
     * Ghi nhận thanh toán hóa đơn (CASH / BANK_TRANSFER)
     * Đảm bảo tính toàn vẹn giao dịch (ACID) & Chống thanh toán trùng (Idempotent)
     */
    @Transactional
    public InvoiceResponse payInvoice(String id, PayInvoiceRequest request, String currentUserId) {
        Invoice invoice = invoiceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVOICE_NOT_FOUND));

        if ("PAID".equalsIgnoreCase(invoice.getStatus())) {
            throw new BusinessException(ErrorCode.INVOICE_ALREADY_PAID);
        }

        if ("CANCELLED".equalsIgnoreCase(invoice.getStatus())) {
            throw new BusinessException(ErrorCode.INVOICE_ALREADY_CANCELLED);
        }

        Optional<StaffProfile> cashierProfileOpt = staffProfileRepository.findByUserId(currentUserId);
        String cashierId = cashierProfileOpt.map(StaffProfile::getId).orElse(null);

        // 1. Cập nhật trạng thái hóa đơn
        invoice.setStatus("PAID");
        invoice.setPaidAmount(invoice.getTotalAmount());
        invoice.setPaymentMethod(request.getPaymentMethod());
        invoice.setPaidAt(LocalDateTime.now());
        invoice.setCashierId(cashierId);
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            invoice.setNotes(invoice.getNotes() != null ? invoice.getNotes() + "\n" + request.getNotes() : request.getNotes());
        }

        // 2. Tạo bản ghi thanh toán tài chính (Payments ledger)
        Payment payment = new Payment();
        payment.setPaymentCode(generatePaymentCode());
        payment.setInvoiceId(invoice.getId());
        payment.setAmount(invoice.getTotalAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setTransactionReference(request.getTransactionReference() != null && !request.getTransactionReference().isBlank() 
                ? request.getTransactionReference() 
                : ("CASH".equalsIgnoreCase(request.getPaymentMethod()) ? "TM-QUAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase() : null));
        payment.setCashierId(cashierId);
        payment.setStatus("SUCCESS");
        payment.setNotes(request.getNotes());

        paymentRepository.save(payment);
        Invoice saved = invoiceRepository.save(invoice);

        recordAudit(currentUserId, "PAY_INVOICE", "invoices", saved.getId(),
                "Xác nhận thanh toán hóa đơn " + saved.getInvoiceCode() + " số tiền " + saved.getPaidAmount() +
                " VNĐ qua hình thức " + saved.getPaymentMethod() + " (Mã GD: " + payment.getTransactionReference() + ")");

        return mapToResponse(saved);
    }

    /**
     * Hủy hóa đơn viện phí
     * Chỉ được phép hủy khi hóa đơn ở trạng thái UNPAID
     */
    @Transactional
    public InvoiceResponse cancelInvoice(String id, CancelInvoiceRequest request, String currentUserId) {
        Invoice invoice = invoiceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVOICE_NOT_FOUND));

        if ("PAID".equalsIgnoreCase(invoice.getStatus())) {
            throw new BusinessException(ErrorCode.INVOICE_CANNOT_BE_CANCELLED);
        }

        if ("CANCELLED".equalsIgnoreCase(invoice.getStatus())) {
            throw new BusinessException(ErrorCode.INVOICE_ALREADY_CANCELLED);
        }

        invoice.setStatus("CANCELLED");
        invoice.setCancellationReason(request.getCancellationReason());

        Invoice saved = invoiceRepository.save(invoice);

        recordAudit(currentUserId, "CANCEL_INVOICE", "invoices", saved.getId(),
                "Hủy hóa đơn " + saved.getInvoiceCode() + " với lý do: " + request.getCancellationReason());

        return mapToResponse(saved);
    }

    /**
     * Xem chi tiết hóa đơn (kèm danh sách dịch vụ chi tiết và lịch sử thanh toán)
     */
    public InvoiceResponse getInvoiceById(String id, String currentUserId, Set<String> roles) {
        Invoice invoice = invoiceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVOICE_NOT_FOUND));

        // Kiểm tra quyền sở hữu đối với Bệnh nhân
        if (roles.contains("ROLE_PATIENT")) {
            PatientUserLink link = patientUserLinkRepository.findByUserId(currentUserId).orElse(null);
            if (link == null || !invoice.getPatientId().equals(link.getPatientId())) {
                throw new BusinessException(ErrorCode.DATA_OWNERSHIP_VIOLATION, "Bệnh nhân chỉ được xem hóa đơn của chính mình");
            }
        }

        return mapToResponse(invoice);
    }

    /**
     * Tìm kiếm và phân trang danh sách hóa đơn theo ngày và trạng thái
     */
    public PageResponse<InvoiceResponse> searchInvoices(
            String patientId,
            String status,
            LocalDate fromDate,
            LocalDate toDate,
            String search,
            Pageable pageable,
            String currentUserId,
            Set<String> roles
    ) {
        if (roles.contains("ROLE_PATIENT")) {
            PatientUserLink link = patientUserLinkRepository.findByUserId(currentUserId).orElse(null);
            if (link != null) {
                patientId = link.getPatientId();
            }
        }

        Instant fromInstant = fromDate != null ? fromDate.atStartOfDay(ZoneId.systemDefault()).toInstant() : null;
        Instant toInstant = toDate != null ? toDate.atTime(LocalTime.MAX).atZone(ZoneId.systemDefault()).toInstant() : null;

        String filterStatus = (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) ? status.toUpperCase() : null;
        String filterSearch = (search != null && !search.isBlank()) ? search.trim() : null;

        Page<Invoice> page = invoiceRepository.searchInvoices(
                patientId,
                filterStatus,
                fromInstant,
                toInstant,
                filterSearch,
                pageable
        );

        return PageResponse.from(page.map(this::mapToResponse));
    }

    /**
     * Báo cáo tổng hợp doanh thu và số lượng hóa đơn
     */
    public BillingSummaryResponse getBillingSummary() {
        BigDecimal totalPaid = invoiceRepository.calculateTotalPaidRevenue();
        BigDecimal totalUnpaid = invoiceRepository.calculateTotalUnpaidAmount();
        long totalCount = invoiceRepository.countByDeletedAtIsNull();
        long paidCount = invoiceRepository.countByDeletedAtIsNullAndStatus("PAID");
        long unpaidCount = invoiceRepository.countByDeletedAtIsNullAndStatus("UNPAID");
        long cancelledCount = invoiceRepository.countByDeletedAtIsNullAndStatus("CANCELLED");

        return new BillingSummaryResponse(
                totalPaid,
                totalUnpaid,
                totalCount,
                paidCount,
                unpaidCount,
                cancelledCount
        );
    }

    private InvoiceResponse mapToResponse(Invoice invoice) {
        InvoiceResponse res = new InvoiceResponse();
        res.setId(invoice.getId());
        res.setInvoiceCode(invoice.getInvoiceCode());
        res.setPatientId(invoice.getPatientId());
        res.setEncounterId(invoice.getEncounterId());
        res.setAppointmentId(invoice.getAppointmentId());
        res.setTotalAmount(invoice.getTotalAmount());
        res.setPaidAmount(invoice.getPaidAmount());
        res.setStatus(invoice.getStatus());
        res.setPaymentMethod(invoice.getPaymentMethod());
        res.setPaidAt(invoice.getPaidAt());
        res.setCashierId(invoice.getCashierId());
        res.setNotes(invoice.getNotes());
        res.setCancellationReason(invoice.getCancellationReason());
        res.setCreatedBy(invoice.getCreatedBy());
        res.setCreatedAt(invoice.getCreatedAt());
        res.setUpdatedAt(invoice.getUpdatedAt());

        // Lấy thông tin Bệnh nhân
        patientRepository.findByIdAndDeletedAtIsNull(invoice.getPatientId()).ifPresent(p -> {
            res.setPatientCode(p.getPatientCode());
            res.setPatientName(p.getFullName());
            res.setPatientPhone(p.getPhone());
            res.setPatientGender(p.getGender());
            res.setPatientDateOfBirth(p.getDateOfBirth() != null ? p.getDateOfBirth().toString() : null);
            res.setPatientAddress(p.getAddress());
        });

        // Lấy thông tin Thu ngân
        if (invoice.getCashierId() != null) {
            staffProfileRepository.findById(invoice.getCashierId())
                    .ifPresent(cashier -> res.setCashierName(cashier.getFullName()));
        }

        // Lấy thông tin Lượt khám nếu có
        if (invoice.getEncounterId() != null) {
            encounterRepository.findById(invoice.getEncounterId())
                    .ifPresent(enc -> res.setEncounterCode(enc.getEncounterCode()));
        }

        // Lấy thông tin Lịch hẹn nếu có
        if (invoice.getAppointmentId() != null) {
            appointmentRepository.findById(invoice.getAppointmentId())
                    .ifPresent(apt -> res.setAppointmentCode(apt.getAppointmentCode()));
        }

        // Dòng chi tiết dịch vụ
        List<InvoiceItem> items = invoiceItemRepository.findByInvoiceId(invoice.getId());
        List<InvoiceItemResponse> itemResponses = items.stream().map(item -> {
            InvoiceItemResponse r = new InvoiceItemResponse();
            r.setId(item.getId());
            r.setServiceId(item.getServiceId());
            r.setServiceCode(item.getServiceCode());
            r.setServiceName(item.getServiceName());
            r.setUnitPrice(item.getUnitPrice());
            r.setQuantity(item.getQuantity());
            r.setTotalPrice(item.getTotalPrice());
            return r;
        }).toList();
        res.setItems(itemResponses);

        // Lịch sử thanh toán
        List<Payment> payments = paymentRepository.findByInvoiceIdOrderByCreatedAtDesc(invoice.getId());
        List<PaymentResponse> paymentResponses = payments.stream().map(pay -> {
            PaymentResponse pRes = new PaymentResponse();
            pRes.setId(pay.getId());
            pRes.setPaymentCode(pay.getPaymentCode());
            pRes.setAmount(pay.getAmount());
            pRes.setPaymentMethod(pay.getPaymentMethod());
            pRes.setTransactionReference(pay.getTransactionReference());
            pRes.setCashierId(pay.getCashierId());
            if (pay.getCashierId() != null) {
                staffProfileRepository.findById(pay.getCashierId())
                        .ifPresent(c -> pRes.setCashierName(c.getFullName()));
            }
            pRes.setStatus(pay.getStatus());
            pRes.setNotes(pay.getNotes());
            pRes.setCreatedAt(pay.getCreatedAt());
            return pRes;
        }).toList();
        res.setPayments(paymentResponses);

        return res;
    }

    private String generateInvoiceCode() {
        String datePrefix = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String randomSuffix = String.format("%04d", new Random().nextInt(10000));
        return "HD-" + datePrefix + "-" + randomSuffix;
    }

    private String generatePaymentCode() {
        String datePrefix = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String randomSuffix = String.format("%04d", new Random().nextInt(10000));
        return "TT-" + datePrefix + "-" + randomSuffix;
    }

    private void recordAudit(String userId, String action, String entityName, String entityId, String note) {
        try {
            AuditLog audit = new AuditLog();
            audit.setUserId(userId);
            audit.setUsername(SecurityContextHelper.getCurrentUsername().orElse("SYSTEM"));
            audit.setRoleName(SecurityContextHelper.getCurrentUser()
                    .map(u -> String.join(",", u.getRoles())).orElse("UNKNOWN"));
            audit.setAction(action);
            audit.setEntityName(entityName);
            audit.setEntityId(entityId);
            audit.setNewValues("{\"note\":\"" + note + "\"}");
            auditLogRepository.save(audit);
        } catch (Exception ignored) {
            // Không làm gián đoạn nghiệp vụ chính nếu ghi log audit gặp lỗi
        }
    }
}

