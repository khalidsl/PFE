const Vote = require("../models/Vote")
const Election = require("../models/Election")
const User = require("../models/User")
const blockchainService = require("../services/blockchain.service")
const emailService = require("../services/email.service")
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
    const candidate = election.candidates.find((c) => c._id.toString() === candidateId)
    if (!candidate) {
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

    // Send vote confirmation email
    try {
      await emailService.sendVoteConfirmationEmail(user, election.title, candidate.name)
      console.log(`Vote confirmation email sent to ${user.email}`)
    } catch (emailError) {
      console.error("Error sending vote confirmation email:", emailError)
      // Continue even if email fails
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

    res.json({
      electionId: id,
      title: election.title,
      totalVotes: votes.length,
      results: sortedResults,
    })
  } catch (error) {
    console.error("Error getting election results:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Verify a vote
exports.verifyVote = async (req, res) => {
  try {
    const { id } = req.params

    // Find the vote
    const vote = await Vote.findById(id)
    if (!vote) {
      return res.status(404).json({ message: "Vote not found" })
    }

    // Check if the vote belongs to the user
    if (vote.voter.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized to verify this vote" })
    }

    // Verify the vote in the blockchain
    let blockchainVerification = null
    try {
      blockchainVerification = await blockchainService.verifyVote(vote)
    } catch (error) {
      console.error("Error verifying vote in blockchain:", error)
      // Continue even if blockchain verification fails
    }

    res.json({
      verified: true,
      vote: {
        electionId: vote.election,
        candidateId: vote.candidate,
        timestamp: vote.timestamp,
        voteHash: vote.voteHash,
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
    const votes = await Vote.find({ voter: userId }).populate("election")

    // Format the response
    const formattedVotes = await Promise.all(
      votes.map(async (vote) => {
        const election = await Election.findById(vote.election)
        const candidate = election.candidates.find((c) => c._id.toString() === vote.candidate.toString())

        return {
          voteId: vote._id,
          electionId: vote.election,
          electionTitle: election.title,
          candidateId: vote.candidate,
          candidateName: candidate ? candidate.name : "Unknown",
          timestamp: vote.timestamp,
          voteHash: vote.voteHash,
        }
      }),
    )

    res.json(formattedVotes)
  } catch (error) {
    console.error("Error getting user votes:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get blockchain status
exports.getBlockchainStatus = async (req, res) => {
  try {
    const status = await blockchainService.getBlockchainStatus()
    res.json(status)
  } catch (error) {
    console.error("Error getting blockchain status:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Reinitialize blockchain
exports.reinitializeBlockchain = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" })
    }

    await blockchainService.initializeBlockchain()
    res.json({ message: "Blockchain reinitialized successfully" })
  } catch (error) {
    console.error("Error reinitializing blockchain:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get recent votes (for admin dashboard)
exports.getRecentVotes = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Non autorisé" });
    }

    // Récupérer les 10 votes les plus récents avec leurs informations associées
    const votes = await Vote.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate("voter", "name email")
      .lean();

    // Enrichir les votes avec des informations supplémentaires
    const enrichedVotes = await Promise.all(
      votes.map(async (vote) => {
        try {
          const election = await Election.findById(vote.election);
          const candidate = election?.candidates.find(c => c._id.toString() === vote.candidate.toString());
          
          // Créer un avatar basé sur les initiales du nom de l'électeur
          const voterName = vote.voter?.name || "Anonymous User";
          const initials = voterName
            .split(' ')
            .map(name => name[0])
            .join('')
            .toUpperCase();
          
          return {
            _id: vote._id,
            electionId: vote.election,
            electionTitle: election ? election.title : "Élection inconnue",
            candidateId: vote.candidate,
            candidateName: candidate ? candidate.name : "Candidat inconnu",
            voterName: voterName,
            voterAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(voterName)}&background=random`,
            timestamp: vote.timestamp,
          };
        } catch (mapError) {
          console.error("Erreur lors du traitement d'un vote:", mapError);
          // Retourner une version simplifiée en cas d'erreur
          return {
            _id: vote._id,
            electionId: vote.election,
            electionTitle: "Élection inconnue",
            candidateId: vote.candidate,
            candidateName: "Candidat inconnu",
            voterName: "Utilisateur inconnu",
            voterAvatar: `https://ui-avatars.com/api/?name=?&background=random`,
            timestamp: vote.timestamp,
          };
        }
      })
    );

    res.json(enrichedVotes);
  } catch (error) {
    console.error("Erreur lors de la récupération des votes récents:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Non autorisé" });
    }

    // Date actuelle
    const now = new Date();
    
    // Récupérer toutes les élections
    const elections = await Election.find();
    
    // Compter le nombre de votes total
    const totalVotes = await Vote.countDocuments();
    
    // Compter le nombre d'électeurs uniques (utilisateurs qui ont voté)
    // Correction: hasVoted est un Map, pas un tableau, donc $size ne fonctionne pas
    const totalVoters = await User.countDocuments({ "hasVoted": { $exists: true, $ne: {} } });
    
    try {
      // Déterminer les élections actives et terminées
      const activeElections = elections.filter(e => 
        new Date(e.startDate) <= now && 
        new Date(e.endDate) >= now && 
        e.isActive
      ).length;
      
      const completedElections = elections.filter(e => 
        new Date(e.endDate) < now
      ).length;
      
      // Statistiques à renvoyer
      const stats = {
        totalVotes,
        totalVoters,
        activeElections,
        completedElections
      };
      
      res.json(stats);
    } catch (innerError) {
      console.error("Erreur lors du calcul des statistiques:", innerError);
      
      // Envoyer des statistiques de base en cas d'erreur de calcul
      res.json({
        totalVotes: totalVotes || 0,
        totalVoters: totalVoters || 0,
        activeElections: 0,
        completedElections: 0
      });
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques du tableau de bord:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
