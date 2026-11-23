
package tienda_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tienda_backend.entidades.detalleBoleta;
import java.util.List;

public interface detalleBoletaRepository
        extends JpaRepository<detalleBoleta, Long> {

    List<detalleBoleta> findByBoleta_Id(Long boletaId);
}
