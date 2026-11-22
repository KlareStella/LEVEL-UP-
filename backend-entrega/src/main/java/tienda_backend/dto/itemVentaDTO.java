
package tienda_backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record itemVentaDTO(
    @NotNull Long productoId,
    @Min(1) int cantidad
) {
}
