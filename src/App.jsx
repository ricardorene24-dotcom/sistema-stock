import { useEffect, useState } from 'react'
import { supabase } from './supabase'

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

  useEffect(() => {
    obtenerMateriales()

    verificarUsuario()
  }, [])

  async function verificarUsuario() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    setUsuario(user)
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

  async function agregarMaterial() {
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
      console.log(error)
    } else {
      alert('Material agregado')

      setDescripcion('')
      setCantidad('')
      setMedida('')
      setEspesor('')
      setColor('')

      obtenerMateriales()
    }
  
  }
  async function eliminarMaterial(id) {
  const confirmar = confirm(
    '¿Eliminar material?'
  )

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
    <div
      style={{
        padding: '30px',
        fontFamily: 'Arial',
      }}
    >
      <h1>Sistema de Stock</h1>

      {!usuario ? (
        <div
          style={{
            marginBottom: '30px',
            maxWidth: '300px',
          }}
        >
          <h2>Login Administrador</h2>

          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <br />
          <br />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <br />
          <br />

          <button onClick={iniciarSesion}>
            Iniciar Sesión
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: '30px' }}>
          <p>Administrador conectado ✅</p>

          <button onClick={cerrarSesion}>
            Cerrar Sesión
          </button>

          <h2>Agregar Material</h2>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              maxWidth: '300px',
            }}
          >
            <input
              type="text"
              placeholder="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />

            <input
              type="number"
              placeholder="Cantidad"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />

            <input
              type="text"
              placeholder="Medida"
              value={medida}
              onChange={(e) => setMedida(e.target.value)}
            />

            <input
              type="text"
              placeholder="Espesor"
              value={espesor}
              onChange={(e) => setEspesor(e.target.value)}
            />

            <input
              type="text"
              placeholder="Color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />

            <button onClick={agregarMaterial}>
              Agregar Material
            </button>
          </div>
        </div>
      )}

      <table
        border="1"
        cellPadding="10"
        style={{
          borderCollapse: 'collapse',
          width: '100%',
        }}
      >
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
    <button
      onClick={() => eliminarMaterial(material.id)}
    >
      Eliminar
    </button>
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