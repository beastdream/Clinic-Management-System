package com.clinicmanagement.clinical.service;

import com.clinicmanagement.audit.entity.AuditLog;
import com.clinicmanagement.audit.repository.AuditLogRepository;
import com.clinicmanagement.clinical.dto.DoctorPillarDtos.*;
import com.clinicmanagement.clinical.entity.Encounter;
import com.clinicmanagement.clinical.entity.Prescription;
import com.clinicmanagement.clinical.entity.PrescriptionItem;
import com.clinicmanagement.clinical.repository.EncounterRepository;
import com.clinicmanagement.clinical.repository.PrescriptionItemRepository;
import com.clinicmanagement.clinical.repository.PrescriptionRepository;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ErrorCode;
import com.clinicmanagement.inventory.entity.Medicine;
import com.clinicmanagement.inventory.repository.MedicineRepository;
import com.clinicmanagement.patient.entity.Patient;
import com.clinicmanagement.patient.repository.PatientRepository;
import com.clinicmanagement.staff.entity.StaffProfile;
import com.clinicmanagement.staff.repository.StaffProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ClinicalPrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionItemRepository prescriptionItemRepository;
    private final EncounterRepository encounterRepository;
    private final PatientRepository patientRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final MedicineRepository medicineRepository;
    private final AuditLogRepository auditLogRepository;

    public ClinicalPrescriptionService(
            PrescriptionRepository prescriptionRepository,
            PrescriptionItemRepository prescriptionItemRepository,
            EncounterRepository encounterRepository,
            PatientRepository patientRepository,
            StaffProfileRepository staffProfileRepository,
            MedicineRepository medicineRepository,
            AuditLogRepository auditLogRepository
    ) {
        this.prescriptionRepository = prescriptionRepository;
        this.prescriptionItemRepository = prescriptionItemRepository;
        this.encounterRepository = encounterRepository;
        this.patientRepository = patientRepository;
        this.staffProfileRepository = staffProfileRepository;
        this.medicineRepository = medicineRepository;
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Tạo mới hoặc cập nhật toàn bộ đơn thuốc cho ca khám
     */
    public PrescriptionDto createOrUpdatePrescription(CreatePrescriptionRequest request, String currentUsername) {
        Encounter encounter = encounterRepository.findByIdAndDeletedAtIsNull(request.encounterId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ENCOUNTER_NOT_FOUND));

        if ("COMPLETED".equalsIgnoreCase(encounter.getStatus())) {
            throw new BusinessException(ErrorCode.ENCOUNTER_ALREADY_COMPLETED, "Ca khám đã hoàn tất và khóa bệnh án, không thể sửa đơn thuốc");
        }

        StaffProfile doctor = staffProfileRepository.findById(encounter.getDoctorId())
                .orElseThrow(() -> new BusinessException(ErrorCode.DOCTOR_NOT_FOUND));

        Patient patient = patientRepository.findByIdAndDeletedAtIsNull(encounter.getPatientId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PATIENT_NOT_FOUND));

        Prescription prescription = prescriptionRepository.findByEncounterIdAndDeletedAtIsNull(encounter.getId())
                .orElseGet(() -> {
                    Prescription p = new Prescription();
                    p.setPrescriptionCode(generatePrescriptionCode());
                    p.setEncounterId(encounter.getId());
                    p.setPatientId(patient.getId());
                    p.setDoctorId(doctor.getId());
                    return p;
                });

        prescription.setDiagnosis(request.diagnosis() != null ? request.diagnosis() : encounter.getDiagnosis());
        prescription.setAdvice(request.advice());
        prescription.setStatus("ACTIVE");
        prescription.setCreatedBy(currentUsername);

        // Xóa các thuốc cũ trong đơn (nếu cập nhật)
        prescription.getItems().clear();

        // Thêm danh mục thuốc mới
        for (PrescriptionItemRequest itemReq : request.items()) {
            Medicine med = medicineRepository.findById(itemReq.medicineId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.MEDICINE_NOT_FOUND, "Không tìm thấy thuốc với ID: " + itemReq.medicineId()));

            PrescriptionItem item = new PrescriptionItem();
            item.setMedicineId(med.getId());
            item.setMedicineName(med.getName());
            item.setUnit(med.getUnit());
            item.setQuantity(itemReq.quantity());
            item.setMorningDose(itemReq.morningDose());
            item.setNoonDose(itemReq.noonDose());
            item.setEveningDose(itemReq.eveningDose());
            item.setNightDose(itemReq.nightDose());
            item.setUsageTiming(itemReq.usageTiming() != null ? itemReq.usageTiming() : "Sau ăn 30 phút");
            item.setUsageRoute(itemReq.usageRoute() != null ? itemReq.usageRoute() : "UONG");
            item.setDaysCount(itemReq.daysCount() != null ? itemReq.daysCount() : 5);
            item.setInstructions(itemReq.instructions());

            prescription.addItem(item);
        }

        Prescription saved = prescriptionRepository.save(prescription);

        // Ghi nhận Audit Log
        recordAudit(currentUsername, "CREATE_PRESCRIPTION", "prescriptions", saved.getId(),
                "Kê đơn thuốc " + saved.getPrescriptionCode() + " cho ca khám " + encounter.getEncounterCode());

        return mapToDto(saved, patient, doctor);
    }

    /**
     * Lấy đơn thuốc theo mã ca khám (Encounter ID)
     */
    @Transactional(readOnly = true)
    public Optional<PrescriptionDto> getPrescriptionByEncounterId(String encounterId) {
        return prescriptionRepository.findByEncounterIdAndDeletedAtIsNull(encounterId)
                .map(p -> {
                    Patient patient = patientRepository.findByIdAndDeletedAtIsNull(p.getPatientId()).orElse(null);
                    StaffProfile doctor = staffProfileRepository.findById(p.getDoctorId()).orElse(null);
                    return mapToDto(p, patient, doctor);
                });
    }

    /**
     * Lấy danh sách các đơn thuốc trước đây của bệnh nhân (phục vụ chức năng Tái Kê Đơn)
     */
    @Transactional(readOnly = true)
    public List<PrescriptionDto> getPastPrescriptionsByPatientId(String patientId) {
        Patient patient = patientRepository.findByIdAndDeletedAtIsNull(patientId).orElse(null);
        return prescriptionRepository.findByPatientIdAndDeletedAtIsNullOrderByCreatedAtDesc(patientId).stream()
                .map(p -> {
                    StaffProfile doctor = staffProfileRepository.findById(p.getDoctorId()).orElse(null);
                    return mapToDto(p, patient, doctor);
                })
                .toList();
    }

    /**
     * Kiểm tra an toàn dị ứng thuốc dựa trên hồ sơ bệnh nhân
     */
    @Transactional(readOnly = true)
    public AllergyAlertDto checkAllergySafety(String patientId, List<String> medicineIds) {
        Patient patient = patientRepository.findByIdAndDeletedAtIsNull(patientId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PATIENT_NOT_FOUND));

        String allergies = patient.getAllergies();
        if (allergies == null || allergies.trim().isBlank()) {
            return new AllergyAlertDto(false, "Bệnh nhân không có ghi nhận tiền sử dị ứng thuốc.", List.of());
        }

        String allergiesLower = allergies.toLowerCase();
        List<String> matchedAlerts = new ArrayList<>();

        for (String medId : medicineIds) {
            medicineRepository.findById(medId).ifPresent(med -> {
                String nameLower = med.getName().toLowerCase();
                String genericLower = med.getGenericName() != null ? med.getGenericName().toLowerCase() : "";

                if (allergiesLower.contains(nameLower) || (!genericLower.isEmpty() && allergiesLower.contains(genericLower))) {
                    matchedAlerts.add(med.getName() + " (Hoạt chất: " + med.getGenericName() + ")");
                }
            });
        }

        if (!matchedAlerts.isEmpty()) {
            return new AllergyAlertDto(
                    true,
                    "CẢNH BÁO NGUY HIỂM: Phát hiện thuốc kê trùng khớp với tiền sử dị ứng đã ghi nhận của bệnh nhân (" + allergies + ")!",
                    matchedAlerts
            );
        }

        return new AllergyAlertDto(false, "An toàn: Không phát hiện xung đột dị ứng.", List.of());
    }

    private PrescriptionDto mapToDto(Prescription p, Patient patient, StaffProfile doctor) {
        List<PrescriptionItemDto> items = p.getItems().stream()
                .map(item -> new PrescriptionItemDto(
                        item.getId(),
                        item.getMedicineId(),
                        item.getMedicineName(),
                        item.getUnit(),
                        item.getQuantity(),
                        item.getMorningDose(),
                        item.getNoonDose(),
                        item.getEveningDose(),
                        item.getNightDose(),
                        item.getUsageTiming(),
                        item.getUsageRoute(),
                        item.getDaysCount(),
                        item.getInstructions()
                ))
                .toList();

        return new PrescriptionDto(
                p.getId(),
                p.getPrescriptionCode(),
                p.getEncounterId(),
                p.getPatientId(),
                patient != null ? patient.getFullName() : "",
                patient != null ? patient.getPatientCode() : "",
                patient != null ? patient.getPhone() : "",
                patient != null ? patient.getGender() : "",
                patient != null && patient.getDateOfBirth() != null ? patient.getDateOfBirth().toString() : "",
                p.getDoctorId(),
                doctor != null ? doctor.getFullName() : "",
                doctor != null ? doctor.getStaffCode() : "",
                p.getDiagnosis(),
                p.getAdvice(),
                p.getStatus(),
                p.getCreatedAt(),
                items
        );
    }

    private String generatePrescriptionCode() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = prescriptionRepository.count() + 1;
        return String.format("DT-%s-%03d", dateStr, count);
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
