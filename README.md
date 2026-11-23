# Level-Up Gamer · React Router

Migración del sitio Level-Up Gamer (HTML + CSS + JS, tienda y panel administrador) a **React 19 + React Router 8 + React Bootstrap**,
conectado a una **API REST con axios** (login con JWT de acceso + renovación, permisos por rol) y con pruebas unitarias en **Jasmine + Karma**.

## Cómo ejecutarlo

```bash
npm install
cp .env.example .env   # y ajusta VITE_API_URL a la URL de tu API
npm run dev        # desarrollo: http://localhost:5173
npm run build      # genera dist/
npm run preview    # revisa dist/ antes de publicar
```

Requiere Node 22 o superior y la API en marcha (por defecto `http://localhost:8080/api/v1`).
`VITE_API_URL` se lee al compilar: si cambia la URL de la API, vuelve a ejecutar `npm run build`.

## Conexión con la API

Todo el acceso a datos pasa por `src/servicios/` (una sola instancia de axios en `api.js`):

| Archivo | Qué hace |
|---|---|
| `api.js` | `axios.create` con `baseURL = VITE_API_URL`. **Interceptor de petición:** agrega `Authorization: Bearer <token>` (salvo en `/auth/*`). **Interceptor de respuesta:** ante un `401` con sesión activa renueva el token con `POST /auth/refresh` y repite la petición una vez; si no se puede renovar, borra la sesión y lleva a `/login` con el aviso «Tu sesión expiró». |
| `auth.js` | `POST /auth/login` y `POST /auth/register` (la contraseña **no se compara en el navegador**); normaliza el rol `ADMIN` / `VENDEDOR` / `CLIENTE` a `Administrador` / `Vendedor` / `Cliente`. |
| `productos.js`, `categorias.js`, `usuarios.js`, `ordenes.js` | CRUD contra la API (reemplazan a los antiguos `crud.js` y `baseDatos.js`). |

`localStorage` solo guarda el **carrito**, los **tokens** (`lug_token` de acceso y `lug_refresh` de renovación) y los **datos del usuario** (`lug_session`, sin contraseña); la sesión sobrevive a recargar la página.

### Contrato con el backend (Spring Boot, `/api/v1`)

El backend identifica todo por `id` numérico; `src/servicios/adaptadores.js` traduce a las formas que usa el frontend
(`codigo`, `value`/`label`, `run`, órdenes con cliente y líneas). Si el backend agrega campos, el adaptador los respeta.

| Recurso | Endpoints usados | Notas |
|---|---|---|
| Sesión | `POST /auth/login` `{correo, contrasena}` · `POST /auth/register` `{nombre, correo, contrasena}` · `POST /auth/refresh` `{refreshToken}` | Responden `{ accessToken, refreshToken, tipoToken, expiraEnSegundos, usuario:{id,nombre,correo,rol} }`. Acceso: 15 min · renovación: 7 días. La contraseña debe tener **mínimo 8 caracteres** (el registro siempre crea rol `CLIENTE`). |
| Productos | `GET /productos` · `GET/PUT/DELETE /productos/{id}` · `POST /productos` | `codigo` = `id`; `categoria` = `categoriaId`. El backend guarda `nombre, precio, stock, categoria`. |
| Categorías | `GET /categorias` · `POST` · `PUT/DELETE /categorias/{id}` | `value` = `id`; `label` = `nombre`. |
| Usuarios (Admin) | `GET /usuarios` · `GET/PUT/DELETE /usuarios/{id}` · `POST /usuarios/registro` | `run` = `id`; `nombre` guarda «nombre apellidos»; crear siempre da rol CLIENTE. |
| Órdenes | `GET /boletas` · `GET /boletas/{id}` · `POST /boletas` · `PATCH /boletas/{id}/confirmar` · `PATCH /boletas/{id}/rechazar` | El checkout crea la boleta (`{usuarioId, items:[{productoId, cantidad}]}`) y luego la confirma (`{descuentoPorcentaje}`, descuenta stock) o la rechaza según el pago. Estados `PENDIENTE/PAGADA/RECHAZADA` → `Pendiente/Pagada/Rechazada`. |

