import { Link } from "react-router-dom"

const ElectionCard = ({ election }) => {
  // Vérifier le statut de l'élection
  const now = new Date()
  const startDate = new Date(election.startDate)
  const endDate = new Date(election.endDate)
  const isActive = now >= startDate && now <= endDate && election.isActive
  const isPast = now > endDate
  // eslint-disable-next-line no-unused-vars
  const isFuture = now < startDate

  return (
    <div className="border rounded-lg overflow-hidden shadow-md">
      <div className={`p-4 text-white ${isActive ? "bg-green-600" : isPast ? "bg-gray-600" : "bg-blue-600"}`}>
        <h3 className="text-xl font-semibold">{election.title}</h3>
        <div className="text-sm mt-1">{isActive ? "Active" : isPast ? "Terminée" : "À venir"}</div>
      </div>

      <div className="p-4">
        <p className="text-gray-600 mb-4">
          {election.description.length > 150 ? `${election.description.substring(0, 150)}...` : election.description}
        </p>

        <div className="flex justify-between text-sm text-gray-500 mb-4">
          <div>
            <span className="font-semibold">Début:</span> {new Date(election.startDate).toLocaleDateString()}
          </div>
          <div>
            <span className="font-semibold">Fin:</span> {new Date(election.endDate).toLocaleDateString()}
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/elections/${election._id}`}
            className="flex-1 block text-center bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Détails
          </Link>

          {isActive && (
            <Link
              to={`/vote/${election._id}`}
              className="flex-1 block text-center bg-green-500 text-white py-2 rounded hover:bg-green-600"
            >
              Voter
            </Link>
          )}

          {isPast && (
            <Link
              to={`/results/${election._id}`}
              className="flex-1 block text-center bg-purple-500 text-white py-2 rounded hover:bg-purple-600"
            >
              Résultats
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default ElectionCard

