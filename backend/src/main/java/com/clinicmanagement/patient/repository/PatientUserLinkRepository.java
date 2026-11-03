package com.clinicmanagement.patient.repository;

import com.clinicmanagement.patient.entity.PatientUserLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientUserLinkRepository extends JpaRepository<PatientUserLink, String> {

    Optional<PatientUserLink> findByPatientId(String patientId);

    Optional<PatientUserLink> findByUserId(String userId);

    boolean existsByPatientId(String patientId);

    boolean existsByUserId(String userId);
}
