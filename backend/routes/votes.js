import express from "express"
import crypto from "crypto"
import Vote from "../models/Vote.js"
import Election from "../models/Election.js"
import User from "../models/User.js"
import { protect } from "../middleware/auth.js"

const router = express.Router()

// Generate a hash for the vote
const generateVoteHash = (electionId, candidateId, voterId, timestamp) => {
  const data = `${electionId}:${candidateId}:${voterId}:${timestamp}:${process.env.ENCRYPTION_KEY}`
  return crypto.createHash("sha256").update(data).digest("hex")
}

// @route   POST /api/votes
// @desc    Cast a vote
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
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
    const voteHash = generateVoteHash(electionId, candidateId, voterId, timestamp)

    // Create the vote
    const vote = await Vote.create({
      election: electionId,
      candidate: candidateId,
      voter: voterId,
      timestamp,
      voteHash,
    })

    // Update user's voting status
    user.hasVoted.set(electionId.toString(), true)
    await user.save()

    res.status(201).json({
      message: "Vote cast successfully",
      voteId: vote._id,
      voteHash,
    })
  } catch (error) {
    console.error(error)
    if (error.code === 11000) {
      // Duplicate key error
      res.status(400).json({ message: "You have already voted in this election" })
    } else {
      res.status(500).json({ message: "Server error" })
    }
  }
})

// @route   GET /api/votes/results/:electionId
// @desc    Get election results
// @access  Public
router.get("/results/:electionId", async (req, res) => {
  try {
    const { electionId } = req.params

    // Check if election exists
    const election = await Election.findById(electionId)
    if (!election) {
      return res.status(404).json({ message: "Election not found" })
    }

    // Check if election has ended
    const now = new Date()
    if (now < election.endDate) {
      return res.status(400).json({ message: "Election results are not available until the election ends" })
    }

    // Get vote counts for each candidate
    const votes = await Vote.find({ election: electionId })

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

    res.json({
      electionId,
      title: election.title,
      totalVotes: votes.length,
      results: sortedResults,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/votes/verify/:voteId
// @desc    Verify a vote
// @access  Private
router.get("/verify/:voteId", protect, async (req, res) => {
  try {
    const { voteId } = req.params

    // Find the vote
    const vote = await Vote.findById(voteId)
    if (!vote) {
      return res.status(404).json({ message: "Vote not found" })
    }

    // Check if the vote belongs to the user
    if (vote.voter.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized to verify this vote" })
    }

    // Regenerate the hash to verify
    const regeneratedHash = generateVoteHash(
      vote.election.toString(),
      vote.candidate.toString(),
      vote.voter.toString(),
      vote.timestamp,
    )

    // Compare the hashes
    const isVerified = regeneratedHash === vote.voteHash

    res.json({
      verified: isVerified,
      vote: {
        electionId: vote.election,
        candidateId: vote.candidate,
        timestamp: vote.timestamp,
        voteHash: vote.voteHash,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router

