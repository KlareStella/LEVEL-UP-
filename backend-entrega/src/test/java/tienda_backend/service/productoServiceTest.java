
package tienda_backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import tienda_backend.entidades.categoria;
import tienda_backend.entidades.producto;
import tienda_backend.repository.categoriaRepository;
import tienda_backend.repository.productoRepository;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class productoServiceTest {

    @Mock
    private productoRepository productoRepo;

    @Mock
    private categoriaRepository categoriaRepo;

    private productoService service;

    @BeforeEach
    void preparar() {
        MockitoAnnotations.openMocks(this);

        service = new productoService(
            productoRepo,
            categoriaRepo
        );
    }

    private producto crearProductoValido() {

        categoria cat = new categoria();
        cat.setId(1L);
        cat.setNombre("Tecnologia");

        producto p = new producto();
        p.setNombre("Mouse Gamer");
        p.setPrecio(new BigDecimal("15990"));
        p.setStock(20);
        p.setCategoria(cat);

        return p;
    }

    @Test
    void debeGuardarProductoValido() {

        producto p = crearProductoValido();

        when(categoriaRepo.findById(1L))
            .thenReturn(Optional.of(p.getCategoria()));

        when(productoRepo.save(any(producto.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        producto resultado = service.guardar(p);

        assertNotNull(resultado);
        assertEquals("Mouse Gamer", resultado.getNombre());

        verify(productoRepo, times(1))
            .save(any(producto.class));
    }

    @Test
    void debeRechazarPrecioNegativo() {

        producto p = crearProductoValido();
        p.setPrecio(new BigDecimal("-100"));

        assertThrows(
            IllegalArgumentException.class,
            () -> service.guardar(p)
        );

        verify(productoRepo, never())
            .save(any(producto.class));
    }

    @Test
    void debeRechazarStockNegativo() {

        producto p = crearProductoValido();
        p.setStock(-5);

        assertThrows(
            IllegalArgumentException.class,
            () -> service.guardar(p)
        );

        verify(productoRepo, never())
            .save(any(producto.class));
    }

    @Test
    void debeRechazarCategoriaInexistente() {

        producto p = crearProductoValido();

        when(categoriaRepo.findById(1L))
            .thenReturn(Optional.empty());

        assertThrows(
            IllegalArgumentException.class,
            () -> service.guardar(p)
        );

        verify(productoRepo, never())
            .save(any(producto.class));
    }
}
