package com.clinicmanagement.staff.repository;

import com.clinicmanagement.staff.entity.StaffProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StaffProfileRepository extends JpaRepository<StaffProfile, String> {

    Optional<StaffProfile> findByUserId(String userId);

    Optional<StaffProfile> findByStaffCode(String staffCode);

    boolean existsByStaffCode(String staffCode);

    @Query("SELECT COUNT(s) FROM StaffProfile s WHERE s.staffCode LIKE 'NV-BS%'")
    long countDoctors();
}
