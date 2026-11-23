package tienda_backend.security;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import tienda_backend.dto.registroUsuarioDTO;

@RestController
@RequestMapping("/api/v1/auth")
public class authController {

    private final authService service;

    public authController(authService service) {
        this.service = service;
    }

    @PostMapping("/login")
    public authRespuestaDTO login(@Valid @RequestBody loginDTO datos) {
        return service.login(datos);
    }

    @PostMapping("/register")
    public ResponseEntity<authRespuestaDTO> register(
            @Valid @RequestBody registroUsuarioDTO datos) {

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(service.registrar(datos));
    }

    @PostMapping("/refresh")
    public authRespuestaDTO refresh(@Valid @RequestBody refreshDTO datos) {
        return service.renovar(datos);
    }
}
