import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router'

import Layout from './componentes/Layout.jsx'
import AdminLayout from './componentes/AdminLayout.jsx'
import SoloRoles from './componentes/SoloRoles.jsx'

import Inicio from './paginas/Inicio.jsx'
import Catalogo from './paginas/Catalogo.jsx'
import DetalleProducto from './paginas/DetalleProducto.jsx'
import Blogs from './paginas/Blogs.jsx'
import DetalleBlog from './paginas/DetalleBlog.jsx'
import Nosotros from './paginas/Nosotros.jsx'
import Contacto from './paginas/Contacto.jsx'
import Login from './paginas/Login.jsx'
import Registro from './paginas/Registro.jsx'
import Carrito from './paginas/Carrito.jsx'
import Checkout from './paginas/Checkout.jsx'
import NoEncontrada from './paginas/NoEncontrada.jsx'
import Categorias from './paginas/Categorias.jsx'
import Ofertas from './paginas/Ofertas.jsx'
import CompraExitosa from './paginas/CompraExitosa.jsx'
import CompraError from './paginas/CompraError.jsx'

import Dashboard from './paginas/admin/Dashboard.jsx'
import ProductosAdmin from './paginas/admin/ProductosAdmin.jsx'
import ProductoDetalleAdmin from './paginas/admin/ProductoDetalleAdmin.jsx'
import ProductoForm from './paginas/admin/ProductoForm.jsx'
import UsuariosAdmin from './paginas/admin/UsuariosAdmin.jsx'
import UsuarioForm from './paginas/admin/UsuarioForm.jsx'
import Ordenes from './paginas/admin/Ordenes.jsx'
import CategoriasAdmin from './paginas/admin/CategoriasAdmin.jsx'
import ProductosCriticos from './paginas/admin/ProductosCriticos.jsx'
import Reportes from './paginas/admin/Reportes.jsx'
import Perfil from './paginas/admin/Perfil.jsx'
import HistorialCompras from './paginas/admin/HistorialCompras.jsx'

import { borrarSesion, guardarCarrito, guardarSesion, leerCarrito, leerSesion } from './utilidades/almacen.js'
import { mensajeError, registrarAlExpirar } from './servicios/api.js'
import { listarProductos } from './servicios/productos.js'
import { listarCategorias } from './servicios/categorias.js'

const ADMIN = ['Administrador']
const PERSONAL = ['Administrador', 'Vendedor']

