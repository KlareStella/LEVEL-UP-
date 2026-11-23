
package tienda_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tienda_backend.entidades.producto;
import tienda_backend.entidades.categoria;
import tienda_backend.repository.productoRepository;
import tienda_backend.repository.categoriaRepository;

import java.math.BigDecimal;
import java.util.List;
import tienda_backend.exception.recursoNoEncontradoException;

@Service
public class productoService {

    private final productoRepository repository;
    private final categoriaRepository categoriaRepo;

    public productoService(
        productoRepository repository,
        categoriaRepository categoriaRepo
    ) {
        this.repository = repository;
        this.categoriaRepo = categoriaRepo;
    }

    @Transactional(readOnly = true)
    public List<producto> listar() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public producto buscarPorId(Long id) {
        return repository.findById(id)
        .orElseThrow(() ->
            new recursoNoEncontradoException(
                "Producto no encontrado: " + id
            )
        );
        

    }

    @Transactional(readOnly = true)
    public List<producto> buscarPorNombre(String nombre) {
        return repository.findByNombreContainingIgnoreCase(nombre);
    }

    @Transactional(readOnly = true)
    public List<producto> buscarPorCategoria(Long categoriaId) {
        return repository.findByCategoria_Id(categoriaId);
    }

    private void validar(producto datos) {

        if (datos.getNombre() == null ||
            datos.getNombre().isBlank()) {
            throw new IllegalArgumentException(
                "El nombre del producto es obligatorio"
            );
        }

        if (datos.getPrecio() == null ||
            datos.getPrecio().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                "El precio debe ser mayor que cero"
            );
        }

        if (datos.getStock() < 0) {
            throw new IllegalArgumentException(
                "El stock no puede ser negativo"
            );
        }

        if (datos.getCategoria() == null ||
            datos.getCategoria().getId() == null) {
            throw new IllegalArgumentException(
                "La categoría es obligatoria"
            );
        }
    }

    private categoria obtenerCategoria(Long id) {
        return categoriaRepo.findById(id)
            .orElseThrow(() ->
                new IllegalArgumentException(
                    "Categoría no encontrada: " + id
                )
            );
    }

    @Transactional
    public producto guardar(producto nuevo) {

        validar(nuevo);

        categoria categoriaExistente = obtenerCategoria(
            nuevo.getCategoria().getId()
        );

        nuevo.setId(null);
        nuevo.setCategoria(categoriaExistente);

        return repository.save(nuevo);
    }

    @Transactional
    public producto actualizar(Long id, producto datos) {

        validar(datos);

        producto existente = buscarPorId(id);

        categoria categoriaExistente = obtenerCategoria(
            datos.getCategoria().getId()
        );

        existente.setNombre(datos.getNombre());
        existente.setPrecio(datos.getPrecio());
        existente.setStock(datos.getStock());
        existente.setCategoria(categoriaExistente);

        return repository.save(existente);
    }

    @Transactional
    public void eliminar(Long id) {
        producto existente = buscarPorId(id);
        repository.delete(existente);
    }
}
