import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import './App.css'
import logo from './assets/Logo Cesart.png'

function App() {
  const [vista, setVista] = useState('inventario')

  const [materiales, setMateriales] = useState([])
  const [filtroMaterial, setFiltroMaterial] = useState('todos')
  const [movimientos, setMovimientos] = useState([])

  const [descripcion, setDescripcion] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [medida, setMedida] = useState('')
  const [espesor, setEspesor] = useState('')
  const [color, setColor] = useState('')

  const [movDescripcion, setMovDescripcion] = useState('')
  const [movEspesor, setMovEspesor] = useState('')
  const [movMedida, setMovMedida] = useState('')
  const [movColor, setMovColor] = useState('')
  const [movTipo, setMovTipo] = useState('Ingreso')
  const [movCantidad, setMovCantidad] = useState('')
  const [movObservacion, setMovObservacion] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [usuario, setUsuario] = useState(null)

  const [editandoId, setEditandoId] = useState(null)

  useEffect(() => {
    obtenerMateriales()
    obtenerMovimientos()
    verificarUsuario()
  }, [])

  function normalizar(texto) {
    return String(texto || '').trim().toLowerCase()
  }

  async function verificarUsuario() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    setUsuario(user)
  }

  async function iniciarSesion() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('Credenciales incorrectas')
      return
    }

    await verificarUsuario()
    setEmail('')
    setPassword('')
    setVista('inventario')
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    setUsuario(null)
    setVista('inventario')
  }

  async function obtenerMateriales() {
    const { data, error } = await supabase
      .from('materiales')
      .select('*')
      .order('id', { ascending: false })

    if (!error) {
      setMateriales(data)
    }
  }

  async function obtenerMovimientos() {
    const { data, error } = await supabase
      .from('movimientos')
      .select('*')
      .order('fecha', { ascending: false })

    if (!error) {
      setMovimientos(data)
    }
  }

  function editarMaterial(material) {
    setEditandoId(material.id)
    setDescripcion(material.descripcion)
    setCantidad(material.cantidad)
    setMedida(material.medida)
    setEspesor(material.espesor)
    setColor(material.color)
    setVista('nuevo')
  }

  function limpiarProducto() {
    setDescripcion('')
    setCantidad('')
    setMedida('')
    setEspesor('')
    setColor('')
    setEditandoId(null)
  }

  function limpiarMovimiento() {
    setMovDescripcion('')
    setMovEspesor('')
    setMovMedida('')
    setMovColor('')
    setMovTipo('Ingreso')
    setMovCantidad('')
    setMovObservacion('')
  }

  async function guardarMaterial() {
    if (!usuario) {
      alert('Debes iniciar sesión')
      return
    }

    if (!descripcion || !cantidad || !medida || !espesor || !color) {
      alert('Completa todos los campos')
      return
    }

    const materialExiste = materiales.find(
      (m) =>
        normalizar(m.descripcion) === normalizar(descripcion) &&
        normalizar(m.medida) === normalizar(medida) &&
        normalizar(m.espesor) === normalizar(espesor) &&
        normalizar(m.color) === normalizar(color)
    )

    if (materialExiste && !editandoId) {
      alert(
        'Este material ya existe. Registra un movimiento de ingreso o edita el producto existente.'
      )
      return
    }

    if (editandoId) {
      await supabase
        .from('materiales')
        .update({
          descripcion,
          cantidad: Number(cantidad),
          medida,
          espesor,
          color,
          fecha_actualizacion: new Date().toISOString(),
        })
        .eq('id', editandoId)
    } else {
      await supabase.from('materiales').insert([
        {
          descripcion,
          cantidad: Number(cantidad),
          medida,
          espesor,
          color,
          fecha_actualizacion: new Date().toISOString(),
        },
      ])
    }

    limpiarProducto()
    obtenerMateriales()
    setVista('inventario')
  }

  async function registrarMovimiento() {
    if (!usuario) {
      alert('Debes iniciar sesión')
      return
    }

    if (
      !movDescripcion ||
      !movEspesor ||
      !movMedida ||
      !movColor ||
      !movCantidad
    ) {
      alert('Completa los datos del movimiento')
      return
    }

    const material = materiales.find(
      (m) =>
        normalizar(m.descripcion) === normalizar(movDescripcion) &&
        normalizar(m.espesor) === normalizar(movEspesor) &&
        normalizar(m.medida) === normalizar(movMedida) &&
        normalizar(m.color) === normalizar(movColor)
    )

    if (!material) {
      alert(
        'Este material no existe. Primero ingrésalo como Nuevo Producto.'
      )
      return
    }

    const cantidadMovimiento = Number(movCantidad)
    const stockActual = Number(material.cantidad)

    if (cantidadMovimiento <= 0) {
      alert('La cantidad debe ser mayor a 0')
      return
    }

    let nuevoStock = stockActual

    if (movTipo === 'Ingreso') {
      nuevoStock = stockActual + cantidadMovimiento
    }

    if (movTipo === 'Salida') {
      if (cantidadMovimiento > stockActual) {
        alert(
          `Stock insuficiente. Stock actual: ${stockActual}`
        )
        return
      }

      nuevoStock = stockActual - cantidadMovimiento
    }

    const fechaActual = new Date().toISOString()

    const { error: errorActualizar } = await supabase
      .from('materiales')
      .update({
        cantidad: nuevoStock,
        fecha_actualizacion: fechaActual,
      })
      .eq('id', material.id)

    if (errorActualizar) {
      alert('Error al actualizar stock')
      return
    }

    const { error: errorMovimiento } = await supabase
      .from('movimientos')
      .insert([
        {
          material_id: material.id,
          descripcion: material.descripcion,
          espesor: material.espesor,
          medida: material.medida,
          color: material.color,
          tipo_movimiento: movTipo,
          cantidad: cantidadMovimiento,
          observacion: movObservacion || 'Sin observación',
          fecha: fechaActual,
        },
      ])

    if (errorMovimiento) {
      alert('Error al registrar movimiento')
      return
    }

    limpiarMovimiento()
    obtenerMateriales()
    obtenerMovimientos()
    setVista('inventario')
  }

  async function eliminarMaterial(id) {
    const confirmar = confirm('¿Eliminar?')
    if (!confirmar) return

    await supabase.from('materiales').delete().eq('id', id)

    obtenerMateriales()
  }

  const listaMateriales = [
    ...new Set(
      materiales.map((m) =>
        normalizar(m.descripcion)
      )
    ),
  ]

  const materialesFiltrados =
    filtroMaterial === 'todos'
      ? materiales
      : materiales.filter(
          (m) => normalizar(m.descripcion) === filtroMaterial
        )

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          CESART
          <br />
          SYSTEM
        </div>

        <nav className="menu">
          {usuario && (
            <button
              className={vista === 'nuevo' ? 'activo' : ''}
              onClick={() => setVista('nuevo')}
            >
              Nuevo Producto
            </button>
          )}

          <button
            className={vista === 'inventario' ? 'activo' : ''}
            onClick={() => setVista('inventario')}
          >
            Inventario
          </button>

          {usuario && (
            <button
              className={vista === 'movimientos' ? 'activo' : ''}
              onClick={() => setVista('movimientos')}
            >
              Movimientos
            </button>
          )}

          {usuario && (
            <button
              className={vista === 'reportes' ? 'activo' : ''}
              onClick={() => setVista('reportes')}
            >
              Reportes
            </button>
          )}
        </nav>
      </aside>

      <main className="contenido">
        <header className="topbar">
          <div className="top-right">
            {!usuario && vista !== 'login' && (
              <>
                <button
                  className="btn-login-top"
                  onClick={() => setVista('login')}
                >
                  Iniciar sesión
                </button>

                <img src={logo} alt="" className="logo" />
              </>
            )}

            {usuario && (
              <div className="usuario-box">
                <span>Bienvenido Ricardo ✅</span>

                <button
                  className="btn-logout"
                  onClick={cerrarSesion}
                >
                  Cerrar sesión
                </button>

                <img src={logo} alt="" className="logo" />
              </div>
            )}
          </div>
        </header>

        {vista === 'login' && (
          <section className="login-page">
            <div className="login-card">
              <img src={logo} className="login-logo" />

              <h2>Iniciar sesión</h2>

              <input
                type="email"
                placeholder="Usuario"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button onClick={iniciarSesion}>
                Iniciar sesión
              </button>
            </div>
          </section>
        )}

        {vista === 'nuevo' && usuario && (
          <section className="card">
            <h2>Nuevo Producto</h2>

            <div className="form-grid">
              <input
                placeholder="Descripción"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />

              <input
                placeholder="Cantidad"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />

              <input
                placeholder="Medida"
                value={medida}
                onChange={(e) => setMedida(e.target.value)}
              />

              <input
                placeholder="Espesor"
                value={espesor}
                onChange={(e) => setEspesor(e.target.value)}
              />

              <input
                placeholder="Color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />

              <button
                className="btn-primary"
                onClick={guardarMaterial}
              >
                {editandoId
                  ? 'Guardar Cambios'
                  : 'Agregar Producto'}
              </button>
            </div>
          </section>
        )}

        {vista === 'inventario' && (
          <section className="card">
            <h2>Inventario</h2>

            <div className="filtros">
              <select
                value={filtroMaterial}
                onChange={(e) =>
                  setFiltroMaterial(e.target.value)
                }
              >
                <option value="todos">
                  Todos los materiales
                </option>

                {listaMateriales.map((material) => (
                  <option key={material} value={material}>
                    {material.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="tabla-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Medida</th>
                    <th>Espesor</th>
                    <th>Color</th>
                    <th>Fecha actualización</th>
                    {usuario && <th>Acciones</th>}
                  </tr>
                </thead>

                <tbody>
                  {materialesFiltrados.map((m) => (
                    <tr key={m.id}>
                      <td>{m.descripcion}</td>
                      <td>{m.cantidad}</td>
                      <td>{m.medida}</td>
                      <td>{m.espesor}</td>
                      <td>{m.color}</td>
                      <td>
                        {m.fecha_actualizacion
                          ? new Date(
                              m.fecha_actualizacion
                            ).toLocaleString()
                          : 'Sin fecha'}
                      </td>

                      {usuario && (
                        <td>
                          <div className="acciones">
                            <button
                              className="btn-edit"
                              onClick={() => editarMaterial(m)}
                            >
                              Editar
                            </button>

                            <button
                              className="btn-delete"
                              onClick={() =>
                                eliminarMaterial(m.id)
                              }
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {vista === 'movimientos' && usuario && (
          <section className="card">
            <h2>Movimientos</h2>

            <div className="form-grid">
              <input
                placeholder="Nombre del producto"
                value={movDescripcion}
                onChange={(e) =>
                  setMovDescripcion(e.target.value)
                }
              />

              <input
                placeholder="Espesor"
                value={movEspesor}
                onChange={(e) => setMovEspesor(e.target.value)}
              />

              <input
                placeholder="Medida"
                value={movMedida}
                onChange={(e) => setMovMedida(e.target.value)}
              />

              <input
                placeholder="Color"
                value={movColor}
                onChange={(e) => setMovColor(e.target.value)}
              />

              <select
                value={movTipo}
                onChange={(e) => setMovTipo(e.target.value)}
              >
                <option value="Ingreso">Ingreso</option>
                <option value="Salida">Salida</option>
              </select>

              <input
                placeholder="Cantidad"
                value={movCantidad}
                onChange={(e) => setMovCantidad(e.target.value)}
              />

              <input
                placeholder="Observación"
                value={movObservacion}
                onChange={(e) =>
                  setMovObservacion(e.target.value)
                }
              />

              <button
                className="btn-primary"
                onClick={registrarMovimiento}
              >
                Registrar Movimiento
              </button>
            </div>

            <br />

            <div className="tabla-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Espesor</th>
                    <th>Medida</th>
                    <th>Color</th>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Observación</th>
                  </tr>
                </thead>

                <tbody>
                  {movimientos.map((mov) => (
                    <tr key={mov.id}>
                      <td>{mov.descripcion}</td>
                      <td>{mov.espesor}</td>
                      <td>{mov.medida}</td>
                      <td>{mov.color}</td>
                      <td>
                        {mov.fecha
                          ? new Date(mov.fecha).toLocaleString()
                          : ''}
                      </td>
                      <td>{mov.tipo_movimiento}</td>
                      <td>{mov.cantidad}</td>
                      <td>{mov.observacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {vista === 'reportes' && usuario && (
          <section className="card">
            <h2>Reportes</h2>
            <p>Próximamente...</p>
          </section>
        )}
      </main>
    </div>
  )
}

export default App