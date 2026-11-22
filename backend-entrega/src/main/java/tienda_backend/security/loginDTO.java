package tienda_backend.security;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record loginDTO(

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "Correo inválido")
    String correo,

    @NotBlank(message = "La contraseña es obligatoria")
    String contrasena

) {
}
