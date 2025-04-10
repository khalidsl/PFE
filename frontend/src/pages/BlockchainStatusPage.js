import { Link } from "react-router-dom"
import BlockchainStatus from "../components/BlockchainStatus"

const BlockchainStatusPage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Statut de la Blockchain</h1>

      <div className="mb-6">
        <p className="text-gray-600">
          Cette page affiche l'état actuel de la blockchain utilisée pour sécuriser les votes. La blockchain garantit
          l'intégrité et l'immuabilité des votes enregistrés dans le système.
        </p>
      </div>

      <BlockchainStatus />

      <div className="mt-6">
        <Link to="/admin" className="btn btn-secondary">
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  )
}

export default BlockchainStatusPage

