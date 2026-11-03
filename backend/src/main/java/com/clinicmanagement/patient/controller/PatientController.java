package com.clinicmanagement.patient.controller;

import com.clinicmanagement.common.response.ApiResponse;
import com.clinicmanagement.common.response.PageResponse;
import com.clinicmanagement.patient.dto.CreatePatientRequest;
import com.clinicmanagement.patient.dto.PatientResponse;
import com.clinicmanagement.patient.dto.UpdatePatientRequest;
import com.clinicmanagement.patient.service.PatientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/patients")
@Tag(name = "Patient Management", description = "Các API quản lý hồ sơ nhân khẩu và hành chính bệnh nhân")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'DOCTOR')")
    @Operation(summary = "Đăng ký hồ sơ bệnh nhân mới", description = "Tạo mới hồ sơ hành chính, tự động sinh mã BN-YYYY-XXXX")
    public ResponseEntity<ApiResponse<PatientResponse>> createPatient(@Valid @RequestBody CreatePatientRequest request) {
        PatientResponse response = patientService.createPatient(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký hồ sơ bệnh nhân thành công", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'DOCTOR')")
    @Operation(summary = "Cập nhật hồ sơ bệnh nhân", description = "Chỉnh sửa thông tin hành chính, liên hệ và tiền sử bệnh nhân")
    public ResponseEntity<ApiResponse<PatientResponse>> updatePatient(
            @PathVariable String id,
            @Valid @RequestBody UpdatePatientRequest request
    ) {
        PatientResponse response = patientService.updatePatient(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin bệnh nhân thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    @Operation(summary = "Lưu trữ hồ sơ bệnh nhân (Soft Delete)", description = "Đánh dấu hồ sơ vào trạng thái ARCHIVED, không xóa vật lý khỏi CSDL")
    public ResponseEntity<ApiResponse<Void>> deletePatient(@PathVariable String id) {
        patientService.softDeletePatient(id);
        return ResponseEntity.ok(ApiResponse.success("Đã lưu trữ hồ sơ bệnh nhân thành công", null));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'DOCTOR', 'CASHIER', 'PATIENT')")
    @Operation(summary = "Danh sách bệnh nhân (Phân trang và Tìm kiếm)", description = "Lấy danh sách hồ sơ bệnh nhân theo trang, hỗ trợ tìm kiếm theo tên, SĐT, mã BN")
    public ResponseEntity<ApiResponse<PageResponse<PatientResponse>>> getPatients(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = "desc".equalsIgnoreCase(direction) ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Page<PatientResponse> patientPage = patientService.getAllPatients(search, PageRequest.of(page, size, sort));
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách bệnh nhân thành công", PageResponse.from(patientPage)));
    }

    @GetMapping("/top")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'DOCTOR', 'CASHIER', 'PATIENT')")
    @Operation(summary = "Lấy nhanh danh sách bệnh nhân", description = "Lấy tối đa 50 bệnh nhân để phục vụ hiển thị nhanh, hỗ trợ tìm kiếm")
    public ResponseEntity<ApiResponse<List<PatientResponse>>> getTopPatients(
            @RequestParam(required = false) String search
    ) {
        List<PatientResponse> patients = patientService.getTopPatients(search);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách bệnh nhân thành công", patients));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'DOCTOR', 'CASHIER', 'PATIENT')")
    @Operation(summary = "Xem chi tiết hồ sơ bệnh nhân", description = "Tra cứu hồ sơ bệnh nhân theo UUID")
    public ResponseEntity<ApiResponse<PatientResponse>> getPatientById(@PathVariable String id) {
        PatientResponse response = patientService.getPatientById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
