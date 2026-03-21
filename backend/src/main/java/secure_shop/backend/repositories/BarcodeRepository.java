package secure_shop.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import secure_shop.backend.entities.Barcode;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BarcodeRepository extends JpaRepository<Barcode, Long> {
    Optional<Barcode> findByBarcode(String barcode);
    boolean existsByBarcode(String barcode);
    List<Barcode> findByProductIdOrderByCreatedAtDesc(UUID productId);
}

