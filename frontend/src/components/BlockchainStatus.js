"use client"

import { useState, useEffect } from "react"
import { votesApi } from "../services/api"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"

const BlockchainStatus = () => {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const { logout, refreshToken } = useAuth()  // Utiliser le hook useAuth au lieu d'importer AuthContext
  const navigate = useNavigate()

  useEffect(() => {
    const fetchBlockchainStatus = async () => {
      try {
        setLoading(true)
        const { data } = await votesApi.getBlockchainStatus()
        setStatus(data)
        setError(null)
        setLoading(false)
      } catch (error) {
        console.error("Erreur de récupération du statut de la blockchain:", error)

        // Message d'erreur plus détaillé
        let errorMessage = "Impossible de charger le statut de la blockchain"

        if (error.response) {
          // Le serveur a répondu avec un code d'erreur
          errorMessage += ` (${error.response.status})`
          
          // Gestion spécifique de l'erreur 401
          if (error.response.status === 401) {
            errorMessage += ": Non autorisé, token invalide"
          } else if (error.response.data && error.response.data.message) {
            errorMessage += `: ${error.response.data.message}`
          }
          
          if (error.response.data && error.response.data.error) {
            errorMessage += ` - ${error.response.data.error}`
          }
        } else if (error.request) {
          // La requête a été faite mais pas de réponse
          errorMessage += ": Pas de réponse du serveur"
        } else {
          // Erreur lors de la configuration de la requête
          errorMessage += `: ${error.message}`
        }

        setError(errorMessage)
        setLoading(false)
      }
    }

    fetchBlockchainStatus()

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchBlockchainStatus, 30000)

    return () => clearInterval(interval)
  }, [retryCount])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  const handleReinitialize = async () => {
    try {
      setLoading(true)
      // Appeler une route spéciale pour réinitialiser la blockchain
      const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/votes/blockchain/reinitialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      
      // Vérifier si la réponse est un 401
      if (response.status === 401) {
        throw new Error("Non autorisé. Votre session a peut-être expiré.")
      }
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Échec de la réinitialisation")
      }

      // Attendre un peu pour laisser le temps à la blockchain de s'initialiser
      setTimeout(() => {
        setRetryCount((prev) => prev + 1)
      }, 2000)
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error)
      
      // Si c'est une erreur d'authentification
      if (error.message && error.message.includes("Non autorisé")) {
        setError("Session expirée. Veuillez vous reconnecter pour réinitialiser la blockchain.")
      } else {
        setError(`Échec de la réinitialisation de la blockchain: ${error.message}`)
      }
      
      setLoading(false)
    }
  }

  const handleRefreshToken = async () => {
    try {
      setLoading(true)
      await refreshToken()
      // Si le rafraîchissement du token réussit, réessayer de charger les données
      setRetryCount((prev) => prev + 1)
    } catch (error) {
      console.error("Erreur lors du rafraîchissement du token:", error)
      setError("Impossible de rafraîchir votre session. Veuillez vous reconnecter.")
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Chargement des données blockchain...</p>
        </div>
      </div>
    )
  }

  if (error) {
    const isAuthError = error.includes("Non autorisé") || error.includes("token invalide") || error.includes("401");
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-red-600 text-white p-4">
          <h2 className="text-xl font-semibold">Problème de connexion à la blockchain</h2>
        </div>
        
        <div className="p-6">
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
            <p className="font-semibold mb-2">{error}</p>
            <p className="text-sm mb-3">
              {isAuthError 
                ? "Votre session a peut-être expiré ou votre token d'authentification n'est plus valide."
                : "Le serveur blockchain pourrait être temporairement indisponible ou rencontrer des problèmes d'initialisation."}
            </p>
          </div>
          
          {isAuthError ? (
            <div className="space-y-2">
              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleRefreshToken}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md w-full flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Rafraîchir ma session
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-md w-full flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Se reconnecter
                </button>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <h3 className="text-yellow-800 font-medium mb-2">Informations pour l'administrateur système</h3>
                <p className="text-sm text-yellow-700">
                  Cette erreur peut être causée par:
                </p>
                <ul className="list-disc pl-5 mt-1 text-sm text-yellow-700 space-y-1">
                  <li>Une session expirée</li>
                  <li>Un problème de connexion au serveur blockchain</li>
                  <li>Un token JWT invalide ou expiré</li>
                  <li>Des permissions insuffisantes</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md w-full flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Réessayer
              </button>
              <button
                onClick={handleReinitialize}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-md w-full flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Réinitialiser la blockchain
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Vérifier si le statut est valide
  if (!status || !status.chainLength) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-yellow-600 text-white p-4">
          <h2 className="text-xl font-semibold">Données blockchain incomplètes</h2>
        </div>
        
        <div className="p-6">
          <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg mb-4">
            <p className="font-semibold mb-2">La blockchain semble vide ou en cours d'initialisation</p>
            <p className="text-sm mb-3">
              Les informations de la blockchain ne sont pas complètes ou le système est en cours d'initialisation.
            </p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md w-full flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualiser
            </button>
            <button
              onClick={handleReinitialize}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-md w-full flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Réinitialiser la blockchain
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Statut de la Blockchain</h2>
          <button 
            onClick={handleRetry}
            className="bg-blue-500 bg-opacity-25 hover:bg-opacity-40 rounded-full p-1"
            title="Actualiser les données"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition">
            <h3 className="text-sm text-gray-500 mb-1">Nombre de blocs</h3>
            <p className="text-3xl font-semibold text-blue-700">{status.chainLength}</p>
          </div>

          <div className="border rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition">
            <h3 className="text-sm text-gray-500 mb-1">Intégrité</h3>
            <div className="flex justify-center">
              <p className={`text-2xl font-semibold flex items-center ${status.isValid ? "text-green-600" : "text-red-600"}`}>
                {status.isValid ? (
                  <>
                    <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Valide
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Invalide
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {status.latestBlock && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Dernier bloc
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg text-sm border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-500">Index</p>
                  <p className="font-medium">{status.latestBlock.index || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date de création</p>
                  <p className="font-medium">
                    {new Date(status.latestBlock.timestamp).toLocaleDateString()} {new Date(status.latestBlock.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-gray-500">Hash</p>
                <p className="font-mono bg-gray-100 p-2 rounded border border-gray-200 text-xs overflow-auto whitespace-nowrap">
                  {status.latestBlock.hash}
                </p>
              </div>
              <div className="mt-3">
                <p className="text-gray-500">Hash précédent</p>
                <p className="font-mono bg-gray-100 p-2 rounded border border-gray-200 text-xs overflow-auto whitespace-nowrap">
                  {status.latestBlock.previousHash || "N/A"}
                </p>
              </div>
              <div className="mt-3">
                <p className="text-gray-500">Nombre de votes dans le bloc</p>
                <p className="font-medium">{status.latestBlock.voteCount || 0}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Votes en attente
          </h3>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
            <p className="text-3xl font-semibold text-blue-700">{status.pendingVotes}</p>
            <p className="text-sm text-gray-500 mt-2">
              {status.pendingVotes === 0 
                ? "Aucun vote en attente d'être ajouté à la blockchain" 
                : status.pendingVotes === 1 
                  ? "1 vote en attente d'être ajouté à la blockchain" 
                  : `${status.pendingVotes} votes en attente d'être ajoutés à la blockchain`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlockchainStatus
