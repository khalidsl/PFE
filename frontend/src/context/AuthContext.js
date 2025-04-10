"use client"

import { createContext, useState, useContext, useEffect } from "react"
import { authApi } from "../services/api"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Charger l'utilisateur depuis le localStorage au démarrage
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem("user")

      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          setUser(userData)

          // Vérifier si le token est toujours valide en récupérant le profil
          try {
            const { data } = await authApi.getProfile()
            // Mettre à jour les données utilisateur si nécessaire
            setUser((prevUser) => ({
              ...prevUser,
              ...data,
            }))
          } catch (error) {
            console.error("Token expiré ou invalide:", error)
            logout()
          }
        } catch (error) {
          console.error("Erreur lors du chargement de l'utilisateur:", error)
          localStorage.removeItem("user")
          localStorage.removeItem("token")
        }
      }

      setLoading(false)
    }

    loadUser()
  }, [])

  // Fonction de connexion
  const login = async (email, password) => {
    try {
      const { data } = await authApi.login({ email, password })

      // Stocker le token et les données utilisateur
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data))

      setUser(data)
      return { success: true }
    } catch (error) {
      console.error("Erreur de connexion:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Erreur de connexion",
      }
    }
  }

  // Fonction d'inscription
  const register = async (userData) => {
    try {
      const { data } = await authApi.register(userData)

      // Stocker le token et les données utilisateur
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data))

      setUser(data)
      return { success: true }
    } catch (error) {
      console.error("Erreur d'inscription:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Erreur d'inscription",
      }
    }
  }

  // Fonction de déconnexion
  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error("Erreur de déconnexion:", error)
    } finally {
      // Supprimer le token et les données utilisateur
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      setUser(null)
    }
  }

  // Fonction de mise à jour du profil
  const updateProfile = async (userData) => {
    try {
      const { data } = await authApi.updateProfile(userData)

      // Mettre à jour les données utilisateur
      const updatedUser = { ...user, ...data }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)

      return { success: true }
    } catch (error) {
      console.error("Erreur de mise à jour du profil:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Erreur de mise à jour du profil",
      }
    }
  }

  // Fonction pour mettre à jour le statut de vote
  const updateVoteStatus = (electionId) => {
    if (user) {
      const updatedUser = {
        ...user,
        hasVoted: {
          ...user.hasVoted,
          [electionId]: true,
        },
      }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    updateVoteStatus,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext

