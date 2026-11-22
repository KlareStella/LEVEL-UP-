
package tienda_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tienda_backend.dto.crearBoletaDTO;
import tienda_backend.dto.itemVentaDTO;

import tienda_backend.entidades.boleta;
import tienda_backend.entidades.detalleBoleta;
import tienda_backend.entidades.producto;
import tienda_backend.entidades.usuario;

import tienda_backend.repository.boletaRepository;
import tienda_backend.repository.productoRepository;
import tienda_backend.repository.usuarioRepository;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import tienda_backend.dto.confirmarBoletaDTO;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;

@Service
public class boletaService {

    private final boletaRepository boletaRepo;
    private final productoRepository productoRepo;
    private final usuarioRepository usuarioRepo;

    public boletaService(
            boletaRepository boletaRepo,
            productoRepository productoRepo,
            usuarioRepository usuarioRepo) {

        this.boletaRepo = boletaRepo;
        this.productoRepo = productoRepo;
        this.usuarioRepo = usuarioRepo;
    }

    @Transactional(readOnly = true)
    public List<boleta> listar() {
        return boletaRepo.findAll();
    }

    @Transactional(readOnly = true)
    public boleta buscarPorId(Long id) {
        return boletaRepo.findById(id)
                .orElseThrow(() ->
                    new IllegalArgumentException(
                        "Boleta no encontrada: " + id
                    )
                );
    }

    @Transactional(readOnly = true)
    public List<boleta> buscarPorUsuario(Long usuarioId) {
        return boletaRepo.findByUsuario_Id(usuarioId);
    }

    @Transactional(readOnly = true)
    public List<boleta> buscarPorEstado(String estado) {
        return boletaRepo.findByEstado(estado);
    }

    @Transactional
    public boleta crear(crearBoletaDTO solicitud) {

        if (solicitud == null ||
            solicitud.usuarioId() == null ||
            solicitud.items() == null ||
            solicitud.items().isEmpty()) {

            throw new IllegalArgumentException(
                "La boleta necesita usuario y productos"
            );
        }

        usuario comprador = usuarioRepo
                .findById(solicitud.usuarioId())
                .orElseThrow(() ->
                    new IllegalArgumentException(
                        "Usuario no encontrado"
                    )
                );

        boleta nueva = new boleta();
        nueva.setUsuario(comprador);
        nueva.setEstado("PENDIENTE");

        BigDecimal total = BigDecimal.ZERO;
        Set<Long> idsProductos = new HashSet<>();

        for (itemVentaDTO item : solicitud.items()) {

            if (item == null ||
                item.productoId() == null ||
                item.cantidad() <= 0) {

                throw new IllegalArgumentException(
                    "Producto o cantidad inválidos"
                );
            }

            if (!idsProductos.add(item.productoId())) {
                throw new IllegalArgumentException(
                    "No se permiten productos repetidos"
                );
            }

            producto encontrado = productoRepo
                    .findById(item.productoId())
                    .orElseThrow(() ->
                        new IllegalArgumentException(
                            "Producto no encontrado: "
                            + item.productoId()
                        )
                    );

            if (encontrado.getStock() < item.cantidad()) {
                throw new IllegalArgumentException(
                    "Stock insuficiente para "
                    + encontrado.getNombre()
                );
            }

            BigDecimal precio = encontrado.getPrecio();

            if (precio == null ||
                precio.compareTo(BigDecimal.ZERO) <= 0) {

                throw new IllegalArgumentException(
                    "Precio de producto inválido"
                );
            }

            BigDecimal subtotal = precio.multiply(
                BigDecimal.valueOf(item.cantidad())
            );

            detalleBoleta detalle = new detalleBoleta();

            detalle.setProducto(encontrado);
            detalle.setCantidad(item.cantidad());
            detalle.setPrecioUnitario(precio);
            detalle.setSubtotal(subtotal);

            nueva.agregarDetalle(detalle);

            total = total.add(subtotal);
        }

        nueva.setTotal(total);

        return boletaRepo.save(nueva);
    }

    @Transactional
    public boleta rechazar(Long id) {

        boleta existente = buscarPorId(id);

        if (!"PENDIENTE".equals(existente.getEstado())) {
            throw new IllegalStateException(
                "Solo se pueden rechazar boletas pendientes"
            );
        }

        existente.setEstado("RECHAZADA");

        return boletaRepo.save(existente);
    }

    @Transactional
    public boleta confirmar(
        Long id,
        confirmarBoletaDTO solicitud) {

    if (solicitud == null ||
        solicitud.descuentoPorcentaje() == null) {
        throw new IllegalArgumentException(
            "Debes indicar el porcentaje de descuento"
        );
    }

    BigDecimal porcentaje = solicitud.descuentoPorcentaje();

    if (porcentaje.compareTo(BigDecimal.ZERO) < 0 ||
        porcentaje.compareTo(new BigDecimal("100")) > 0) {
        throw new IllegalArgumentException(
            "El descuento debe estar entre 0 y 100"
        );
    }

        boleta venta = boletaRepo.buscarParaConfirmar(id)
            .orElseThrow(() ->
        new IllegalArgumentException(
            "Boleta no encontrada: " + id
        )
        );

    if (!"PENDIENTE".equals(venta.getEstado())) {
        throw new IllegalStateException(
            "La boleta ya fue procesada"
        );
    }

    List<detalleBoleta> detalles =
        new ArrayList<>(venta.getDetalles());

    if (detalles.isEmpty()) {
        throw new IllegalArgumentException(
            "La boleta no tiene productos"
        );
    }

    detalles.sort(
        Comparator.comparing(
            d -> d.getProducto().getId()
        )
    );

    BigDecimal subtotalGeneral = BigDecimal.ZERO;

    for (detalleBoleta detalle : detalles) {

        producto p = productoRepo.buscarParaVenta(
            detalle.getProducto().getId()
        ).orElseThrow(() ->
            new IllegalArgumentException(
                "Producto no encontrado"
            )
        );

        int cantidad = detalle.getCantidad();

        if (cantidad <= 0) {
            throw new IllegalArgumentException(
                "Cantidad inválida"
            );
        }

        if (p.getStock() < cantidad) {
            throw new IllegalArgumentException(
                "Stock insuficiente para " + p.getNombre()
            );
        }

        subtotalGeneral = subtotalGeneral.add(
            detalle.getSubtotal()
        );

        p.setStock(p.getStock() - cantidad);
        productoRepo.save(p);
    }

    BigDecimal descuento = subtotalGeneral
        .multiply(porcentaje)
        .divide(
            new BigDecimal("100"),
            2,
            RoundingMode.HALF_UP
        );

    BigDecimal totalFinal = subtotalGeneral
        .subtract(descuento);

    venta.setDescuentoPorcentaje(porcentaje);
    venta.setTotal(totalFinal);
    venta.setEstado("PAGADA");

    return boletaRepo.saveAndFlush(venta);
    }

}
