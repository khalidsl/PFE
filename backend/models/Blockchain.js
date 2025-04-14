const mongoose = require("mongoose")

// Schéma pour les transactions
const transactionSchema = new mongoose.Schema({
  voteId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  electionId: {
    type: String,
    required: true,
  },
  candidateId: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
})

// Schéma pour les blocs
const blockSchema = new mongoose.Schema({
  index: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  transactions: {
    type: [transactionSchema],
    default: [],
  },
  previousHash: {
    type: String,
    required: true,
  },
  hash: {
    type: String,
    required: true,
  },
  nonce: {
    type: Number,
    default: 0,
  },
})

// Schéma principal de la blockchain
const blockchainSchema = new mongoose.Schema({
  chain: {
    type: [blockSchema],
    required: true,
    default: [],
  },
  pendingTransactions: {
    type: [transactionSchema],
    default: [],
  },
})

// Ajouter une méthode pour vérifier si la blockchain est valide
blockchainSchema.methods.isValid = function () {
  if (!this.chain || this.chain.length <= 1) {
    return true // Une chaîne avec seulement le bloc genesis est valide
  }

  for (let i = 1; i < this.chain.length; i++) {
    const currentBlock = this.chain[i]
    const previousBlock = this.chain[i - 1]

    // Vérifier le lien avec le bloc précédent
    if (currentBlock.previousHash !== previousBlock.hash) {
      return false
    }
  }

  return true
}

const Blockchain = mongoose.model("Blockchain", blockchainSchema)

module.exports = Blockchain
