package com.clinicmanagement.clinic.repository;

import com.clinicmanagement.clinic.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BranchRepository extends JpaRepository<Branch, String> {
    List<Branch> findByClinicId(String clinicId);
    Optional<Branch> findByCode(String code);
}

