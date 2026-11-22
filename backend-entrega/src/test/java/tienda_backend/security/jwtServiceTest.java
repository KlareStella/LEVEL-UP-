package tienda_backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;

import tienda_backend.entidades.usuario;

import static org.junit.jupiter.api.Assertions.*;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;

public class jwtServiceTest {

    private static final String SECRETO =
        "clave-de-prueba-con-mas-de-32-caracteres-ok";

    private jwtService servicio;
    private usuario admin;

    @BeforeEach
    void preparar() {
        servicio = new jwtService(SECRETO, 15, 7);

        admin = new usuario();
        admin.setId(1L);
        admin.setNombre("Administrador");
        admin.setCorreo("admin@tienda.local");
        admin.setRol("ADMIN");
    }

    @Test
    void tokenDeAccesoContieneUsuarioRolYTipo() {

        Jwt jwt = servicio.validarAcceso(servicio.generarAcceso(admin));

        assertEquals("admin@tienda.local", jwt.getSubject());
        assertEquals("access", jwt.getClaimAsString("tipo"));
        assertEquals(java.util.List.of("ADMIN"),
            jwt.getClaimAsStringList("roles"));
        assertTrue(jwt.getExpiresAt().isAfter(jwt.getIssuedAt()));
    }

    @Test
    void tokenDeRefrescoNoSirveComoAcceso() {

        String refresh = servicio.generarRefresh(admin);

        assertThrows(JwtException.class,
            () -> servicio.validarAcceso(refresh));
        assertEquals("refresh",
            servicio.validarRefresh(refresh).getClaimAsString("tipo"));
    }

    @Test
    void tokenDeAccesoNoSirveComoRefresh() {

        String acceso = servicio.generarAcceso(admin);

        assertThrows(JwtException.class,
            () -> servicio.validarRefresh(acceso));
    }

    @Test
    void tokenFirmadoConOtraClaveEsRechazado() {

        jwtService otro = new jwtService(
            "otra-clave-distinta-de-mas-de-32-caracteres", 15, 7);

        String falso = otro.generarAcceso(admin);

        assertThrows(JwtException.class,
            () -> servicio.validarAcceso(falso));
    }

    @Test
    void tokenExpiradoEsRechazado() {

        // Token firmado con la misma clave, emitido hace 2 h y vencido hace 1 h
        SecretKey clave = new SecretKeySpec(
                SECRETO.getBytes(StandardCharsets.UTF_8), "HmacSHA256");

        JwtEncoder encoder = new NimbusJwtEncoder(new ImmutableSecret<>(clave));

        Instant hace2h = Instant.now().minus(Duration.ofHours(2));

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("level-up-backend")
                .subject("admin@tienda.local")
                .issuedAt(hace2h)
                .expiresAt(hace2h.plus(Duration.ofHours(1)))
                .claim("tipo", "access")
                .build();

        String vencido = encoder
                .encode(JwtEncoderParameters.from(
                        JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();

        assertThrows(JwtException.class,
                () -> servicio.validarAcceso(vencido));
    }

    @Test
    void textoQueNoEsUnTokenEsRechazado() {
        assertThrows(JwtException.class,
            () -> servicio.validarAcceso("esto.no.es-un-jwt"));
    }

    @Test
    void secretoCortoNoPermiteArrancar() {
        assertThrows(IllegalStateException.class,
            () -> new jwtService("corto", 15, 7));
    }
}
