package com.clinicmanagement.patient.repository;

import com.clinicmanagement.patient.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, String> {

    Optional<Patient> findByPatientCode(String patientCode);

    Optional<Patient> findByIdentityCardNo(String identityCardNo);

    Optional<Patient> findByPhone(String phone);

    boolean existsByPatientCode(String patientCode);

    Page<Patient> findByDeletedAtIsNull(Pageable pageable);

    List<Patient> findByDeletedAtIsNullOrderByCreatedAtDesc();

    Optional<Patient> findByIdAndDeletedAtIsNull(String id);

    @Query("SELECT p FROM Patient p WHERE p.deletedAt IS NULL AND (" +
            "LOWER(p.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "p.phone LIKE CONCAT('%', :search, '%') OR " +
            "LOWER(p.patientCode) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Patient> searchActivePatients(@Param("search") String search, Pageable pageable);

    @Query("SELECT p FROM Patient p WHERE p.deletedAt IS NULL AND (" +
            "LOWER(p.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "p.phone LIKE CONCAT('%', :search, '%') OR " +
            "LOWER(p.patientCode) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Patient> searchActivePatientsList(@Param("search") String search);

    long countByDeletedAtIsNull();
}
