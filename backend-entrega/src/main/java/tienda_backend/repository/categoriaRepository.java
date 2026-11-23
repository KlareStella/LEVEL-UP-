
package tienda_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tienda_backend.entidades.categoria;

public interface categoriaRepository
        extends JpaRepository<categoria, Long> {
}
