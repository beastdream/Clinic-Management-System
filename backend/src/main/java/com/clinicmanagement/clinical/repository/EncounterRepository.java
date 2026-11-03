package com.clinicmanagement.clinical.repository;

import com.clinicmanagement.clinical.entity.Encounter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EncounterRepository extends JpaRepository<Encounter, String> {

    Optional<Encounter> findByIdAndDeletedAtIsNull(String id);

    Optional<Encounter> findByEncounterCodeAndDeletedAtIsNull(String encounterCode);

    Optional<Encounter> findByAppointmentIdAndDeletedAtIsNull(String appointmentId);

    boolean existsByAppointmentIdAndDeletedAtIsNull(String appointmentId);

    List<Encounter> findByPatientIdAndDeletedAtIsNullOrderByEncounterDateTimeDesc(String patientId);

    Page<Encounter> findByDoctorIdAndDeletedAtIsNull(String doctorId, Pageable pageable);

    @Query("SELECT e FROM Encounter e WHERE e.deletedAt IS NULL " +
           "AND (:doctorId IS NULL OR e.doctorId = :doctorId) " +
           "AND (:patientId IS NULL OR e.patientId = :patientId) " +
           "AND (:status IS NULL OR e.status = :status) " +
           "AND (:search IS NULL OR LOWER(e.encounterCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(e.diagnosis) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(e.chiefComplaint) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY e.encounterDateTime DESC")
    Page<Encounter> searchEncounters(
            @Param("doctorId") String doctorId,
            @Param("patientId") String patientId,
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable
    );

    long countByDeletedAtIsNullAndStatus(String status);
}

