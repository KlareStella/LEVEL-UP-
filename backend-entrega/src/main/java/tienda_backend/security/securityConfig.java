package tienda_backend.security;

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
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

import tienda_backend.repository.usuarioRepository;

@Configuration
public class securityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Se mantiene para que Spring Boot no genere un usuario por defecto
    @Bean
    public UserDetailsService userDetailsService(
            usuarioRepository usuarioRepo) {

        return correo -> {

            var usuario = usuarioRepo.findByCorreo(correo)
                .orElseThrow(() ->
                    new UsernameNotFoundException("Usuario no encontrado"));

            return User.withUsername(usuario.getCorreo())
                .password(usuario.getContrasena())
                .roles(usuario.getRol())
                .build();
        };
    }

    // Valida el Bearer token con la misma clave con la que se firma
    @Bean
    public JwtDecoder jwtDecoder(jwtService jwt) {
        return jwt.decoderAcceso();
    }

    // El claim "roles": ["ADMIN"] se convierte en ROLE_ADMIN
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {

        var roles = new JwtGrantedAuthoritiesConverter();
        roles.setAuthoritiesClaimName("roles");
        roles.setAuthorityPrefix("ROLE_");

        var convertidor = new JwtAuthenticationConverter();
        convertidor.setJwtGrantedAuthoritiesConverter(roles);

        return convertidor;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationConverter convertidor) throws Exception {

        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // Swagger
                .requestMatchers(
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**"
                ).permitAll()

                // Login, registro y renovación de token
                .requestMatchers("/api/v1/auth/**").permitAll()

                // Registro anterior (se mantiene por compatibilidad)
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
                .requestMatchers("/api/v1/usuarios/**").hasRole("ADMIN")

                // Administración de categorías y productos
                .requestMatchers(
                    "/api/v1/productos/**",
                    "/api/v1/categorias/**"
                ).hasRole("ADMIN")

                // Boletas: listados globales solo para el personal
                .requestMatchers(HttpMethod.GET,
                    "/api/v1/boletas",
                    "/api/v1/boletas/estado/**")
                    .hasAnyRole("ADMIN", "VENDEDOR")

                // Boletas: el cliente puede comprar y ver las suyas
                // (que la boleta sea suya se valida en boletaController)
                .requestMatchers("/api/v1/boletas/**")
                    .hasAnyRole("ADMIN", "VENDEDOR", "CLIENTE")

                // Todo lo demás requiere autenticación
                .anyRequest().authenticated()
            )
            // Autenticación con "Authorization: Bearer <accessToken>"
            .oauth2ResourceServer(oauth -> oauth
                .jwt(jwt -> jwt.jwtAuthenticationConverter(convertidor)));

        return http.build();
    }
}
