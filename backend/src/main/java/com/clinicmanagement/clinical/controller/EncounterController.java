package com.clinicmanagement.clinical.controller;

import com.clinicmanagement.clinical.dto.*;
import com.clinicmanagement.clinical.service.EncounterService;
import com.clinicmanagement.common.exception.BusinessException;
import com.clinicmanagement.common.exception.ErrorCode;
import com.clinicmanagement.common.response.ApiResponse;
import com.clinicmanagement.common.response.PageResponse;
import com.clinicmanagement.security.SecurityContextHelper;
import com.clinicmanagement.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/clinical/encounters")
@Tag(name = "Clinical Encounter Management", description = "Các API khám bệnh lâm sàng, ghi nhận triệu chứng, sinh hiệu, chẩn đoán và hướng xử trí")
public class EncounterController {

    private final EncounterService encounterService;

    public EncounterController(EncounterService encounterService) {
        this.encounterService = encounterService;
    }

    @GetMapping("/doctor-queue")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Hàng chờ khám bệnh của Bác sĩ", description = "Lấy danh sách bệnh nhân đã tiếp đón (CHECKED_IN) hoặc đang khám (IN_PROGRESS) của bác sĩ hiện tại")
    public ResponseEntity<ApiResponse<List<DoctorQueueItemResponse>>> getDoctorQueue() {
        String currentUserId = SecurityContextHelper.getCurrentUserId()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        List<DoctorQueueItemResponse> queue = encounterService.getDoctorQueue(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách hàng chờ khám thành công", queue));
    }

    @PostMapping("/start-from-appointment/{appointmentId}")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Bắt đầu lượt khám từ Lịch hẹn", description = "Khởi tạo phiếu khám lâm sàng cho lịch hẹn đã check-in")
    public ResponseEntity<ApiResponse<EncounterResponse>> startEncounter(@PathVariable String appointmentId) {
        String currentUserId = SecurityContextHelper.getCurrentUserId()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        EncounterResponse response = encounterService.startEncounterFromAppointment(appointmentId, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Khởi tạo lượt khám thành công", response));
    }

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Tạo mới phiếu khám lâm sàng", description = "Tạo trực tiếp phiếu khám lâm sàng (vãng lai hoặc theo lịch hẹn)")
    public ResponseEntity<ApiResponse<EncounterResponse>> createEncounter(@Valid @RequestBody CreateEncounterRequest request) {
        String currentUserId = SecurityContextHelper.getCurrentUserId()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        EncounterResponse response = encounterService.createEncounter(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phiếu khám lâm sàng thành công", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Cập nhật phiếu khám lâm sàng", description = "Lưu nháp nội dung khám, sinh hiệu, chẩn đoán của phiếu khám đang diễn ra")
    public ResponseEntity<ApiResponse<EncounterResponse>> updateEncounter(
            @PathVariable String id,
            @Valid @RequestBody UpdateEncounterRequest request
    ) {
        String currentUserId = SecurityContextHelper.getCurrentUserId()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        EncounterResponse response = encounterService.updateEncounter(id, request, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật phiếu khám thành công", response));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Hoàn tất lượt khám bệnh", description = "Kết thúc khám bệnh, khóa phiếu khám an toàn và cập nhật lịch hẹn")
    public ResponseEntity<ApiResponse<EncounterResponse>> completeEncounter(@PathVariable String id) {
        String currentUserId = SecurityContextHelper.getCurrentUserId()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        EncounterResponse response = encounterService.completeEncounter(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Hoàn tất lượt khám bệnh thành công", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT')")
    @Operation(summary = "Xem chi tiết phiếu khám", description = "Xem thông tin chi tiết một phiếu khám lâm sàng (kiểm tra quyền sở hữu)")
    public ResponseEntity<ApiResponse<EncounterResponse>> getEncounterById(@PathVariable String id) {
        UserPrincipal currentUser = SecurityContextHelper.getCurrentUser()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        EncounterResponse response = encounterService.getEncounterById(id, currentUser.getId(), currentUser.getRoles());
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin phiếu khám thành công", response));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT')")
    @Operation(summary = "Xem lịch sử khám của bệnh nhân", description = "Xem toàn bộ các phiếu khám trong quá khứ của bệnh nhân")
    public ResponseEntity<ApiResponse<List<EncounterResponse>>> getPatientHistory(@PathVariable String patientId) {
        UserPrincipal currentUser = SecurityContextHelper.getCurrentUser()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        List<EncounterResponse> history = encounterService.getPatientHistory(patientId, currentUser.getId(), currentUser.getRoles());
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử khám bệnh thành công", history));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT')")
    @Operation(summary = "Tìm kiếm và phân trang phiếu khám", description = "Danh sách phiếu khám theo điều kiện lọc và phân trang")
    public ResponseEntity<ApiResponse<PageResponse<EncounterResponse>>> searchEncounters(
            @RequestParam(required = false) String patientId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        UserPrincipal currentUser = SecurityContextHelper.getCurrentUser()
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "encounterDateTime"));
        PageResponse<EncounterResponse> response = encounterService.searchEncounters(
                patientId, status, search, pageRequest, currentUser.getId(), currentUser.getRoles()
        );
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phiếu khám thành công", response));
    }
}

