"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { electionsApi, votesApi } from "../services/api"

const ResultsPage = () => {
  const { id } = useParams()

  const [election, setElection] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les détails de l'élection
        const electionResponse = await electionsApi.getById(id)
        setElection(electionResponse.data)

        // Récupérer les résultats de l'élection
        const resultsResponse = await votesApi.getResults(id)
        setResults(resultsResponse.data)

        setLoading(false)
      } catch (error) {
        console.error("Erreur de récupération des résultats:", error)
        setError(error.response?.data?.message || "Impossible de charger les résultats")
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
        <Link to="/elections" className="btn btn-primary">
          Retour aux élections
        </Link>
      </div>
    )
  }

  // Vérifier si l'élection est terminée
  const now = new Date()
  const endDate = new Date(election.endDate)
  const hasEnded = now > endDate

  if (!hasEnded) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded mb-4">
          Les résultats seront disponibles après la fin de l'élection le {endDate.toLocaleDateString()} à{" "}
          {endDate.toLocaleTimeString()}.
        </div>
        <Link to={`/elections/${id}`} className="btn btn-primary">
          Retour aux détails de l'élection
        </Link>
      </div>
    )
  }

  // Calculer le nombre maximum de votes pour les barres de progression
  const maxVotes = results && results.results.length > 0 ? Math.max(...results.results.map((r) => r.voteCount)) : 0

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{election.title} - Résultats</h1>
      <p className="text-gray-600 mb-6">Élection terminée le {endDate.toLocaleDateString()}</p>

      {/* Afficher le statut de vérification de la blockchain */}
      {results.blockchainVerified !== undefined && (
        <div
          className={`p-4 rounded-lg mb-6 ${results.blockchainVerified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
          <div className="flex items-center">
            {results.blockchainVerified ? (
              <>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Résultats vérifiés par la blockchain</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span>Attention: L'intégrité de la blockchain n'a pas pu être vérifiée</span>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">Résultats finaux</h2>
            <div className="text-gray-600">Votes totaux: {results.totalVotes}</div>
          </div>

          <div className="space-y-6">
            {results.results.map((result, index) => {
              const percentage = results.totalVotes > 0 ? ((result.voteCount / results.totalVotes) * 100).toFixed(2) : 0

              const progressWidth = maxVotes > 0 ? (result.voteCount / maxVotes) * 100 : 0

              return (
                <div key={result.candidateId} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <div>
                      <span className="font-semibold">
                        {index + 1}. {result.name}
                      </span>
                      <span className="text-gray-600 ml-2">({result.party})</span>
                    </div>
                    <div className="font-semibold">
                      {result.voteCount} votes ({percentage}%)
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${index === 0 ? "bg-green-500" : "bg-blue-500"}`}
                      style={{ width: `${progressWidth}%` }}
                    ></div>
                  </div>

                  {index === 0 && result.voteCount > 0 && (
                    <div className="mt-2 text-green-600 font-semibold text-right">Gagnant</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Link to="/elections" className="btn btn-secondary">
          Retour aux élections
        </Link>

        <Link to={`/elections/${id}`} className="btn btn-primary">
          Détails de l'élection
        </Link>
      </div>
    </div>
  )
}

export default ResultsPage

