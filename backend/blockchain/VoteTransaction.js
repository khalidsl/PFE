const crypto = require("crypto-js")

class VoteTransaction {
  constructor(electionId, candidateId, voterId, privateKey) {
    this.electionId = electionId
    this.candidateId = candidateId
    this.voterId = voterId
    this.timestamp = Date.now()

    // Créer une signature pour le vote
    this.signature = this.signVote(privateKey)
  }

  // Calculer le hash du vote
  calculateHash() {
    return crypto.SHA256(this.electionId + this.candidateId + this.voterId + this.timestamp).toString()
  }

  // Signer le vote avec la clé privée
  signVote(privateKey) {
    const hash = this.calculateHash()
    // Dans un système réel, nous utiliserions une vraie signature cryptographique
    // Pour simplifier, nous utilisons un hash combiné avec la clé privée
    const signature = crypto.HmacSHA256(hash, privateKey).toString()
    return signature
  }

  // Vérifier si le vote est valide
  isValid() {
    // Dans un système réel, nous vérifierions la signature avec la clé publique
    // Pour simplifier, nous supposons que tous les votes sont valides
    return true
  }
}

module.exports = VoteTransaction

