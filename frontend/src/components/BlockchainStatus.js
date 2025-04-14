"use client"

import { useState, useEffect } from "react"
import { votesApi } from "../services/api"

const BlockchainStatus = () => {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

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
          if (error.response.data && error.response.data.message) {
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
      await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/votes/blockchain/reinitialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      // Attendre un peu pour laisser le temps à la blockchain de s'initialiser
      setTimeout(() => {
        setRetryCount((prev) => prev + 1)
      }, 2000)
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error)
      setError("Échec de la réinitialisation de la blockchain")
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-24">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
        <p className="font-semibold mb-2">{error}</p>
        <p className="text-sm mb-3">
          Le serveur blockchain pourrait être temporairement indisponible ou rencontrer des problèmes d'initialisation.
        </p>
        <div className="flex space-x-2">
          <button onClick={handleRetry} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm">
            Réessayer
          </button>
          <button
            onClick={handleReinitialize}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm"
          >
            Réinitialiser la blockchain
          </button>
        </div>
      </div>
    )
  }

  // Vérifier si le statut est valide
  if (!status || !status.chainLength) {
    return (
      <div className="bg-yellow-100 text-yellow-700 p-4 rounded mb-4">
        <p className="font-semibold mb-2">Données blockchain incomplètes</p>
        <p className="text-sm mb-3">
          Les informations de la blockchain ne sont pas complètes ou sont en cours d'initialisation.
        </p>
        <div className="flex space-x-2">
          <button
            onClick={handleRetry}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm"
          >
            Actualiser
          </button>
          <button
            onClick={handleReinitialize}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm"
          >
            Réinitialiser la blockchain
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-600 text-white p-4">
        <h2 className="text-xl font-semibold">Statut de la Blockchain</h2>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-3">
            <h3 className="text-sm text-gray-500 mb-1">Nombre de blocs</h3>
            <p className="text-2xl font-semibold">{status.chainLength}</p>
          </div>

          <div className="border rounded-lg p-3">
            <h3 className="text-sm text-gray-500 mb-1">Intégrité</h3>
            <p className={`text-2xl font-semibold ${status.isValid ? "text-green-600" : "text-red-600"}`}>
              {status.isValid ? "Valide" : "Invalide"}
            </p>
          </div>
        </div>

        {status.latestBlock && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Dernier bloc</h3>
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p>
                <span className="font-medium">Hash:</span> {status.latestBlock.hash}
              </p>
              <p>
                <span className="font-medium">Timestamp:</span>{" "}
                {new Date(status.latestBlock.timestamp).toLocaleString()}
              </p>
              <p>
                <span className="font-medium">Votes:</span> {status.latestBlock.voteCount}
              </p>
            </div>
          </div>
        )}

        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Votes en attente</h3>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xl font-semibold">{status.pendingVotes}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlockchainStatus
