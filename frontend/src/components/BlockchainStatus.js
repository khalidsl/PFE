"use client"

import { useState, useEffect } from "react"
import { votesApi } from "../services/api"

const BlockchainStatus = () => {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBlockchainStatus = async () => {
      try {
        const { data } = await votesApi.getBlockchainStatus()
        setStatus(data)
        setLoading(false)
      } catch (error) {
        console.error("Erreur de récupération du statut de la blockchain:", error)
        setError("Impossible de charger le statut de la blockchain")
        setLoading(false)
      }
    }

    fetchBlockchainStatus()

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchBlockchainStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-24">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
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

