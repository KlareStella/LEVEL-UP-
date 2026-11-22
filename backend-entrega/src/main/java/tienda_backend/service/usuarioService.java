
package tienda_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import tienda_backend.entidades.usuario;
import tienda_backend.dto.registroUsuarioDTO;
import tienda_backend.repository.usuarioRepository;

import java.util.List;

@Service
public class usuarioService {

    private final usuarioRepository repository;

    private final BCryptPasswordEncoder encoder =
            new BCryptPasswordEncoder();

    public usuarioService(usuarioRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<usuario> listar() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public usuario buscarPorId(Long id) {
        return repository.findById(id)
            .orElseThrow(() ->
                new IllegalArgumentException(
                    "Usuario no encontrado: " + id
                )
            );
    }

    @Transactional(readOnly = true)
    public usuario buscarPorCorreo(String correo) {
        return repository.findByCorreo(correo)
            .orElseThrow(() ->
                new IllegalArgumentException(
                    "Usuario no encontrado"
                )
            );
    }

    @Transactional
    public usuario registrar(registroUsuarioDTO datos) {

        if (datos == null ||
            datos.nombre() == null ||
            datos.nombre().isBlank() ||
            datos.correo() == null ||
            datos.correo().isBlank() ||
            datos.contrasena() == null ||
            datos.contrasena().length() < 8) {

            throw new IllegalArgumentException(
                "Datos de registro inválidos"
            );
        }

        String correo = datos.correo().trim().toLowerCase();

        if (repository.existsByCorreo(correo)) {
            throw new IllegalArgumentException(
                "El correo ya está registrado"
            );
        }

        usuario nuevo = new usuario();

        nuevo.setNombre(datos.nombre().trim());
        nuevo.setCorreo(correo);

        // Nunca guardamos la contraseña original
        nuevo.setContrasena(
            encoder.encode(datos.contrasena())
        );

        // Rol predeterminado para registros
        nuevo.setRol("CLIENTE");

        return repository.save(nuevo);
    }

    @Transactional
    public usuario actualizar(Long id, usuario datos) {

        usuario existente = buscarPorId(id);

        if (datos.getNombre() == null ||
            datos.getNombre().isBlank() ||
            datos.getCorreo() == null ||
            datos.getCorreo().isBlank()) {

            throw new IllegalArgumentException(
                "Nombre y correo son obligatorios"
            );
        }

        String nuevoCorreo =
            datos.getCorreo().trim().toLowerCase();

        if (!existente.getCorreo().equals(nuevoCorreo) &&
            repository.existsByCorreo(nuevoCorreo)) {

            throw new IllegalArgumentException(
                "El correo ya está registrado"
            );
        }

        existente.setNombre(datos.getNombre().trim());
        existente.setCorreo(nuevoCorreo);

        // No cambiamos rol ni contraseña desde aquí
        return repository.save(existente);
    }

    @Transactional
    public void eliminar(Long id) {
        usuario existente = buscarPorId(id);
        repository.delete(existente);
    }
}
