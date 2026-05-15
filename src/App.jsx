import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import './App.css'

function App() {
  const [materiales, setMateriales] = useState([])
  const [descripcion, setDescripcion] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [medida, setMedida] = useState('')
  const [espesor, setEspesor] = useState('')
  const [color, setColor] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [usuario, setUsuario] = useState(null)
  const [editandoId, setEditandoId] = useState(null)

  useEffect(() => {
    obtenerMateriales()
    verificarUsuario()
  }, [])

  async function verificarUsuario() {
    const { data: { user } } = await supabase.auth.getUser()
    setUsuario(user)
  }

  async function obtenerMateriales() {
    const { data, error } = await supabase
      .from('materiales')
      .select('*')
      .order('id', { ascending: false })

    if (!error) setMateriales(data)
  }

  async function iniciarSesion() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('Credenciales incorrectas')
    } else {
      alert('Bienvenido administrador')
      verificarUsuario()
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    setUsuario(null)
  }

  function limpiarFormulario() {
    setDescripcion('')
    setCantidad('')
    setMedida('')
    setEspesor('')
    setColor('')
    setEditandoId(null)
  }

  function editarMaterial(material) {
    setEditandoId(material.id)
    setDescripcion(material.descripcion)
    setCantidad(material.cantidad)
    setMedida(material.medida)
    setEspesor(material.espesor)
    setColor(material.color)
  }

  async function agregarMaterial() {
    if (editandoId) {
      const { error } = await supabase
        .from('materiales')
        .update({
          descripcion,
          cantidad,
          medida,
          espesor,
          color,
        })
        .eq('id', editandoId)

      if (error) {
        alert('Error al editar')
      } else {
        alert('Material actualizado')
        limpiarFormulario()
        obtenerMateriales()
      }

      return
    }

    const { error } = await supabase
      .from('materiales')
      .insert([
        {
          descripcion,
          cantidad,
          medida,
          espesor,
          color,
        },
      ])

    if (error) {
      alert('Error al guardar')
    } else {
      alert('Material agregado')
      limpiarFormulario()
      obtenerMateriales()
    }
  }

  async function eliminarMaterial(id) {
    const confirmar = confirm('¿Eliminar material?')
    if (!confirmar) return

    const { error } = await supabase
      .from('materiales')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error al eliminar')
    } else {
      obtenerMateriales()
    }
  }

  return (
    <div className="container">
      <h1 className="titulo">Sistema de Stock</h1>

      {!usuario ? (
        <div className="panel">
          <h2>Login Administrador</h2>

          <div className="formulario">
            <input
              className="input"
              type="email"
              placeholder="Correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="input"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              className="boton boton-principal"
              onClick={iniciarSesion}
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="admin-bar">
            <span className="estado-admin">
              Bienvenido Administrador (Conectado ✅)
            </span>

            <button
              className="boton salir"
              onClick={cerrarSesion}
            >
              Cerrar Sesión
            </button>
          </div>

          <div className="panel">
            <h2>
              {editandoId ? 'Editar Material' : 'Agregar Material'}
            </h2>

            <div className="formulario">
              <input
                className="input"
                type="text"
                placeholder="Descripción"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />

              <input
                className="input"
                type="text"
                placeholder="Cantidad"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />

              <input
                className="input"
                type="text"
                placeholder="Medida"
                value={medida}
                onChange={(e) => setMedida(e.target.value)}
              />

              <input
                className="input"
                type="text"
                placeholder="Espesor"
                value={espesor}
                onChange={(e) => setEspesor(e.target.value)}
              />

              <input
                className="input"
                type="text"
                placeholder="Color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />

              <button
                className="boton boton-principal"
                onClick={agregarMaterial}
              >
                {editandoId ? 'Guardar Cambios' : 'Agregar Material'}
              </button>
            </div>
          </div>
        </>
      )}

      <table className="tabla">
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Cantidad</th>
            <th>Medida</th>
            <th>Espesor</th>
            <th>Color</th>
            {usuario && <th>Acciones</th>}
          </tr>
        </thead>

        <tbody>
          {materiales.map((material) => (
            <tr key={material.id}>
              <td>{material.descripcion}</td>
              <td>{material.cantidad}</td>
              <td>{material.medida}</td>
              <td>{material.espesor}</td>
              <td>{material.color}</td>

              {usuario && (
                <td>
                  <div className="acciones">
                    <button
                      className="boton editar"
                      onClick={() => editarMaterial(material)}
                    >
                      Editar
                    </button>

                    <button
                      className="boton eliminar"
                      onClick={() => eliminarMaterial(material.id)}
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
  )
}

export default App