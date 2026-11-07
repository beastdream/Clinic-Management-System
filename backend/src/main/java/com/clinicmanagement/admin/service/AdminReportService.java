package com.clinicmanagement.admin.service;

import com.clinicmanagement.admin.dto.ReportDtos.*;
import com.clinicmanagement.clinic.entity.Room;
import com.clinicmanagement.clinic.entity.ServiceItem;
import com.clinicmanagement.clinic.entity.Specialty;
import com.clinicmanagement.clinic.repository.RoomRepository;
import com.clinicmanagement.clinic.repository.ServiceItemRepository;
import com.clinicmanagement.clinic.repository.SpecialtyRepository;
import com.clinicmanagement.clinical.entity.Encounter;
import com.clinicmanagement.clinical.repository.EncounterRepository;
import com.clinicmanagement.patient.repository.PatientRepository;
import com.clinicmanagement.staff.entity.StaffProfile;
import com.clinicmanagement.staff.repository.StaffProfileRepository;
import com.clinicmanagement.user.entity.Role;
import com.clinicmanagement.user.entity.User;
import com.clinicmanagement.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminReportService {

    private final StaffProfileRepository staffProfileRepository;
    private final UserRepository userRepository;
    private final SpecialtyRepository specialtyRepository;
    private final RoomRepository roomRepository;
    private final ServiceItemRepository serviceItemRepository;
    private final PatientRepository patientRepository;
    private final EncounterRepository encounterRepository;

    public AdminReportService(StaffProfileRepository staffProfileRepository,
                              UserRepository userRepository,
                              SpecialtyRepository specialtyRepository,
                              RoomRepository roomRepository,
                              ServiceItemRepository serviceItemRepository,
                              PatientRepository patientRepository,
                              EncounterRepository encounterRepository) {
        this.staffProfileRepository = staffProfileRepository;
        this.userRepository = userRepository;
        this.specialtyRepository = specialtyRepository;
        this.roomRepository = roomRepository;
        this.serviceItemRepository = serviceItemRepository;
        this.patientRepository = patientRepository;
        this.encounterRepository = encounterRepository;
    }

    @Transactional(readOnly = true)
    public AdminReportSummaryDto getSummary() {
        long totalDoctors = staffProfileRepository.countDoctors();
        long totalStaff = staffProfileRepository.count();
        long totalSpecialties = specialtyRepository.count();
        long totalRooms = roomRepository.count();
        long totalServices = serviceItemRepository.count();
        long totalPatients = patientRepository.countByDeletedAtIsNull();
        long totalEncounters = encounterRepository.count();

        // Thống kê nhân sự theo vai trò
        Map<String, Long> staffByRole = new HashMap<>();
        List<User> users = userRepository.findAll();
        for (User u : users) {
            if (u.isStaff() && u.getRoles() != null) {
                for (Role r : u.getRoles()) {
                    String clean = r.getCode().replace("ROLE_", "");
                    staffByRole.put(clean, staffByRole.getOrDefault(clean, 0L) + 1);
                }
            }
        }

        return new AdminReportSummaryDto(
                totalDoctors,
                totalStaff,
                totalSpecialties,
                totalRooms,
                totalServices,
                totalPatients,
                totalEncounters,
                staffByRole
        );
    }

    @Transactional(readOnly = true)
    public List<SpecialtyReportDto> getSpecialtyStats() {
        List<Specialty> specialties = specialtyRepository.findAll();
        List<StaffProfile> doctors = staffProfileRepository.findAll().stream()
                .filter(s -> s.getStaffCode() != null && s.getStaffCode().startsWith("NV-BS"))
                .toList();
        List<Encounter> encounters = encounterRepository.findAll();

        // Map doctor to specialty
        Map<String, String> doctorSpecialtyMap = doctors.stream()
                .filter(d -> d.getSpecialtyId() != null)
                .collect(Collectors.toMap(StaffProfile::getId, StaffProfile::getSpecialtyId, (a, b) -> a));

        return specialties.stream().map(sp -> {
            long docCount = doctors.stream()
                    .filter(d -> sp.getId().equals(d.getSpecialtyId()))
                    .count();

            long encCount = encounters.stream()
                    .filter(e -> {
                        String specId = doctorSpecialtyMap.get(e.getDoctorId());
                        return sp.getId().equals(specId);
                    })
                    .count();

            return new SpecialtyReportDto(
                    sp.getId(),
                    sp.getCode(),
                    sp.getName(),
                    docCount,
                    encCount
            );
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DoctorWorkloadDto> getDoctorWorkload() {
        List<StaffProfile> doctors = staffProfileRepository.findAll().stream()
                .filter(s -> s.getStaffCode() != null && s.getStaffCode().startsWith("NV-BS"))
                .toList();

        Map<String, String> specNames = specialtyRepository.findAll().stream()
                .collect(Collectors.toMap(Specialty::getId, Specialty::getName, (a, b) -> a));

        List<Encounter> encounters = encounterRepository.findAll();
        Map<String, Long> completedCountByDoctor = encounters.stream()
                .filter(e -> "COMPLETED".equalsIgnoreCase(e.getStatus()))
                .collect(Collectors.groupingBy(Encounter::getDoctorId, Collectors.counting()));

        return doctors.stream().map(d -> {
            String specName = d.getSpecialtyId() != null
                    ? specNames.getOrDefault(d.getSpecialtyId(), "Đa khoa")
                    : "Đa khoa";

            long count = completedCountByDoctor.getOrDefault(d.getId(), 0L);

            return new DoctorWorkloadDto(
                    d.getId(),
                    d.getStaffCode(),
                    d.getFullName(),
                    specName,
                    d.getPhone(),
                    count
            );
        }).sorted(Comparator.comparing(DoctorWorkloadDto::completedEncounters).reversed())
          .collect(Collectors.toList());
    }
}

