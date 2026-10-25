# Level-Up Gamer · React Router

Migración del sitio Level-Up Gamer (HTML + CSS + JS, tienda y panel administrador) a **React 19 + React Router 8 + React Bootstrap**,
con pruebas unitarias en **Jasmine + Karma** (DSY1104 · Evaluación Parcial 2).

## Cómo ejecutarlo

```bash
npm install
npm run dev        # desarrollo: http://localhost:5173
npm run build      # genera dist/
npm run preview    # revisa dist/ antes de publicar
```

Requiere Node 22 o superior.

## Pruebas unitarias (Jasmine + Karma)

```bash
npm test             # Karma + Jasmine en Chrome headless (necesita Google Chrome instalado)
npm run test:jsdom   # igual, pero sin navegador (jsdom): útil si no hay Chrome
npm run test:watch   # modo observador mientras desarrollas
```

- 120 pruebas en `src/pruebas/` (`*.spec.js` / `*.spec.jsx`), cargadas por `src/pruebas/indice.js`.
- Configuración: `karma.conf.cjs` (webpack + Babel para JSX, `istanbul` para cobertura).
- Cada ejecución genera el informe de cobertura en `cobertura/index.html` (abrir en el navegador).
- Mocks usados: `jasmine.createSpy` (callbacks/props), `spyOn` (`window.confirm`, `Storage.prototype.getItem`),
  `jasmine.clock()` (temporizadores) e inyección de la pasarela de pago como prop del Checkout.

## Rutas

| Ruta | Página | Qué demuestra |
|---|---|---|
| `/` | Inicio | Layout con `Outlet`, grilla responsiva |
| `/catalogo` | Catálogo | `useSearchParams`: `?buscar=…&categoria=a,b&orden=…` |
| `/producto/:id` | Detalle | `useParams`, `useNavigate(-1)`, id inexistente |
| `/blogs`, `/blogs/:id` | Blogs | Ruta con parámetro numérico (`Number(id)`) |
| `/nosotros`, `/contacto` | Informativas | Formulario validado |
| `/login`, `/registro` | Sesión | `useLocation().state.from`, formularios controlados |
| `/categorias`, `/categorias/:valor` | Categorías | Tarjetas por categoría + productos de la categoría |
| `/ofertas` | Ofertas | Productos con `descuento` > 0 |
| `/carrito` | Carrito | Estado levantado a `App.jsx` + `localStorage` |
| `/checkout` | Checkout | Formulario validado (se autocompleta con sesión), crea la orden |
| `/compra-exitosa/:id`, `/compra-error/:id` | Resultado del pago | Resumen de la orden / reintentar pago |
| `/admin` | Dashboard | Layout propio con menú lateral + guardia por rol |
| `/admin/ordenes`, `/admin/ordenes/:id` | Órdenes y boleta | Listado y detalle de compras |
| `/admin/productos` | Mantenedor de productos | Admin: CRUD · Vendedor: solo lectura |
| `/admin/productos/criticos` | Productos críticos | Stock ≤ stock crítico |
| `/admin/categorias` | Categorías | CRUD de categorías |
| `/admin/reportes`, `/admin/perfil` | Reportes y perfil | Ventas por categoría · edición de perfil |
| `/admin/usuarios/:run/historial` | Historial de compras | Órdenes del usuario |
| `/admin/productos/nuevo`, `/admin/productos/:codigo/editar` | Formulario de producto | Solo Administrador (`<SoloAdmin />`) |
| `/admin/usuarios`, `/admin/usuarios/nuevo`, `/admin/usuarios/:run/editar` | Mantenedor de usuarios | Solo Administrador |
| `*` | 404 | Comodín dentro del Layout, muestra `useLocation().pathname` |

## Estructura

```
src/
├── main.jsx            → BrowserRouter
├── App.jsx             → mapa de rutas + estado del carrito y la sesión
├── componentes/        → Layout, AdminLayout, SoloAdmin, BarraNavegacion, PiePagina, TarjetaProducto, GrillaProductos, Campo
├── paginas/            → una por ruta (admin/ = panel administrador)
├── hooks/              → useFormulario
├── datos/              → data.js (semillas) · crud.js (CRUD genérico) · baseDatos.js (productos, usuarios, categorías, órdenes)
├── servicios/          → pagos.js (pasarela simulada)
├── pruebas/            → *.spec.js(x) de Jasmine + indice.js + ayudas.jsx
├── utilidades/         → validaciones, formato CLP/ofertas, localStorage
└── estilos/            → levelup.css + admin.css (tema original) + ajustes.css (convivencia con Bootstrap)
public/pictures/        → imágenes del sitio (se referencian como "pictures/archivo.png")
```

## Cuentas de prueba

- Administrador: `admin@duoc.cl` / `admin123` (entra al panel `/admin`)
- Vendedor: `vrojas@gmail.com` / `vendedor1` (panel en solo lectura, sin Usuarios)
- Cliente de prueba: regístrate en `/registro` (RUN válido, ej: `10000013K`).
- Checkout: la casilla «Demo: simular pago rechazado» fuerza la vista de pago con error.
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

Copia la URL del repositorio en la entrega de la actividad.

## Publicar (opcional)

Una SPA necesita que el servidor devuelva `index.html` en cualquier dirección (si no, F5 en `/producto/JM001` da 404):

- **Netlify**: ya incluye `public/_redirects`.
- **GitHub Pages**: `npm run build` ya copia `dist/index.html` a `dist/404.html`. Si publicas en
  `usuario.github.io/mi-repo/`, cambia `base: '/mi-repo/'` en `vite.config.js`.
