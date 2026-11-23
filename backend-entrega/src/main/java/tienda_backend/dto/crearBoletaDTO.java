
package tienda_backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record crearBoletaDTO(
    @NotNull Long usuarioId,
    @NotEmpty List<@NotNull @Valid itemVentaDTO> items
) {
}
