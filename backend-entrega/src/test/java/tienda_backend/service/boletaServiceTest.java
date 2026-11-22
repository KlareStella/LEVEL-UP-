
package tienda_backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import tienda_backend.dto.crearBoletaDTO;
import tienda_backend.dto.itemVentaDTO;
import tienda_backend.dto.confirmarBoletaDTO;

import tienda_backend.entidades.boleta;
import tienda_backend.entidades.detalleBoleta;
import tienda_backend.entidades.producto;
import tienda_backend.entidades.usuario;

import tienda_backend.repository.boletaRepository;
import tienda_backend.repository.productoRepository;
import tienda_backend.repository.usuarioRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class boletaServiceTest {

    @Mock
    private boletaRepository boletaRepo;

    @Mock
    private productoRepository productoRepo;

    @Mock
    private usuarioRepository usuarioRepo;

    private boletaService service;

    @BeforeEach
    void preparar() {
        MockitoAnnotations.openMocks(this);

        service = new boletaService(
            boletaRepo,
            productoRepo,
            usuarioRepo
        );
    }

    private producto crearProducto() {
        producto p = new producto();
        p.setId(1L);
        p.setNombre("Mouse Gamer");
        p.setPrecio(new BigDecimal("15990"));
        p.setStock(20);
        return p;
    }

    private boleta crearBoletaPendiente(producto p) {

        boleta b = new boleta();
        b.setId(1L);

        detalleBoleta detalle = new detalleBoleta();
        detalle.setProducto(p);
        detalle.setCantidad(2);
        detalle.setPrecioUnitario(p.getPrecio());
        detalle.setSubtotal(new BigDecimal("31980"));

        b.agregarDetalle(detalle);
        b.setTotal(new BigDecimal("31980"));

        return b;
    }

    @Test
    void debeCalcularTotalAlCrearBoleta() {

        usuario u = new usuario();
        u.setId(1L);

        producto p = crearProducto();

        when(usuarioRepo.findById(1L))
            .thenReturn(Optional.of(u));

        when(productoRepo.findById(1L))
            .thenReturn(Optional.of(p));

        when(boletaRepo.save(any(boleta.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        crearBoletaDTO solicitud = new crearBoletaDTO(
            1L,
            List.of(new itemVentaDTO(1L, 2))
        );

        boleta resultado = service.crear(solicitud);

        assertEquals(
            0,
            new BigDecimal("31980")
                .compareTo(resultado.getTotal())
        );

        assertEquals("PENDIENTE", resultado.getEstado());
        assertEquals(1, resultado.getDetalles().size());

        // Crear una boleta no descuenta stock
        assertEquals(20, p.getStock());
    }

    @Test
    void debeRechazarStockInsuficiente() {

        usuario u = new usuario();
        u.setId(1L);

        producto p = crearProducto();
        p.setStock(1);

        when(usuarioRepo.findById(1L))
            .thenReturn(Optional.of(u));

        when(productoRepo.findById(1L))
            .thenReturn(Optional.of(p));

        crearBoletaDTO solicitud = new crearBoletaDTO(
            1L,
            List.of(new itemVentaDTO(1L, 2))
        );

        assertThrows(
            IllegalArgumentException.class,
            () -> service.crear(solicitud)
        );

        verify(boletaRepo, never())
            .save(any(boleta.class));
    }

    @Test
    void debeAplicarDescuentoYDescontarStock() {

        producto p = crearProducto();
        boleta b = crearBoletaPendiente(p);

        when(boletaRepo.buscarParaConfirmar(1L))
            .thenReturn(Optional.of(b));

        when(productoRepo.buscarParaVenta(1L))
            .thenReturn(Optional.of(p));

        when(productoRepo.save(any(producto.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        when(boletaRepo.saveAndFlush(any(boleta.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        confirmarBoletaDTO solicitud =
            new confirmarBoletaDTO(new BigDecimal("10"));

        boleta resultado = service.confirmar(1L, solicitud);

        assertEquals("PAGADA", resultado.getEstado());

        assertEquals(
            0,
            new BigDecimal("28782")
                .compareTo(resultado.getTotal())
        );

        assertEquals(18, p.getStock());

        assertEquals(
            0,
            new BigDecimal("10")
                .compareTo(resultado.getDescuentoPorcentaje())
        );

        verify(productoRepo).save(p);
        verify(boletaRepo).saveAndFlush(b);
    }

    @Test
    void debeImpedirConfirmarBoletaPagada() {

        producto p = crearProducto();
        boleta b = crearBoletaPendiente(p);

        b.setEstado("PAGADA");

        when(boletaRepo.buscarParaConfirmar(1L))
            .thenReturn(Optional.of(b));

        confirmarBoletaDTO solicitud =
            new confirmarBoletaDTO(new BigDecimal("10"));

        assertThrows(
            IllegalStateException.class,
            () -> service.confirmar(1L, solicitud)
        );

        assertEquals(20, p.getStock());

        verify(productoRepo, never())
            .save(any(producto.class));

        verify(boletaRepo, never())
            .saveAndFlush(any(boleta.class));
    }
}
