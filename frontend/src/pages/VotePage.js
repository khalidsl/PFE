"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { electionsApi, votesApi } from "../services/api"
import { useAuth } from "../context/AuthContext"
import { toast } from "react-toastify"
import CandidateCard from "../components/CandidateCard"

const VotePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, updateVoteStatus } = useAuth()

  const [election, setElection] = useState(null)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [confirmStep, setConfirmStep] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchElection = async () => {
      try {
        const { data } = await electionsApi.getById(id)
        setElection(data)
        setLoading(false)

        // Vérifier si l'utilisateur a déjà voté pour cette élection
        if (user.hasVoted && user.hasVoted[id]) {
          setError("Vous avez déjà voté pour cette élection")
          setTimeout(() => {
            navigate(`/elections/${id}`)
          }, 3000)
        }

        // Vérifier si l'élection est active
        const now = new Date()
        const startDate = new Date(data.startDate)
        const endDate = new Date(data.endDate)
        if (!(now >= startDate && now <= endDate && data.isActive)) {
          setError("Cette élection n'est pas active actuellement")
          setTimeout(() => {
            navigate(`/elections/${id}`)
          }, 3000)
        }
      } catch (error) {
        console.error("Erreur de récupération de l'élection:", error)
        setError("Impossible de charger les détails de l'élection")
        setLoading(false)
      }
    }

    fetchElection()
  }, [id, navigate, user])

  const handleCandidateSelect = (candidateId) => {
    setSelectedCandidate(candidateId)
  }

  const handleContinue = () => {
    if (!selectedCandidate) {
      toast.error("Veuillez sélectionner un candidat")
      return
    }
    setConfirmStep(true)
  }

  const handleBack = () => {
    setConfirmStep(false)
  }

  const handleSubmitVote = async () => {
    if (!selectedCandidate) {
      toast.error("Veuillez sélectionner un candidat")
      return
    }

    setSubmitting(true)

    try {
      const { data } = await votesApi.castVote({
        electionId: id,
        candidateId: selectedCandidate,
      })

      // Mettre à jour le statut de vote de l'utilisateur
      updateVoteStatus(id)

      toast.success("Vote enregistré avec succès")

      // Rediriger vers la page de détails de l'élection avec l'ID du vote
      navigate(`/elections/${id}?vote=${data._id}`)
    } catch (error) {
      console.error("Erreur d'enregistrement du vote:", error)
      setError(error.response?.data?.message || "Une erreur est survenue lors de l'enregistrement du vote")
      toast.error("Erreur d'enregistrement du vote")
    } finally {
      setSubmitting(false)
    }
  }

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
        <button
          onClick={() => navigate(`/elections/${id}`)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retour aux détails de l'élection
        </button>
      </div>
    )
  }

  const selectedCandidateData = election.candidates.find((c) => c._id === selectedCandidate)

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Voter</h1>
      <h2 className="text-xl text-gray-600 mb-6">{election.title}</h2>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        {!confirmStep ? (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sélectionnez un candidat</h3>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {election.candidates.map((candidate) => (
                <CandidateCard
                  key={candidate._id}
                  candidate={candidate}
                  selected={selectedCandidate === candidate._id}
                  onSelect={handleCandidateSelect}
                />
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleContinue}
                disabled={!selectedCandidate}
                className="btn btn-primary disabled:opacity-50"
              >
                Continuer
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Confirmer votre vote</h3>

            <div className="bg-gray-50 p-4 rounded mb-6">
              <p className="text-gray-600 mb-2">Vous allez voter pour :</p>
              <div className="flex items-center">
                {selectedCandidateData.imageUrl && (
                  <div className="w-12 h-12 mr-3 overflow-hidden rounded-full bg-gray-200">
                    <img
                      src={selectedCandidateData.imageUrl || "/placeholder.svg"}
                      alt={selectedCandidateData.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = "https://via.placeholder.com/48"
                      }}
                    />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold">{selectedCandidateData.name}</h4>
                  <p className="text-sm text-gray-500">{selectedCandidateData.party}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-6">
              <p className="text-yellow-800">
                <strong>Important :</strong> Votre vote est définitif et ne peut pas être modifié une fois soumis.
              </p>
            </div>

            <div className="flex justify-between">
              <button onClick={handleBack} className="btn btn-secondary">
                Retour
              </button>

              <button onClick={handleSubmitVote} disabled={submitting} className="btn btn-success disabled:opacity-50">
                {submitting ? "Enregistrement..." : "Confirmer mon vote"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VotePage

