package com.clinicmanagement.clinic.repository;

import com.clinicmanagement.clinic.entity.Clinic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClinicRepository extends JpaRepository<Clinic, String> {
    Optional<Clinic> findByCode(String code);
}

