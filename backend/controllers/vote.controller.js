const Vote = require("../models/Vote")
const Election = require("../models/Election")
const User = require("../models/User")
const blockchainService = require("../services/blockchain.service")
const { validationResult } = require("express-validator")

// Cast a vote
exports.castVote = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { electionId, candidateId } = req.body
    const voterId = req.user._id

    // Check if election exists and is active
    const election = await Election.findById(electionId)
    if (!election) {
      return res.status(404).json({ message: "Election not found" })
    }

    const now = new Date()
    if (now < election.startDate || now > election.endDate || !election.isActive) {
      return res.status(400).json({ message: "Election is not active" })
    }

    // Check if candidate exists in this election
    const candidateExists = election.candidates.some((c) => c._id.toString() === candidateId)
    if (!candidateExists) {
      return res.status(404).json({ message: "Candidate not found in this election" })
    }

    // Check if user has already voted in this election
    const user = await User.findById(voterId)
    if (user.hasVoted && user.hasVoted.get(electionId.toString())) {
      return res.status(400).json({ message: "You have already voted in this election" })
    }

    // Create timestamp for the vote
    const timestamp = new Date()

    // Generate vote hash for verification
    const voteHash = Vote.generateVoteHash(electionId, candidateId, voterId, process.env.ENCRYPTION_KEY)

    // Create the vote
    const vote = await Vote.create({
      election: electionId,
      candidate: candidateId,
      voter: voterId,
      timestamp,
      voteHash,
    })

    // Update user's voting status
    if (!user.hasVoted) {
      user.hasVoted = new Map()
    }
    user.hasVoted.set(electionId.toString(), true)
    await user.save()

    // Add vote to blockchain
    try {
      const blockchainResult = await blockchainService.addVoteToBlockchain(vote)
      console.log("Vote added to blockchain:", blockchainResult)
    } catch (error) {
      console.error("Error adding vote to blockchain:", error)
      // Continue even if blockchain fails
    }

    res.status(201).json({
      message: "Vote cast successfully",
      voteId: vote._id,
      voteHash,
    })
  } catch (error) {
    console.error("Error casting vote:", error)
    if (error.code === 11000) {
      // Duplicate key error
      res.status(400).json({ message: "You have already voted in this election" })
    } else {
      res.status(500).json({ message: "Server error", error: error.message })
    }
  }
}

// Get election results
exports.getElectionResults = async (req, res) => {
  try {
    const { id } = req.params

    // Check if election exists
    const election = await Election.findById(id)
    if (!election) {
      return res.status(404).json({ message: "Election not found" })
    }

    // Check if election has ended
    const now = new Date()
    if (now < election.endDate) {
      return res.status(400).json({ message: "Election results are not available until the election ends" })
    }

    // Get vote counts for each candidate
    const votes = await Vote.find({ election: id })

    // Count votes for each candidate
    const results = {}
    election.candidates.forEach((candidate) => {
      results[candidate._id] = {
        candidateId: candidate._id,
        name: candidate.name,
        party: candidate.party,
        voteCount: 0,
      }
    })

    votes.forEach((vote) => {
      if (results[vote.candidate]) {
        results[vote.candidate].voteCount++
      }
    })

    // Convert to array and sort by vote count
    const sortedResults = Object.values(results).sort((a, b) => b.voteCount - a.voteCount)

    // Verify blockchain integrity
    let blockchainVerified = false
    try {
      const blockchain = await blockchainService.getBlockchainStatus()
      blockchainVerified = blockchain.isValid
    } catch (error) {
      console.error("Error verifying blockchain:", error)
    }

    res.json({
      electionId: id,
      title: election.title,
      totalVotes: votes.length,
      results: sortedResults,
      blockchainVerified,
    })
  } catch (error) {
    console.error("Error getting election results:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Verify a vote
exports.verifyVote = async (req, res) => {
  try {
    const voteId = req.params.id

    // Find the vote
    const vote = await Vote.findById(voteId)
    if (!vote) {
      return res.status(404).json({ message: "Vote not found" })
    }

    // Verify if the vote belongs to the user
    if (vote.voter.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized to verify this vote" })
    }

    // Find the election
    const election = await Election.findById(vote.election)
    if (!election) {
      return res.status(404).json({ message: "Election not found" })
    }

    // Find the candidate
    const candidate = election.candidates.find((c) => c._id.toString() === vote.candidate.toString())
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" })
    }

    // Verify if the vote is in the blockchain
    let blockchainVerification = {
      inBlockchain: false,
      blockHash: null,
      blockIndex: null,
    }

    try {
      if (vote.blockHash) {
        blockchainVerification = {
          inBlockchain: true,
          blockHash: vote.blockHash,
          blockIndex: vote.blockIndex,
        }
      } else {
        // Verify if the vote is pending inclusion
        const verificationResult = await blockchainService.verifyVote(vote)
        if (verificationResult.verified) {
          blockchainVerification = {
            inBlockchain: true,
            blockHash: verificationResult.blockHash,
            blockIndex: verificationResult.blockIndex,
          }

          // Update the vote with block information
          vote.blockHash = verificationResult.blockHash
          vote.blockIndex = verificationResult.blockIndex
          await vote.save()
        } else if (verificationResult.message && verificationResult.message.includes("attente")) {
          blockchainVerification = {
            inBlockchain: false,
            message: "Vote en attente d'inclusion dans la blockchain",
          }
        }
      }
    } catch (error) {
      console.error("Error verifying blockchain:", error)
      blockchainVerification.error = "Erreur lors de la vérification blockchain"
    }

    res.json({
      vote: {
        _id: vote._id,
        election: vote.election,
        voteHash: vote.voteHash,
        timestamp: vote.timestamp,
      },
      election: {
        title: election.title,
      },
      candidate: {
        name: candidate.name,
        party: candidate.party,
      },
      blockchain: blockchainVerification,
    })
  } catch (error) {
    console.error("Error verifying vote:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get user votes
exports.getUserVotes = async (req, res) => {
  try {
    const userId = req.user._id

    // Find all votes by this user
    const votes = await Vote.find({ voter: userId }).populate("election", "title startDate endDate")

    res.json(votes)
  } catch (error) {
    console.error("Error getting user votes:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Obtenir l'état de la blockchain
exports.getBlockchainStatus = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" })
    }

    const status = await blockchainService.getBlockchainStatus()

    // If an error is returned in the status object, send an appropriate error response
    if (status.error) {
      console.error("Blockchain error:", status.error)
      return res.status(500).json({
        message: "Error retrieving blockchain status",
        error: status.error,
      })
    }

    res.json(status)
  } catch (error) {
    console.error("Error getting blockchain status:", error)
    res.status(500).json({
      message: "Error retrieving blockchain status",
      error: error.message,
    })
  }
}

// Ajouter cette méthode au contrôleur
exports.reinitializeBlockchain = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" })
    }

    // Delete existing blockchain
    const Blockchain = require("../models/Blockchain")
    await Blockchain.deleteMany({})

    // Reinitialize blockchain
    const blockchain = await blockchainService.initializeBlockchain()

    res.json({
      message: "Blockchain reinitialized successfully",
      chainLength: blockchain.chain ? blockchain.chain.length : 0,
    })
  } catch (error) {
    console.error("Error reinitializing blockchain:", error)
    res.status(500).json({
      message: "Error reinitializing blockchain",
      error: error.message,
    })
  }
}
