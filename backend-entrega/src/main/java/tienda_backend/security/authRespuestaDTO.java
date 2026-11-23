package tienda_backend.security;

import tienda_backend.dto.usuarioRespuestaDTO;

public record authRespuestaDTO(
    String accessToken,
    String refreshToken,
    String tipoToken,
    long expiraEnSegundos,
    usuarioRespuestaDTO usuario
) {
}
