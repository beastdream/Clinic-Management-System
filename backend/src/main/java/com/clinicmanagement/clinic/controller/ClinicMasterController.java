package com.clinicmanagement.clinic.controller;

import com.clinicmanagement.clinic.entity.Room;
import com.clinicmanagement.clinic.entity.ServiceItem;
import com.clinicmanagement.clinic.entity.Specialty;
import com.clinicmanagement.clinic.repository.RoomRepository;
import com.clinicmanagement.clinic.repository.ServiceItemRepository;
import com.clinicmanagement.clinic.repository.SpecialtyRepository;
import com.clinicmanagement.common.response.ApiResponse;
import com.clinicmanagement.staff.entity.StaffProfile;
import com.clinicmanagement.staff.repository.StaffProfileRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Clinic Master Data", description = "Các API danh mục dùng chung: Chuyên khoa, Phòng ban, Bác sĩ và Dịch vụ kỹ thuật")
public class ClinicMasterController {

    private final SpecialtyRepository specialtyRepository;
    private final RoomRepository roomRepository;
    private final ServiceItemRepository serviceItemRepository;
    private final StaffProfileRepository staffProfileRepository;

    public ClinicMasterController(SpecialtyRepository specialtyRepository,
                                  RoomRepository roomRepository,
                                  ServiceItemRepository serviceItemRepository,
                                  StaffProfileRepository staffProfileRepository) {
        this.specialtyRepository = specialtyRepository;
        this.roomRepository = roomRepository;
        this.serviceItemRepository = serviceItemRepository;
        this.staffProfileRepository = staffProfileRepository;
    }

    @GetMapping("/specialties")
    @Operation(summary = "Lấy danh mục chuyên khoa", description = "Trả về danh sách các chuyên khoa khám đang hoạt động")
    public ResponseEntity<ApiResponse<List<Specialty>>> getSpecialties() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục chuyên khoa thành công", specialtyRepository.findByActiveTrue()));
    }

    @GetMapping("/rooms")
    @Operation(summary = "Lấy danh sách phòng khám và phòng chức năng", description = "Trả về danh sách phòng ban trong phòng khám")
    public ResponseEntity<ApiResponse<List<Room>>> getRooms() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phòng thành công", roomRepository.findAll()));
    }

    @GetMapping("/services")
    @Operation(summary = "Lấy danh mục dịch vụ khám", description = "Trả về danh mục dịch vụ kỹ thuật y tế")
    public ResponseEntity<ApiResponse<List<ServiceItem>>> getServices() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục dịch vụ thành công", serviceItemRepository.findByActiveTrue()));
    }

    @GetMapping("/doctors")
    @Operation(summary = "Lấy danh sách bác sĩ", description = "Trả về danh sách hồ sơ bác sĩ kèm chuyên khoa, phòng phụ trách, hỗ trợ lọc chuyên khoa và tìm kiếm")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDoctors(
            @RequestParam(required = false) String specialtyId,
            @RequestParam(required = false) String search
    ) {
        List<StaffProfile> doctors = staffProfileRepository.findAll().stream()
                .filter(s -> s.getStaffCode() != null && s.getStaffCode().startsWith("NV-BS"))
                .filter(s -> {
                    if (specialtyId == null || specialtyId.isBlank()) return true;
                    return specialtyId.equals(s.getSpecialtyId());
                })
                .filter(s -> {
                    if (search == null || search.isBlank()) return true;
                    String kw = search.trim().toLowerCase();
                    boolean nameMatch = s.getFullName() != null && s.getFullName().toLowerCase().contains(kw);
                    boolean codeMatch = s.getStaffCode() != null && s.getStaffCode().toLowerCase().contains(kw);
                    boolean phoneMatch = s.getPhone() != null && s.getPhone().contains(kw);
                    return nameMatch || codeMatch || phoneMatch;
                })
                .toList();

        List<Map<String, Object>> result = doctors.stream().map(doc -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", doc.getId());
            map.put("staffCode", doc.getStaffCode());
            map.put("fullName", doc.getFullName());
            map.put("gender", doc.getGender());
            map.put("phone", doc.getPhone());
            map.put("qualification", doc.getQualification());
            map.put("licenseNumber", doc.getLicenseNumber());
            map.put("status", doc.getStatus() != null ? doc.getStatus() : "ACTIVE");
            map.put("specialtyId", doc.getSpecialtyId());
            if (doc.getSpecialtyId() != null) {
                specialtyRepository.findById(doc.getSpecialtyId()).ifPresent(spec -> {
                    map.put("specialtyName", spec.getName());
                    map.put("specialtyCode", spec.getCode());
                });
            }
            map.put("roomId", doc.getRoomId());
            if (doc.getRoomId() != null) {
                roomRepository.findById(doc.getRoomId()).ifPresent(r -> map.put("roomName", r.getName()));
            }
            return map;
        }).toList();

        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách bác sĩ thành công", result));
    }
}
