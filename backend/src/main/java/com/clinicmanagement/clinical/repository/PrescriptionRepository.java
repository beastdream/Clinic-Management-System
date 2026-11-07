package com.clinicmanagement.clinical.repository;

import com.clinicmanagement.clinical.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, String> {

    Optional<Prescription> findByEncounterIdAndDeletedAtIsNull(String encounterId);

    Optional<Prescription> findByPrescriptionCodeAndDeletedAtIsNull(String prescriptionCode);

    List<Prescription> findByPatientIdAndDeletedAtIsNullOrderByCreatedAtDesc(String patientId);

    List<Prescription> findByDoctorIdAndDeletedAtIsNullOrderByCreatedAtDesc(String doctorId);

    long count();
}

