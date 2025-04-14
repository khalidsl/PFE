"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { authApi } from "../services/api"
import { useAuth } from "../context/AuthContext"
import { toast } from "react-toastify"

const OTPVerificationPage = () => {
  const [otp, setOtp] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState(null)
  const [countdown, setCountdown] = useState(0)

  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  // Récupérer l'email et le code OTP des paramètres d'URL ou du state
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const emailParam = searchParams.get("email") || (location.state && location.state.email) || ""
    const otpParam = searchParams.get("otp") || (location.state && location.state.otpCode) || ""

    setEmail(emailParam)

    // Pré-remplir le code OTP s'il est fourni
    if (otpParam) {
      setOtp(otpParam)
    }

    // Démarrer le compte à rebours pour le bouton de renvoi
    setCountdown(60)
  }, [location])

  // Gérer le compte à rebours
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await authApi.verifyOTP({ email, otp })

      // Mettre à jour le contexte d'authentification
      if (response.data.token) {
        localStorage.setItem("token", response.data.token)
        localStorage.setItem("user", JSON.stringify(response.data.user))
        login(response.data.user)
      }

      toast.success("Compte vérifié avec succès")
      navigate("/")
    } catch (error) {
      console.error("Erreur de vérification:", error)
      setError(error.response?.data?.message || "Erreur de vérification du code")
      toast.error(error.response?.data?.message || "Erreur de vérification du code")
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (countdown > 0) return

    setResending(true)
    setError(null)

    try {
      const response = await authApi.resendOTP({ email })

      // Mettre à jour le code OTP si retourné
      if (response.data.otpCode) {
        setOtp(response.data.otpCode)
      }

      toast.success("Nouveau code envoyé avec succès")
      setCountdown(60) // Réinitialiser le compte à rebours
    } catch (error) {
      console.error("Erreur de renvoi:", error)
      setError(error.response?.data?.message || "Erreur lors de l'envoi du nouveau code")
      toast.error(error.response?.data?.message || "Erreur lors de l'envoi du nouveau code")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Vérification du compte</h1>

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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="otp" className="form-label">
              Code de vérification
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="form-input"
              required
              placeholder="Entrez le code à 6 chiffres"
              maxLength={6}
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Entrez le code de vérification qui vous a été fourni lors de l'inscription.
            </p>
          </div>

          <button type="submit" disabled={loading} className="w-full btn btn-primary mb-4">
            {loading ? "Vérification..." : "Vérifier le compte"}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resending || countdown > 0}
              className="text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
            >
              {countdown > 0
                ? `Renvoyer le code (${countdown}s)`
                : resending
                  ? "Envoi en cours..."
                  : "Renvoyer le code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OTPVerificationPage
