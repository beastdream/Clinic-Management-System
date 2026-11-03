package com.clinicmanagement.clinic.repository;

import com.clinicmanagement.clinic.entity.ServicePrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServicePriceRepository extends JpaRepository<ServicePrice, String> {
    List<ServicePrice> findByServiceIdAndActiveTrue(String serviceId);
    java.util.Optional<ServicePrice> findFirstByServiceIdAndActiveTrueOrderByEffectiveFromDesc(String serviceId);
}

