
package tienda_backend.controller;

import tienda_backend.entidades.producto;
import tienda_backend.service.productoService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/productos")
public class productoController {

    private final productoService service;

    public productoController(productoService service) {
        this.service = service;
    }

    // DTO para evitar relaciones circulares en JSON
    public record productoRespuesta(
        Long id,
        String nombre,
        BigDecimal precio,
        int stock,
        Long categoriaId
    ) {}

    private productoRespuesta convertir(producto p) {
        return new productoRespuesta(
            p.getId(),
            p.getNombre(),
            p.getPrecio(),
            p.getStock(),
            p.getCategoria().getId()
        );
    }

    // GET: listar productos
    @GetMapping
    public List<productoRespuesta> listar() {
        return service.listar()
            .stream()
            .map(this::convertir)
            .toList();
    }

    // GET: buscar producto
    @GetMapping("/{id}")
    public productoRespuesta buscar(@PathVariable Long id) {
        return convertir(service.buscarPorId(id));
    }

    // GET: buscar por nombre
    @GetMapping("/buscar")
    public List<productoRespuesta> buscarPorNombre(
        @RequestParam String nombre
    ) {
        return service.buscarPorNombre(nombre)
            .stream()
            .map(this::convertir)
            .toList();
    }

    // GET: productos de una categoría
    @GetMapping("/categoria/{id}")
    public List<productoRespuesta> porCategoria(
        @PathVariable Long id
    ) {
        return service.buscarPorCategoria(id)
            .stream()
            .map(this::convertir)
            .toList();
    }

    // POST: crear producto
    @PostMapping
    public ResponseEntity<productoRespuesta> crear(
        @Valid @RequestBody producto datos
    ) {
        producto creado = service.guardar(datos);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(convertir(creado));
    }

    // PUT: actualizar producto
    @PutMapping("/{id}")
    public productoRespuesta actualizar(
        @PathVariable Long id,
        @Valid @RequestBody producto datos
    ) {
        return convertir(service.actualizar(id, datos));
    }

    // DELETE: eliminar producto
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
        @PathVariable Long id
    ) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
