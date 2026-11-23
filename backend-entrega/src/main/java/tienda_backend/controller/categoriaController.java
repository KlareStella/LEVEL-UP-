
package tienda_backend.controller;

import tienda_backend.entidades.categoria;
import tienda_backend.service.categoriaService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categorias")
public class categoriaController {

    private final categoriaService service;

    public categoriaController(categoriaService service) {
        this.service = service;
    }

    // GET: listar todas las categorías
    @GetMapping
    public List<categoria> listar() {
        return service.listar();
    }

    // GET: buscar categoría por ID
    @GetMapping("/{id}")
    public categoria buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    // POST: crear una categoría
    @PostMapping
    public ResponseEntity<categoria> crear(
            @Valid @RequestBody categoria datos) {

        categoria creada = service.guardar(datos);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(creada);
    }

    // PUT: actualizar una categoría
    @PutMapping("/{id}")
    public categoria actualizar(
            @PathVariable Long id,
            @Valid @RequestBody categoria datos) {

        return service.actualizar(id, datos);
    }

    // DELETE: eliminar una categoría
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id) {

        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
