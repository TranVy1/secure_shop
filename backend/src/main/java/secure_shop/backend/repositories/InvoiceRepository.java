package secure_shop.backend.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import secure_shop.backend.entities.Invoice;
import secure_shop.backend.enums.InvoiceStatus;

import java.util.Optional;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    Optional<Invoice> findByInvoiceCode(String invoiceCode);

    Page<Invoice> findByStaffId(UUID staffId, Pageable pageable);

    Page<Invoice> findByStatus(InvoiceStatus status, Pageable pageable);

    Page<Invoice> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** Lấy số sequence lớn nhất trong năm để generate invoice code tiếp theo */
    @Query(value = """
        SELECT ISNULL(MAX(CAST(SUBSTRING(invoice_code, 10, 10) AS INT)), 0)
        FROM invoices
        WHERE invoice_code LIKE CONCAT('INV-', :year, '-%')
        """, nativeQuery = true)
    int findMaxSequenceForYear(@Param("year") int year);
}
