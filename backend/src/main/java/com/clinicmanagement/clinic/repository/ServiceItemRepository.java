package com.clinicmanagement.clinic.repository;

import com.clinicmanagement.clinic.entity.ServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceItemRepository extends JpaRepository<ServiceItem, String> {
    Optional<ServiceItem> findByCode(String code);
    List<ServiceItem> findBySpecialtyId(String specialtyId);
    List<ServiceItem> findByActiveTrue();
}

