
package tienda_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record actualizarUsuarioDTO(
    @NotBlank String nombre,
    @NotBlank @Email String correo
) {
}
