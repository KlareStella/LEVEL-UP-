
package tienda_backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class swaggerConfig {

    @Bean
    public OpenAPI configurarAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("API Sistema de Ventas")
                .version("1.0.0")
                .description(
                    "Backend desarrollado con Spring Boot, " +
                    "Spring Data JPA y MySQL. " +
                    "Permite gestionar usuarios, categorias, " +
                    "productos y boletas."
                )
            );
    }
}
