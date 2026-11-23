# Backend — Sistema de Ventas

## Descripción

API REST desarrollada con Java, Spring Boot y MySQL para administrar usuarios, categorías, productos y boletas de un sistema de ventas.

El backend permite registrar productos, consultar existencias, gestionar usuarios y procesar ventas con descuentos, validación de stock y estados de boleta.

Este módulo forma parte de un proyecto grupal de desarrollo fullstack.

## Tecnologías utilizadas

- Java 21 (versión de compilación)
- Spring Boot 4.2.0
- Spring Data JPA / Hibernate
- MySQL 8.4
- Maven
- Spring Security y BCrypt
- Springdoc OpenAPI / Swagger
- JUnit y Mockito
- Visual Studio Code

## Estructura del proyecto

```text
backend/
├── src/
│   ├── main/
│   │   ├── java/tienda_backend/
│   │   │   ├── config/
│   │   │   ├── controller/
│   │   │   ├── dto/
│   │   │   ├── entidades/
│   │   │   ├── exception/
│   │   │   ├── repository/
│   │   │   ├── service/
│   │   │   └── BackendApplication.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       └── java/tienda_backend/
├── pom.xml
├── mvnw
├── mvnw.cmd
└── README.md
```

## Modelo de datos

El sistema utiliza cinco entidades:

| Entidad | Descripción |
|---|---|
| usuario | Almacena usuarios y roles |
| categoria | Organiza los productos |
| producto | Registra precios y stock |
| boleta | Registra ventas, totales y estados |
| detalleBoleta | Almacena los productos de cada boleta |

Relaciones:

- Una categoría tiene muchos productos.
- Un usuario puede tener varias boletas.
- Una boleta contiene varios detalles.
- Un producto puede aparecer en múltiples detalles.

## Configuración de MySQL

Crear la base de datos:

```sql
CREATE DATABASE IF NOT EXISTS tienda_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Configurar la conexión en `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/tienda_db
spring.datasource.username=${DB_USER:root}
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=update
server.port=8080
```

El proyecto requiere configurar `DB_PASSWORD` como variable de entorno. No se deben guardar contraseñas directamente en el repositorio.

En PowerShell:

```powershell
$env:DB_PASSWORD = "CONTRASEÑA_LOCAL"
```

## Ejecutar el backend

Desde la carpeta que contiene `pom.xml`:

```powershell
.\mvnw.cmd clean compile
.\mvnw.cmd spring-boot:run
```

El servidor se ejecuta en:

`http://localhost:8080`

Se requiere MySQL en funcionamiento antes de iniciar Spring Boot.

## Documentación Swagger

Con la aplicación iniciada:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Endpoints principales

| Método | Endpoint | Función |
|---|---|---|
| GET | `/api/v1/categorias` | Listar categorías |
| POST | `/api/v1/categorias` | Crear categoría |
| GET | `/api/v1/productos` | Listar productos |
| POST | `/api/v1/productos` | Registrar producto |
| PUT | `/api/v1/productos/{id}` | Actualizar producto |
| DELETE | `/api/v1/productos/{id}` | Eliminar producto |
| POST | `/api/v1/usuarios/registro` | Registrar usuario |
| GET | `/api/v1/usuarios` | Consultar usuarios |
| PUT | `/api/v1/usuarios/{id}` | Actualizar usuario |
| DELETE | `/api/v1/usuarios/{id}` | Eliminar usuario |
| GET | `/api/v1/boletas` | Consultar boletas |
| POST | `/api/v1/boletas` | Crear boleta pendiente |
| PATCH | `/api/v1/boletas/{id}/confirmar` | Confirmar venta |
| PATCH | `/api/v1/boletas/{id}/rechazar` | Rechazar venta |

Consultar Swagger para ver todos los endpoints, parámetros y modelos disponibles.

## Lógica de ventas

El sistema permite:

- Calcular subtotales por producto.
- Calcular el total de la boleta.
- Aplicar descuentos porcentuales.
- Comprobar la disponibilidad de stock.
- Descontar unidades al confirmar una venta.
- Registrar boletas pagadas o rechazadas.
- Impedir confirmar nuevamente una boleta procesada.

La confirmación se realiza mediante transacciones de base de datos.

El estado `PAGADA` representa una confirmación interna; no implica integración con un proveedor de pagos externo.

## Seguridad

Se utiliza Spring Security con autenticación HTTP Basic y contraseñas almacenadas mediante BCrypt.

Roles disponibles:

- `ADMIN`: administración de usuarios, productos, categorías y boletas.
- `VENDEDOR`: gestión de boletas y consulta pública de productos.
- `CLIENTE`: registro y consulta de los recursos públicos.

Las operaciones protegidas requieren autenticación. Los permisos deben verificarse antes de integrar nuevas pantallas.

HTTP Basic está configurado para pruebas locales; cualquier despliegue externo debe utilizar HTTPS y revisar la autenticación.

## Datos iniciales

Existe un cargador de datos para desarrollo (`dataLoader.java`), activado mediante el perfil `dev`.

Para crear usuarios de prueba deben proporcionarse las variables `SEED_ADMIN_PASSWORD` y `SEED_VENDEDOR_PASSWORD`.

Ejecutar con el perfil de desarrollo:

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

No incluir las contraseñas de prueba en el repositorio.

## Pruebas automatizadas

El proyecto incluye pruebas JUnit y Mockito para:

- Validación de productos.
- Validación de precios y stock.
- Cálculo de totales de boletas.
- Control de stock insuficiente.
- Aplicación de descuentos.
- Prevención de confirmaciones duplicadas.

Ejecutar todas las pruebas:

```powershell
.\mvnw.cmd test
```

Las pruebas unitarias de productos y boletas también pueden ejecutarse por separado:

```powershell
.\mvnw.cmd "-Dtest=productoServiceTest,boletaServiceTest" test
```

## Integración con frontend

URL base local:

`http://localhost:8080/api/v1`

CORS está configurado para los orígenes locales:

- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:4200`

Los endpoints protegidos requieren autenticación.
