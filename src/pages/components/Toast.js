import { useState, useEffect } from "react"
import { X } from "lucide-react"
import DOMPurify from "dompurify"

const Toast = ({ message, type, onClose, duration = 5000 }) => {
  const [visible, setVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  useEffect(() => {
    if (isLeaving) {
      const leaveTimer = setTimeout(() => {
        setVisible(false)
        onClose()
      }, 500) // 500ms for fade out animation

      return () => clearTimeout(leaveTimer)
    }
  }, [isLeaving, onClose])

  if (!visible) return null

  return (
    <div className={`toast toast-${type} ${isLeaving ? "toast-leave" : ""}`}>
      <p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message) }} />
      <button onClick={() => setIsLeaving(true)} className="toast-close" aria-label="Cerrar notificación">
        <X size={16} />
      </button>
    </div>
  )
}

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}
    </div>
  )
}

export { Toast, ToastContainer }

