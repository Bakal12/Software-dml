import "./repuestos.css"
import OrdenASC from "./Images/OrdenASC.png"
import OrdenDESC from "./Images/OrdenDESC.png"
import OrdenIDLE from "./Images/OrdenIDLE.png"
import TrashICON from "./Images/TrashICON.png"
import DeleteICON from "./Images/DeleteICON.png"
import { useState, useEffect, useRef, useCallback } from "react"
import { Pagination } from "@mui/material"
import api from "./API"
import { ToastContainer } from "./components/Toast"
import DOMPurify from "dompurify"

export default function Repuestos() {
  /*-------------------------------------- VARIABLES --------------------------------------*/

  const [repuestos, setRepuestos] = useState([
    {
      codigo: "",
      descripcion: "",
      cantidad_disponible: "",
      numero_estanteria: "",
      numero_estante: "",
      numero_BIN: "",
      posicion_BIN: "",
    },
  ]) // Inicialmente contiene una sola grilla

  const [editingCell, setEditingCell] = useState(null) // Variable que referencia a editar las celdas

  const [showNewRepuestoForm, setShowNewRepuestoForm] = useState(false) // Variable que referencia a mostrar la grilla para crear nuevo repuesto

  const [allRepuestos, setAllRepuestos] = useState([]) // Variable que guarda todo el array de registros en la coleccion de la db
  const [displayedRepuestos, setDisplayedRepuestos] = useState([]) // Guarda registros actuales en pantalla
  const [limit, setLimit] = useState(5) // Guarda el límite por página
  const [currentPage, setCurrentPage] = useState(1) // Guarda la página actual
  const [totalPages, setTotalPages] = useState(1) // Guarda el total de páginas
  const [isLoading, setIsLoading] = useState(true) // Guarda el estado de carga
  const [sortField, setSortField] = useState(null) // Campo activo para ordenar
  const [sortDirection, setSortDirection] = useState("idle") // Dirección actual (ascendente, descendente, idle)

  const [searchTerm, setSearchTerm] = useState("") // Guarda el "prompt" del query para la busqueda

  const [fichas, setFichas] = useState([]) // State para almacenar los datos de las fichas

  const [toasts, setToasts] = useState([])
  const editingInputRef = useRef(null)

  // Añade este nuevo estado para manejar los campos erróneos
  const [errorFields, setErrorFields] = useState({})

  const autoResize = (textarea) => {
    textarea.style.height = "auto" // Restablecer altura
    textarea.style.height = `${textarea.scrollHeight}px` // Ajustar a la altura del contenido
  }

  /*------------------------------------------- C R U D -------------------------------------------*/

  /*--------------- Crear repuesto ---------------*/

  // Agregar una nueva grilla
  const addRepuesto = () => {
    setRepuestos((prev) => [
      ...prev,
      {
        codigo: "",
        descripcion: "",
        cantidad_disponible: "0",
        numero_estanteria: "",
        numero_estante: "",
        numero_BIN: "",
        posicion_BIN: "",
      },
    ])
  }

  // Eliminar una grilla específica
  const removeRepuesto = (index) => {
    if (repuestos.length > 1) {
      setRepuestos((prev) => prev.filter((_, i) => i !== index))
    }
  }

  // Actualizar los datos de una grilla
  const updateRepuestoField = (index, field, value) => {
    setRepuestos((prev) => prev.map((repuesto, i) => (i === index ? { ...repuesto, [field]: value } : repuesto)))
  }

  const addToast = useCallback((message, type, duration = 5000) => {
    const newToast = { id: Date.now(), message, type, duration }
    setToasts((prevToasts) => {
      const updatedToasts = [newToast, ...prevToasts]
      if (updatedToasts.length > 5) {
        const oldestToast = updatedToasts.pop()
        setTimeout(() => removeToast(oldestToast.id), 0)
      }
      return updatedToasts
    })
  }, [])

  const removeToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }

  // Modifica la función validateField para que devuelva un booleano
  const validateField = (field, value) => {
    switch (field) {
      case "codigo":
      case "descripcion":
      case "numero_estanteria":
      case "numero_estante":
      case "numero_BIN":
      case "posicion_BIN":
        return typeof value === "string" && value.trim() !== ""
      case "cantidad_disponible":
        return !isNaN(value) && Number.parseInt(value) >= 0
      default:
        return true
    }
  }

  // Modifica la función createAllRepuestos
  const createAllRepuestos = async () => {
    const newErrorFields = {}
    let isValid = true

    repuestos.forEach((repuesto, index) => {
      Object.entries(repuesto).forEach(([field, value]) => {
        if (!validateField(field, value)) {
          newErrorFields[`${index}-${field}`] = true
          isValid = false
        }
      })
    })

    setErrorFields(newErrorFields)

    if (!isValid) {
      addToast("Por favor, complete todos los campos correctamente antes de crear los repuestos.", "warning")
      return
    }

    try {
      const newRepuestos = await Promise.all(
        repuestos.map(async (repuesto) => {
          const response = await api.post("/repuestos", repuesto)
          return { ...repuesto, ID: response.data.id }
        }),
      )
      await loadAllRepuestos()
      setRepuestos([
        {
          codigo: "",
          descripcion: "",
          cantidad_disponible: "0",
          numero_estanteria: "",
          numero_estante: "",
          numero_BIN: "",
          posicion_BIN: "",
        },
      ])
      setErrorFields({})
      addToast("Repuestos creados exitosamente", "success")
    } catch (error) {
      console.error("Error al crear los repuestos:", error)
      addToast("Error al crear los repuestos", "error")
    }
  }

  // Actualizar repuesto
  const updateRepuesto = async (id, field, value) => {
    try {
      await api.put(`/repuestos/${id}`, { [field]: value })
      setAllRepuestos((prevRepuestos) => prevRepuestos.map((r) => (r.ID === id ? { ...r, [field]: value } : r)))
      setDisplayedRepuestos((prevDisplayed) => prevDisplayed.map((r) => (r.ID === id ? { ...r, [field]: value } : r)))
      addToast("Repuesto actualizado exitosamente", "success")
    } catch (error) {
      console.error("Error al actualizar el repuesto:", error.response?.data || error.message)
      addToast("Error al actualizar repuesto", "error")
    }
  }

  // Eliminar repuesto
  const deleteRepuesto = async (id) => {
    try {
      await api.delete(`/repuestos/${id}`)
      setAllRepuestos((prev) => prev.filter((repuesto) => repuesto.ID !== id))
      setDisplayedRepuestos((prev) => prev.filter((repuesto) => repuesto.ID !== id))
      addToast("Repuesto eliminado exitosamente", "success")
    } catch (error) {
      console.error("Error al eliminar el repuesto:", error)
      addToast("Error al eliminar repuesto", "error")
    }
  }

  /*------------------------------------------- CARGA DE DATOS -------------------------------------------*/

  const loadAllRepuestos = useCallback(async () => {
    try {
      const response = await api.get("/repuestos")
      const repuestos = response.data
      setAllRepuestos(repuestos)
      setTotalPages(Math.ceil(repuestos.length / limit))
      setDisplayedRepuestos(repuestos.slice(0, limit))
      addToast("Datos cargados exitosamente", "success", 3000)
    } catch (error) {
      console.error("Error al cargar los datos:", error)
      addToast("Error al cargar los datos", "error")
    }
  }, [limit, addToast])

  // Obtener todos los registros al cargar el componente
  useEffect(() => {
    console.log("Fetching data...")
    const fetchRepuestos = async () => {
      setIsLoading(true)
      await loadAllRepuestos()
      setIsLoading(false)
    }

    fetchRepuestos()
  }, [loadAllRepuestos]) // Fixed dependency

  /*------------------------------------------- MISCELÁNEA -------------------------------------------*/

  // Función donde realiza el query para la búsqueda
  const searchRepuestos = async (term) => {
    if (term.trim() === "") {
      setDisplayedRepuestos(allRepuestos.slice(0, limit))
      setTotalPages(Math.ceil(allRepuestos.length / limit))
      setCurrentPage(1)
      return
    }

    try {
      const response = await api.get(`/repuestos/search`, {
        params: { term },
      })
      const filteredRepuestos = response.data

      setDisplayedRepuestos(filteredRepuestos.slice(0, limit))
      setTotalPages(Math.ceil(filteredRepuestos.length / limit))
      setCurrentPage(1)
    } catch (error) {
      console.error("Error al buscar repuestos:", error)
      addToast("Error al buscar repuestos", "error")
    }
  }

  const toggleSort = (field) => {
    let nextDirection = "asc"

    if (sortField === field) {
      nextDirection = sortDirection === "asc" ? "desc" : "asc"
    }

    setSortField(field)
    setSortDirection(nextDirection)

    const sortedRepuestos = [...allRepuestos].sort((a, b) => {
      if (a[field] < b[field]) return nextDirection === "asc" ? -1 : 1
      if (a[field] > b[field]) return nextDirection === "asc" ? 1 : -1
      return 0
    })
    setAllRepuestos(sortedRepuestos)
  }

  const getRowClass = (repuesto) => {
    // Check if the repuesto is in any ficha's "repuestos faltantes"
    const isInRepuestosFaltantes = fichas.some(
      (ficha) => ficha.repuestos_faltantes && ficha.repuestos_faltantes[repuesto.codigo],
    )
    return isInRepuestosFaltantes ? "repuesto-faltante" : ""
  }

  // Actualizar los registros mostrados cuando cambie la página o el límite
  useEffect(() => {
    const startIndex = (currentPage - 1) * limit
    const endIndex = startIndex + limit
    setDisplayedRepuestos(allRepuestos.slice(startIndex, endIndex))
  }, [currentPage, limit, allRepuestos])

  useEffect(() => {
    const fetchFichas = async () => {
      try {
        const response = await api.get("/fichas")
        setFichas(response.data)
      } catch (error) {
        console.error("Error al obtener las fichas:", error)
      }
    }

    fetchFichas()
  }, [])

  const getContentWidth = (content) => {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    context.font = "14px Arial" // Ajusta esto al tamaño y fuente que uses
    return Math.ceil(context.measureText(content).width) + 20 // 20px extra para padding
  }

  // Editar repuesto
  const makeEditable = (repuestoId, field, initialValue) => {
    const contentWidth = Math.max(100, getContentWidth(initialValue))
    return (
      <div>
        <textarea
          ref={editingInputRef}
          rows={2}
          spellCheck="true"
          className="input editable-field"
          defaultValue={initialValue}
          style={{ width: `${contentWidth}px` }}
          onBlur={(e) => {
            const newValue = DOMPurify.sanitize(e.target.value)
            if (newValue.trim() !== "") {
              if (validateField(field, newValue)) {
                if (field === "cantidad_disponible") {
                  // Para campos numéricos, comparamos los valores numéricos
                  if (Number.parseInt(newValue, 10) !== Number.parseInt(initialValue, 10)) {
                    updateRepuesto(repuestoId, field, newValue)
                  }
                } else if (newValue !== initialValue) {
                  updateRepuesto(repuestoId, field, newValue)
                }
              } else {
                addToast(`Tipo de dato inválido`, "error")
              }
            }
            setEditingCell(null)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              e.target.blur()
            }
          }}
          onInput={(e) => {
            autoResize(e.target)
            e.target.style.width = `${Math.max(100, getContentWidth(e.target.value))}px`
          }}
          autoFocus
        />
        {editingInputRef.current && editingInputRef.current.value.trim() === "" && (
          <div className="edit-warning">Escriba al menos un carácter</div>
        )}
      </div>
    )
  }

  /*------------------------------------------- CODIGO HTML -------------------------------------------*/

  return (
    <div className="min-h-screen">
      {/*----------------------------------- HEADER -----------------------------------*/}
      <header className="header">
        <nav className="nav">
          <ul>
            <li>
              <a href="/repuestos" className="nav-link">
                Revisar componentes mecánicos
              </a>
            </li>
            <li>
              <a href="/home" className="nav-link">
                Revisar máquinas
              </a>
            </li>
          </ul>
        </nav>
      </header>
      <main className="main-content">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Gestión de repuestos</h2>
          </div>
          {/*------------------------------ GRILLA DE CREACION DE NUEVO REPUESTO ------------------------------*/}
          <div className="card-content">
            <button className="button" onClick={() => setShowNewRepuestoForm(!showNewRepuestoForm)}>
              {showNewRepuestoForm ? "Cancelar" : "Crear Nuevo Repuesto"}
            </button>
            {showNewRepuestoForm && (
              <div className="new-repuesto-form">
                <h3>Crear nuevos repuestos</h3>
                {repuestos.map((repuesto, index) => (
                  <div key={index} style={{ marginTop: "30px", marginBottom: "10px" }}>
                    <h4>{`Repuesto ${index + 1}`}</h4>
                    <div className="form-grid">
                      {[
                        "codigo",
                        "descripcion",
                        "cantidad_disponible",
                        "numero_estanteria",
                        "numero_estante",
                        "numero_BIN",
                        "posicion_BIN",
                      ].map((field) => (
                        <textarea
                          key={field}
                          className={`input ${errorFields[`${index}-${field}`] ? "error-input" : ""}`}
                          rows={1}
                          placeholder={field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ") + "..."}
                          value={repuesto[field]}
                          onChange={(e) => {
                            updateRepuestoField(index, field, e.target.value)
                            setErrorFields((prev) => ({ ...prev, [`${index}-${field}`]: false }))
                          }}
                          onInput={(e) => autoResize(e.target)}
                        />
                      ))}
                      {index > 0 && (
                        <button className="icon-button-repuesto delete-button" onClick={() => removeRepuesto(index)}>
                          <img src={DeleteICON || "/placeholder.svg"} alt="Eliminar" className="button-icon" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {/* Botón para agregar una nueva grilla */}
                <button className="button-newRepuesto" onClick={addRepuesto}>
                  Agregar otro repuesto
                </button>
                {/* Botón para crear todos los repuestos */}
                <button className="button-newRepuesto" style={{ marginLeft: "10px" }} onClick={createAllRepuestos}>
                  Crear repuestos
                </button>
              </div>
            )}
          </div>
        </div>
        {/*------------------------------ TABLA DE REGISTROS ------------------------------*/}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Lista de Repuestos</h2>
            {/*------- Selector de límite -------*/}
            <div className="search-container">
              <input
                style={{ width: "250px" }}
                type="text"
                className="input search-input"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => {
                  const term = e.target.value
                  setSearchTerm(term)
                  searchRepuestos(term)
                }}
              />
              <div>
                <label htmlFor="limit" className="">
                  Resultados por página:{" "}
                </label>
                <select
                  style={{ textAlign: "center" }}
                  id="limit"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value))
                    setCurrentPage(1) // Reiniciar a la página 1 al cambiar el límite
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={allRepuestos.length}>Todos</option>
                </select>
              </div>
            </div>
          </div>
          <div className="card-content">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    {[
                      "codigo",
                      "descripción",
                      "cantidad_disponible",
                      "nº_estantería",
                      "nº_estante",
                      "nº_BIN",
                      "posición_BIN",
                    ].map((field) => {
                      const icon =
                        sortField === field && sortDirection === "asc"
                          ? OrdenASC
                          : sortField === field && sortDirection === "desc"
                            ? OrdenDESC
                            : OrdenIDLE // Usar idleIcon por defecto
                      return (
                        <th key={field}>
                          <div className="th-content">
                            <span>{field.replace("_", " ")}</span> {/* Texto alineado a la izquierda */}
                            <img
                              src={icon || "/placeholder.svg"} // Imagen dinámica según estado
                              alt={`Ordenar por ${field}`}
                              onClick={() => toggleSort(field)}
                            />
                          </div>
                        </th>
                      )
                    })}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRepuestos.map((repuesto) => (
                    <tr key={repuesto.ID} className={getRowClass(repuesto)}>
                      {[
                        "codigo",
                        "descripción",
                        "cantidad_disponible",
                        "nº_estantería",
                        "nº_estante",
                        "nº_BIN",
                        "posición_BIN",
                      ].map((field) => (
                        <td key={field} onDoubleClick={() => setEditingCell({ id: repuesto.ID, field })}>
                          {editingCell?.id === repuesto.ID && editingCell?.field === field
                            ? makeEditable(repuesto.ID, field, repuesto[field])
                            : repuesto[field] || "N/A"}
                        </td>
                      ))}
                      <td className="actions-cell">
                        <div className="actions-buttons">
                          <button
                            className="icon-button delete-button"
                            onClick={() => {
                              deleteRepuesto(repuesto.ID)
                            }}
                          >
                            <img src={TrashICON || "/placeholder.svg"} alt="Eliminar" className="button-icon" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {isLoading && <p>Cargando...</p>}
              {/*------- Paginación -------*/}
              <div style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
                <Pagination
                  count={totalPages} // Número total de páginas
                  page={currentPage} // Página actual
                  onChange={(event, value) => setCurrentPage(value)} // Cambiar página
                  color="primary"
                  disabled={isLoading} // Deshabilitar mientras los datos cargan
                />
              </div>
              {/*------- Indicador de carga --------*/}
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </main>
    </div>
  )
}

