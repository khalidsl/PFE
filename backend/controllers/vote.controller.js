const Vote = require("../models/Vote")
const Election = require("../models/Election")
const User = require("../models/User")
const { validationResult } = require("express-validator")
const blockchainService = require("../services/blockchain.service")

// Supprimez cette ligne qui cause l'erreur
// const blockchain = new Blockchain() // Instantiate Blockchain

// Enregistrer un vote
exports.castVote = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { electionId, candidateId } = req.body
    const userId = req.user._id

    // Vérifier si l'élection existe
    const election = await Election.findById(electionId)
    if (!election) {
      return res.status(404).json({ message: "Élection non trouvée" })
    }

    // Vérifier si l'élection est active
    const now = new Date()
    if (!election.isActive || now < new Date(election.startDate) || now > new Date(election.endDate)) {
      return res.status(400).json({ message: "L'élection n'est pas active" })
    }

    // Vérifier si le candidat existe
    const candidateExists = election.candidates.some((c) => c._id.toString() === candidateId)
    if (!candidateExists) {
      return res.status(404).json({ message: "Candidat non trouvé" })
    }

    // Vérifier si l'utilisateur a déjà voté pour cette élection
    const user = await User.findById(userId)
    if (user.hasVoted && user.hasVoted.get(electionId)) {
      return res.status(400).json({ message: "Vous avez déjà voté pour cette élection" })
    }

    // Générer un hash de vote
    const voteHash = Vote.generateVoteHash(electionId, candidateId, userId, process.env.ENCRYPTION_KEY)

    // Ajouter le vote à la blockchain
    try {
      await blockchainService.addVoteToBlockchain(electionId.toString(), candidateId.toString(), userId.toString())

      console.log("Vote ajouté à la blockchain")
    } catch (blockchainError) {
      console.error("Erreur d'ajout à la blockchain:", blockchainError)
      return res.status(400).json({ message: blockchainError.message })
    }

    // Créer le vote dans la base de données
    const vote = await Vote.create({
      election: electionId,
      candidate: candidateId,
      voter: userId,
      voteHash,
    })

    // Mettre à jour le statut de vote de l'utilisateur
    user.hasVoted.set(electionId, true)
    await user.save()

    // Miner les votes si nécessaire (dans un système réel, cela serait fait par un processus séparé)
    if (Math.random() < 0.2) {
      // 20% de chance de miner un bloc après un vote
      const newBlock = await blockchainService.mineVotes()
      if (newBlock) {
        // Mettre à jour les votes avec les informations du bloc
        await Vote.updateMany(
          { blockHash: { $exists: false } },
          {
            blockHash: newBlock.hash,
            blockIndex: blockchainService.getFullBlockchain().length - 1,
          },
        )
      }
    }

    res.status(201).json({
      _id: vote._id,
      election: vote.election,
      voteHash: vote.voteHash,
      timestamp: vote.timestamp,
      message: "Vote enregistré avec succès et ajouté à la blockchain",
    })
  } catch (error) {
    console.error("Erreur d'enregistrement de vote:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
}

// Obtenir les résultats d'une élection
exports.getElectionResults = async (req, res) => {
  try {
    const electionId = req.params.id

    // Vérifier si l'élection existe
    const election = await Election.findById(electionId)
    if (!election) {
      return res.status(404).json({ message: "Élection non trouvée" })
    }

    // Vérifier si l'élection est terminée (sauf pour les admins)
    const now = new Date()
    if (new Date(election.endDate) > now && req.user.role !== "admin") {
      return res.status(400).json({
        message: "Les résultats ne sont disponibles qu'après la fin de l'élection",
      })
    }

    // Compter les votes pour chaque candidat
    const votes = await Vote.find({ election: electionId })

    // Créer un objet pour stocker les résultats
    const results = []
    const totalVotes = votes.length

    // Compter les votes pour chaque candidat
    for (const candidate of election.candidates) {
      const candidateVotes = votes.filter((v) => v.candidate.toString() === candidate._id.toString())
      results.push({
        candidateId: candidate._id,
        name: candidate.name,
        party: candidate.party,
        voteCount: candidateVotes.length,
      })
    }

    // Trier les résultats par nombre de votes (décroissant)
    results.sort((a, b) => b.voteCount - a.voteCount)

    // Vérifier l'intégrité de la blockchain
    const isBlockchainValid = blockchainService.verifyBlockchain()

    res.json({
      electionId,
      title: election.title,
      totalVotes,
      results,
      blockchainVerified: isBlockchainValid,
    })
  } catch (error) {
    console.error("Erreur de récupération des résultats:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
}

// Vérifier un vote
exports.verifyVote = async (req, res) => {
  try {
    const voteId = req.params.id

    // Trouver le vote
    const vote = await Vote.findById(voteId)
    if (!vote) {
      return res.status(404).json({ message: "Vote non trouvé" })
    }

    // Vérifier si l'utilisateur est le propriétaire du vote ou un admin
    if (vote.voter.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Non autorisé" })
    }

    // Trouver l'élection
    const election = await Election.findById(vote.election)
    if (!election) {
      return res.status(404).json({ message: "Élection non trouvée" })
    }

    // Trouver le candidat
    const candidate = election.candidates.find((c) => c._id.toString() === vote.candidate.toString())
    if (!candidate) {
      return res.status(404).json({ message: "Candidat non trouvé" })
    }

    // Vérifier si le vote est dans la blockchain
    let blockchainVerification = {
      inBlockchain: false,
      blockHash: null,
      blockIndex: null,
    }

    if (vote.blockHash) {
      blockchainVerification = {
        inBlockchain: true,
        blockHash: vote.blockHash,
        blockIndex: vote.blockIndex,
      }
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
    console.error("Erreur de vérification de vote:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
}

// Obtenir les votes de l'utilisateur
exports.getUserVotes = async (req, res) => {
  try {
    const userId = req.user._id

    // Trouver tous les votes de l'utilisateur
    const votes = await Vote.find({ voter: userId }).sort({ timestamp: -1 })

    // Récupérer les détails des élections et des candidats
    const votesWithDetails = await Promise.all(
      votes.map(async (vote) => {
        const election = await Election.findById(vote.election)
        if (!election) {
          return null
        }

        const candidate = election.candidates.find((c) => c._id.toString() === vote.candidate.toString())
        if (!candidate) {
          return null
        }

        return {
          _id: vote._id,
          election: {
            _id: election._id,
            title: election.title,
          },
          candidate: {
            name: candidate.name,
            party: candidate.party,
          },
          voteHash: vote.voteHash,
          blockHash: vote.blockHash,
          timestamp: vote.timestamp,
        }
      }),
    )

    // Filtrer les votes nuls (élections ou candidats supprimés)
    const validVotes = votesWithDetails.filter((vote) => vote !== null)

    res.json(validVotes)
  } catch (error) {
    console.error("Erreur de récupération des votes:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
}

// Obtenir l'état de la blockchain
exports.getBlockchainStatus = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Non autorisé" })
    }

    const chain = blockchainService.getFullBlockchain()
    const isValid = blockchainService.verifyBlockchain()

    res.json({
      chainLength: chain.length,
      isValid,
      latestBlock:
        chain.length > 0
          ? {
              hash: chain[chain.length - 1].hash,
              timestamp: chain[chain.length - 1].timestamp,
              voteCount: chain[chain.length - 1].votes.length,
            }
          : null,
      pendingVotes: blockchainService.getPendingVotesCount(),
    })
  } catch (error) {
    console.error("Erreur de récupération de l'état de la blockchain:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
}

