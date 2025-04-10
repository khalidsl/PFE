"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { electionsApi } from "../services/api"
import { toast } from "react-toastify"

const AdminDashboardPage = () => {
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const { data } = await electionsApi.getAll()
        setElections(data)
        setLoading(false)
      } catch (error) {
        console.error("Erreur de récupération des élections:", error)
        setError("Impossible de charger les élections")
        setLoading(false)
      }
    }

    fetchElections()
  }, [])

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await electionsApi.update(id, { isActive: !currentStatus })

      // Mettre à jour l'état local
      setElections(
        elections.map((election) => (election._id === id ? { ...election, isActive: !election.isActive } : election)),
      )

      toast.success(`Élection ${!currentStatus ? "activée" : "désactivée"} avec succès`)
    } catch (error) {
      console.error("Erreur de mise à jour du statut de l'élection:", error)
      toast.error("Erreur de mise à jour du statut de l'élection")
    }
  }

  const handleDeleteElection = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette élection ? Cette action ne peut pas être annulée.")) {
      try {
        await electionsApi.delete(id)

        // Mettre à jour l'état local
        setElections(elections.filter((election) => election._id !== id))

        toast.success("Élection supprimée avec succès")
      } catch (error) {
        console.error("Erreur de suppression de l'élection:", error)
        toast.error(error.response?.data?.message || "Erreur de suppression de l'élection")
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tableau de bord administrateur</h1>
        <div className="flex gap-2">
          <Link to="/admin/elections/create" className="btn btn-success">
            Créer une nouvelle élection
          </Link>
          <Link to="/admin/blockchain" className="btn btn-primary">
            Statut Blockchain
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Gérer les élections</h2>

          {elections.length === 0 ? (
            <div className="bg-gray-100 p-4 text-center rounded">
              <p className="text-gray-600">Aucune élection trouvée. Créez votre première élection.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Titre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidats
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {elections.map((election) => {
                    const now = new Date()
                    const startDate = new Date(election.startDate)
                    const endDate = new Date(election.endDate)
                    const isActive = now >= startDate && now <= endDate && election.isActive
                    const isPast = now > endDate
                    const isFuture = now < startDate

                    return (
                      <tr key={election._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{election.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              isActive
                                ? "bg-green-100 text-green-800"
                                : isPast
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {isActive ? "En cours" : isPast ? "Terminée" : "À venir"}
                          </span>
                          {election.isActive ? (
                            <span className="ml-2 text-green-600 text-xs">Activée</span>
                          ) : (
                            <span className="ml-2 text-red-600 text-xs">Désactivée</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>Début: {startDate.toLocaleDateString()}</div>
                          <div>Fin: {endDate.toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {election.candidates.length}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link to={`/elections/${election._id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                            Voir
                          </Link>
                          {!isPast && (
                            <Link
                              to={`/admin/elections/${election._id}/edit`}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Modifier
                            </Link>
                          )}
                          <button
                            onClick={() => handleToggleActive(election._id, election.isActive)}
                            className={`${
                              election.isActive
                                ? "text-red-600 hover:text-red-900"
                                : "text-green-600 hover:text-green-900"
                            } mr-3`}
                          >
                            {election.isActive ? "Désactiver" : "Activer"}
                          </button>
                          <button
                            onClick={() => handleDeleteElection(election._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage

