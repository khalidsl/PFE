"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { authApi, electionsApi } from "../services/api"

const ProfilePage = () => {
  const { user } = useAuth()

  const [votingHistory, setVotingHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Récupérer le profil de l'utilisateur pour obtenir l'historique de vote mis à jour
        const { data } = await authApi.getProfile()

        // Récupérer toutes les élections
        const electionsResponse = await electionsApi.getAll()
        const allElections = electionsResponse.data

        // Créer l'historique de vote en faisant correspondre les votes de l'utilisateur avec les élections
        const history = []

        if (data.hasVoted) {
          for (const [electionId, hasVoted] of Object.entries(data.hasVoted)) {
            if (hasVoted) {
              const election = allElections.find((e) => e._id === electionId)
              if (election) {
                history.push({
                  electionId,
                  title: election.title,
                  date: election.endDate,
                  isActive: new Date() <= new Date(election.endDate) && election.isActive,
                })
              }
            }
          }
        }

        // Trier par date (plus récent en premier)
        history.sort((a, b) => new Date(b.date) - new Date(a.date))

        setVotingHistory(history)
        setLoading(false)
      } catch (error) {
        console.error("Erreur de récupération des données du profil:", error)
        setError("Impossible de charger les données du profil")
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

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

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mon Profil</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="bg-blue-600 text-white p-6">
          <h2 className="text-2xl font-semibold">{user.name}</h2>
          <p className="text-blue-100">{user.role === "admin" ? "Administrateur" : "Électeur"}</p>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-gray-500 text-sm">Email</h3>
              <p>{user.email}</p>
            </div>
            <div>
              <h3 className="text-gray-500 text-sm">Numéro d'identité national</h3>
              <p>{user.nationalId}</p>
            </div>
          </div>

          {user.role === "admin" && (
            <div className="mt-4">
              <Link to="/admin" className="btn btn-primary">
                Accéder au tableau de bord administrateur
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Historique de vote</h2>

          {votingHistory.length === 0 ? (
            <div className="bg-gray-100 p-4 text-center rounded">
              <p className="text-gray-600">Vous n'avez pas encore voté pour une élection.</p>
            </div>
          ) : (
            <div className="divide-y">
              {votingHistory.map((vote) => (
                <div key={vote.electionId} className="py-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{vote.title}</h3>
                    <p className="text-sm text-gray-500">Voté le {new Date(vote.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/elections/${vote.electionId}`} className="text-blue-600 hover:underline text-sm">
                      Détails
                    </Link>
                    {!vote.isActive && (
                      <Link to={`/results/${vote.electionId}`} className="text-purple-600 hover:underline text-sm">
                        Résultats
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

