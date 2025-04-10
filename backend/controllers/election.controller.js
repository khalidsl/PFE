const Election = require("../models/Election")
const Vote = require("../models/Vote")
const { validationResult } = require("express-validator")

// Créer une nouvelle élection
exports.createElection = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { title, description, startDate, endDate, isActive, candidates } = req.body

    // Créer une nouvelle élection
    const election = await Election.create({
      title,
      description,
      startDate,
      endDate,
      isActive,
      candidates,
      createdBy: req.user._id,
    })

    res.status(201).json(election)
  } catch (error) {
    console.error("Erreur de création d'élection:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
}

// Obtenir toutes les élections
exports.getElections = async (req, res) => {
  try {
    const elections = await Election.find({}).sort({ createdAt: -1 })

    res.json(elections)
  } catch (error) {
    console.error("Erreur de récupération des élections:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
}

// Obtenir une élection par ID
exports.getElectionById = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id)

    if (election) {
      res.json(election)
    } else {
      res.status(404).json({ message: "Élection non trouvée" })
    }
  } catch (error) {
    console.error("Erreur de récupération de l'élection:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
}

// Mettre à jour une élection
exports.updateElection = async (req, res) => {
  try {
    const { title, description, startDate, endDate, isActive, candidates } = req.body

    const election = await Election.findById(req.params.id)

    if (!election) {
      return res.status(404).json({ message: "Élection non trouvée" })
    }

    // Vérifier si l'élection est terminée
    const now = new Date()
    if (new Date(election.endDate) < now) {
      return res.status(400).json({ message: "Impossible de modifier une élection terminée" })
    }

    // Mettre à jour l'élection
    election.title = title || election.title
    election.description = description || election.description
    election.startDate = startDate || election.startDate
    election.endDate = endDate || election.endDate
    election.isActive = isActive !== undefined ? isActive : election.isActive

    if (candidates) {
      election.candidates = candidates
    }

    const updatedElection = await election.save()
    res.json(updatedElection)
  } catch (error) {
    console.error("Erreur de mise à jour de l'élection:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
}

// Supprimer une élection
exports.deleteElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id)

    if (!election) {
      return res.status(404).json({ message: "Élection non trouvée" })
    }

    // Vérifier si des votes ont été enregistrés
    const votes = await Vote.find({ election: req.params.id })
    if (votes.length > 0) {
      return res.status(400).json({
        message: "Impossible de supprimer une élection avec des votes enregistrés",
      })
    }

    await election.remove()
    res.json({ message: "Élection supprimée" })
  } catch (error) {
    console.error("Erreur de suppression de l'élection:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
}

