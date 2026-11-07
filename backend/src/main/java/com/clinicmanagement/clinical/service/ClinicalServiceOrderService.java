package com.clinicmanagement.clinical.service;

import com.clinicmanagement.audit.entity.AuditLog;
import com.clinicmanagement.audit.repository.AuditLogRepository;
import com.clinicmanagement.billing.entity.Invoice;
import com.clinicmanagement.billing.entity.InvoiceItem;
import com.clinicmanagement.billing.repository.InvoiceItemRepository;
import com.clinicmanagement.billing.repository.InvoiceRepository;
import com.clinicmanagement.clinic.entity.ServiceItem;
import com.clinicmanagement.clinic.entity.ServicePrice;
import com.clinicmanagement.clinic.repository.ServiceItemRepository;
import com.clinicmanagement.clinic.repository.ServicePriceRepository;
import com.clinicmanagement.clinical.dto.DoctorPillarDtos.CreateServiceOrderRequest;
import com.clinicmanagement.clinical.dto.DoctorPillarDtos.ServiceOrderDto;
import com.clinicmanagement.clinical.dto.DoctorPillarDtos.UpdateServiceOrderResultRequest;
import com.clinicmanagement.clinical.entity.Encounter;
import com.clinicmanagement.clinical.entity.ServiceOrder;
import com.clinicmanagement.clinical.repository.EncounterRepository;
import com.clinicmanagement.clinical.repository.ServiceOrderRepository;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ErrorCode;
import com.clinicmanagement.patient.entity.Patient;
import com.clinicmanagement.patient.repository.PatientRepository;
import com.clinicmanagement.staff.entity.StaffProfile;
import com.clinicmanagement.staff.repository.StaffProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Transactional
public class ClinicalServiceOrderService {

    private final ServiceOrderRepository serviceOrderRepository;
    private final EncounterRepository encounterRepository;
    private final PatientRepository patientRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final ServiceItemRepository serviceItemRepository;
    private final ServicePriceRepository servicePriceRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final AuditLogRepository auditLogRepository;

    public ClinicalServiceOrderService(
            ServiceOrderRepository serviceOrderRepository,
            EncounterRepository encounterRepository,
            PatientRepository patientRepository,
            StaffProfileRepository staffProfileRepository,
            ServiceItemRepository serviceItemRepository,
            ServicePriceRepository servicePriceRepository,
            InvoiceRepository invoiceRepository,
            InvoiceItemRepository invoiceItemRepository,
            AuditLogRepository auditLogRepository
    ) {
        this.serviceOrderRepository = serviceOrderRepository;
        this.encounterRepository = encounterRepository;
        this.patientRepository = patientRepository;
        this.staffProfileRepository = staffProfileRepository;
        this.serviceItemRepository = serviceItemRepository;
        this.servicePriceRepository = servicePriceRepository;
        this.invoiceRepository = invoiceRepository;
        this.invoiceItemRepository = invoiceItemRepository;
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Bác sĩ chỉ định dịch vụ kỹ thuật / cận lâm sàng (Lab test, Siêu âm, X-quang...)
     */
    public ServiceOrderDto createServiceOrder(CreateServiceOrderRequest request, String currentUsername) {
        Encounter encounter = encounterRepository.findByIdAndDeletedAtIsNull(request.encounterId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ENCOUNTER_NOT_FOUND));

        if ("COMPLETED".equalsIgnoreCase(encounter.getStatus())) {
            throw new BusinessException(ErrorCode.ENCOUNTER_ALREADY_COMPLETED, "Ca khám đã hoàn tất và khóa bệnh án, không thể chỉ định thêm");
        }

        Patient patient = patientRepository.findByIdAndDeletedAtIsNull(encounter.getPatientId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PATIENT_NOT_FOUND));

        StaffProfile doctor = staffProfileRepository.findById(encounter.getDoctorId())
                .orElseThrow(() -> new BusinessException(ErrorCode.DOCTOR_NOT_FOUND));

        ServiceItem serviceItem = serviceItemRepository.findById(request.serviceId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy dịch vụ: " + request.serviceId()));

        BigDecimal price = servicePriceRepository.findFirstByServiceIdAndActiveTrueOrderByEffectiveFromDesc(serviceItem.getId())
                .map(ServicePrice::getPrice)
                .orElse(BigDecimal.valueOf(150000));

        ServiceOrder order = new ServiceOrder();
        order.setOrderCode(generateOrderCode());
        order.setEncounterId(encounter.getId());
        order.setPatientId(patient.getId());
        order.setDoctorId(doctor.getId());
        order.setServiceId(serviceItem.getId());
        order.setServiceName(serviceItem.getName());
        order.setPrice(price);
        order.setPriority(request.priority() != null ? request.priority() : "ROUTINE");
        order.setNotes(request.notes());
        order.setStatus("PENDING");

        ServiceOrder saved = serviceOrderRepository.save(order);

        // Tự động đẩy vào hóa đơn viện phí nếu có hóa đơn UNPAID cho ca khám
        linkToBillingInvoice(encounter, patient, serviceItem, price);

        recordAudit(currentUsername, "CREATE_SERVICE_ORDER", "service_orders", saved.getId(),
                "Chỉ định dịch vụ " + serviceItem.getName() + " cho ca khám " + encounter.getEncounterCode());

        return mapToDto(saved, patient, doctor);
    }

