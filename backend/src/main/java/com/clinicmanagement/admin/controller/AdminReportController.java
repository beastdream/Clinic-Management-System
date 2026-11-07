package com.clinicmanagement.admin.controller;

import com.clinicmanagement.admin.dto.ReportDtos.*;
import com.clinicmanagement.admin.service.AdminReportService;
import com.clinicmanagement.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Reports & Analytics", description = "Các API dành riêng cho Quản trị viên theo dõi thống kê hiệu suất chuyên khoa, nhân sự và bác sĩ")
public class AdminReportController {

    private final AdminReportService reportService;

    public AdminReportController(AdminReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Lấy báo cáo tổng hợp hệ thống")
    public ResponseEntity<ApiResponse<AdminReportSummaryDto>> getSummary() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getSummary()));
    }

    @GetMapping("/specialty-stats")
    @Operation(summary = "Thống kê theo chuyên khoa")
    public ResponseEntity<ApiResponse<List<SpecialtyReportDto>>> getSpecialtyStats() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getSpecialtyStats()));
    }

    @GetMapping("/doctor-workload")
    @Operation(summary = "Thống kê tải công việc theo bác sĩ")
    public ResponseEntity<ApiResponse<List<DoctorWorkloadDto>>> getDoctorWorkload() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getDoctorWorkload()));
    }
}