**Lo que el backend todavía no guarda** (y por eso el frontend usa valores por defecto): en productos `descuento` (sin Ofertas), `stockCritico` (por defecto 5), `descripcion` e `imagen`; en usuarios `run`, `region`, `comuna`, `direccion`, `fechaNacimiento` y el cambio de rol; en órdenes el cliente y la dirección de entrega (se muestran solo justo después de comprar). Para guardarlos hay que agregar esos campos al backend y a `aCuerpoProducto` en `adaptadores.js`.

Las listas pueden venir como arreglo o paginadas (`{ content: [...] }`). Los reportes y los productos críticos se calculan en el frontend a partir de `/boletas` y `/productos`. Comprar requiere haber iniciado sesión. **Pendiente de acordar con el backend:** hoy `/boletas/**` solo permite `ADMIN` y `VENDEDOR`, por lo que un `CLIENTE` recibe 403 al pagar; hace falta un endpoint de compra para clientes que tome el usuario del JWT y calcule el descuento en el servidor.

## Roles y permisos

| Rol | Qué puede hacer |
|---|---|
| **Cliente** | Solo la tienda (catálogo, carrito, checkout). `/admin` lo devuelve a la tienda. |
| **Vendedor** | Panel con solo **Órdenes** (lista y boleta) y **Productos** (lista y detalle de solo lectura). Sin Dashboard, Críticos, Categorías, Reportes, Perfil ni botones de crear / editar / eliminar. Si abre esas URLs a mano, vuelve a Órdenes. |
| **Administrador** | Todo el panel: Dashboard, productos (CRUD), críticos, categorías, reportes, usuarios, perfil y órdenes. |

Las guardias están en `AdminLayout` (sesión y rol de personal), `SoloRoles` / `SoloAdmin` (rutas por rol) y en `App.jsx` (el índice `/admin` redirige al Vendedor a Órdenes).

## Pruebas unitarias (Jasmine + Karma)

```bash
npm test             # Karma + Jasmine en Chrome headless (necesita Google Chrome instalado)
npm run test:jsdom   # igual, pero sin navegador (jsdom): útil si no hay Chrome
npm run test:watch   # modo observador mientras desarrollas
```

- Specs en `src/pruebas/` (`*.spec.js` / `*.spec.jsx`), cargados por `src/pruebas/indice.js`.
- Configuración: `karma.conf.cjs` (webpack + Babel para JSX, `istanbul` para cobertura; define `VITE_API_URL` para las pruebas).
- Cada ejecución genera el informe de cobertura en `cobertura/index.html` (abrir en el navegador).
- **Mocks de axios:** ninguna prueba toca la red. Se usa `spyOn(api, 'get' | 'post' | 'put' | 'patch' | 'delete')` sobre la instancia de `src/servicios/api.js` con `.and.callFake(exito(datos))` / `.and.callFake(rechazo(401))` (helpers en `src/pruebas/ayudas.jsx`).
- Otros mocks: `jasmine.createSpy` (callbacks/props), `spyOn(window, 'confirm')`, `spyOn(Storage.prototype, 'getItem')` e inyección de la pasarela de pago como prop del Checkout.
- Qué cubren: interceptores (Bearer y cierre de sesión en 401), servicios, login/registro contra la API, checkout con creación de orden, guardias por rol (incluida la vista del Vendedor), CRUD del admin y la persistencia de la sesión.

## Rutas

| Ruta | Página | Qué demuestra |
|---|---|---|
| `/` | Inicio | Layout con `Outlet`, grilla responsiva |
| `/catalogo` | Catálogo | `useSearchParams`: `?buscar=…&categoria=a,b&orden=…` |
| `/producto/:id` | Detalle | `useParams`, `useNavigate(-1)`, id inexistente |
| `/blogs`, `/blogs/:id` | Blogs | Ruta con parámetro numérico (`Number(id)`) |
| `/nosotros`, `/contacto` | Informativas | Formulario validado |
| `/login`, `/registro` | Sesión | Autenticación contra la API, `useLocation().state.from`, formularios controlados |
| `/categorias`, `/categorias/:valor` | Categorías | Tarjetas por categoría + productos de la categoría |
| `/ofertas` | Ofertas | Productos con `descuento` > 0 |
| `/carrito` | Carrito | Estado levantado a `App.jsx` + `localStorage` (el carrito es local) |
| `/checkout` | Checkout | Formulario validado (se autocompleta con sesión), crea la boleta (`POST /boletas`) y la confirma o rechaza |
| `/compra-exitosa/:id`, `/compra-error/:id` | Resultado del pago | Resumen de la orden / reintentar pago |
| `/admin` | Dashboard (Admin) · redirige a Órdenes (Vendedor) | Layout propio con menú según el rol + guardia |
| `/admin/ordenes`, `/admin/ordenes/:id` | Órdenes y boleta | Listado y detalle de compras |
| `/admin/productos`, `/admin/productos/:codigo` | Lista y detalle de productos | Admin y Vendedor (solo lectura) |
| `/admin/productos/criticos` | Productos críticos | Solo Admin · stock ≤ stock crítico |
| `/admin/categorias` | Categorías | Solo Admin · CRUD de categorías |
| `/admin/reportes`, `/admin/perfil` | Reportes y perfil | Solo Admin · ventas por categoría · edición de perfil |
| `/admin/usuarios/:run/historial` | Historial de compras | Solo Admin · órdenes del usuario |
| `/admin/productos/nuevo`, `/admin/productos/:codigo/editar` | Formulario de producto | Solo Administrador (`<SoloRoles />`) |
| `/admin/usuarios`, `/admin/usuarios/nuevo`, `/admin/usuarios/:run/editar` | Mantenedor de usuarios | Solo Administrador |
| `*` | 404 | Comodín dentro del Layout, muestra `useLocation().pathname` |

## Estructura

```
src/
├── main.jsx            → BrowserRouter
├── App.jsx             → mapa de rutas + estado del carrito y la sesión
├── componentes/        → Layout, AdminLayout, SoloRoles, SoloAdmin, Estado (cargando/error), BarraNavegacion, PiePagina, TarjetaProducto, GrillaProductos, Campo
├── paginas/            → una por ruta (admin/ = panel administrador)
├── hooks/              → useFormulario, useRecurso (carga de datos de la API)
├── datos/              → data.js (catálogo de ejemplo para sembrar la API y para las pruebas, blogs y regiones)
├── servicios/          → api.js (axios + interceptores) · auth, productos, categorias, usuarios, ordenes · pagos.js (pasarela simulada)
├── pruebas/            → *.spec.js(x) de Jasmine + indice.js + ayudas.jsx
├── utilidades/         → validaciones, formato CLP/ofertas/slug, almacen (carrito, token y sesión)
└── estilos/            → levelup.css + admin.css (tema original) + ajustes.css (convivencia con Bootstrap)
public/pictures/        → imágenes del sitio (se referencian como "pictures/archivo.png")
```

## Cuentas de prueba

Las cuentas ahora viven en la base de datos de la API (el frontend ya no trae usuarios ni contraseñas). Crea en tu backend un **Administrador** y un **Vendedor** para probar los dos paneles (el backend los siembra con el perfil `dev` y las variables `SEED_ADMIN_PASSWORD` / `SEED_VENDEDOR_PASSWORD`; `JWT_SECRET` de al menos 32 caracteres es obligatorio); los clientes se registran en `/registro` (RUN válido, ej: `10000013K`).

- Checkout: la casilla «Demo: simular pago rechazado» fuerza la vista de pago con error (la orden se guarda como `Rechazada`).
- Cupón de descuento: `LEVELUP20` · los correos `@duoc.cl` tienen 20 % automático.

## Subir a GitHub

```bash
git init
git add .
git commit -m "Level-Up Gamer con React Router"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

Crea el repositorio como **público** en GitHub (Settings → Danger zone → Change visibility) y copia su URL en la entrega.
No subas `.env` (ya está en `.gitignore`); sí deja `.env.example`.

## Publicar (opcional)

Una SPA necesita que el servidor devuelva `index.html` en cualquier dirección (si no, F5 en `/producto/JM001` da 404):

- **Netlify**: ya incluye `public/_redirects`.
- **GitHub Pages**: `npm run build` ya copia `dist/index.html` a `dist/404.html`. Si publicas en
  `usuario.github.io/mi-repo/`, cambia `base: '/mi-repo/'` en `vite.config.js`.
