"use client"

import { useState, useEffect } from "react"
import { electionsApi } from "../services/api"
import ElectionCard from "../components/ElectionCard"

const ElectionsPage = () => {
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("all") // 'all', 'active', 'upcoming', 'past'

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

  // Filtrer les élections en fonction du filtre sélectionné
  const filteredElections = elections.filter((election) => {
    const now = new Date()
    const startDate = new Date(election.startDate)
    const endDate = new Date(election.endDate)

    switch (filter) {
      case "active":
        return now >= startDate && now <= endDate && election.isActive
      case "upcoming":
        return now < startDate
      case "past":
        return now > endDate
      default:
        return true
    }
  })

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Toutes les élections</h1>

      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full ${
              filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-2 rounded-full ${
              filter === "active" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            En cours
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-4 py-2 rounded-full ${
              filter === "upcoming" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            À venir
          </button>
          <button
            onClick={() => setFilter("past")}
            className={`px-4 py-2 rounded-full ${
              filter === "past" ? "bg-gray-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Terminées
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
      ) : filteredElections.length === 0 ? (
        <div className="bg-gray-100 p-8 text-center rounded">
          <p className="text-xl text-gray-600">Aucune élection trouvée</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredElections.map((election) => (
            <ElectionCard key={election._id} election={election} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ElectionsPage

