package secure_shop.backend.dto.barcode;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateBarcodeRequest {
    @NotBlank(message = "Mã vạch không được để trống")
    private String barcode;

    @NotNull(message = "Sản phẩm không được để trống")
    private UUID productId;

    private String serialNumber;
}
