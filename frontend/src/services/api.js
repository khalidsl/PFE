import axios from "axios"

// URL de base de l'API - Utiliser l'URL complète pour éviter les problèmes CORS
// Modifier pour utiliser le nom du service Docker au lieu de localhost
const API_URL = process.env.REACT_APP_API_URL || 
                (window.location.hostname === 'localhost' ? 
                "http://localhost:5000/api" : 
                "http://backend:5000/api")

// Instance axios pour les requêtes d'authentification
const authInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 10000, // Réduire le timeout à 10 secondes pour une réponse plus rapide
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// Instance axios pour les requêtes générales
const apiInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 10000, // Réduire le timeout à 10 secondes
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// Intercepteur pour ajouter le token JWT aux requêtes
apiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log(`Sending request to: ${config.url}`)
    return config
  },
  (error) => Promise.reject(error),
)

// Intercepteur pour gérer les erreurs de réponse
const handleResponseError = (error) => {
  if (error.response) {
    // La requête a été faite et le serveur a répondu avec un code d'état
    console.error("Erreur de réponse:", error.response.status, error.response.data)
  } else if (error.request) {
    // La requête a été faite mais aucune réponse n'a été reçue
    console.error("Erreur de requête:", error.request)

    // Si l'erreur est un timeout, afficher un message plus clair
    if (error.code === "ECONNABORTED") {
      console.error("La requête a expiré. Le serveur est peut-être indisponible ou surchargé.")
      error.message = "Le serveur ne répond pas. Veuillez réessayer plus tard."
    }
  } else {
    // Une erreur s'est produite lors de la configuration de la requête
    console.error("Erreur:", error.message)
  }
  return Promise.reject(error)
}

authInstance.interceptors.response.use((response) => response, handleResponseError)
apiInstance.interceptors.response.use((response) => response, handleResponseError)

// Services d'authentification
export const authApi = {
  register: (userData) => authInstance.post("/auth/register", userData),
  login: (credentials) => authInstance.post("/auth/login", credentials),
  logout: () => authInstance.post("/auth/logout"),
  getProfile: () => apiInstance.get("/auth/profile"),
  updateProfile: (userData) => apiInstance.put("/auth/profile", userData),
  refreshToken: () => authInstance.post("/auth/refresh-token"),
  // Nouvelles routes OTP
  verifyOTP: (data) => authInstance.post("/auth/verify-otp", data),
  resendOTP: (data) => authInstance.post("/auth/resend-otp", data),
  // Anciennes routes (conservées pour rétrocompatibilité)
  verifyEmail: (token) => authInstance.get(`/auth/verify-email/${token}`),
  resendVerification: (data) => authInstance.post("/auth/resend-verification", data),
}

// Services pour les élections
export const electionsApi = {
  getAll: () => apiInstance.get("/elections"),
  getById: (id) => apiInstance.get(`/elections/${id}`),
  create: (electionData) => apiInstance.post("/elections", electionData),
  update: (id, electionData) => apiInstance.put(`/elections/${id}`, electionData),
  delete: (id) => apiInstance.delete(`/elections/${id}`),
}

// Services pour les votes
export const votesApi = {
  castVote: (voteData) => apiInstance.post("/votes", voteData),
  getResults: (electionId) => apiInstance.get(`/votes/results/${electionId}`),
  verifyVote: (voteId) => apiInstance.get(`/votes/verify/${voteId}`),
  getUserVotes: () => apiInstance.get("/votes/user"),
  getBlockchainStatus: () => apiInstance.get("/votes/blockchain/status"),
}

// Créer un objet pour l'export par défaut
const apiService = {
  auth: authApi,
  elections: electionsApi,
  votes: votesApi,
}

export default apiService
