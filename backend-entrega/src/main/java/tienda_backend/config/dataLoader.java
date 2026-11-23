
package tienda_backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import tienda_backend.entidades.usuario;
import tienda_backend.entidades.categoria;
import tienda_backend.entidades.producto;

import tienda_backend.repository.usuarioRepository;
import tienda_backend.repository.categoriaRepository;
import tienda_backend.repository.productoRepository;

import java.math.BigDecimal;

@Configuration
@Profile("dev")
public class dataLoader {

    @Bean
    public CommandLineRunner cargarDatos(
            usuarioRepository usuarioRepo,
            categoriaRepository categoriaRepo,
            productoRepository productoRepo) {

        return args -> {

            BCryptPasswordEncoder encoder =
                    new BCryptPasswordEncoder();

            // Contraseñas solo para desarrollo local
            String claveAdmin =
                System.getenv("SEED_ADMIN_PASSWORD");

            String claveVendedor =
                System.getenv("SEED_VENDEDOR_PASSWORD");

            // Crear administrador, si no existe
            if (claveAdmin != null &&
                !claveAdmin.isBlank() &&
                !usuarioRepo.existsByCorreo(
                    "admin@duoc.cl")) {

                usuario admin = new usuario();

                admin.setNombre("Administrador");
                admin.setCorreo("admin@duoc.cl");
                admin.setContrasena(
                    encoder.encode(claveAdmin)
                );
                admin.setRol("ADMIN");

                usuarioRepo.save(admin);
            }

            // Crear vendedor, si no existe
            if (claveVendedor != null &&
                !claveVendedor.isBlank() &&
                !usuarioRepo.existsByCorreo(
                    "vendedor@duoc.cl")) {

                usuario vendedor = new usuario();

                vendedor.setNombre("Vendedor");
                vendedor.setCorreo("vendedor@duoc.cl");
                vendedor.setContrasena(
                    encoder.encode(claveVendedor)
                );
                vendedor.setRol("VENDEDOR");

                usuarioRepo.save(vendedor);
            }

            // Categoría de prueba
            categoria accesorios = categoriaRepo.findAll()
                .stream()
                .filter(c ->
                    "Accesorios PC".equals(c.getNombre())
                )
                .findFirst()
                .orElseGet(() -> {

                    categoria nueva = new categoria();

                    nueva.setNombre("Accesorios PC");
                    nueva.setDescripcion(
                        "Accesorios para computadores"
                    );

                    return categoriaRepo.save(nueva);
                });

            // Producto de prueba
            boolean existeTeclado = productoRepo.findAll()
                .stream()
                .anyMatch(p ->
                    "Teclado Mecanico Demo".equals(
                        p.getNombre()
                    )
                );

            if (!existeTeclado) {

                producto teclado = new producto();

                teclado.setNombre("Teclado Mecanico Demo");
                teclado.setPrecio(
                    new BigDecimal("29990")
                );
                teclado.setStock(15);
                teclado.setCategoria(accesorios);

                productoRepo.save(teclado);
            }

            System.out.println(
                "Datos iniciales de desarrollo verificados"
            );
        };
    }
}
