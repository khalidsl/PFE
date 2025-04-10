const mongoose = require("mongoose")
const crypto = require("crypto")

const voteSchema = new mongoose.Schema({
  election: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Election",
    required: true,
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  voter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  voteHash: {
    type: String,
    required: true,
    unique: true,
  },
  blockHash: {
    type: String,
  },
  blockIndex: {
    type: Number,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
})

// Méthode pour générer un hash de vote
voteSchema.statics.generateVoteHash = (electionId, candidateId, voterId, encryptionKey) => {
  const data = `${electionId}:${candidateId}:${voterId}:${Date.now()}`
  const cipher = crypto.createCipher("aes-256-cbc", encryptionKey)
  let encrypted = cipher.update(data, "utf8", "hex")
  encrypted += cipher.final("hex")
  return encrypted
}

const Vote = mongoose.model("Vote", voteSchema)

module.exports = Vote

