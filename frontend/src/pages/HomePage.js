"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { electionsApi } from "../services/api"
import ElectionCard from "../components/ElectionCard"

const HomePage = () => {
  const [activeElections, setActiveElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchActiveElections = async () => {
      try {
        const { data } = await electionsApi.getAll()

        // Filtrer les élections actives
        const now = new Date()
        const active = data.filter((election) => {
          const startDate = new Date(election.startDate)
          const endDate = new Date(election.endDate)
          return now >= startDate && now <= endDate && election.isActive
        })

        setActiveElections(active)
        setLoading(false)
      } catch (error) {
        console.error("Erreur de récupération des élections:", error)
        setError("Impossible de charger les élections actives")
        setLoading(false)
      }
    }

    fetchActiveElections()
  }, [])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Système de Vote Électronique</h1>
        <p className="text-xl text-gray-600">Une plateforme sécurisée et transparente pour les élections en ligne</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Pourquoi voter en ligne ?</h2>
          <ul className="space-y-2">
            <li className="flex items-center">
              <svg
                className="w-5 h-5 text-green-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Accessibilité pour tous les électeurs</span>
            </li>
            <li className="flex items-center">
              <svg
                className="w-5 h-5 text-green-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Résultats rapides et précis</span>
            </li>
            <li className="flex items-center">
              <svg
                className="w-5 h-5 text-green-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Sécurité et transparence garanties</span>
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Comment ça marche ?</h2>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Créez un compte avec vos informations personnelles</li>
            <li>Parcourez les élections actives</li>
            <li>Sélectionnez votre candidat préféré</li>
            <li>Confirmez votre vote</li>
            <li>Recevez une confirmation sécurisée</li>
          </ol>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Élections en cours</h2>
          <Link to="/elections" className="text-blue-600 hover:underline">
            Voir toutes les élections
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
        ) : activeElections.length === 0 ? (
          <div className="bg-gray-100 p-8 text-center rounded">
            <p className="text-xl text-gray-600">Aucune élection active en ce moment</p>
            <Link to="/elections" className="mt-4 inline-block btn btn-primary">
              Voir les élections à venir
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {activeElections.map((election) => (
              <ElectionCard key={election._id} election={election} />
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h2 className="text-2xl font-semibold mb-4 text-center">Prêt à voter ?</h2>
        <div className="flex justify-center gap-4">
          <Link to="/register" className="btn btn-primary">
            S'inscrire maintenant
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HomePage

