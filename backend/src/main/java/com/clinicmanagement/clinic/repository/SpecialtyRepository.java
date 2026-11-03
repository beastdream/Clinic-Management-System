package com.clinicmanagement.clinic.repository;

import com.clinicmanagement.clinic.entity.Specialty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpecialtyRepository extends JpaRepository<Specialty, String> {
    Optional<Specialty> findByCode(String code);
    List<Specialty> findByActiveTrue();
}

