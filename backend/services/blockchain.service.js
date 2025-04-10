const Blockchain = require("../blockchain/Blockchain")
const blockchain = new Blockchain()

// Initialiser la blockchain
exports.initializeBlockchain = async () => {
  await blockchain.initializeChain()
  console.log("Blockchain initialisée")
  return blockchain
}

// Ajouter un vote à la blockchain
exports.addVoteToBlockchain = async (electionId, candidateId, voterId) => {
  // Vérifier si l'utilisateur a déjà voté pour cette élection
  if (blockchain.hasVoted(electionId, voterId)) {
    throw new Error("Vous avez déjà voté pour cette élection")
  }

  // Ajouter le vote à la blockchain
  const privateKey = process.env.ENCRYPTION_KEY // Utiliser la clé de chiffrement comme clé privée
  const vote = blockchain.addVote(electionId, candidateId, voterId, privateKey)

  // Si nous avons suffisamment de votes en attente, miner un nouveau bloc
  // Dans un système réel, cela serait fait par un processus séparé
  if (blockchain.pendingVotes.length >= 5) {
    await blockchain.minePendingVotes()
  }

  return vote
}

// Miner les votes en attente
exports.mineVotes = async () => {
  return await blockchain.minePendingVotes()
}

// Vérifier si la blockchain est valide
exports.verifyBlockchain = () => {
  return blockchain.isChainValid()
}

// Obtenir tous les votes pour une élection
exports.getVotesForElection = (electionId) => {
  return blockchain.getVotesForElection(electionId)
}

// Obtenir l'historique des votes d'un utilisateur
exports.getUserVotingHistory = (voterId) => {
  return blockchain.getUserVotingHistory(voterId)
}

// Obtenir toute la blockchain
exports.getFullBlockchain = () => {
  return blockchain.chain
}

// Obtenir le nombre de votes en attente
exports.getPendingVotesCount = () => {
  return blockchain.pendingVotes.length
}
