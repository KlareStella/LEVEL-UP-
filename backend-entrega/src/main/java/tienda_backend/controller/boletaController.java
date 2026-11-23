
package tienda_backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
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

    // ---------- Control de acceso por rol ----------

    private static final String CORREO_DUOC = "@duoc.cl";
    private static final BigDecimal DESCUENTO_DUOC = new BigDecimal("20");

    // ADMIN y VENDEDOR pueden operar sobre cualquier boleta
    private boolean esPersonal(Jwt jwt) {
        List<String> roles = jwt.getClaimAsStringList("roles");
        return roles != null
            && (roles.contains("ADMIN") || roles.contains("VENDEDOR"));
    }

    // Un CLIENTE solo puede operar sobre sus propias boletas
    private void exigirDueno(Jwt jwt, Long usuarioId) {
        if (esPersonal(jwt)) return;

        Number uid = jwt.getClaim("uid");

        if (uid == null || usuarioId == null
                || uid.longValue() != usuarioId) {
            throw new AccessDeniedException(
                "No puedes acceder a boletas de otro usuario");
        }
    }

    @GetMapping
    public List<boletaRespuesta> listar() {
        return service.listar()
            .stream()
            .map(this::convertir)
            .toList();
    }

    @GetMapping("/{id}")
    public boletaRespuesta buscar(
        @PathVariable Long id,
        @AuthenticationPrincipal Jwt jwt
    ) {
        boleta b = service.buscarPorId(id);
        exigirDueno(jwt, b.getUsuario().getId());
        return convertir(b);
    }

    @GetMapping("/usuario/{id}")
    public List<boletaRespuesta> porUsuario(
        @PathVariable Long id,
        @AuthenticationPrincipal Jwt jwt
    ) {
        exigirDueno(jwt, id);
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
        @Valid @RequestBody crearBoletaDTO solicitud,
        @AuthenticationPrincipal Jwt jwt
    ) {
        exigirDueno(jwt, solicitud.usuarioId());
        boleta creada = service.crear(solicitud);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(convertir(creada));
    }

    @PatchMapping("/{id}/rechazar")
    public boletaRespuesta rechazar(
        @PathVariable Long id,
        @AuthenticationPrincipal Jwt jwt
    ) {
        exigirDueno(jwt, service.buscarPorId(id).getUsuario().getId());
        return convertir(service.rechazar(id));
    }

    @PatchMapping("/{id}/confirmar")
    public boletaRespuesta confirmar(
        @PathVariable Long id,
        @Valid @RequestBody confirmarBoletaDTO datos,
        @AuthenticationPrincipal Jwt jwt) {

        boleta existente = service.buscarPorId(id);
        exigirDueno(jwt, existente.getUsuario().getId());

        // Un cliente NO elige su descuento: lo fija el servidor
        // (20% si el correo es @duoc.cl, 0% en otro caso).
        if (!esPersonal(jwt)) {
            boolean esDuoc = existente.getUsuario().getCorreo()
                .toLowerCase().endsWith(CORREO_DUOC);

            datos = new confirmarBoletaDTO(
                esDuoc ? DESCUENTO_DUOC : BigDecimal.ZERO);
        }

        return convertir(service.confirmar(id, datos));
    }

}
