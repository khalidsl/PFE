const crypto = require("crypto-js")

class Block {
  constructor(timestamp, votes, previousHash = "") {
    this.timestamp = timestamp
    this.votes = votes
    this.previousHash = previousHash
    this.hash = this.calculateHash()
    this.nonce = 0
  }

  calculateHash() {
    return crypto.SHA256(this.previousHash + this.timestamp + JSON.stringify(this.votes) + this.nonce).toString()
  }

  // Preuve de travail simple (difficulté = nombre de zéros au début du hash)
  mineBlock(difficulty) {
    const target = Array(difficulty + 1).join("0")

    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++
      this.hash = this.calculateHash()
    }

    console.log(`Bloc miné: ${this.hash}`)
  }

  // Vérifier si les votes dans ce bloc ont été modifiés
  hasValidVotes() {
    for (const vote of this.votes) {
      if (!vote.isValid()) {
        return false
      }
    }

    return true
  }
}

module.exports = Block

