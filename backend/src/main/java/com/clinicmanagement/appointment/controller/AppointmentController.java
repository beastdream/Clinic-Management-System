package com.clinicmanagement.appointment.controller;

import com.clinicmanagement.appointment.dto.AppointmentResponse;
import com.clinicmanagement.appointment.dto.CancelAppointmentRequest;
import com.clinicmanagement.appointment.dto.CreateAppointmentRequest;
import com.clinicmanagement.appointment.service.AppointmentService;
import com.clinicmanagement.common.response.ApiResponse;
import com.clinicmanagement.common.response.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/appointments")
@Tag(name = "Appointment Management", description = "Các API đặt lịch hẹn, kiểm tra lịch khám và điều phối ca khám")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'DOCTOR')")
    @Operation(summary = "Đặt lịch hẹn khám mới", description = "Tạo mới lịch hẹn khám, kiểm tra khóa ngoại và kiểm tra trùng lịch")
    public ResponseEntity<ApiResponse<AppointmentResponse>> createAppointment(@Valid @RequestBody CreateAppointmentRequest request) {
        AppointmentResponse response = appointmentService.createAppointment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đặt lịch hẹn khám thành công", response));
    }

    @PatchMapping("/{id}/check-in")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    @Operation(summary = "Tiếp đón bệnh nhân (Check-in)", description = "Chuyển trạng thái lịch hẹn sang CHECKED_IN")
    public ResponseEntity<ApiResponse<AppointmentResponse>> checkIn(@PathVariable String id) {
        AppointmentResponse response = appointmentService.checkInAppointment(id);
        return ResponseEntity.ok(ApiResponse.success("Tiếp đón bệnh nhân thành công", response));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'ADMIN')")
    @Operation(summary = "Hoàn thành lượt khám", description = "Chuyển trạng thái lịch hẹn sang COMPLETED")
    public ResponseEntity<ApiResponse<AppointmentResponse>> complete(@PathVariable String id) {
        AppointmentResponse response = appointmentService.completeAppointment(id);
        return ResponseEntity.ok(ApiResponse.success("Hoàn tất lịch hẹn thành công", response));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'DOCTOR')")
    @Operation(summary = "Hủy lịch hẹn", description = "Chuyển trạng thái lịch hẹn sang CANCELLED và lưu lý do hủy")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancel(
            @PathVariable String id,
            @RequestBody(required = false) CancelAppointmentRequest request
    ) {
        String reason = request != null ? request.getCancellationReason() : null;
        AppointmentResponse response = appointmentService.cancelAppointment(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Hủy lịch hẹn thành công", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'CASHIER', 'PATIENT')")
    @Operation(summary = "Danh sách lịch hẹn khám (Phân trang và lọc)", description = "Lấy danh sách lịch hẹn theo ngày, trạng thái, bác sĩ hoặc bệnh nhân")
    public ResponseEntity<ApiResponse<PageResponse<AppointmentResponse>>> getAppointments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String doctorId,
            @RequestParam(required = false) String patientId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "appointmentDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = "desc".equalsIgnoreCase(direction) ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Page<AppointmentResponse> aptPage = appointmentService.getAppointments(status, date, doctorId, patientId, PageRequest.of(page, size, sort));
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách lịch hẹn thành công", PageResponse.from(aptPage)));
    }

    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'CASHIER')")
    @Operation(summary = "Danh sách lịch hẹn gần đây", description = "Lấy nhanh tối đa 50 lịch hẹn phục vụ hiển thị Dashboard")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getRecentAppointments() {
        List<AppointmentResponse> list = appointmentService.getRecentAppointments();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách lịch hẹn thành công", list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'CASHIER', 'PATIENT')")
    @Operation(summary = "Xem chi tiết lịch hẹn", description = "Tra cứu chi tiết lịch hẹn theo UUID")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentById(@PathVariable String id) {
        AppointmentResponse response = appointmentService.getAppointmentById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
