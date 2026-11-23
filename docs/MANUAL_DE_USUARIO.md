# Manual de usuario — Level-Up Gamer (Anexo 4)

Este manual explica cómo usar la tienda **Level-Up Gamer** y su panel de administración.
Cada sección tiene un recuadro **[Pantallazo]** con el nombre sugerido para la captura (guárdalas en `docs/capturas/`).

> **Antes de empezar:** la aplicación necesita que la API esté en funcionamiento. Si ves el aviso rojo
> «No se pudo conectar con el servidor», revisa que la API esté encendida y pulsa **Reintentar**.

---

## 1. Para clientes (tienda)

### 1.1 Registrarse
1. Pulsa **Iniciar sesión** (arriba a la derecha) y luego **Regístrate aquí**.
2. Completa RUN (sin puntos ni guion, con dígito verificador), nombre, apellidos, correo (`@duoc.cl`, `@profesor.duoc.cl` o `@gmail.com`), contraseña de 4 a 10 caracteres, región, comuna y dirección.
3. Pulsa **Registrarme**. Si los datos son válidos, la cuenta se crea y entras con la sesión iniciada.
4. Si el correo o el RUN ya existen, verás «Ya existe una cuenta registrada con ese correo o RUN».

**[Pantallazo 01: registro.png]** · **[Pantallazo 02: registro-error.png]**

### 1.2 Iniciar y cerrar sesión
1. Ve a **Iniciar sesión**, escribe tu correo y contraseña y pulsa **Iniciar sesión**.
2. Tu sesión se mantiene aunque recargues la página. Para salir, pulsa **Salir** junto a tu nombre.
3. Si tu sesión vence, la aplicación te devuelve al inicio de sesión con el aviso «Tu sesión expiró».

**[Pantallazo 03: login.png]** · **[Pantallazo 04: sesion-expirada.png]**

### 1.3 Explorar productos
- **Productos**: catálogo con buscador, filtros por categoría y orden por precio o nombre.
- **Categorías** y **Ofertas**: acceso directo por categoría y productos con descuento.
- Al abrir un producto verás el detalle, el stock disponible y los productos relacionados.

**[Pantallazo 05: catalogo.png]** · **[Pantallazo 06: detalle-producto.png]**

### 1.4 Carrito y compra
1. En el producto, elige la cantidad (no puede superar el stock) y pulsa **Añadir al carrito**.
2. En **Carrito** puedes cambiar cantidades, quitar productos y aplicar el cupón `LEVELUP20` (20 %). Los correos `@duoc.cl` tienen 20 % automático.
3. Pulsa **Ir a pagar** y completa tus datos y la dirección de entrega (si iniciaste sesión, se rellenan solos).
4. Pulsa **Pagar ahora**. Se registra la orden en el sistema:
   - **Pago aprobado:** verás «Se ha realizado la compra» con el número de orden y la boleta. Puedes imprimirla.
   - **Pago rechazado:** verás «No se pudo realizar el pago» y el botón **Volver a realizar el pago**; tu carrito se conserva.
5. Si no se puede registrar la orden (por ejemplo, sin conexión), aparece un aviso y puedes reintentar.

**[Pantallazo 07: carrito.png]** · **[Pantallazo 08: checkout.png]** · **[Pantallazo 09: compra-exitosa.png]** · **[Pantallazo 10: compra-error.png]**

> Los clientes solo pueden usar la tienda: si intentan abrir `/admin` vuelven al inicio.

---

## 2. Para vendedores

Al iniciar sesión como **Vendedor** entras directo a **Órdenes**. El menú lateral solo muestra **Órdenes** y **Productos**.

### 2.1 Órdenes
- La lista muestra número, fecha, cliente, total y estado (Pagada / Rechazada), con las más recientes arriba.
- Pulsa **Ver boleta** para ver el detalle: cliente, dirección de entrega y productos comprados.

**[Pantallazo 11: vendedor-ordenes.png]** · **[Pantallazo 12: vendedor-boleta.png]**

### 2.2 Productos (solo consulta)
- La lista muestra código, nombre, categoría, precio y stock (en rojo si está en nivel crítico).
- Pulsa **Ver detalle** para ver la ficha del producto.
- El vendedor **no ve** los botones de crear, editar ni eliminar, y no tiene acceso a Dashboard, Críticos, Categorías, Reportes, Usuarios ni Perfil. Si escribe esas direcciones a mano, vuelve a Órdenes.

**[Pantallazo 13: vendedor-productos.png]** · **[Pantallazo 14: vendedor-detalle-producto.png]**

---

## 3. Para administradores

El **Administrador** tiene todo el menú lateral.

### 3.1 Dashboard
Resumen con productos activos, usuarios registrados, productos con stock bajo, órdenes pagadas y productos sin stock.
**[Pantallazo 15: admin-dashboard.png]**

### 3.2 Productos
- **+ Nuevo producto:** completa código (mínimo 3 caracteres, no se puede cambiar después), categoría, nombre, precio, stock, stock crítico, descuento (0–90 %) e imagen, y pulsa **Guardar producto**.
- **Editar** y **Eliminar** (pide confirmación) están en cada fila. **Ver detalle** abre la ficha.
- **Críticos:** lista los productos cuyo stock es igual o menor a su stock crítico, del más bajo al más alto.

**[Pantallazo 16: admin-productos.png]** · **[Pantallazo 17: admin-producto-form.png]** · **[Pantallazo 18: admin-criticos.png]**

### 3.3 Categorías
Crea, renombra o elimina categorías. No se puede eliminar una categoría que tenga productos, ni repetir un nombre.
**[Pantallazo 19: admin-categorias.png]**

### 3.4 Usuarios
- **+ Nuevo usuario:** RUN válido, tipo (Administrador, Vendedor o Cliente), nombre, apellidos, correo y dirección. Los usuarios nuevos parten con una contraseña inicial que deben cambiar.
- **Editar**, **Historial** (compras del usuario) y **Eliminar** (con confirmación).

**[Pantallazo 20: admin-usuarios.png]** · **[Pantallazo 21: admin-usuario-form.png]** · **[Pantallazo 22: admin-historial.png]**

### 3.5 Órdenes y reportes
- **Órdenes:** igual que el vendedor (lista y boleta).
- **Reportes:** órdenes pagadas, ventas totales, ticket promedio, pagos rechazados y ventas por categoría.

**[Pantallazo 23: admin-ordenes.png]** · **[Pantallazo 24: admin-reportes.png]**

### 3.6 Perfil
Edita tu nombre, apellidos y dirección y pulsa **Guardar perfil**.
**[Pantallazo 25: admin-perfil.png]**

---

## 4. Mensajes frecuentes

| Mensaje | Qué significa | Qué hacer |
|---|---|---|
| No se pudo conectar con el servidor | La API no responde | Revisa tu conexión o que la API esté encendida y pulsa **Reintentar** |
| Correo o contraseña incorrectos | Las credenciales no coinciden | Vuelve a escribirlas |
| Tu sesión expiró | El token venció | Inicia sesión nuevamente |
| No existe el producto / la orden | El código o número no existe | Vuelve a la lista y elige otro |
| No se puede eliminar: la categoría tiene productos | La categoría está en uso | Mueve o elimina antes sus productos |
