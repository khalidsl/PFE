const mongoose = require("mongoose")

const blockchainSchema = new mongoose.Schema({
  index: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Number,
    required: true,
  },
  votes: [
    {
      electionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Election",
      },
      candidateId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      voterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      signature: {
        type: String,
        required: true,
      },
    },
  ],
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
    required: true,
  },
})

const Blockchain = mongoose.model("Blockchain", blockchainSchema)

module.exports = Blockchain

