const BlockchainVerification = ({ blockchainData }) => {
  if (!blockchainData) {
    return null
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
          <span>Vote en attente d'inclusion dans la blockchain</span>
        </div>
      )}
    </div>
  )
}

export default BlockchainVerification

