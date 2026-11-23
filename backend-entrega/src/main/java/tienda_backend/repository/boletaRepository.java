
package tienda_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import tienda_backend.entidades.boleta;

import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface boletaRepository
        extends JpaRepository<boleta, Long> {

    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM boleta b WHERE b.id = :id")
    Optional<boleta> buscarParaConfirmar(
        @Param("id") Long id
    );


    @EntityGraph(attributePaths = {
        "usuario", "detalles", "detalles.producto"
    })
    List<boleta> findAll();

    @Override
    @EntityGraph(attributePaths = {
        "usuario", "detalles", "detalles.producto"
    })
    Optional<boleta> findById(Long id);

    @EntityGraph(attributePaths = {
        "usuario", "detalles", "detalles.producto"
    })
    List<boleta> findByUsuario_Id(Long usuarioId);

    @EntityGraph(attributePaths = {
        "usuario", "detalles", "detalles.producto"
    })
    List<boleta> findByEstado(String estado);
}
