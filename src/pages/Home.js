import "./home.css"
import InfoICON from "./Images/InfoICON.png"
import DeleteICON from "./Images/DeleteICON.png"
import AddICON from "./Images/AddICON.png"
import ConfirmICON from "./Images/ConfirmICON.png"
import OrdenASC from "./Images/OrdenASC.png"
import OrdenDESC from "./Images/OrdenDESC.png"
import OrdenIDLE from "./Images/OrdenIDLE.png"
import TrashICON from "./Images/TrashICON.png"
import ExcelICON from "./Images/ExcelICON.png"
import WarningICON from "./Images/WarningICON.png"
import DecreaseStockICON from "./Images/DecreaseStockICON.png"
import IncreaseStockICON from "./Images/IncreaseStockICON.png"
import { useState, useEffect } from "react"
import { Pagination } from "@mui/material"
import { saveAs } from "file-saver"
import templateFile from "../Plantilla_excel.xlsx"
import ExcelJS from "exceljs"
import api from "./API"
import { ToastContainer } from "./components/Toast"
import DOMPurify from "dompurify"

const Home = () => {
  const [ficha, setFicha] = useState([])
  const createEmptyFicha = () => ({
    numero_ficha: "",
    cliente: "",
    serie: "",
    modelo: "",
    no_bat: "",
    no_cargador: "",
    diagnóstico: "",
    tipo: "",
    observaciones: "",
    reparación: "",
    repuestos_colocados: {},
    repuestos_faltantes: {},
    no_ciclos: "",
    estado: "",
  })

  const [isLoading, setIsLoading] = useState(true)
  const [displayedFichas, setDisplayedFichas] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(5)

  const [editingCell, setEditingCell] = useState(null)
  const [showNewFichaForm, setShowNewFichaForm] = useState(false)
  const [sortField, setSortField] = useState(null)
  const [sortOrder, setSortOrder] = useState("asc")

  const [searchTerm, setSearchTerm] = useState("")

  const [repuestosExistentes, setRepuestosExistentes] = useState({})
  const [newFichas, setNewFichas] = useState([createEmptyFicha()])
  const [repuestosColocadosInput, setRepuestosColocadosInput] = useState({})
  const [repuestosFaltantesInput, setRepuestosFaltantesInput] = useState({})
  const [updatedRepuestos, setUpdatedRepuestos] = useState({})
  const [toasts, setToasts] = useState([])

  const createFicha = async (fichaData) => {
    try {
      const response = await api.post("/fichas", fichaData)
      const newFichaWithId = { ...fichaData, item: response.data.id }
      setFicha((prevFicha) => [...prevFicha, newFichaWithId])
      setDisplayedFichas((prevDisplayed) => [...prevDisplayed, newFichaWithId])
      addToast("Ficha creada exitosamente", "success", 3000)
    } catch (error) {
      console.error("Error al crear la ficha:", error)
      addToast(`Error: ${error.message}`, "error")
    }
  }

  const createAllFichas = async () => {
    const isValid = newFichas.every(
      (ficha) =>
        ficha.numero_ficha &&
        ficha.cliente &&
        ficha.serie &&
        ficha.modelo &&
        ficha.no_bat &&
        ficha.no_cargador &&
        ficha.diagnóstico &&
        ficha.tipo &&
        ficha.observaciones &&
        ficha.reparación &&
        ficha.no_ciclos &&
        ficha.estado,
    )

    if (!isValid) {
      alert("Por favor, complete todos los campos antes de crear las fichas.")
      return
    }

    for (const fichaData of newFichas) {
      await createFicha(fichaData)
    }
    setShowNewFichaForm(false)
    setNewFichas([createEmptyFicha()])
  }

  const updateFicha = async (id, field, value) => {
    try {
      await api.put(`/fichas/${id}`, { [field]: value })
      setFicha((prevFicha) => prevFicha.map((ficha) => (ficha.item === id ? { ...ficha, [field]: value } : ficha)))
      setDisplayedFichas((prevDisplayed) =>
        prevDisplayed.map((ficha) => (ficha.item === id ? { ...ficha, [field]: value } : ficha)),
      )
      addToast("Ficha actualizada exitosamente", "success", 3000)
    } catch (error) {
      addToast("Error al actualizar ficha", "error")
      console.error("Error al actualizar la ficha:", error)
    }
  }

  const deleteFicha = async (id) => {
    try {
      await api.delete(`/fichas/${id}`)
      setFicha((prevFicha) => prevFicha.filter((ficha) => ficha.item !== id))
      setDisplayedFichas((prevDisplayed) => prevDisplayed.filter((ficha) => ficha.item !== id))
      addToast("Ficha eliminada exitosamente", "success", 3000)
    } catch (error) {
      console.error("Error al eliminar la ficha:", error)
      addToast("Error al eliminar ficha", "error")
    }
  }

  const loadAllFichas = async () => {
    try {
      console.log("BASE URL:", process.env.REACT_APP_API_BASE_URL_TESTING)

      const response = await api.get("/fichas")
      const allficha = response.data
      setFicha(allficha)
      setTotalPages(Math.ceil(allficha.length / limit))
      setDisplayedFichas(allficha.slice(0, limit))
      addToast("Datos cargados exitosamente", "success", 3000)
    } catch (error) {
      console.error("Error al cargar los datos:", error)
      addToast("Error al cargar los datos", "error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAllFichas()
  }, [])

  useEffect(() => {
    const startIndex = (currentPage - 1) * limit
    const endIndex = startIndex + limit
    setDisplayedFichas(ficha.slice(startIndex, endIndex))
  }, [currentPage, limit, ficha])

  const exportToExcel = async (fichaData) => {
    try {
      const templateBuffer = await fetch(templateFile).then((response) => response.arrayBuffer())

      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(templateBuffer)

      const worksheet = workbook.getWorksheet(1)

      worksheet.getCell("A3").value = fichaData.numero_ficha
      worksheet.getCell("C11").value = fichaData.cliente
      worksheet.getCell("E13").value = fichaData.serie
      worksheet.getCell("E14").value = fichaData.nº_bat
      worksheet.getCell("E15").value = fichaData.nº_cargador
      worksheet.getCell("A18").value = fichaData.diagnóstico
      worksheet.getCell("A29").value = fichaData.reparación

      const repuestosColocados = fichaData.repuestos_colocados || {}
      let row = 37

      const repuestosResponse = await api.get("/repuestos")
      const repuestosInfo = repuestosResponse.data.reduce((acc, repuesto) => {
        acc[repuesto.codigo] = repuesto.descripción
        return acc
      }, {})

      Object.entries(repuestosColocados).forEach(([nombre, cantidad]) => {
        worksheet.getCell(`A${row}`).value = nombre
        worksheet.getCell(`B${row}`).value = cantidad
        worksheet.getCell(`C${row}`).value = repuestosInfo[nombre] || "Descripción no encontrada"
        row++
      })

      const buffer = await workbook.xlsx.writeBuffer()
      saveAs(
        new Blob([buffer], { type: "application/octet-stream" }),
        `${fichaData.numero_ficha}-${fichaData.cliente}-${fichaData.serie}.xlsx`,
      )
      addToast("Archivo Excel generado exitosamente", "success", 3000)
    } catch (error) {
      console.error("Error al exportar el Excel:", error)
      addToast("Error al exportar Excel", "error")
    }
  }

  const searchFichasInDatabase = async (term) => {
    if (term.trim() === "") {
      loadAllFichas()
      return
    }
    try {
      const response = await api.get(`/fichas/search?term=${term}`)
      const filteredFichas = response.data
      setFicha(filteredFichas)
      setTotalPages(Math.ceil(filteredFichas.length / limit))
      setCurrentPage(1)
      setDisplayedFichas(filteredFichas.slice(0, limit))
    } catch (error) {
      console.error("Error during search:", error)
      addToast("Error al buscar fichas", "error")
    }
  }

  const autoResize = (textarea) => {
    textarea.style.height = "auto"
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  const getContentWidth = (content) => {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    context.font = "14px Arial" // Ajusta esto al tamaño y fuente que uses
    return Math.ceil(context.measureText(content).width) + 20 // 20px extra para padding
  }

  const makeEditable = (fichaId, field, initialValue) => {
    const isRepuestosField = field === "repuestos_colocados" || field === "repuestos_faltantes"

    if (isRepuestosField) {
      const repuestosMap = initialValue || {}

      return (
        <div className="editable-repuestos">
          {Object.entries(repuestosMap).map(([nombre, cantidad], index) => (
            <div key={index} className="repuesto-row">
              <input
                type="text"
                defaultValue={nombre}
                className="input-field-editable"
                style={{ maxWidth: "70px" }}
                placeholder="Código del repuesto"
                onBlur={(e) => {
                  const newNombre = e.target.value
                  const newRepuestos = { ...repuestosMap }
                  if (newNombre !== nombre) {
                    newRepuestos[newNombre] = repuestosMap[nombre]
                    delete newRepuestos[nombre]
                  }
                  updateFicha(fichaId, field, newRepuestos)
                }}
              />
              <input
                type="number"
                defaultValue={cantidad}
                className="input-field-editable"
                style={{ maxWidth: "40px" }}
                placeholder="Cantidad"
                onBlur={(e) => {
                  const newCantidad = Number(e.target.value)
                  const newRepuestos = { ...repuestosMap, [nombre]: newCantidad }
                  updateFicha(fichaId, field, newRepuestos)
                }}
              />
              <button
                className="button-delete"
                onClick={() => {
                  const newRepuestos = { ...repuestosMap }
                  delete newRepuestos[nombre]
                  updateFicha(fichaId, field, newRepuestos)
                }}
              >
                <img src={DeleteICON || "/placeholder.svg"} alt="Eliminar" className="button-icon" />
              </button>
            </div>
          ))}
          <div className="add-repuesto">
            <input
              type="text"
              className="input-field-editable"
              style={{ maxWidth: "70px" }}
              placeholder="Nuevo código"
              id={`new-repuesto-${field}`}
            />
            <input
              type="number"
              className="input-field-editable"
              style={{ maxWidth: "40px" }}
              placeholder="Cantidad"
              id={`new-cantidad-${field}`}
            />
            <button
              className="button-add"
              onClick={() => {
                const nombre = document.getElementById(`new-repuesto-${field}`).value
                const cantidad = Number(document.getElementById(`new-cantidad-${field}`).value)

                if (nombre && cantidad > 0) {
                  const newRepuestos = { ...repuestosMap, [nombre]: cantidad }
                  updateFicha(fichaId, field, newRepuestos)

                  document.getElementById(`new-repuesto-${field}`).value = ""
                  document.getElementById(`new-cantidad-${field}`).value = ""
                }
              }}
            >
              <img src={AddICON || "/placeholder.svg"} alt="Agregar" className="button-icon" />
            </button>
          </div>
          <div className="close-menu">
            <button className="button-close" onClick={() => setEditingCell(null)}>
              <img src={ConfirmICON || "/placeholder.svg"} alt="Cerrar" className="button-icon" />
            </button>
          </div>
        </div>
      )
    }

    const predefinedOptions = {
      tipo: ["Manual", "A batería", "Neumática"],
      modelo: [
        "ITA 10",
        "ITA 11",
        "ITA 12",
        "ITA 20",
        "ITA 21",
        "ITA 24",
        "ITA 25",
        "CT 20",
        "CT 25",
        "CT 40",
        "CTT 20",
        "CTT 25",
        "CTT 40",
      ],
      estado: ["En revisión", "A la espera de repuestos", "Lista para entregar", "Entregada"],
    }

    if (predefinedOptions[field]) {
      const contentWidth = Math.max(100, getContentWidth(initialValue))
      return (
        <select
          className="input-field editable-field"
          style={{ width: `${contentWidth}px` }}
          defaultValue={initialValue}
          onChange={(e) => {
            updateFicha(fichaId, field, e.target.value)
            setEditingCell(null)
          }}
        >
          {predefinedOptions[field].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
    }

    const contentWidth = Math.max(100, getContentWidth(initialValue))
    return (
      <textarea
        spellCheck="true"
        rows={2}
        className="input-field editable-field"
        defaultValue={initialValue}
        style={{ width: `${contentWidth}px` }}
        onBlur={(e) => {
          updateFicha(fichaId, field, DOMPurify.sanitize(e.target.value))
          setEditingCell(null)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            updateFicha(fichaId, field, DOMPurify.sanitize(e.target.value))
            setEditingCell(null)
          }
        }}
        onInput={(e) => {
          autoResize(e.target)
          e.target.style.width = `${Math.max(100, getContentWidth(e.target.value))}px`
        }}
        autoFocus
      />
    )
  }

  const parseRepuestos = (input) => {
    const lines = input.split("\n").filter((line) => line.trim() !== "")
    const repuestosMap = {}

    lines.forEach((line) => {
      const match = line.match(/^(.+)\s+(\d+)$/)
      if (match) {
        const [_, nombre, cantidad] = match
        repuestosMap[nombre] = Number(cantidad)
      }
    })

    return repuestosMap
  }

  const sortData = (field) => {
    const order = sortField === field && sortOrder === "asc" ? "desc" : "asc"
    setSortField(field)
    setSortOrder(order)

    const sortedFicha = [...ficha].sort((a, b) => {
      if (a[field] < b[field]) return order === "asc" ? -1 : 1
      if (a[field] > b[field]) return order === "asc" ? 1 : -1
      return 0
    })

    setFicha(sortedFicha)
  }

  useEffect(() => {
    const fetchRepuestos = async () => {
      try {
        const response = await api.get("/repuestos")
        const repuestosData = {}
        response.data.forEach((repuesto) => {
          repuestosData[repuesto.codigo] = repuesto
        })
        setRepuestosExistentes(repuestosData)
      } catch (error) {
        console.error("Error al obtener los repuestos:", error)
      }
    }

    fetchRepuestos()
  }, [])

  const verificarRepuesto = (codigo) => {
    return repuestosExistentes[codigo] || false
  }

  const updateRepuestoStock = async (fichaId, codigoRepuesto, cantidad, action) => {
    try {
      const response = await api.put(`/update_stock/${fichaId}/${codigoRepuesto}`, { action })
      const { new_stock } = response.data

      setFicha((prevFicha) =>
        prevFicha.map((f) => {
          if (f.item === fichaId) {
            const updatedRepuestosColocados = { ...f.repuestos_colocados }
            // No cambiamos la cantidad, solo actualizamos el estado
            return { ...f, repuestos_colocados: updatedRepuestosColocados }
          }
          return f
        }),
      )

      setRepuestosExistentes((prev) => ({
        ...prev,
        [codigoRepuesto]: {
          ...prev[codigoRepuesto],
          cantidad_disponible: new_stock,
        },
      }))

      const newUpdatedRepuestos = {
        ...updatedRepuestos,
        [`${fichaId}-${codigoRepuesto}`]: action === "decrease",
      }
      setUpdatedRepuestos(newUpdatedRepuestos)

      // Guardar el estado en localStorage
      localStorage.setItem("updatedRepuestos", JSON.stringify(newUpdatedRepuestos))

      console.log(
        `Stock ${action === "decrease" ? "disminuido" : "aumentado"} correctamente para el repuesto:`,
        codigoRepuesto,
      )
      addToast(`Stock del repuesto ${codigoRepuesto} exitosamente`, "success", 3000)
    } catch (error) {
      console.error("Error al actualizar el stock del repuesto:", error.response?.data || error.message)
      alert(`Error al actualizar el stock: ${error.response?.data?.detail || error.message}`)
      addToast(`Error: ${error.message}`, "error")
    }
  }

  const formatRepuestosForDisplay = (repuestosMap, fichaId, isRepuestosFaltantes = false) => {
    return Object.entries(repuestosMap).map(([nombre, cantidad]) => (
      <div key={nombre} style={{ display: "flex", alignItems: "center" }}>
        {DOMPurify.sanitize(`${nombre} (${cantidad})`)}
        {!isRepuestosFaltantes && verificarRepuesto(nombre) && (
          <img
            src={
              updatedRepuestos[`${fichaId || "/placeholder.svg"}-${nombre}`]
                ? IncreaseStockICON
                : DecreaseStockICON || "/placeholder.svg"
            }
            alt="Actualizar stock"
            style={{ width: "24px", height: "24px", marginLeft: "5px" }}
            onClick={() =>
              updateRepuestoStock(
                fichaId,
                nombre,
                cantidad,
                updatedRepuestos[`${fichaId}-${nombre}`] ? "increase" : "decrease",
              )
            }
            title={
              updatedRepuestos[`${fichaId}-${nombre}`]
                ? "Revertir actualización de stock"
                : "Actualizar stock del repuesto"
            }
          />
        )}
        {!verificarRepuesto(nombre) && (
          <img
            src={WarningICON || "/placeholder.svg"}
            alt="Repuesto no existe"
            style={{ marginLeft: "5px", width: "16px", height: "16px" }}
            title="Este repuesto no existe en el inventario"
          />
        )}
      </div>
    ))
  }

  useEffect(() => {
    const savedUpdatedRepuestos = localStorage.getItem("updatedRepuestos")
    if (savedUpdatedRepuestos) {
      setUpdatedRepuestos(JSON.parse(savedUpdatedRepuestos))
    }
  }, [])

  const addNewFichaForm = () => {
    setNewFichas((prev) => [...prev, createEmptyFicha()])
  }

  const updateNewFichaField = (index, field, value) => {
    setNewFichas((prev) =>
      prev.map((ficha, i) => {
        if (i === index) {
          if (field === "repuestos_colocados" || field === "repuestos_faltantes") {
            return {
              ...ficha,
              [field]: parseRepuestos(value),
            }
          }
          return { ...ficha, [field]: value }
        }
        return ficha
      }),
    )
  }

  const addToast = (message, type, duration = 5000) => {
    const newToast = { id: Date.now(), message, type, duration }
    setToasts((prevToasts) => {
      const updatedToasts = [newToast, ...prevToasts]
      if (updatedToasts.length > 5) {
        const oldestToast = updatedToasts.pop()
        setTimeout(() => removeToast(oldestToast.id), 0)
      }
      return updatedToasts
    })
  }

  const removeToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }

  return (
    <div className="app-container">
      <header className="header">
        <nav className="nav">
          <ul className="nav-list">
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
            <h2 className="card-title">Gestión de fichas</h2>
          </div>
          <div className="card-content">
            <button
              className="button"
              onClick={() => {
                setShowNewFichaForm(!showNewFichaForm)
                if (!showNewFichaForm) {
                  setNewFichas([createEmptyFicha()])
                }
              }}
            >
              {showNewFichaForm ? "Cancelar" : "Crear Nueva Ficha"}
            </button>
            {showNewFichaForm && (
              <div className="new-ficha-form">
                <h3>Crear Nuevas Fichas</h3>
                {newFichas.map((ficha, index) => (
                  <div key={index}>
                    <h4>{`Ficha ${index + 1}`}</h4>
                    <div className="form-grid" style={{ marginBottom: "30px", marginTop: "10px" }}>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="Número de ficha..."
                        onChange={(event) => {
                          updateNewFichaField(index, "numero_ficha", event.target.value)
                        }}
                        value={ficha.numero_ficha}
                      />
                      <textarea
                        spellCheck="true"
                        rows={1}
                        className="input-field"
                        placeholder="Cliente..."
                        onChange={(event) => {
                          updateNewFichaField(index, "cliente", event.target.value)
                        }}
                        onInput={(e) => autoResize(e.target)}
                        value={ficha.cliente}
                      />
                      <textarea
                        spellCheck="true"
                        rows={1}
                        className="input-field"
                        placeholder="Serie..."
                        onChange={(event) => {
                          updateNewFichaField(index, "serie", event.target.value)
                        }}
                        onInput={(e) => autoResize(e.target)}
                        value={ficha.serie}
                      />
                      <select
                        className="input-field"
                        placeholder="Modelo..."
                        onChange={(event) => {
                          updateNewFichaField(index, "modelo", event.target.value)
                        }}
                        value={ficha.modelo}
                      >
                        <option value="" disabled>
                          Modelo...
                        </option>
                        <option value="ITA 10">ITA 10</option>
                        <option value="ITA 11">ITA 11</option>
                        <option value="ITA 12">ITA 12</option>
                        <option value="ITA 20">ITA 20</option>
                        <option value="ITA 21">ITA 21</option>
                        <option value="ITA 24">ITA 24</option>
                        <option value="ITA 25">ITA 25</option>
                        <option value="CT 20">CT 20</option>
                        <option value="CT 25">CT 25</option>
                        <option value="CT 40">CT 40</option>
                        <option value="CTT 20">CTT 20</option>
                        <option value="CTT 25">CTT 25</option>
                        <option value="CTT 40">CTT 40</option>
                      </select>
                      <textarea
                        spellCheck="true"
                        rows={1}
                        className="input-field"
                        placeholder="Nº Bat..."
                        onChange={(event) => {
                          updateNewFichaField(index, "no_bat", event.target.value)
                        }}
                        onInput={(e) => autoResize(e.target)}
                        value={ficha.no_bat}
                      />
                      <textarea
                        spellCheck="true"
                        rows={1}
                        className="input-field"
                        placeholder="Nº Cargador..."
                        onChange={(event) => {
                          updateNewFichaField(index, "no_cargador", event.target.value)
                        }}
                        onInput={(e) => autoResize(e.target)}
                        value={ficha.no_cargador}
                      />
                      <textarea
                        spellCheck="true"
                        rows={1}
                        className="input-field"
                        placeholder="Diagnóstico..."
                        onChange={(event) => {
                          updateNewFichaField(index, "diagnóstico", event.target.value)
                        }}
                        onInput={(e) => autoResize(e.target)}
                        value={ficha.diagnóstico}
                      />
                      <select
                        className="input-field"
                        placeholder="Tipo..."
                        onChange={(event) => {
                          updateNewFichaField(index, "tipo", event.target.value)
                        }}
                        value={ficha.tipo}
                      >
                        <option value="" disabled>
                          Tipo...
                        </option>
                        <option value="Manual">Manual</option>
                        <option value="A batería">A batería</option>
                        <option value="Neumática">Neumática</option>
                      </select>
                      <textarea
                        spellCheck="true"
                        rows={1}
                        className="input-field"
                        placeholder="Observaciones..."
                        onChange={(event) => {
                          updateNewFichaField(index, "observaciones", event.target.value)
                        }}
                        onInput={(e) => autoResize(e.target)}
                        value={ficha.observaciones}
                      />
                      <textarea
                        spellCheck="true"
                        rows={1}
                        className="input-field"
                        placeholder="Reparación..."
                        onChange={(event) => {
                          updateNewFichaField(index, "reparación", event.target.value)
                        }}
                        onInput={(e) => autoResize(e.target)}
                        value={ficha.reparación}
                      />
                      <div className="textarea-with-tooltip">
                        <textarea
                          spellCheck="true"
                          rows={1}
                          className="input-field"
                          placeholder="Repuestos colocados..."
                          onChange={(event) => {
                            setRepuestosColocadosInput({
                              ...repuestosColocadosInput,
                              [index]: event.target.value,
                            })
                          }}
                          onBlur={(event) => {
                            updateNewFichaField(index, "repuestos_colocados", event.target.value)
                          }}
                          onInput={(e) => autoResize(e.target)}
                          value={repuestosColocadosInput[index] || ""}
                        ></textarea>
                        <div className="info-icon-container">
                          <img className="info-icon" src={InfoICON || "/placeholder.svg"} alt="Info" />
                          <div className="tooltip">Formato: "código_del_repuesto cantidad", un repuesto por línea.</div>
                        </div>
                      </div>
                      <div className="textarea-with-tooltip">
                        <textarea
                          spellCheck="true"
                          rows={1}
                          className="input-field"
                          placeholder="Repuestos faltantes..."
                          onChange={(event) => {
                            setRepuestosFaltantesInput({
                              ...repuestosFaltantesInput,
                              [index]: event.target.value,
                            })
                          }}
                          onBlur={(event) => {
                            updateNewFichaField(index, "repuestos_faltantes", event.target.value)
                          }}
                          onInput={(e) => autoResize(e.target)}
                          value={repuestosFaltantesInput[index] || ""}
                        ></textarea>
                        <div className="info-icon-container">
                          <img className="info-icon" src={InfoICON || "/placeholder.svg"} alt="Info" />
                          <div className="tooltip">Formato: "código_del_repuesto cantidad", un repuesto por línea.</div>
                        </div>
                      </div>
                      <textarea
                        spellCheck="true"
                        rows={1}
                        className="input-field"
                        placeholder="Nº Ciclos..."
                        onChange={(event) => {
                          updateNewFichaField(index, "no_ciclos", event.target.value)
                        }}
                        onInput={(e) => autoResize(e.target)}
                        value={ficha.no_ciclos}
                      />
                      <select
                        className="input-field"
                        placeholder="Estado..."
                        onChange={(event) => {
                          updateNewFichaField(index, "estado", event.target.value)
                        }}
                        value={ficha.estado}
                      >
                        <option value="" disabled>
                          Estado...
                        </option>
                        <option value="En revisión">En revisión</option>
                        <option value="A la espera de repuestos">A la espera de repuestos</option>
                        <option value="Lista para entregar">Lista para entregar</option>
                        <option value="Entregada">Entregada</option>
                      </select>
                      {index > 0 && (
                        <button
                          className="icon-button delete-button"
                          onClick={() => {
                            setNewFichas((prev) => prev.filter((_, i) => i !== index))
                          }}
                        >
                          <img src={DeleteICON || "/placeholder.svg"} alt="Eliminar" className="button-icon" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button className="button-newFicha" style={{ marginRight: "20px" }} onClick={addNewFichaForm}>
                  Agregar otra ficha
                </button>
                <button className="button-newFicha" onClick={createAllFichas}>
                  Crear fichas
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Lista de máquinas</h2>
            <div className="search-container">
              <input
                style={{ width: "250px" }}
                type="text"
                className="input-field search-input"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  searchFichasInDatabase(e.target.value)
                }}
              />
              <div>
                <label htmlFor="limit">Resultados por página: </label>
                <select
                  style={{ textAlign: "center" }}
                  id="limit"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={ficha.length}>Todos</option>
                </select>
              </div>
            </div>
          </div>
          <div className="card-content table-card-content">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    {[
                      { field: "numero_ficha", label: "# Ficha" },
                      { field: "cliente", label: "Cliente" },
                      { field: "serie", label: "Nº Serie" },
                      { field: "modelo", label: "Modelo" },
                      { field: "nº_bat", label: "Nº Bat" },
                      { field: "nº_cargador", label: "Nº Cargador" },
                      { field: "diagnóstico", label: "Diagnóstico Ingreso" },
                      { field: "tipo", label: "Tipo" },
                      { field: "observaciones", label: "Observaciones" },
                      { field: "reparación", label: "Reparación" },
                      { field: "nº_ciclos", label: "Nº Ciclos" },
                      { field: "repuestos_colocados", label: "Repuestos Colocados" },
                      { field: "repuestos_faltantes", label: "Repuestos Faltantes" },
                      { field: "estado", label: "Estado" },
                    ].map(({ field, label }) => {
                      const icon =
                        sortField === field && sortOrder === "asc"
                          ? OrdenASC
                          : sortField === field && sortOrder === "desc"
                            ? OrdenDESC
                            : OrdenIDLE
                      return (
                        <th key={field}>
                          <div className="th-content">
                            {label}
                            <img
                              src={icon || "/placeholder.svg"}
                              className="sort-icon"
                              onClick={() => sortData(field)}
                              alt={`Ordenar por ${label}`}
                            />
                          </div>
                        </th>
                      )
                    })}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedFichas.map((ficha) => {
                    return (
                      <tr
                        key={ficha.item}
                        style={{ backgroundColor: ficha.estado === "Entregada" ? "#90EE90" : "yellow" }}
                      >
                        {[
                          "numero_ficha",
                          "cliente",
                          "serie",
                          "modelo",
                          "nº_bat",
                          "nº_cargador",
                          "diagnóstico",
                          "tipo",
                          "observaciones",
                          "reparación",
                          "nº_ciclos",
                        ].map((field) => (
                          <td key={field} onDoubleClick={() => setEditingCell({ id: ficha.item, field })}>
                            {editingCell?.id === ficha.item && editingCell.field === field
                              ? makeEditable(ficha.item, field, ficha[field])
                              : ficha[field]}
                          </td>
                        ))}
                        <td
                          key="repuestos_colocados"
                          onDoubleClick={() => setEditingCell({ id: ficha.item, field: "repuestos_colocados" })}
                        >
                          {editingCell?.id === ficha.item && editingCell.field === "repuestos_colocados" ? (
                            makeEditable(ficha.item, "repuestos_colocados", ficha.repuestos_colocados)
                          ) : (
                            <div className="repuestos-list">
                              {formatRepuestosForDisplay(ficha.repuestos_colocados, ficha.item).map(
                                (repuesto, index) => (
                                  <div key={index}>{repuesto}</div>
                                ),
                              )}
                            </div>
                          )}
                        </td>
                        <td
                          key="repuestosfaltantes"
                          onDoubleClick={() => setEditingCell({ id: ficha.item, field: "repuestos_faltantes" })}
                        >
                          {editingCell?.id === ficha.item && editingCell.field === "repuestos_faltantes" ? (
                            makeEditable(ficha.item, "repuestos_faltantes", ficha.repuestos_faltantes)
                          ) : (
                            <div className="repuestos-list">
                              {formatRepuestosForDisplay(ficha.repuestos_faltantes, ficha.item, true)}
                            </div>
                          )}
                        </td>
                        <td
                          key="estado"
                          style={{
                            backgroundColor: ficha.estado === "Entregada" ? "lightgreen" : "yellow",
                          }}
                          onDoubleClick={() => setEditingCell({ id: ficha.item, field: "estado" })}
                        >
                          {editingCell?.id === ficha.item && editingCell.field === "estado"
                            ? makeEditable(ficha.item, "estado", ficha.estado)
                            : ficha.estado}
                        </td>
                        <td className="actions-cell">
                          <div className="actions-buttons">
                            <button
                              className="icon-button delete-button"
                              onClick={() => {
                                deleteFicha(ficha.item)
                              }}
                            >
                              <img src={TrashICON || "/placeholder.svg"} alt="Eliminar" className="button-icon" />
                            </button>
                            <button className="icon-button excel-button" onClick={() => exportToExcel(ficha)}>
                              <img src={ExcelICON || "/placeholder.svg"} alt="Generar Excel" className="button-icon" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {isLoading && <p>Cargando...</p>}
            </div>
            <div style={{ marginTop: "20px", marginBottom: "20px", display: "flex", justifyContent: "center" }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(event, value) => setCurrentPage(value)}
                color="primary"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </main>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

export default Home

