
package tienda_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tienda_backend.entidades.producto;
import java.util.List;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface productoRepository
        extends JpaRepository<producto, Long> {


@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT p FROM producto p WHERE p.id = :id")
Optional<producto> buscarParaVenta(
    @Param("id") Long id
);


    List<producto> findByNombreContainingIgnoreCase(
        String nombre
    );

    List<producto> findByCategoria_Id(Long categoriaId);
}
