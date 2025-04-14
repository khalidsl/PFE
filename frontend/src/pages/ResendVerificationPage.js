"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { authApi } from "../services/api"
import { toast } from "react-toastify"

const ResendVerificationPage = () => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  // Ajoutons des logs pour déboguer le problème

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!email) {
      setError("Veuillez entrer votre adresse email")
      setLoading(false)
      return
    }

    console.log("Tentative de renvoi d'email à:", email)

    try {
      const response = await authApi.resendVerification({ email })
      console.log("Réponse du serveur:", response)
      setSuccess(true)
      toast.success("Email de vérification envoyé avec succès")
    } catch (error) {
      console.error("Erreur détaillée de renvoi d'email:", error)
      setError(error.response?.data?.message || "Erreur de renvoi d'email")
      toast.error(error.response?.data?.message || "Erreur de renvoi d'email")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Renvoyer l'email de vérification</h1>

      {success ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden p-6 text-center">
          <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
            <p className="font-semibold">Email envoyé avec succès!</p>
            <p>Veuillez vérifier votre boîte de réception et suivre les instructions.</p>
          </div>
          <Link to="/login" className="btn btn-primary">
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {error && <div className="bg-red-100 text-red-700 p-4">{error}</div>}

          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6">
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
              />
            </div>

            <button type="submit" disabled={loading} className="w-full btn btn-primary">
              {loading ? "Envoi en cours..." : "Renvoyer l'email de vérification"}
            </button>
          </form>

          <div className="p-4 bg-gray-50 text-center">
            <Link to="/login" className="text-blue-600 hover:underline">
              Retour à la connexion
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResendVerificationPage
