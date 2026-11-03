package com.clinicmanagement.dashboard.controller;

import com.clinicmanagement.common.response.ApiResponse;
import com.clinicmanagement.dashboard.dto.DashboardStatsResponse;
import com.clinicmanagement.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Dashboard Management", description = "Các API thống kê tổng hợp số liệu thực tế từ MySQL cho bảng điều khiển phòng khám")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lấy chỉ số thống kê Dashboard", description = "Truy vấn thời gian thực từ MySQL: tổng số bệnh nhân, bác sĩ, lịch hẹn hôm nay, hàng chờ, lượt khám hoàn thành, doanh thu và phân bố trạng thái")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats() {
        DashboardStatsResponse stats = dashboardService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Lấy số liệu thống kê Dashboard thành công", stats));
    }
}

