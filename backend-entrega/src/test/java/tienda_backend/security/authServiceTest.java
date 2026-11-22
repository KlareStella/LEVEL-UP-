package tienda_backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import tienda_backend.dto.registroUsuarioDTO;
import tienda_backend.entidades.usuario;
import tienda_backend.exception.noAutorizadoException;
import tienda_backend.repository.usuarioRepository;
import tienda_backend.service.usuarioService;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class authServiceTest {

    @Mock
    private usuarioRepository repositorio;

    @Mock
    private usuarioService usuarios;

    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    private jwtService jwt;
    private authService service;
    private usuario vendedor;

    @BeforeEach
    void preparar() {
        MockitoAnnotations.openMocks(this);

        jwt = new jwtService(
            "clave-de-prueba-con-mas-de-32-caracteres-ok", 15, 7);

        service = new authService(repositorio, usuarios, encoder, jwt);

        vendedor = new usuario();
        vendedor.setId(2L);
        vendedor.setNombre("Vendedor");
        vendedor.setCorreo("vendedor@tienda.local");
        vendedor.setContrasena(encoder.encode("clave12345"));
        vendedor.setRol("VENDEDOR");
    }

    @Test
    void loginCorrectoEntregaTokensYUsuario() {

        when(repositorio.findByCorreo("vendedor@tienda.local"))
            .thenReturn(Optional.of(vendedor));

        authRespuestaDTO r = service.login(
            new loginDTO("  Vendedor@Tienda.local ", "clave12345"));

        assertEquals("Bearer", r.tipoToken());
        assertEquals("VENDEDOR", r.usuario().rol());
        assertEquals(900, r.expiraEnSegundos());
        assertEquals("vendedor@tienda.local",
            jwt.validarAcceso(r.accessToken()).getSubject());
        assertEquals("vendedor@tienda.local",
            jwt.validarRefresh(r.refreshToken()).getSubject());
    }

    @Test
    void loginConContrasenaIncorrectaFalla() {

        when(repositorio.findByCorreo("vendedor@tienda.local"))
            .thenReturn(Optional.of(vendedor));

        assertThrows(noAutorizadoException.class, () ->
            service.login(new loginDTO("vendedor@tienda.local", "otraClave")));
    }

    @Test
    void loginConCorreoInexistenteFalla() {

        when(repositorio.findByCorreo("nadie@tienda.local"))
            .thenReturn(Optional.empty());

        assertThrows(noAutorizadoException.class, () ->
            service.login(new loginDTO("nadie@tienda.local", "clave12345")));
    }

    @Test
    void registroEntregaTokensConRolCliente() {

        usuario nuevo = new usuario();
        nuevo.setId(3L);
        nuevo.setNombre("Ana");
        nuevo.setCorreo("ana@gmail.com");
        nuevo.setRol("CLIENTE");

        registroUsuarioDTO datos =
            new registroUsuarioDTO("Ana", "ana@gmail.com", "clave12345");

        when(usuarios.registrar(datos)).thenReturn(nuevo);

        authRespuestaDTO r = service.registrar(datos);

        assertEquals("CLIENTE", r.usuario().rol());
        assertEquals(java.util.List.of("CLIENTE"),
            jwt.validarAcceso(r.accessToken()).getClaimAsStringList("roles"));
    }

    @Test
    void refreshValidoEntregaNuevoTokenDeAcceso() {

        when(repositorio.findByCorreo("vendedor@tienda.local"))
            .thenReturn(Optional.of(vendedor));

        String refresh = jwt.generarRefresh(vendedor);

        authRespuestaDTO r = service.renovar(new refreshDTO(refresh));

        assertEquals("vendedor@tienda.local",
            jwt.validarAcceso(r.accessToken()).getSubject());
    }

    @Test
    void refreshConTokenDeAccesoFalla() {

        String acceso = jwt.generarAcceso(vendedor);

        assertThrows(noAutorizadoException.class,
            () -> service.renovar(new refreshDTO(acceso)));
    }

    @Test
    void refreshDeUsuarioEliminadoFalla() {

        when(repositorio.findByCorreo("vendedor@tienda.local"))
            .thenReturn(Optional.empty());

        String refresh = jwt.generarRefresh(vendedor);

        assertThrows(noAutorizadoException.class,
            () -> service.renovar(new refreshDTO(refresh)));
    }
}
