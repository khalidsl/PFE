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

      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-12">
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

      {/* Graphique des résultats d'élection (déplacé en bas de page) */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Résultats de dernière élection</h2>
        
        {/* Sélecteur d'élection */}
        <div className="flex justify-end mb-4">
          <div className="w-64">
            <label htmlFor="electionSelect" className="block text-sm font-medium text-gray-700 mb-1">
              Choisir une élection:
            </label>
            <select
              id="electionSelect"
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              defaultValue="presidentielle-2025"
            >
              <option value="presidentielle-2025">Élections présidentielles 2025</option>
              <option value="municipales-2024">Élections municipales 2024</option>
              <option value="europeennes-2024">Élections européennes 2024</option>
              <option value="regionales-2023">Élections régionales 2023</option>
            </select>
          </div>
        </div>
        
        {/* Graphique des résultats */}
        <div className="rounded-lg overflow-hidden">
          {/* Fond bleu foncé avec bord arrondi */}
          <div className="bg-white rounded-lg">
            {/* Bande titre en haut */}
            <div className="bg-blue-700 py-3 px-6">
              <h3 className="text-white text-xl font-bold">Élections présidentielles 2025 - Résultats après dépouillement</h3>
            </div>
            
            {/* Contenu du graphique */}
            <div className="bg-blue-600 p-10 pt-20 pb-16">
              {/* Le graphique à barres - version améliorée avec barres horizontales */}
              <div className="flex justify-around items-end h-60">
                {/* Candidat 1 */}
                <div className="flex flex-col items-center">
                  <div className="bg-green-500 w-32 h-12 flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-xl">42,7%</span>
                  </div>
                  <div className="text-white font-semibold text-center">
                    <div>Candidat A</div>
                    <div className="text-sm opacity-90">13 452 votes</div>
                  </div>
                </div>
                
                {/* Candidat 2 */}
                <div className="flex flex-col items-center">
                  <div className="bg-blue-400 w-32 h-12 flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-xl">32,5%</span>
                  </div>
                  <div className="text-white font-semibold text-center">
                    <div>Candidat B</div>
                    <div className="text-sm opacity-90">10 234 votes</div>
                  </div>
                </div>
                
                {/* Candidat 3 */}
                <div className="flex flex-col items-center">
                  <div className="bg-yellow-500 w-32 h-12 flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-xl">16,3%</span>
                  </div>
                  <div className="text-white font-semibold text-center">
                    <div>Candidat C</div>
                    <div className="text-sm opacity-90">5 138 votes</div>
                  </div>
                </div>
                
                {/* Candidat 4 */}
                <div className="flex flex-col items-center">
                  <div className="bg-red-500 w-32 h-12 flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-xl">8,5%</span>
                  </div>
                  <div className="text-white font-semibold text-center">
                    <div>Candidat D</div>
                    <div className="text-sm opacity-90">2 678 votes</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Données de participation en bas */}
            <div className="bg-blue-700 py-2 px-6 flex justify-between text-sm text-white">
              <p>Participation: 78,3%</p>
              <p>Votes exprimés: 31 502</p>
              <p>Abstention: 21,7%</p>
              <p>Système de Vote Électronique • 29/04/2025</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage

