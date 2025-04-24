"use client"

import { useState, useEffect } from "react"
import { useParams, Link, useLocation } from "react-router-dom"
import { electionsApi, votesApi } from "../services/api"
import { useAuth } from "../context/AuthContext"
import BlockchainVerification from "../components/BlockchainVerification"

const ElectionDetailsPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const { user } = useAuth()

  const [election, setElection] = useState(null)
  const [voteVerification, setVoteVerification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Vérifier s'il y a un ID de vote dans les paramètres d'URL
  const queryParams = new URLSearchParams(location.search)
  const voteId = queryParams.get("vote")

  useEffect(() => {
    const fetchElection = async () => {
      try {
        const { data } = await electionsApi.getById(id)
        setElection(data)
        setLoading(false)
      } catch (error) {
        console.error("Erreur de récupération de l'élection:", error)
        setError("Impossible de charger les détails de l'élection")
        setLoading(false)
      }
    }

    const verifyVote = async () => {
      if (voteId) {
        try {
          const { data } = await votesApi.verifyVote(voteId)
          setVoteVerification(data)
        } catch (error) {
          console.error("Erreur de vérification du vote:", error)
        }
      }
    }

    fetchElection()
    if (voteId) {
      verifyVote()
    }
  }, [id, voteId])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
  }

  // Vérifier si l'élection est active
  const now = new Date()
  const startDate = new Date(election.startDate)
  const endDate = new Date(election.endDate)
  const isActive = now >= startDate && now <= endDate && election.isActive
  const isPast = now > endDate
  const hasVoted = user && user.hasVoted && user.hasVoted[id]

  return (
    <div className="max-w-4xl mx-auto">
      {voteVerification && (
        <div className="bg-green-100 text-green-800 p-4 rounded mb-6">
          <h3 className="font-bold text-lg mb-2">Vérification du vote</h3>
          <p>Votre vote a été enregistré et vérifié avec succès.</p>
          {/* <p className="text-sm mt-2">Hash du vote: {voteVerification.vote.voteHash}</p> */}
          {/* Afficher les informations de la blockchain */}
          <BlockchainVerification blockchainData={voteVerification.blockchain} />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className={`p-6 text-white ${isActive ? "bg-green-600" : isPast ? "bg-gray-600" : "bg-blue-600"}`}>
          <h1 className="text-3xl font-bold">{election.title}</h1>
          <div className="mt-2 flex justify-between items-center">
            <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
              {isActive ? "En cours" : isPast ? "Terminée" : "À venir"}
            </span>
            <div className="text-sm">
              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p className="text-gray-700 mb-6">{election.description}</p>

          <h2 className="text-xl font-semibold mb-4">Candidats</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {election.candidates.map((candidate) => (
              <div key={candidate._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                {candidate.imageUrl && (
                  <div className="w-20 h-20 mx-auto mb-3 overflow-hidden rounded-full bg-gray-200">
                    <img
                      src={candidate.imageUrl || "/placeholder.svg"}
                      alt={candidate.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = "https://via.placeholder.com/80"
                      }}
                    />
                  </div>
                )}
                <h3 className="text-lg font-semibold text-center">{candidate.name}</h3>
                <div className="text-center text-sm text-gray-500 mb-2">{candidate.party}</div>
                {candidate.bio && <p className="text-gray-600 text-sm">{candidate.bio}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Link to="/elections" className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400">
          Retour aux élections
        </Link>

        {isActive && user && !hasVoted && (
          <Link to={`/vote/${id}`} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
            Voter maintenant
          </Link>
        )}

        {isPast && (
          <Link to={`/results/${id}`} className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">
            Voir les résultats
          </Link>
        )}
      </div>
    </div>
  )
}

export default ElectionDetailsPage

