import axios from "axios"

// URL de base de l'API
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

// Instance axios pour les requêtes d'authentification
const authInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

// Instance axios pour les requêtes générales
const apiInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

// Intercepteur pour ajouter le token JWT aux requêtes
apiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Services d'authentification
export const authApi = {
  register: (userData) => authInstance.post("/auth/register", userData),
  login: (credentials) => authInstance.post("/auth/login", credentials),
  logout: () => authInstance.post("/auth/logout"),
  getProfile: () => apiInstance.get("/auth/profile"),
  updateProfile: (userData) => apiInstance.put("/auth/profile", userData),
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

export default {
  auth: authApi,
  elections: electionsApi,
  votes: votesApi,
}
