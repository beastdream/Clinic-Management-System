package com.clinicmanagement.clinical.controller;

import com.clinicmanagement.clinical.dto.DoctorPillarDtos.AllergyAlertDto;
import com.clinicmanagement.clinical.dto.DoctorPillarDtos.CreatePrescriptionRequest;
import com.clinicmanagement.clinical.dto.DoctorPillarDtos.PrescriptionDto;
import com.clinicmanagement.clinical.service.ClinicalPrescriptionService;
import com.clinicmanagement.common.response.ApiResponse;
import com.clinicmanagement.security.SecurityContextHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clinical/prescriptions")
@Tag(name = "Clinical Prescriptions", description = "Quản lý đơn thuốc điện tử và cảnh báo dị ứng thuốc lâm sàng")
public class ClinicalPrescriptionController {

    private final ClinicalPrescriptionService prescriptionService;

    public ClinicalPrescriptionController(ClinicalPrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Kê mới hoặc cập nhật đơn thuốc điện tử cho ca khám")
    public ResponseEntity<ApiResponse<PrescriptionDto>> createOrUpdatePrescription(
            @Valid @RequestBody CreatePrescriptionRequest request
    ) {
        String currentUsername = SecurityContextHelper.getCurrentUsername().orElse("doctor");
        PrescriptionDto dto = prescriptionService.createOrUpdatePrescription(request, currentUsername);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Kê đơn thuốc thành công", dto));
    }

    @GetMapping("/encounter/{encounterId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PHARMACIST', 'CASHIER', 'ADMIN')")
    @Operation(summary = "Lấy thông tin đơn thuốc của một lượt khám")
    public ResponseEntity<ApiResponse<PrescriptionDto>> getPrescriptionByEncounterId(
            @PathVariable String encounterId
    ) {
        return prescriptionService.getPrescriptionByEncounterId(encounterId)
                .map(dto -> ResponseEntity.ok(ApiResponse.success(dto)))
                .orElse(ResponseEntity.ok(ApiResponse.success("Chưa có đơn thuốc", null)));
    }

    @GetMapping("/patient/{patientId}/past")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @Operation(summary = "Lấy các đơn thuốc trước đây của bệnh nhân (phục vụ tái kê đơn 1-click)")
    public ResponseEntity<ApiResponse<List<PrescriptionDto>>> getPastPrescriptions(
            @PathVariable String patientId
    ) {
        return ResponseEntity.ok(ApiResponse.success(prescriptionService.getPastPrescriptionsByPatientId(patientId)));
    }

    @PostMapping("/check-allergy")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @Operation(summary = "Kiểm tra rủi ro dị ứng thuốc đối chiếu với hồ sơ bệnh nhân")
    public ResponseEntity<ApiResponse<AllergyAlertDto>> checkAllergy(
            @RequestParam String patientId,
            @RequestBody List<String> medicineIds
    ) {
        return ResponseEntity.ok(ApiResponse.success(prescriptionService.checkAllergySafety(patientId, medicineIds)));
    }
}