export default function App() {
  const navegar = useNavigate()
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [errorCatalogo, setErrorCatalogo] = useState('')
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true)
  const [carrito, setCarrito] = useState(leerCarrito)
  const [sesion, setSesion] = useState(leerSesion)

  // Productos y categorías vienen de la API; las vistas de admin llaman a `cargarCatalogo` tras cada cambio.
  const cargarCatalogo = useCallback(async () => {
    try {
      const [listaProductos, listaCategorias] = await Promise.all([listarProductos(), listarCategorias()])
      // El backend entrega solo el id de la categoría: se le agrega el nombre para mostrarlo.
      const etiquetas = Object.fromEntries(listaCategorias.map((c) => [c.value, c.label]))
      setProductos(listaProductos.map((p) => (p.categoriaLabel ? p : { ...p, categoriaLabel: etiquetas[p.categoria] ?? '' })))
      setCategorias(listaCategorias)
      setErrorCatalogo('')
    } catch (err) {
      setErrorCatalogo(mensajeError(err, 'No se pudo cargar el catálogo.'))
    } finally {
      setCargandoCatalogo(false)
    }
  }, [])

  useEffect(() => { cargarCatalogo() }, [cargarCatalogo])
  useEffect(() => { guardarCarrito(carrito) }, [carrito])

  // Si el interceptor de axios detecta un 401 (token vencido), la sesión se cierra y se vuelve al login.
  useEffect(() => {
    registrarAlExpirar(() => { setSesion(null); navegar('/login', { state: { expirada: true } }) })
    return () => registrarAlExpirar(null)
  }, [navegar])

  const totalCarrito = carrito.reduce((suma, item) => suma + item.cantidad, 0)

  const tope = (codigo) => {
    const p = productos.find((x) => x.codigo === codigo)
    return p && p.stock > 0 ? p.stock : 99
  }

  function agregar(codigo, cantidad = 1) {
    setCarrito((actual) => {
      const existente = actual.find((i) => i.codigo === codigo)
      if (!existente) return [...actual, { codigo, cantidad: Math.min(cantidad, tope(codigo)) }]
      return actual.map((i) => i.codigo === codigo ? { ...i, cantidad: Math.min(i.cantidad + cantidad, tope(codigo)) } : i)
    })
  }
  function cambiarCantidad(codigo, delta) {
    setCarrito((actual) => actual.map((i) =>
      i.codigo === codigo ? { ...i, cantidad: Math.min(tope(codigo), Math.max(1, i.cantidad + delta)) } : i))
  }
  const quitar = (codigo) => setCarrito((actual) => actual.filter((i) => i.codigo !== codigo))
  // Tras una compra pagada el stock cambió en la API: se vuelve a pedir el catálogo.
  const vaciar = () => { setCarrito([]); cargarCatalogo() }

  const iniciarSesion = (usuario, token, refreshToken) => setSesion(guardarSesion(usuario, token, refreshToken))
  function cerrarSesion(destino = '/') {
    borrarSesion()
    setSesion(null)
    navegar(destino)
  }

  const esAdmin = sesion?.tipoUsuario === 'Administrador'

  return (
    <>
      {errorCatalogo && (
        <div className="form-alert is-visible is-error" role="alert" style={{ margin: 0, textAlign: 'center' }}>
          {errorCatalogo} <button type="button" className="btn btn-outline btn-sm" onClick={cargarCatalogo}>Reintentar</button>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Layout totalCarrito={totalCarrito} sesion={sesion} onSalir={cerrarSesion} />}>
          <Route index element={<Inicio productos={productos} onAgregar={agregar} />} />
          <Route path="catalogo" element={<Catalogo productos={productos} listaCategorias={categorias} onAgregar={agregar} />} />
          <Route path="producto/:id" element={<DetalleProducto productos={productos} onAgregar={agregar} cargando={cargandoCatalogo} />} />
          <Route path="categorias" element={<Categorias productos={productos} listaCategorias={categorias} onAgregar={agregar} />} />
          <Route path="categorias/:valor" element={<Categorias productos={productos} listaCategorias={categorias} onAgregar={agregar} />} />
          <Route path="ofertas" element={<Ofertas productos={productos} onAgregar={agregar} />} />
          <Route path="blogs" element={<Blogs />} />
          <Route path="blogs/:id" element={<DetalleBlog />} />
          <Route path="nosotros" element={<Nosotros />} />
          <Route path="contacto" element={<Contacto />} />
          <Route path="login" element={<Login onLogin={iniciarSesion} />} />
          <Route path="registro" element={<Registro onLogin={iniciarSesion} />} />
          <Route path="carrito" element={<Carrito carrito={carrito} productos={productos} sesion={sesion} onCambiar={cambiarCantidad} onQuitar={quitar} />} />
          <Route path="checkout" element={<Checkout carrito={carrito} productos={productos} sesion={sesion} onVaciar={vaciar} />} />
          <Route path="compra-exitosa/:id" element={<CompraExitosa />} />
          <Route path="compra-error/:id" element={<CompraError />} />
          <Route path="*" element={<NoEncontrada />} />
        </Route>

        <Route path="/admin" element={<AdminLayout sesion={sesion} onSalir={cerrarSesion} />}>
          {/* El Vendedor no tiene Dashboard: su pantalla de inicio es la lista de órdenes. */}
          <Route index element={esAdmin ? <Dashboard productos={productos} /> : <Navigate to="/admin/ordenes" replace />} />

          {/* Administrador y Vendedor: solo lista y detalle de productos y de órdenes. */}
          <Route element={<SoloRoles sesion={sesion} roles={PERSONAL} />}>
            <Route path="productos" element={<ProductosAdmin productos={productos} sesion={sesion} onCambio={cargarCatalogo} />} />
            <Route path="productos/:codigo" element={<ProductoDetalleAdmin productos={productos} />} />
            <Route path="ordenes" element={<Ordenes />} />
            <Route path="ordenes/:id" element={<Ordenes />} />
          </Route>

          {/* Solo Administrador. */}
          <Route element={<SoloRoles sesion={sesion} roles={ADMIN} />}>
            <Route path="productos/criticos" element={<ProductosCriticos productos={productos} />} />
            <Route path="productos/nuevo" element={<ProductoForm productos={productos} categorias={categorias} onCambio={cargarCatalogo} />} />
            <Route path="productos/:codigo/editar" element={<ProductoForm productos={productos} categorias={categorias} onCambio={cargarCatalogo} />} />
            <Route path="categorias" element={<CategoriasAdmin productos={productos} categorias={categorias} onCambio={cargarCatalogo} />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="perfil" element={<Perfil sesion={sesion} onActualizar={(u) => setSesion(guardarSesion(u))} />} />
            <Route path="usuarios" element={<UsuariosAdmin />} />
            <Route path="usuarios/nuevo" element={<UsuarioForm />} />
            <Route path="usuarios/:run/editar" element={<UsuarioForm />} />
            <Route path="usuarios/:run/historial" element={<HistorialCompras />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}
