"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { authApi } from "../services/api"

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    nationalId: "",
    password: "",
    confirmPassword: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [serverStatus, setServerStatus] = useState("idle") // 'idle', 'checking', 'available', 'unavailable'

  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Fonction pour vérifier si le serveur est disponible
  const checkServerAvailability = async () => {
    try {
      setServerStatus("checking")
      // Utiliser une route simple pour vérifier la disponibilité du serveur
      const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Timeout court pour la vérification
        signal: AbortSignal.timeout(3000),
      })

      if (response.ok) {
        setServerStatus("available")
        return true
      } else {
        setServerStatus("unavailable")
        return false
      }
    } catch (error) {
      console.error("Erreur de vérification du serveur:", error)
      setServerStatus("unavailable")
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Vérifier que les mots de passe correspondent
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      setLoading(false)
      return
    }

    // Vérifier d'abord si le serveur est disponible
    const isServerAvailable = await checkServerAvailability()
    if (!isServerAvailable) {
      setError("Le serveur est actuellement indisponible. Veuillez réessayer plus tard.")
      setLoading(false)
      toast.error("Impossible de se connecter au serveur")
      return
    }

    try {
      const response = await authApi.register({
        name: formData.name,
        email: formData.email,
        nationalId: formData.nationalId,
        password: formData.password,
      })

      toast.success("Inscription réussie")

      // Vérifier si la vérification est requise
      if (response.data.requiresVerification) {
        // Rediriger vers la page de vérification OTP
        navigate("/verify-otp", {
          state: {
            email: formData.email,
            otpCode: response.data.otpCode,
          },
        })
      } else {
        // Rediriger vers la page d'accueil
        navigate("/")
      }
    } catch (error) {
      console.error("Erreur d'inscription:", error)

      // Message d'erreur personnalisé pour les timeouts
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        setError("Le serveur met trop de temps à répondre. Veuillez réessayer plus tard.")
        toast.error("Délai d'attente dépassé")
      } else {
        setError(error.response?.data?.message || "Une erreur est survenue lors de l'inscription")
        toast.error(error.response?.data?.message || "Erreur d'inscription")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Inscription</h1>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

      {serverStatus === "unavailable" && (
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded mb-4">
          Le serveur semble être indisponible. Vos données pourraient ne pas être enregistrées.
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="name" className="form-label">
              Nom complet
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="nationalId" className="form-label">
              Numéro d'identité national
            </label>
            <input
              type="text"
              id="nationalId"
              name="nationalId"
              value={formData.nationalId}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              required
              minLength="6"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="confirmPassword" className="form-label">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="w-full btn btn-primary">
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Inscription en cours...
              </div>
            ) : (
              "S'inscrire"
            )}
          </button>
        </form>
      </div>

      <div className="mt-4 text-center">
        Déjà un compte ?{" "}
        <Link to="/login" className="text-blue-600 hover:underline">
          Se connecter ici
        </Link>
      </div>
    </div>
  )
}

export default RegisterPage
