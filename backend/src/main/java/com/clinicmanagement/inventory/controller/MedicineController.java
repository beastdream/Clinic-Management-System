package com.clinicmanagement.inventory.controller;

import com.clinicmanagement.common.response.ApiResponse;
import com.clinicmanagement.inventory.entity.Medicine;
import com.clinicmanagement.inventory.repository.MedicineRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/medicines")
@Tag(name = "Pharmacy & Medicines", description = "Các API tra cứu danh mục dược phẩm và tồn kho")
public class MedicineController {

    private final MedicineRepository medicineRepository;

    public MedicineController(MedicineRepository medicineRepository) {
        this.medicineRepository = medicineRepository;
    }

    @GetMapping
    @Operation(summary = "Lấy danh mục thuốc đang hoạt động", description = "Trả về toàn bộ danh mục thuốc, hoạt chất, quy cách và giá bán")
    public ResponseEntity<ApiResponse<List<Medicine>>> getActiveMedicines() {
        List<Medicine> medicines = medicineRepository.findByActiveTrue();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục thuốc thành công", medicines));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết thuốc", description = "Tra cứu thuốc theo UUID")
    public ResponseEntity<ApiResponse<Medicine>> getMedicineById(@PathVariable String id) {
        return medicineRepository.findById(id)
                .map(m -> ResponseEntity.ok(ApiResponse.success(m)))
                .orElse(ResponseEntity.notFound().build());
    }
}

