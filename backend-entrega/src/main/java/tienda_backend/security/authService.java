package tienda_backend.security;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;

import tienda_backend.dto.registroUsuarioDTO;
import tienda_backend.dto.usuarioRespuestaDTO;
import tienda_backend.entidades.usuario;
import tienda_backend.exception.noAutorizadoException;
import tienda_backend.repository.usuarioRepository;
import tienda_backend.service.usuarioService;

@Service
public class authService {

    private final usuarioRepository repositorio;
    private final usuarioService usuarios;
    private final PasswordEncoder encoder;
    private final jwtService jwt;

    public authService(
            usuarioRepository repositorio,
            usuarioService usuarios,
            PasswordEncoder encoder,
            jwtService jwt) {

        this.repositorio = repositorio;
        this.usuarios = usuarios;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    public authRespuestaDTO login(loginDTO datos) {

        String correo = datos.correo().trim().toLowerCase();

        // Mismo mensaje si el correo no existe o la clave es incorrecta
        usuario u = repositorio.findByCorreo(correo)
            .filter(x -> encoder.matches(datos.contrasena(), x.getContrasena()))
            .orElseThrow(() ->
                new noAutorizadoException("Correo o contraseña incorrectos"));

        return construirRespuesta(u);
    }

    // El rol siempre es CLIENTE (lo fija usuarioService.registrar)
    public authRespuestaDTO registrar(registroUsuarioDTO datos) {
        return construirRespuesta(usuarios.registrar(datos));
    }

    public authRespuestaDTO renovar(refreshDTO datos) {

        Jwt token;

        try {
            token = jwt.validarRefresh(datos.refreshToken());
        } catch (JwtException e) {
            throw new noAutorizadoException(
                "Refresh token inválido o expirado");
        }

        // Se vuelve a leer el usuario: si lo borraron o cambió de rol, se nota
        usuario u = repositorio.findByCorreo(token.getSubject())
            .orElseThrow(() ->
                new noAutorizadoException("Usuario no válido"));

        return construirRespuesta(u);
    }

    private authRespuestaDTO construirRespuesta(usuario u) {
        return new authRespuestaDTO(
            jwt.generarAcceso(u),
            jwt.generarRefresh(u),
            "Bearer",
            jwt.segundosAcceso(),
            new usuarioRespuestaDTO(
                u.getId(), u.getNombre(), u.getCorreo(), u.getRol())
        );
    }
}
