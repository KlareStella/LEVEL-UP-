package tienda_backend.security;

import com.nimbusds.jose.jwk.source.ImmutableSecret;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Service;

import tienda_backend.entidades.usuario;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Genera y valida los JWT (HS256).
 * - Token de acceso: corto (15 min por defecto), se envía en cada petición.
 * - Token de refresco: largo (7 días por defecto), solo sirve para /auth/refresh.
 */
@Service
public class jwtService {

    public static final String TIPO_ACCESO = "access";
    public static final String TIPO_REFRESH = "refresh";

    private final JwtEncoder encoder;
    private final NimbusJwtDecoder decoderAcceso;
    private final NimbusJwtDecoder decoderRefresh;
    private final long minutosAcceso;
    private final long diasRefresh;

    public jwtService(
            @Value("${jwt.secret}") String secreto,
            @Value("${jwt.access-minutes:15}") long minutosAcceso,
            @Value("${jwt.refresh-days:7}") long diasRefresh) {

        byte[] bytes = secreto.getBytes(StandardCharsets.UTF_8);

        if (bytes.length < 32) {
            throw new IllegalStateException(
                "jwt.secret debe tener al menos 32 caracteres");
        }

        SecretKey clave = new SecretKeySpec(bytes, "HmacSHA256");

        this.encoder = new NimbusJwtEncoder(new ImmutableSecret<>(clave));
        this.decoderAcceso = crearDecoder(clave, TIPO_ACCESO);
        this.decoderRefresh = crearDecoder(clave, TIPO_REFRESH);
        this.minutosAcceso = minutosAcceso;
        this.diasRefresh = diasRefresh;
    }

    // Decoder que verifica firma, expiración y el tipo de token
    private static NimbusJwtDecoder crearDecoder(SecretKey clave, String tipo) {

        NimbusJwtDecoder decoder = NimbusJwtDecoder
            .withSecretKey(clave)
            .macAlgorithm(MacAlgorithm.HS256)
            .build();

        OAuth2TokenValidator<Jwt> validaTipo = jwt ->
            tipo.equals(jwt.getClaimAsString("tipo"))
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(
                    new OAuth2Error("invalid_token",
                        "Tipo de token incorrecto", null));

        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
            JwtValidators.createDefault(), validaTipo));

        return decoder;
    }

    public String generarAcceso(usuario u) {
        return generar(u, TIPO_ACCESO, Duration.ofMinutes(minutosAcceso));
    }

    public String generarRefresh(usuario u) {
        return generar(u, TIPO_REFRESH, Duration.ofDays(diasRefresh));
    }

    private String generar(usuario u, String tipo, Duration vida) {

        Instant ahora = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("level-up-backend")
            .subject(u.getCorreo())
            .issuedAt(ahora)
            .expiresAt(ahora.plus(vida))
            .claim("tipo", tipo)
            .claim("uid", u.getId())
            .claim("roles", List.of(u.getRol()))
            .build();

        JwsHeader cabecera = JwsHeader.with(MacAlgorithm.HS256).build();

        return encoder
            .encode(JwtEncoderParameters.from(cabecera, claims))
            .getTokenValue();
    }

    // Lanzan JwtException si el token es inválido, expiró o es de otro tipo
    public Jwt validarAcceso(String token) {
        return decoderAcceso.decode(token);
    }

    public Jwt validarRefresh(String token) {
        return decoderRefresh.decode(token);
    }

    // Lo usa Spring Security para validar el Bearer de cada petición
    public JwtDecoder decoderAcceso() {
        return decoderAcceso;
    }

    public long segundosAcceso() {
        return Duration.ofMinutes(minutosAcceso).toSeconds();
    }
}
