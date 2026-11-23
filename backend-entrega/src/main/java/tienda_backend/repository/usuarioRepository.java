
package tienda_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tienda_backend.entidades.usuario;
import java.util.Optional;

public interface usuarioRepository
        extends JpaRepository<usuario, Long> {

    Optional<usuario> findByCorreo(String correo);

    boolean existsByCorreo(String correo);
}
