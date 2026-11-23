
package tienda_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import tienda_backend.repository.usuarioRepository;

@Configuration
public class securityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(
            usuarioRepository usuarioRepo) {

        return correo -> {

            var usuario = usuarioRepo.findByCorreo(correo)
                .orElseThrow(() ->
                    new UsernameNotFoundException(
                        "Usuario no encontrado"
                    )
                );

            return User.withUsername(usuario.getCorreo())
                .password(usuario.getContrasena())
                .roles(usuario.getRol())
                .build();
        };
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )
            .authorizeHttpRequests(auth -> auth

                // Swagger
                .requestMatchers(
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**"
                ).permitAll()

                // Registro de clientes
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/v1/usuarios/registro"
                ).permitAll()

                // Consultas públicas
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/v1/productos/**",
                    "/api/v1/categorias/**"
                ).permitAll()

                // Administración de usuarios
                .requestMatchers(
                    "/api/v1/usuarios/**"
                ).hasRole("ADMIN")

                // Administración de categorías y productos
                .requestMatchers(
                    "/api/v1/productos/**",
                    "/api/v1/categorias/**"
                ).hasRole("ADMIN")

                // Gestión de boletas
                .requestMatchers(
                    "/api/v1/boletas/**"
                ).hasAnyRole("ADMIN", "VENDEDOR")

                // Todo lo demás requiere autenticación
                .anyRequest().authenticated()
            )
            .httpBasic(Customizer.withDefaults());

        return http.build();
    }
}
