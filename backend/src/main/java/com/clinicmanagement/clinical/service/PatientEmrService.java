package com.clinicmanagement.clinical.service;

import com.clinicmanagement.clinic.repository.SpecialtyRepository;
import com.clinicmanagement.clinical.dto.DoctorPillarDtos.*;
import com.clinicmanagement.clinical.entity.Encounter;
import com.clinicmanagement.clinical.entity.Prescription;
import com.clinicmanagement.clinical.entity.ServiceOrder;
import com.clinicmanagement.clinical.repository.EncounterRepository;
import com.clinicmanagement.clinical.repository.PrescriptionRepository;
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
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class PatientEmrService {

    private final PatientRepository patientRepository;
    private final EncounterRepository encounterRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final ServiceOrderRepository serviceOrderRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final SpecialtyRepository specialtyRepository;
    private final ClinicalPrescriptionService prescriptionService;

    public PatientEmrService(
            PatientRepository patientRepository,
            EncounterRepository encounterRepository,
            PrescriptionRepository prescriptionRepository,
            ServiceOrderRepository serviceOrderRepository,
            StaffProfileRepository staffProfileRepository,
            SpecialtyRepository specialtyRepository,
            ClinicalPrescriptionService prescriptionService
    ) {
        this.patientRepository = patientRepository;
        this.encounterRepository = encounterRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.serviceOrderRepository = serviceOrderRepository;
        this.staffProfileRepository = staffProfileRepository;
        this.specialtyRepository = specialtyRepository;
        this.prescriptionService = prescriptionService;
    }

    /**
     * Lấy toàn bộ hồ sơ bệnh án điện tử dọc và dữ liệu vẽ biểu đồ diễn tiến sinh hiệu
     */
    public PatientEmrTimelineDto getPatientEmrTimeline(String patientId) {
        Patient patient = patientRepository.findByIdAndDeletedAtIsNull(patientId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PATIENT_NOT_FOUND));

        List<Encounter> encountersDesc = encounterRepository.findByPatientIdAndDeletedAtIsNullOrderByEncounterDateTimeDesc(patientId);

        // Chuẩn bị dữ liệu biểu đồ sinh hiệu (theo thứ tự thời gian từ cũ tới mới)
        List<Encounter> encountersAsc = new ArrayList<>(encountersDesc);
        Collections.reverse(encountersAsc);

        List<VitalTrendPointDto> vitalTrends = new ArrayList<>();
        for (Encounter e : encountersAsc) {
            Integer systolic = null;
            Integer diastolic = null;
            if (e.getBloodPressure() != null && e.getBloodPressure().contains("/")) {
                try {
                    String[] parts = e.getBloodPressure().split("/");
                    systolic = Integer.parseInt(parts[0].trim());
                    diastolic = Integer.parseInt(parts[1].trim());
                } catch (Exception ignored) {}
            }

            BigDecimal bmi = null;
            if (e.getWeight() != null && e.getHeight() != null && e.getHeight().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal heightInMeters = e.getHeight().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
                BigDecimal heightSquared = heightInMeters.multiply(heightInMeters);
                if (heightSquared.compareTo(BigDecimal.ZERO) > 0) {
                    bmi = e.getWeight().divide(heightSquared, 1, RoundingMode.HALF_UP);
                }
            }

            vitalTrends.add(new VitalTrendPointDto(
                    e.getId(),
                    e.getEncounterCode(),
                    e.getEncounterDateTime(),
                    e.getTemperature(),
                    e.getBloodPressure(),
                    systolic,
                    diastolic,
                    e.getHeartRate(),
                    e.getRespiratoryRate(),
                    e.getWeight(),
                    e.getHeight(),
                    bmi
            ));
        }

        // Chuẩn bị danh sách các lần khám trước
        List<PastVisitSummaryDto> visits = new ArrayList<>();
        for (Encounter e : encountersDesc) {
            StaffProfile doc = staffProfileRepository.findById(e.getDoctorId()).orElse(null);
            final String finalDoctorName = doc != null ? doc.getFullName() : "";
            final String finalSpecialtyName = (doc != null && doc.getSpecialtyId() != null)
                    ? specialtyRepository.findById(doc.getSpecialtyId())
                            .map(com.clinicmanagement.clinic.entity.Specialty::getName)
                            .orElse("")
                    : "";

            PrescriptionDto prescription = prescriptionService.getPrescriptionByEncounterId(e.getId()).orElse(null);

            List<ServiceOrderDto> serviceOrders = serviceOrderRepository.findByEncounterIdOrderByCreatedAtDesc(e.getId()).stream()
                    .map(order -> new ServiceOrderDto(
                            order.getId(),
                            order.getOrderCode(),
                            order.getEncounterId(),
                            order.getPatientId(),
                            patient.getFullName(),
                            patient.getPatientCode(),
                            order.getDoctorId(),
                            finalDoctorName,
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
                    ))
                    .toList();

            visits.add(new PastVisitSummaryDto(
                    e.getId(),
                    e.getEncounterCode(),
                    e.getEncounterDateTime(),
                    finalDoctorName,
                    finalSpecialtyName,
                    e.getChiefComplaint(),
                    e.getDiagnosis(),
                    e.getIcd10Code(),
                    e.getTreatmentPlan(),
                    e.getStatus(),
                    prescription,
                    serviceOrders
            ));
        }

        return new PatientEmrTimelineDto(
                patient.getId(),
                patient.getPatientCode(),
                patient.getFullName(),
                patient.getGender(),
                patient.getDateOfBirth(),
                patient.getPhone(),
                patient.getAllergies(),
                patient.getMedicalHistorySummary(),
                vitalTrends,
                visits
        );
    }
}
