
package tienda_backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import tienda_backend.dto.crearBoletaDTO;
import tienda_backend.entidades.boleta;
import tienda_backend.entidades.detalleBoleta;
import tienda_backend.service.boletaService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import tienda_backend.dto.confirmarBoletaDTO;

@RestController
@RequestMapping("/api/v1/boletas")
public class boletaController {

    private final boletaService service;

    public boletaController(boletaService service) {
        this.service = service;
    }

    public record detalleRespuesta(
        Long productoId,
        String nombreProducto,
        int cantidad,
        BigDecimal precioUnitario,
        BigDecimal subtotal
    ) {}

    public record boletaRespuesta(
        Long id,
        Long usuarioId,
        LocalDateTime fecha,
        BigDecimal total,
        String estado,
        List<detalleRespuesta> detalles
    ) {}

    private boletaRespuesta convertir(boleta b) {

        List<detalleRespuesta> detalles = b.getDetalles()
            .stream()
            .map(this::convertirDetalle)
            .toList();

        return new boletaRespuesta(
            b.getId(),
            b.getUsuario().getId(),
            b.getFecha(),
            b.getTotal(),
            b.getEstado(),
            detalles
        );
    }

    private detalleRespuesta convertirDetalle(detalleBoleta d) {
        return new detalleRespuesta(
            d.getProducto().getId(),
            d.getProducto().getNombre(),
            d.getCantidad(),
            d.getPrecioUnitario(),
            d.getSubtotal()
        );
    }

    @GetMapping
    public List<boletaRespuesta> listar() {
        return service.listar()
            .stream()
            .map(this::convertir)
            .toList();
    }

    @GetMapping("/{id}")
    public boletaRespuesta buscar(@PathVariable Long id) {
        return convertir(service.buscarPorId(id));
    }

    @GetMapping("/usuario/{id}")
    public List<boletaRespuesta> porUsuario(
        @PathVariable Long id
    ) {
        return service.buscarPorUsuario(id)
            .stream()
            .map(this::convertir)
            .toList();
    }

    @GetMapping("/estado/{estado}")
    public List<boletaRespuesta> porEstado(
        @PathVariable String estado
    ) {
        return service.buscarPorEstado(estado)
            .stream()
            .map(this::convertir)
            .toList();
    }

    @PostMapping
    public ResponseEntity<boletaRespuesta> crear(
        @Valid @RequestBody crearBoletaDTO solicitud
    ) {
        boleta creada = service.crear(solicitud);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(convertir(creada));
    }

    @PatchMapping("/{id}/rechazar")
    public boletaRespuesta rechazar(@PathVariable Long id) {
        return convertir(service.rechazar(id));
    }

    @PatchMapping("/{id}/confirmar")
    public boletaRespuesta confirmar(
        @PathVariable Long id,
        @Valid @RequestBody confirmarBoletaDTO datos) {

    return convertir(service.confirmar(id, datos));
    }

}
