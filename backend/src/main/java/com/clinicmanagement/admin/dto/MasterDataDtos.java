package com.clinicmanagement.admin.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class MasterDataDtos {

    public record CreateSpecialtyRequest(
            @NotBlank(message = "Mã chuyên khoa không được để trống") String code,
            @NotBlank(message = "Tên chuyên khoa không được để trống") String name,
            String description,
            Boolean active
    ) {}

    public record UpdateSpecialtyRequest(
            @NotBlank(message = "Tên chuyên khoa không được để trống") String name,
            String description,
            Boolean active
    ) {}

    public record CreateRoomRequest(
            @NotBlank(message = "Mã phòng không được để trống") String code,
            @NotBlank(message = "Tên phòng không được để trống") String name,
            @NotBlank(message = "Loại phòng không được để trống") String roomType,
            String specialtyId,
            Boolean active
    ) {}

    public record UpdateRoomRequest(
            @NotBlank(message = "Tên phòng không được để trống") String name,
            @NotBlank(message = "Loại phòng không được để trống") String roomType,
            String specialtyId,
            Boolean active
    ) {}

    public record AdminServiceItemDto(
            String id,
            String code,
            String name,
            String serviceType,
            String description,
            boolean active,
            String specialtyId,
            String specialtyName,
            BigDecimal currentPrice
    ) {}

    public record CreateServiceItemRequest(
            @NotBlank(message = "Mã dịch vụ không được để trống") String code,
            @NotBlank(message = "Tên dịch vụ không được để trống") String name,
            @NotBlank(message = "Loại dịch vụ không được để trống") String serviceType,
            String specialtyId,
            String description,
            @NotNull(message = "Đơn giá không được để trống")
            @DecimalMin(value = "0.0", message = "Đơn giá không được âm") BigDecimal price,
            Boolean active
    ) {}

    public record UpdateServiceItemRequest(
            @NotBlank(message = "Tên dịch vụ không được để trống") String name,
            @NotBlank(message = "Loại dịch vụ không được để trống") String serviceType,
            String specialtyId,
            String description,
            @NotNull(message = "Đơn giá không được để trống")
            @DecimalMin(value = "0.0", message = "Đơn giá không được âm") BigDecimal price,
            Boolean active
    ) {}
}

