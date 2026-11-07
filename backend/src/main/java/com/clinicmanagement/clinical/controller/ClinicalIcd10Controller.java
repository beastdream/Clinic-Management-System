package com.clinicmanagement.clinical.controller;

import com.clinicmanagement.clinical.dto.DoctorPillarDtos.Icd10DiseaseDto;
import com.clinicmanagement.clinical.service.ClinicalIcd10Service;
import com.clinicmanagement.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clinical/icd10")
@PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
@Tag(name = "Clinical ICD-10", description = "Tra cứu danh mục mã bệnh chẩn đoán quốc tế ICD-10 chuẩn y tế")
public class ClinicalIcd10Controller {

    private final ClinicalIcd10Service icd10Service;

    public ClinicalIcd10Controller(ClinicalIcd10Service icd10Service) {
        this.icd10Service = icd10Service;
    }

    @GetMapping
    @Operation(summary = "Tìm kiếm danh mục mã bệnh ICD-10 theo từ khóa mã hoặc tên bệnh")
    public ResponseEntity<ApiResponse<List<Icd10DiseaseDto>>> searchDiseases(
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(ApiResponse.success(icd10Service.searchDiseases(keyword)));
    }
}

