
package tienda_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tienda_backend.entidades.categoria;
import tienda_backend.repository.categoriaRepository;

import java.util.List;

@Service
public class categoriaService {

    private final categoriaRepository repository;

    public categoriaService(categoriaRepository repository) {
        this.repository = repository;
    }

    // Obtener todas las categorias
    @Transactional(readOnly = true)
    public List<categoria> listar() {
        return repository.findAll();
    }

    // Buscar categoria por ID
    @Transactional(readOnly = true)
    public categoria buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                    new IllegalArgumentException(
                        "Categoria no encontrada: " + id
                    )
                );
    }

    // Crear categoria
    @Transactional
    public categoria guardar(categoria nuevaCategoria) {
        if (nuevaCategoria.getNombre() == null ||
            nuevaCategoria.getNombre().isBlank()) {
            throw new IllegalArgumentException(
                "El nombre de la categoria es obligatorio"
            );
        }

        nuevaCategoria.setId(null);
        return repository.save(nuevaCategoria);
    }

    // Actualizar categoria
    @Transactional
    public categoria actualizar(Long id, categoria datos) {

        categoria existente = buscarPorId(id);

        if (datos.getNombre() == null ||
            datos.getNombre().isBlank()) {
            throw new IllegalArgumentException(
                "El nombre de la categoria es obligatorio"
            );
        }

        existente.setNombre(datos.getNombre());
        existente.setDescripcion(datos.getDescripcion());

        return repository.save(existente);
    }

    // Eliminar categoria
    @Transactional
    public void eliminar(Long id) {
        categoria existente = buscarPorId(id);
        repository.delete(existente);
    }
}
