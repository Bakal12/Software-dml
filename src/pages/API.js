import axios from "axios"
import { getAuth, onAuthStateChanged } from "firebase/auth"

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
})

let authInitialized = false

const initializeAuthListener = () => {
  return new Promise((resolve) => {
    const auth = getAuth()
    onAuthStateChanged(auth, (user) => {
      authInitialized = true
      resolve(user)
    })
  })
}

// Interceptor para agregar el token a cada solicitud
api.interceptors.request.use(
  async (config) => {
    if (!authInitialized) {
      await initializeAuthListener()
    }
    const auth = getAuth()
    const user = auth.currentUser
    if (user) {
      const token = await user.getIdToken()
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

export default api

