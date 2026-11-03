package com.clinicmanagement.billing.repository;

import com.clinicmanagement.billing.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, String> {

    Optional<Invoice> findByIdAndDeletedAtIsNull(String id);

    Optional<Invoice> findByInvoiceCodeAndDeletedAtIsNull(String invoiceCode);

    boolean existsByInvoiceCode(String invoiceCode);

    List<Invoice> findByPatientIdAndDeletedAtIsNullOrderByCreatedAtDesc(String patientId);

    @Query("SELECT i FROM Invoice i WHERE i.deletedAt IS NULL " +
           "AND (:patientId IS NULL OR i.patientId = :patientId) " +
           "AND (:status IS NULL OR i.status = :status) " +
           "AND (:fromDate IS NULL OR i.createdAt >= :fromDate) " +
           "AND (:toDate IS NULL OR i.createdAt <= :toDate) " +
           "AND (:search IS NULL OR LOWER(i.invoiceCode) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(i.notes) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY i.createdAt DESC")
    Page<Invoice> searchInvoices(
            @Param("patientId") String patientId,
            @Param("status") String status,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT COALESCE(SUM(i.paidAmount), 0) FROM Invoice i WHERE i.deletedAt IS NULL AND i.status = 'PAID'")
    BigDecimal calculateTotalPaidRevenue();

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.deletedAt IS NULL AND i.status = 'UNPAID'")
    BigDecimal calculateTotalUnpaidAmount();

    long countByDeletedAtIsNullAndStatus(String status);

    long countByDeletedAtIsNull();
}

