const BlockchainVerification = ({ blockchainData }) => {
  if (!blockchainData) {
    return null
  }

  // Si une erreur s'est produite lors de la récupération des données blockchain
  if (blockchainData.error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold mb-2">Vérification Blockchain</h3>
        <div className="flex items-center text-yellow-600">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            ></path>
          </svg>
          <span>Impossible de vérifier le statut blockchain du vote</span>
        </div>
        <p className="text-sm mt-2 text-yellow-700">
          Le service blockchain est temporairement indisponible. Votre vote est enregistré et sera vérifié
          ultérieurement.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold mb-2">Vérification Blockchain</h3>

      {blockchainData.inBlockchain ? (
        <div>
          <div className="flex items-center text-green-600 mb-2">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Vote vérifié et enregistré dans la blockchain</span>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              <span className="font-medium">Hash du bloc:</span> {blockchainData.blockHash}
            </p>
            <p>
              <span className="font-medium">Index du bloc:</span> {blockchainData.blockIndex}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center text-yellow-600">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>{blockchainData.message || "Vote en attente d'inclusion dans la blockchain"}</span>
        </div>
      )}
    </div>
  )
}

export default BlockchainVerification
