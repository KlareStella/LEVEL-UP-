package tienda_backend.security;

import jakarta.validation.constraints.NotBlank;

public record refreshDTO(

    @NotBlank(message = "El refresh token es obligatorio")
    String refreshToken

) {
}
