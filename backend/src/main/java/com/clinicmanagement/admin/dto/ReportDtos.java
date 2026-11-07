package com.clinicmanagement.admin.dto;

import java.util.Map;

public class ReportDtos {

    public record AdminReportSummaryDto(
            long totalDoctors,
            long totalStaff,
            long totalSpecialties,
            long totalRooms,
            long totalServices,
            long totalPatients,
            long totalEncounters,
            Map<String, Long> staffByRole
    ) {}

    public record SpecialtyReportDto(
            String specialtyId,
            String specialtyCode,
            String specialtyName,
            long doctorCount,
            long encounterCount
    ) {}

    public record DoctorWorkloadDto(
            String doctorId,
            String staffCode,
            String fullName,
            String specialtyName,
            String phone,
            long completedEncounters
    ) {}
}

