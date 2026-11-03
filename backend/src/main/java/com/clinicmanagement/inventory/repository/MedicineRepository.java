package com.clinicmanagement.inventory.repository;

import com.clinicmanagement.inventory.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, String> {

    Optional<Medicine> findByCode(String code);

    List<Medicine> findByActiveTrue();

    boolean existsByCode(String code);
}
