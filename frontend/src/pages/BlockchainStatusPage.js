import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import BlockchainStatus from "../components/BlockchainStatus"

const BlockchainStatusPage = () => {
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Mettre à jour l'horodatage de dernière actualisation
  useEffect(() => {
    const timer = setInterval(() => {
      setLastRefresh(new Date())
    }, 30000) // Actualiser l'horodatage toutes les 30 secondes
    
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Statut de la Blockchain</h1>
        <Link 
          to="/admin" 
          className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour au tableau de bord
        </Link>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              Cette page affiche l'état actuel de la blockchain utilisée pour sécuriser les votes. 
              La blockchain garantit l'intégrité et l'immuabilité des votes enregistrés dans le système.
            </p>
            <p className="text-xs text-blue-700 mt-2">
              Dernière actualisation: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      <BlockchainStatus />

      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">À propos de la blockchain de vote</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-800">Comment ça fonctionne</h3>
            <p className="text-gray-600 mt-1">
              Notre système utilise une blockchain privée pour stocker de manière sécurisée et immuable tous les votes. 
              Chaque vote est enregistré dans un bloc, et chaque bloc est lié cryptographiquement au précédent, 
              formant ainsi une chaîne inviolable.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-800">Pourquoi utiliser la blockchain</h3>
            <p className="text-gray-600 mt-1">
              La technologie blockchain garantit que les votes ne peuvent pas être modifiés une fois enregistrés. 
              Cela permet d'assurer l'intégrité du processus de vote et de prévenir toute manipulation des résultats.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-800">Problèmes de connexion</h3>
            <p className="text-gray-600 mt-1">
              Si vous rencontrez des erreurs comme "Non autorisé, token invalide", votre session peut avoir expiré. 
              Essayez de rafraîchir votre session en utilisant le bouton prévu à cet effet ou reconnectez-vous.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlockchainStatusPage

