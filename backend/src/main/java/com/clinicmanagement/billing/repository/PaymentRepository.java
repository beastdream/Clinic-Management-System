package com.clinicmanagement.billing.repository;

import com.clinicmanagement.billing.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {

    List<Payment> findByInvoiceIdOrderByCreatedAtDesc(String invoiceId);

    boolean existsByPaymentCode(String paymentCode);
}

