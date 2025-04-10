"use client"

const CandidateCard = ({ candidate, selected, onSelect }) => {
  return (
    <div
      className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
        selected ? "border-green-500 bg-green-50" : ""
      }`}
      onClick={() => onSelect(candidate._id)}
    >
      {candidate.imageUrl && (
        <div className="w-20 h-20 mx-auto mb-3 overflow-hidden rounded-full bg-gray-200">
          <img
            src={candidate.imageUrl || "/placeholder.svg"}
            alt={candidate.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = "https://via.placeholder.com/80"
            }}
          />
        </div>
      )}

      <h3 className="text-lg font-semibold text-center">{candidate.name}</h3>
      <div className="text-center text-sm text-gray-500 mb-2">{candidate.party}</div>

      {candidate.bio && <p className="text-gray-600 text-sm">{candidate.bio}</p>}

      {selected && <div className="mt-2 text-green-600 font-semibold text-center">Sélectionné</div>}
    </div>
  )
}

export default CandidateCard