    /**
     * Lấy danh sách các chỉ định kỹ thuật của một ca khám
     */
    @Transactional(readOnly = true)
    public List<ServiceOrderDto> getServiceOrdersByEncounterId(String encounterId) {
        return serviceOrderRepository.findByEncounterIdOrderByCreatedAtDesc(encounterId).stream()
                .map(order -> {
                    Patient patient = patientRepository.findByIdAndDeletedAtIsNull(order.getPatientId()).orElse(null);
                    StaffProfile doctor = staffProfileRepository.findById(order.getDoctorId()).orElse(null);
                    return mapToDto(order, patient, doctor);
                })
                .toList();
    }

    /**
     * Cập nhật kết quả chỉ định cận lâm sàng (do Bác sĩ hoặc Kỹ thuật viên nhập)
     */
    public ServiceOrderDto updateServiceOrderResult(String orderId, UpdateServiceOrderResultRequest request, String currentUsername) {
        ServiceOrder order = serviceOrderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy chỉ định dịch vụ"));

        if (request.results() != null) {
            order.setResults(request.results());
        }
        if (request.conclusion() != null) {
            order.setConclusion(request.conclusion());
        }
        if (request.status() != null) {
            order.setStatus(request.status());
        } else {
            order.setStatus("COMPLETED");
        }

        order.setPerformedAt(LocalDateTime.now());
        staffProfileRepository.findByUserId(currentUsername).ifPresent(staff -> order.setPerformedBy(staff.getId()));

        ServiceOrder saved = serviceOrderRepository.save(order);

        recordAudit(currentUsername, "UPDATE_SERVICE_ORDER_RESULT", "service_orders", saved.getId(),
                "Cập nhật kết quả chỉ định " + saved.getOrderCode() + ": " + saved.getConclusion());

        Patient patient = patientRepository.findByIdAndDeletedAtIsNull(saved.getPatientId()).orElse(null);
        StaffProfile doctor = staffProfileRepository.findById(saved.getDoctorId()).orElse(null);
        return mapToDto(saved, patient, doctor);
    }

    /**
     * Hủy chỉ định cận lâm sàng (khi chưa thực hiện)
     */
    public void deleteServiceOrder(String orderId, String currentUsername) {
        ServiceOrder order = serviceOrderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy chỉ định dịch vụ"));

        if ("COMPLETED".equalsIgnoreCase(order.getStatus())) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "Dịch vụ đã hoàn tất thực hiện và có kết quả, không thể hủy");
        }

        order.setStatus("CANCELLED");
        serviceOrderRepository.save(order);

        recordAudit(currentUsername, "CANCEL_SERVICE_ORDER", "service_orders", order.getId(),
                "Hủy chỉ định dịch vụ " + order.getOrderCode());
    }

    private void linkToBillingInvoice(Encounter encounter, Patient patient, ServiceItem serviceItem, BigDecimal price) {
        // Tìm hóa đơn chưa thanh toán của ca khám (hoặc của bệnh nhân)
        List<Invoice> unpaidInvoices = invoiceRepository.findByPatientIdAndDeletedAtIsNullOrderByCreatedAtDesc(patient.getId()).stream()
                .filter(inv -> "UNPAID".equalsIgnoreCase(inv.getStatus()))
                .toList();

        Invoice targetInvoice;
        if (!unpaidInvoices.isEmpty()) {
            targetInvoice = unpaidInvoices.get(0);
        } else {
            // Khởi tạo hóa đơn mới
            targetInvoice = new Invoice();
            targetInvoice.setInvoiceCode("HD-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + (invoiceRepository.count() + 1));
            targetInvoice.setPatientId(patient.getId());
            targetInvoice.setEncounterId(encounter.getId());
            targetInvoice.setStatus("UNPAID");
            targetInvoice.setTotalAmount(BigDecimal.ZERO);
            targetInvoice.setPaidAmount(BigDecimal.ZERO);
            targetInvoice = invoiceRepository.save(targetInvoice);
        }

        // Thêm chi tiết hóa đơn
        InvoiceItem item = new InvoiceItem();
        item.setInvoice(targetInvoice);
        item.setServiceId(serviceItem.getId());
        item.setServiceCode(serviceItem.getCode());
        item.setServiceName(serviceItem.getName());
        item.setQuantity(1);
        item.setUnitPrice(price);
        item.setTotalPrice(price);
        invoiceItemRepository.save(item);

        // Cập nhật lại tổng tiền hóa đơn
        BigDecimal newTotal = targetInvoice.getTotalAmount().add(price);
        targetInvoice.setTotalAmount(newTotal);
        invoiceRepository.save(targetInvoice);
    }

    private ServiceOrderDto mapToDto(ServiceOrder order, Patient patient, StaffProfile doctor) {
        return new ServiceOrderDto(
                order.getId(),
                order.getOrderCode(),
                order.getEncounterId(),
                order.getPatientId(),
                patient != null ? patient.getFullName() : "",
                patient != null ? patient.getPatientCode() : "",
                order.getDoctorId(),
                doctor != null ? doctor.getFullName() : "",
                order.getServiceId(),
                order.getServiceName(),
                order.getPrice(),
                order.getPriority(),
                order.getNotes(),
                order.getStatus(),
                order.getResults(),
                order.getConclusion(),
                order.getPerformedBy(),
                order.getPerformedAt(),
                order.getCreatedAt()
        );
    }

    private String generateOrderCode() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = serviceOrderRepository.count() + 1;
        return String.format("CD-%s-%03d", dateStr, count);
    }

    private void recordAudit(String username, String action, String entityName, String entityId, String detail) {
        AuditLog log = new AuditLog();
        log.setUsername(username != null ? username : "doctor");
        log.setRoleName("ROLE_DOCTOR");
        log.setAction(action);
        log.setEntityName(entityName);
        log.setEntityId(entityId);
        log.setNewValues(detail);
        auditLogRepository.save(log);
    }
}
