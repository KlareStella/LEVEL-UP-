
package tienda_backend.dto;

import jakarta.validation.constraints.*;

public record registroUsuarioDTO(

    @NotBlank(message = "El nombre es obligatorio")
    String nombre,

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "Correo inválido")
    String correo,

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, message = "Mínimo 8 caracteres")
    String contrasena

) {
}
