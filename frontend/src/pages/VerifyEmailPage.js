"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { authApi } from "../services/api"
import { useAuth } from "../context/AuthContext"

const VerifyEmailPage = () => {
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Récupérer le token de l'URL
        const searchParams = new URLSearchParams(location.search)
        const token = searchParams.get("token")

        if (!token) {
          setError("Token de vérification manquant")
          setVerifying(false)
          return
        }

        // Appeler l'API pour vérifier l'email
        const { data } = await authApi.verifyEmail(token)

        setSuccess(true)
        setVerifying(false)

        // Connecter automatiquement l'utilisateur
        if (data.token) {
          localStorage.setItem("token", data.token)

          // Récupérer les informations de l'utilisateur
          const profileResponse = await authApi.getProfile()
          if (profileResponse.data) {
            const userData = {
              ...profileResponse.data,
              token: data.token,
            }

            localStorage.setItem("user", JSON.stringify(userData))

            // Mettre à jour le contexte d'authentification
            login(userData)

            // Rediriger vers la page d'accueil après 3 secondes
            setTimeout(() => {
              navigate("/")
            }, 3000)
          }
        }
      } catch (error) {
        console.error("Erreur de vérification d'email:", error)
        setError(error.response?.data?.message || "Erreur de vérification d'email")
        setVerifying(false)
      }
    }

    verifyEmail()
  }, [location, navigate, login])

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Vérification de l'email</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
        {verifying ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Vérification de votre email en cours...</p>
          </div>
        ) : success ? (
          <div className="text-center">
            <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
              <p className="font-semibold">Email vérifié avec succès!</p>
              <p>Vous allez être redirigé vers la page d'accueil...</p>
            </div>
            <button onClick={() => navigate("/")} className="btn btn-primary">
              Aller à la page d'accueil
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
              <p className="font-semibold">Échec de la vérification</p>
              <p>{error}</p>
            </div>
            <p className="mb-4">Le lien de vérification est peut-être expiré ou invalide.</p>
            <button onClick={() => navigate("/resend-verification")} className="btn btn-primary">
              Renvoyer l'email de vérification
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default VerifyEmailPage
