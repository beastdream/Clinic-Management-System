package com.clinicmanagement.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public class StaffDtos {

    public record AdminStaffDto(
            String id,
            String userId,
            String username,
            String staffCode,
            String fullName,
            String gender,
            LocalDate dateOfBirth,
            String phone,
            String email,
            String specialtyId,
            String specialtyName,
            String roomId,
            String roomName,
            String licenseNumber,
            String qualification,
            String status,
            List<String> roles,
            Instant createdAt
    ) {}

    public record CreateStaffRequest(
            @NotBlank(message = "Tên đăng nhập không được để trống") String username,
            @NotBlank(message = "Mật khẩu không được để trống") String password,
            @NotBlank(message = "Mã nhân viên không được để trống") String staffCode,
            @NotBlank(message = "Họ và tên không được để trống") String fullName,
            @NotBlank(message = "Giới tính không được để trống") String gender,
            LocalDate dateOfBirth,
            @NotBlank(message = "Số điện thoại không được để trống") String phone,
            String email,
            String specialtyId,
            String roomId,
            String licenseNumber,
            String qualification,
            @NotEmpty(message = "Phải chọn ít nhất một vai trò") List<String> roles
    ) {}

    public record UpdateStaffRequest(
            @NotBlank(message = "Họ và tên không được để trống") String fullName,
            @NotBlank(message = "Giới tính không được để trống") String gender,
            LocalDate dateOfBirth,
            @NotBlank(message = "Số điện thoại không được để trống") String phone,
            String email,
            String specialtyId,
            String roomId,
            String licenseNumber,
            String qualification,
            String status,
            @NotEmpty(message = "Phải chọn ít nhất một vai trò") List<String> roles
    ) {}
}

