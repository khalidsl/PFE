"use client"

import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { toast } from "react-toastify"

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Récupérer l'URL de redirection après connexion
  const from = location.state?.from?.pathname || "/"

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { success, message, needsVerification } = await login(formData.email, formData.password)

      if (success) {
        toast.success("Connexion réussie")
        navigate(from, { replace: true })
      } else if (needsVerification) {
        // Rediriger vers la page de vérification OTP
        navigate(`/verify-otp`, {
          state: {
            email: formData.email,
            otpCode: message.otpCode,
          },
        })
      } else {
        setError(message)
        toast.error(message)
      }
    } catch (error) {
      console.error("Erreur de connexion:", error)

      // Vérifier si l'utilisateur doit vérifier son compte
      if (error.response?.data?.needsVerification) {
        // Rediriger vers la page de vérification OTP avec les informations nécessaires
        navigate("/verify-otp", {
          state: {
            email: formData.email,
            otpCode: error.response.data.otpCode,
          },
        })
        return
      }

      // Gérer spécifiquement les erreurs de timeout
      if (error.code === "ECONNABORTED") {
        setError("La connexion au serveur a pris trop de temps. Veuillez réessayer.")
        toast.error("Délai d'attente dépassé. Veuillez réessayer.")
      } else {
        setError("Une erreur est survenue lors de la connexion")
        toast.error("Une erreur est survenue lors de la connexion")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Connexion</h1>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
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

          <div className="mb-6">
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
            />
          </div>

          <button type="submit" disabled={loading} className="w-full btn btn-primary">
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Connexion en cours...
              </div>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>
      </div>

      <div className="mt-4 text-center">
        Pas encore de compte ?{" "}
        <Link to="/register" className="text-blue-600 hover:underline">
          S'inscrire ici
        </Link>
      </div>
    </div>
  )
}

export default LoginPage
