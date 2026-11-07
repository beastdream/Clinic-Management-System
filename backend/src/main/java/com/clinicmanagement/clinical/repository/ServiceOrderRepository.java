package com.clinicmanagement.clinical.repository;

import com.clinicmanagement.clinical.entity.ServiceOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceOrderRepository extends JpaRepository<ServiceOrder, String> {

    List<ServiceOrder> findByEncounterIdOrderByCreatedAtDesc(String encounterId);

    List<ServiceOrder> findByPatientIdOrderByCreatedAtDesc(String patientId);

    Optional<ServiceOrder> findByOrderCode(String orderCode);

    long count();
}

