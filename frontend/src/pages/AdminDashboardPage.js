"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { electionsApi, votesApi } from "../services/api"
import { toast } from "react-toastify"
import axios from "axios"

// Utiliser la même URL de base que celle configurée dans api.js
const API_URL = process.env.REACT_APP_API_URL || 
                (window.location.hostname === 'localhost' ? 
                "http://localhost:5000/api" : 
                "http://backend:5000/api")

const axiosWithBaseUrl = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  }
})

// Ajouter l'intercepteur pour le token JWT
axiosWithBaseUrl.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log(`Sending request to: ${config.url}`)
    return config
  },
  (error) => Promise.reject(error),
)

const AdminDashboardPage = () => {
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedVote, setSelectedVote] = useState(null)
  const [recentVotes, setRecentVotes] = useState([])
  const [selectedElection, setSelectedElection] = useState("all")
  const [stats, setStats] = useState({
    totalVotes: 0,
    totalVoters: 0,
    activeElections: 0,
    completedElections: 0
  })
  const [voterTimingData] = useState([
    { voter: "Martin B.", time: 45, electionId: "e1" },
    { voter: "Sophie L.", time: 32, electionId: "e1" },
    { voter: "Jean D.", time: 68, electionId: "e1" },
    { voter: "Marie T.", time: 27, electionId: "e1" },
    { voter: "Paul M.", time: 90, electionId: "e2" },
    { voter: "Lucie K.", time: 52, electionId: "e2" },
    { voter: "Thomas P.", time: 41, electionId: "e2" }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Récupérer les élections
        const electionsResponse = await electionsApi.getAll();
        setElections(electionsResponse.data);
        
        // Récupérer les statistiques
        try {
          const statsResponse = await axiosWithBaseUrl.get('/dashboard/stats');
          setStats(statsResponse.data);
        } catch (statsError) {
          console.error("Erreur lors de la récupération des statistiques:", statsError);
          
          // Calculer des statistiques basiques à partir des élections disponibles
          const now = new Date();
          const activeElections = electionsResponse.data.filter(e => 
            new Date(e.startDate) <= now && 
            new Date(e.endDate) >= now && 
            e.isActive
          ).length;
          
          const completedElections = electionsResponse.data.filter(e => 
            new Date(e.endDate) < now
          ).length;
          
          // Utiliser les données des élections pour les statistiques
          setStats({
            totalVotes: electionsResponse.data.reduce((acc, curr) => acc + (curr.totalVotes || 0), 0),
            totalVoters: electionsResponse.data.reduce((acc, curr) => acc + (curr.totalRegisteredVoters || 0), 0),
            activeElections,
            completedElections
          });
        }
        
        // Récupérer les votes récents
        try {
          const votesResponse = await axiosWithBaseUrl.get('/votes/recent');
          setRecentVotes(votesResponse.data);
        } catch (votesError) {
          console.error("Erreur lors de la récupération des votes récents:", votesError);
          // En cas d'erreur, garder la liste vide
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Erreur de récupération des données:", error);
        setError("Impossible de charger les données. Veuillez rafraîchir la page ou réessayer plus tard.");
        setLoading(false);
        
        // Afficher un toast pour l'erreur
        toast.error("Erreur de chargement des données. Vérifiez votre connexion au serveur.");
      }
    };

    fetchData();
    
    // Rafraîchir les données toutes les 30 secondes pour les mettre à jour en temps réel
    const intervalId = setInterval(fetchData, 30000);
    
    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(intervalId);
  }, []);

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

  const handleViewVoteDetails = (voteId) => {
    // Trouver le vote spécifique dans notre liste de votes récents
    const vote = recentVotes.find(vote => vote._id === voteId)
    if (vote) {
      setSelectedVote({
        id: vote._id,
        timestamp: new Date(vote.timestamp).toLocaleString(), // Format de la date
        election: vote.electionTitle // Nom de l'élection
      })
    }
  }

  const getFilteredVotes = () => {
    if (selectedElection === "all") {
      return recentVotes
    }
    return recentVotes.filter(vote => vote.electionId === selectedElection)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Trouver les 5 derniers électeurs (simulé - à remplacer par les données réelles)
  const recentVoters = [
    { 
      id: 1, 
      name: "Hassan Amazigh", 
      location: "Agadir (Quartier Talborjt)", 
      avatar: "",
      
  },
  { 
      id: 2, 
      name: "Zahra Tifnout", 
      location: "Agadir (Nouveau Talborjt)", 
      avatar: "",
      
  },
  { 
      id: 3, 
      name: "Mohamed Soussi", 
      location: "Agadir (Cité Dakhla)", 
      avatar: "",
      
  },
  { 
      id: 4, 
      name: "Fatima Aït Baha", 
      location: "Agadir (Quartier Founty)", 
      avatar: "",
    
  },
  { 
      id: 5, 
      name: "Rachid El Mansouri", 
      location: "Agadir (Hay Salam)", 
      avatar: "",
      
  }
  ];

  // Données pour le graphique de temps de vote
  const filteredTimingData = voterTimingData.filter(d => !selectedVote || d.electionId === (selectedVote.electionId || "e1"));

  const filteredVotes = getFilteredVotes()

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Tableau de bord administrateur</h1>
        <div className="flex gap-2">
          <Link to="/admin/elections/create" className="btn bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
            Créer une nouvelle élection
          </Link>
          <Link to="/admin/blockchain" className="btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
            Statut Blockchain
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
            </svg>
            <span>{error}</span>
          </div>
          <button 
            onClick={() => setError(null)} 
            className="text-red-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      )}

      {/* Cartes de statistiques en temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-gray-500 font-medium">Votes Total</p>
            {loading ? (
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <>
                <p className="text-2xl font-bold">{stats.totalVotes.toLocaleString()}</p>
                <p className="text-green-500 text-sm">+12% ce mois</p>
              </>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-500 font-medium">Électeurs</p>
            {loading ? (
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <>
                <p className="text-2xl font-bold">{stats.totalVoters.toLocaleString()}</p>
                <p className="text-green-500 text-sm">+8% ce mois</p>
              </>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-yellow-100 p-3 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-500 font-medium">Élections actives</p>
            {loading ? (
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <>
                <p className="text-2xl font-bold">{stats.activeElections}</p>
                <p className="text-green-500 text-sm">+2 ce mois</p>
              </>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-500 font-medium">Élections terminées</p>
            {loading ? (
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <>
                <p className="text-2xl font-bold">{stats.completedElections}</p>
                <p className="text-green-500 text-sm">+20% ce mois</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top Selling Product (Élections les plus actives) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Élections les plus actives</h2>
            <div className="relative">
              <input
                type="search"
                placeholder="Rechercher..."
                className="px-4 py-2 pr-8 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="w-5 h-5 text-gray-500 absolute right-3 top-2.5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Élection
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Votes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taux de participation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {elections.slice(0, 5).map((election) => {
                  const now = new Date()
                  const startDate = new Date(election.startDate)
                  const endDate = new Date(election.endDate)
                  const isActive = now >= startDate && now <= endDate && election.isActive
                  const isPast = now > endDate
                  // eslint-disable-next-line no-unused-vars
                  const isFuture = now < startDate
                  
                  // Simulation des données de vote
                  const votes = Math.floor(Math.random() * 2000) + 500;
                  const participation = Math.floor(Math.random() * 70) + 30;
                  
                  return (
                    <tr key={election._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center">
                            {election.title.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{election.title}</div>
                            <div className="text-gray-500 text-sm">
                              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {votes.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500">{participation}%</span>
                          <div className="w-24 h-2 bg-gray-200 rounded-full ml-2">
                            <div 
                              className="h-full rounded-full bg-green-500" 
                              style={{ width: `${participation}%` }}
                            ></div>
                          </div>
                        </div>
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link to={`/elections/${election._id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                          Voir
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {elections.length > 5 && (
            <div className="flex justify-center mt-4">
              <Link to="/admin/elections" className="text-blue-600 hover:underline">
                Voir toutes les élections
              </Link>
            </div>
          )}
        </div>
        
        {/* Nouveaux électeurs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Nouveaux électeurs</h2>
            <button className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            {recentVoters.map(voter => (
              <div key={voter.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <img 
                    src={voter.avatar}
                    alt={voter.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="ml-3">
                    <p className="font-medium">{voter.name}</p>
                    <p className="text-sm text-gray-500">{voter.location}</p>
                  </div>
                </div>
                <button className="text-blue-500 bg-blue-100 p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

            {/* Section pour le graphique d'évolution des votes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Évolution des votes</h2>
          
          <div className="relative h-80 w-full overflow-x-auto">
            {/* Étiquette Y - Valeur pour l'électeur */}
            <div className="absolute -left-[150px] top-0 h-full flex flex-col justify-between text-xs text-gray-500">
              <span className="mt-4">1000</span>
              <span>750</span>
              <span>500</span>
              <span className="mb-4">250</span>
            </div>
            
            {/* Conteneur du graphique */}
            <div className="min-w-[800px] h-full bg-blue-50 rounded relative p-4">
              {/* Lignes de grille */}
              <div className="absolute inset-0 p-4">
                <div className="w-full h-full grid grid-rows-4 pointer-events-none">
                  {[...Array(4)].map((_, i) => (
                    <div key={`grid-line-${i}`} className="w-full border-t border-gray-200"></div>
                  ))}
                </div>
              </div>
              
              {/* Courbe d'évolution des votes */}
              <svg className="w-full h-full" viewBox="0 0 820 400" preserveAspectRatio="none">
                {/* Zone remplie sous la courbe */}
                <path 
                  d="M 20,320 C 80,315 160,300 240,270 C 320,240 400,180 480,120 C 560,60 640,15 720,10 L 720,400 L 20,400 Z" 
                  fill="url(#blueGradient)" 
                  stroke="none" 
                />

                {/* Courbe principale */}
                <path 
                  d="M 20,320 C 80,315 160,300 240,270 C 320,240 400,180 480,120 C 560,60 640,15 720,10" 
                  stroke="#3B82F6" 
                  strokeWidth="3" 
                  fill="none" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Points de données avec étiquettes */}
                <g fill="#3B82F6">
                  <circle cx="20" cy="320" r="4" />
                  <text x="20" y="340" fontSize="12" fill="#1E3A8A" textAnchor="middle">200</text>

                  <circle cx="120" cy="300" r="4" />
                  <text x="120" y="320" fontSize="12" fill="#1E3A8A" textAnchor="middle">300</text>

                  <circle cx="220" cy="270" r="4" />
                  <text x="220" y="290" fontSize="12" fill="#1E3A8A" textAnchor="middle">400</text>

                  <circle cx="320" cy="210" r="4" />
                  <text x="320" y="230" fontSize="12" fill="#1E3A8A" textAnchor="middle">550</text>

                  <circle cx="420" cy="130" r="4" />
                  <text x="420" y="150" fontSize="12" fill="#1E3A8A" textAnchor="middle">700</text>

                  <circle cx="520" cy="60" r="4" />
                  <text x="520" y="80" fontSize="12" fill="#1E3A8A" textAnchor="middle">850</text>

                  <circle cx="620" cy="25" r="4" />
                  <text x="620" y="45" fontSize="12" fill="#1E3A8A" textAnchor="middle">950</text>

                  <circle cx="720" cy="10" r="4" />
                  <text x="720" y="30" fontSize="12" fill="#1E3A8A" textAnchor="middle">1000</text>
                </g>
                
                {/* Définition du dégradé */}
                <defs>
                  <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(59, 130, 246, 0.5)" />
                    <stop offset="100%" stopColor="rgba(219, 234, 254, 0.1)" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Étiquettes des mois (X) */}
              <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-gray-500 px-4">
                <span>Jan</span>
                <span>Fév</span>
                <span>Mar</span>
                <span>Avr</span>
                <span>Mai</span>
                <span>Juin</span>
                <span>Juil</span>
                <span>Août</span>
              </div>
            </div>
            
            {/* Légende des données et indicateurs */}
            <div className="absolute bottom-[-25px] left-0 w-full flex justify-between items-center px-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                <span className="text-xs text-gray-600">Votes quotidiens</span>
              </div>
              <span className="text-sm font-medium text-gray-600">Progression des votes par jour</span>
              <div className="flex items-center">
                <span className="text-xs text-gray-600 mr-1">+247% </span>
                <span className="text-xs text-green-600">↑</span>
              </div>
            </div>
          </div>
        </div>
 

        
        {/* Détail du vote - section droite */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Détail du vote</h2>
          {selectedVote ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-sm text-gray-600">Date:</p>
                  <p className="text-sm font-medium">{selectedVote.timestamp}</p>
                  
                  <p className="text-sm text-gray-600">Élection:</p>
                  <p className="text-sm font-medium">{selectedVote.election}</p>
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => setSelectedVote(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Fermer le détail
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500">Cliquez sur "Voir détails" dans la liste des votes pour afficher les informations</p>
              <button
                onClick={() => handleViewVoteDetails()}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Voir un exemple de vote
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Liste des votes récents */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Votes récents</h2>
            <div className="flex items-center">
              <label htmlFor="electionFilter" className="mr-2 text-sm text-gray-600">Filtrer par élection:</label>
              <select
                id="electionFilter"
                value={selectedElection}
                onChange={(e) => setSelectedElection(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les élections</option>
                {elections.map(election => (
                  <option key={election._id} value={election._id}>{election.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Électeur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Élection</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plateforme</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVotes.length > 0 ? (
                  filteredVotes.map((vote) => (
                    <tr key={vote._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img 
                            src={vote.voterAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(vote.voterName)}&background=random`} 
                            alt={vote.voterName}
                            className="w-8 h-8 rounded-full mr-3" 
                          />
                          <span>{vote.voterName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {vote.electionTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(vote.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Web
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          onClick={() => handleViewVoteDetails(vote._id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Voir détails
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      Aucun vote trouvé pour cette élection
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Liste complète des élections */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Gérer toutes les élections</h2>

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
                    // eslint-disable-next-line no-unused-vars
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

