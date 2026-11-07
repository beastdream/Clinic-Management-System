package com.clinicmanagement.clinical.repository;

import com.clinicmanagement.clinical.entity.Icd10Disease;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface Icd10DiseaseRepository extends JpaRepository<Icd10Disease, String> {

    List<Icd10Disease> findByCommonTrueOrderByCodeAsc();

    @Query("SELECT d FROM Icd10Disease d WHERE " +
           "LOWER(d.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(d.nameVi) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(d.nameEn) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY d.code ASC")
    List<Icd10Disease> searchDiseases(@Param("keyword") String keyword);
}

