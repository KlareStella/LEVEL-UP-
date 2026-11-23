
package tienda_backend.controller;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import tienda_backend.dto.registroUsuarioDTO;
import tienda_backend.dto.usuarioRespuestaDTO;
import tienda_backend.entidades.usuario;
import tienda_backend.service.usuarioService;
import tienda_backend.dto.actualizarUsuarioDTO;

@RestController
@RequestMapping("/api/v1/usuarios")
public class usuarioController {

    private final usuarioService service;

    public usuarioController(usuarioService service) {
        this.service = service;
    }

    private usuarioRespuestaDTO convertir(usuario u) {
        return new usuarioRespuestaDTO(
            u.getId(),
            u.getNombre(),
            u.getCorreo(),
            u.getRol()
        );
    }

    @PostMapping("/registro")
    public ResponseEntity<usuarioRespuestaDTO> registrar(
            @Valid @RequestBody registroUsuarioDTO datos) {

        usuario creado = service.registrar(datos);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(convertir(creado));
    }

@GetMapping
public java.util.List<usuarioRespuestaDTO> listar() {
    return service.listar()
        .stream()
        .map(this::convertir)
        .toList();
}

@GetMapping("/{id}")
public usuarioRespuestaDTO buscar(@PathVariable Long id) {
    return convertir(service.buscarPorId(id));
}

@PutMapping("/{id}")
public usuarioRespuestaDTO actualizar(
        @PathVariable Long id,
        @Valid @RequestBody actualizarUsuarioDTO datos) {

    usuario cambios = new usuario();
    cambios.setNombre(datos.nombre());
    cambios.setCorreo(datos.correo());

    return convertir(service.actualizar(id, cambios));
}

@DeleteMapping("/{id}")
public ResponseEntity<Void> eliminar(
        @PathVariable Long id) {

    service.eliminar(id);

    return ResponseEntity.noContent().build();
}

}
