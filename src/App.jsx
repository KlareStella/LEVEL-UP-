import { useEffect, useState } from 'react'
import { Route, Routes, useNavigate } from 'react-router'

import Layout from './componentes/Layout.jsx'
import AdminLayout from './componentes/AdminLayout.jsx'
import SoloAdmin from './componentes/SoloAdmin.jsx'

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
import ProductoForm from './paginas/admin/ProductoForm.jsx'
import UsuariosAdmin from './paginas/admin/UsuariosAdmin.jsx'
import UsuarioForm from './paginas/admin/UsuarioForm.jsx'
import Ordenes from './paginas/admin/Ordenes.jsx'
import CategoriasAdmin from './paginas/admin/CategoriasAdmin.jsx'
import ProductosCriticos from './paginas/admin/ProductosCriticos.jsx'
import Reportes from './paginas/admin/Reportes.jsx'
import Perfil from './paginas/admin/Perfil.jsx'
import HistorialCompras from './paginas/admin/HistorialCompras.jsx'

import {
  borrarSesion, guardarCarrito, guardarProductos, guardarSesion,
  leerCarrito, leerProductos, leerSesion,
} from './utilidades/almacen.js'

export default function App() {
  const navegar = useNavigate()
  const [productos, setProductos] = useState(leerProductos)
  const [carrito, setCarrito] = useState(leerCarrito)
  const [sesion, setSesion] = useState(leerSesion)

  useEffect(() => { guardarProductos(productos) }, [productos])
  useEffect(() => { guardarCarrito(carrito) }, [carrito])

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
  const vaciar = () => setCarrito([])

  const iniciarSesion = (usuario) => setSesion(guardarSesion(usuario))
  function cerrarSesion(destino = '/') {
    borrarSesion()
    setSesion(null)
    navegar(destino)
  }

  return (
    <Routes>
      <Route path="/" element={<Layout totalCarrito={totalCarrito} sesion={sesion} onSalir={cerrarSesion} />}>
        <Route index element={<Inicio productos={productos} onAgregar={agregar} />} />
        <Route path="catalogo" element={<Catalogo productos={productos} onAgregar={agregar} />} />
        <Route path="producto/:id" element={<DetalleProducto productos={productos} onAgregar={agregar} />} />
        <Route path="categorias" element={<Categorias productos={productos} onAgregar={agregar} />} />
        <Route path="categorias/:valor" element={<Categorias productos={productos} onAgregar={agregar} />} />
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
        <Route index element={<Dashboard productos={productos} />} />
        <Route path="productos" element={<ProductosAdmin productos={productos} setProductos={setProductos} sesion={sesion} />} />
        <Route path="productos/criticos" element={<ProductosCriticos productos={productos} />} />
        <Route path="ordenes" element={<Ordenes />} />
        <Route path="ordenes/:id" element={<Ordenes />} />
        <Route path="categorias" element={<CategoriasAdmin productos={productos} />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="perfil" element={<Perfil sesion={sesion} onActualizar={(u) => setSesion(guardarSesion(u))} />} />
        <Route element={<SoloAdmin sesion={sesion} />}>
          <Route path="productos/nuevo" element={<ProductoForm productos={productos} setProductos={setProductos} />} />
          <Route path="productos/:codigo/editar" element={<ProductoForm productos={productos} setProductos={setProductos} />} />
          <Route path="usuarios" element={<UsuariosAdmin />} />
          <Route path="usuarios/nuevo" element={<UsuarioForm />} />
          <Route path="usuarios/:run/editar" element={<UsuarioForm />} />
          <Route path="usuarios/:run/historial" element={<HistorialCompras />} />
        </Route>
      </Route>
    </Routes>
  )
}
