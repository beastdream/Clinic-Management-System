package com.clinicmanagement.clinical.controller;

import com.clinicmanagement.clinical.dto.DoctorPillarDtos.PatientEmrTimelineDto;
import com.clinicmanagement.clinical.service.PatientEmrService;
import com.clinicmanagement.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/clinical/emr")
@Tag(name = "Clinical EMR", description = "Hồ sơ bệnh án điện tử dọc và biểu đồ diễn tiến sinh hiệu bệnh nhân")
public class ClinicalEmrController {

    private final PatientEmrService patientEmrService;

    public ClinicalEmrController(PatientEmrService patientEmrService) {
        this.patientEmrService = patientEmrService;
    }

    @GetMapping("/patients/{patientId}")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Xem hồ sơ bệnh án điện tử dọc và dữ liệu biểu đồ sinh hiệu của bệnh nhân")
    public ResponseEntity<ApiResponse<PatientEmrTimelineDto>> getPatientEmrTimeline(
            @PathVariable String patientId
    ) {
        return ResponseEntity.ok(ApiResponse.success(patientEmrService.getPatientEmrTimeline(patientId)));
    }
}

