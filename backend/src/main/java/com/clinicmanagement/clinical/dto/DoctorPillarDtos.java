package com.clinicmanagement.clinical.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class DoctorPillarDtos {

    // ==================== 1. ICD-10 DTOS ====================
    public record Icd10DiseaseDto(
            String id,
            String code,
            String nameVi,
            String nameEn,
            String chapter,
            Boolean isCommon
    ) {}

    // ==================== 2. PRESCRIPTION DTOS ====================
    public record PrescriptionItemRequest(
            @NotBlank(message = "Mã thuốc không được để trống")
            String medicineId,
            @NotNull(message = "Số lượng kê phải lớn hơn 0")
            @Positive(message = "Số lượng kê phải lớn hơn 0")
            Integer quantity,
            String morningDose,
            String noonDose,
            String eveningDose,
            String nightDose,
            String usageTiming,
            String usageRoute,
            Integer daysCount,
            String instructions
    ) {}

    public record CreatePrescriptionRequest(
            @NotBlank(message = "Mã ca khám không được để trống")
            String encounterId,
            String diagnosis,
            String advice,
            @NotNull(message = "Đơn thuốc cần có ít nhất 1 loại thuốc")
            List<PrescriptionItemRequest> items
    ) {}

    public record PrescriptionItemDto(
            String id,
            String medicineId,
            String medicineName,
            String unit,
            Integer quantity,
            String morningDose,
            String noonDose,
            String eveningDose,
            String nightDose,
            String usageTiming,
            String usageRoute,
            Integer daysCount,
            String instructions
    ) {}

    public record PrescriptionDto(
            String id,
            String prescriptionCode,
            String encounterId,
            String patientId,
            String patientName,
            String patientCode,
            String patientPhone,
            String patientGender,
            String patientDateOfBirth,
            String doctorId,
            String doctorName,
            String doctorCode,
            String diagnosis,
            String advice,
            String status,
            Instant createdAt,
            List<PrescriptionItemDto> items
    ) {}

    public record AllergyAlertDto(
            boolean hasAllergyRisk,
            String warningMessage,
            List<String> matchedAllergens
    ) {}

    // ==================== 3. SERVICE ORDER DTOS (CHỈ ĐỊNH CLS) ====================
    public record CreateServiceOrderRequest(
            @NotBlank(message = "Mã lượt khám không được để trống")
            String encounterId,
            @NotBlank(message = "Mã dịch vụ kỹ thuật không được để trống")
            String serviceId,
            String priority, // ROUTINE, URGENT
            String notes
    ) {}

    public record UpdateServiceOrderResultRequest(
            String results,
            String conclusion,
            String status // COMPLETED, PROCESSING, CANCELLED
    ) {}

    public record ServiceOrderDto(
            String id,
            String orderCode,
            String encounterId,
            String patientId,
            String patientName,
            String patientCode,
            String doctorId,
            String doctorName,
            String serviceId,
            String serviceName,
            BigDecimal price,
            String priority,
            String notes,
            String status,
            String results,
            String conclusion,
            String performedBy,
            LocalDateTime performedAt,
            Instant createdAt
    ) {}

    // ==================== 4. LONGITUDINAL EMR & VITAL TRENDS DTOS ====================
    public record VitalTrendPointDto(
            String encounterId,
            String encounterCode,
            LocalDateTime encounterDateTime,
            BigDecimal temperature,
            String bloodPressure,
            Integer systolicBp,
            Integer diastolicBp,
            Integer heartRate,
            Integer respiratoryRate,
            BigDecimal weight,
            BigDecimal height,
            BigDecimal bmi
    ) {}

    public record PastVisitSummaryDto(
            String encounterId,
            String encounterCode,
            LocalDateTime encounterDateTime,
            String doctorName,
            String doctorSpecialty,
            String chiefComplaint,
            String diagnosis,
            String icd10Code,
            String treatmentPlan,
            String status,
            PrescriptionDto prescription,
            List<ServiceOrderDto> serviceOrders
    ) {}

    public record PatientEmrTimelineDto(
            String patientId,
            String patientCode,
            String fullName,
            String gender,
            LocalDate dateOfBirth,
            String phone,
            String allergies,
            String medicalHistorySummary,
            List<VitalTrendPointDto> vitalTrends,
            List<PastVisitSummaryDto> visits
    ) {}
}

