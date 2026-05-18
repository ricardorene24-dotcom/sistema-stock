import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import './App.css'
import logo from './assets/Logo Cesart.png'

function App() {
  const [vista, setVista] = useState('inventario')
  const [menuAbierto, setMenuAbierto] = useState(true)

  const [materiales, setMateriales] = useState([])
  const [movimientos, setMovimientos] = useState([])

  const [descripcion, setDescripcion] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [medida, setMedida] = useState('')
  const [espesor, setEspesor] = useState('')
  const [color, setColor] = useState('')

  const [editandoId, setEditandoId] = useState(null)
  const [cantidadOriginal, setCantidadOriginal] = useState(null)

  useEffect(() => {
    obtenerMateriales()
    obtenerMovimientos()
  }, [])

  async function obtenerMateriales() {
    const { data, error } = await supabase
      .from('materiales')
      .select('*')
      .order('id', { ascending: false })

    if (!error) setMateriales(data)
  }

  async function obtenerMovimientos() {
    const { data, error } = await supabase
      .from('movimientos')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setMovimientos(data)
  }

  function limpiarFormulario() {
    setDescripcion('')
    setCantidad('')
    setMedida('')
    setEspesor('')
    setColor('')
    setEditandoId(null)
    setCantidadOriginal(null)
  }

  function editarMaterial(material) {
    setEditandoId(material.id)
    setCantidadOriginal(Number(material.cantidad))

    setDescripcion(material.descripcion)
    setCantidad(material.cantidad)
    setMedida(material.medida)
    setEspesor(material.espesor)
    setColor(material.color)

    setVista('nuevo')
  }

  async function guardarMaterial() {
    if (!descripcion || !cantidad) {
      alert('Completa descripción y cantidad')
      return
    }

    if (editandoId) {
      const nuevaCantidad = Number(cantidad)

      const { error } = await supabase
        .from('materiales')
        .update({
          descripcion,
          cantidad: nuevaCantidad,
          medida,
          espesor,
          color,
        })
        .eq('id', editandoId)

      if (error) {
        alert('Error al actualizar')
        return
      }

      if (cantidadOriginal !== nuevaCantidad) {
        const observacion = prompt(
          'Escribe una observación del movimiento'
        )

        await supabase.from('movimientos').insert([
          {
            material: descripcion,
            cantidad_anterior: cantidadOriginal,
            cantidad_nueva: nuevaCantidad,
            diferencia: nuevaCantidad - cantidadOriginal,
            observacion: observacion || 'Sin observación',
          },
        ])
      }

      limpiarFormulario()
      obtenerMateriales()
      obtenerMovimientos()
      setVista('inventario')
      return
    }

    const { error } = await supabase.from('materiales').insert([
      {
        descripcion,
        cantidad: Number(cantidad),
        medida,
        espesor,
        color,
      },
    ])

    if (error) {
      alert('Error al guardar')
      return
    }

    await supabase.from('movimientos').insert([
      {
        material: descripcion,
        cantidad_anterior: 0,
        cantidad_nueva: Number(cantidad),
        diferencia: Number(cantidad),
        observacion: 'Nuevo producto agregado',
      },
    ])

    limpiarFormulario()
    obtenerMateriales()
    obtenerMovimientos()
    setVista('inventario')
  }

  async function eliminarMaterial(id) {
    const confirmar = confirm('¿Eliminar material?')
    if (!confirmar) return

    const { error } = await supabase
      .from('materiales')
      .delete()
      .eq('id', id)

    if (!error) obtenerMateriales()
  }

  return (
    <div className="layout">
      <aside className={menuAbierto ? 'sidebar abierto' : 'sidebar'}>
        <div className="brand" onClick={() => setMenuAbierto(!menuAbierto)}>
          CESART SYSTEM
        </div>

        {menuAbierto && (
          <nav className="menu">
            <button onClick={() => setVista('nuevo')}>Nuevo Producto</button>
            <button onClick={() => setVista('inventario')}>Inventario</button>
            <button onClick={() => setVista('movimientos')}>Movimientos</button>
            <button onClick={() => setVista('reportes')}>Reportes</button>
          </nav>
        )}
      </aside>

      <main className="contenido">
        <header className="topbar">
          <div>
            <h1>Sistema de Stock Cesart</h1>
            <p>Control de Inventario</p>
          </div>

          <img src={logo} alt="Logo Cesart" className="logo" />
        </header>

        {vista === 'nuevo' && (
          <section className="card">
            <h2>{editandoId ? 'Editar Producto' : 'Nuevo Producto'}</h2>

            <div className="form-grid">
              <input placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              <input placeholder="Cantidad" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
              <input placeholder="Medida" value={medida} onChange={(e) => setMedida(e.target.value)} />
              <input placeholder="Espesor" value={espesor} onChange={(e) => setEspesor(e.target.value)} />
              <input placeholder="Color" value={color} onChange={(e) => setColor(e.target.value)} />

              <button className="btn-primary" onClick={guardarMaterial}>
                {editandoId ? 'Guardar Cambios' : 'Agregar Producto'}
              </button>
            </div>
          </section>
        )}

        {vista === 'inventario' && (
          <section className="card">
            <h2>Inventario</h2>

            <div className="tabla-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Medida</th>
                    <th>Espesor</th>
                    <th>Color</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {materiales.map((m) => (
                    <tr key={m.id}>
                      <td>{m.descripcion}</td>
                      <td>{m.cantidad}</td>
                      <td>{m.medida}</td>
                      <td>{m.espesor}</td>
                      <td>{m.color}</td>
                      <td>
                        <div className="acciones">
                          <button className="btn-edit" onClick={() => editarMaterial(m)}>Editar</button>
                          <button className="btn-delete" onClick={() => eliminarMaterial(m.id)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {vista === 'movimientos' && (
          <section className="card">
            <h2>Movimientos</h2>

            <div className="tabla-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Material</th>
                    <th>Antes</th>
                    <th>Ahora</th>
                    <th>Diferencia</th>
                    <th>Observación</th>
                  </tr>
                </thead>

                <tbody>
                  {movimientos.map((mov) => (
                    <tr key={mov.id}>
                      <td>{new Date(mov.created_at).toLocaleString()}</td>
                      <td>{mov.material}</td>
                      <td>{mov.cantidad_anterior}</td>
                      <td>{mov.cantidad_nueva}</td>
                      <td>{mov.diferencia}</td>
                      <td>{mov.observacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {vista === 'reportes' && (
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