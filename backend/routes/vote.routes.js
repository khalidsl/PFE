const express = require("express")
const router = express.Router()
const { body } = require("express-validator")
const { authenticateJWT, isAdmin } = require("../middleware/auth.middleware")

// Import the vote controller
const voteController = require("../controllers/vote.controller")

// Validation for the vote
const voteValidation = [
  body("electionId").notEmpty().withMessage("ID d'élection requis"),
  body("candidateId").notEmpty().withMessage("ID de candidat requis"),
]

// Routes for admin dashboard - Assurez-vous que ces routes sont correctement configurées
router.get("/recent", authenticateJWT, isAdmin, voteController.getRecentVotes) // Route pour les votes récents
router.get("/dashboard/stats", authenticateJWT, isAdmin, voteController.getDashboardStats) // Stats du tableau de bord

// Routes protégées
router.post("/", authenticateJWT, voteValidation, voteController.castVote)
// Correction de la ligne 17 - Assurez-vous que le contrôleur existe
router.get(
  "/results/:id",
  voteController.getElectionResults ||
    ((req, res) => {
      res.status(501).json({ message: "Fonctionnalité non implémentée" })
    }),
)
router.get(
  "/verify/:id",
  authenticateJWT,
  voteController.verifyVote ||
    ((req, res) => {
      res.status(501).json({ message: "Fonctionnalité non implémentée" })
    }),
)
router.get(
  "/user",
  authenticateJWT,
  voteController.getUserVotes ||
    ((req, res) => {
      res.status(501).json({ message: "Fonctionnalité non implémentée" })
    }),
)

// Routes blockchain (admin seulement)
router.get(
  "/blockchain/status",
  authenticateJWT,
  voteController.getBlockchainStatus ||
    ((req, res) => {
      res.status(501).json({ message: "Fonctionnalité non implémentée" })
    }),
)
router.post(
  "/blockchain/reinitialize",
  authenticateJWT,
  isAdmin,
  voteController.reinitializeBlockchain ||
    ((req, res) => {
      res.status(501).json({ message: "Fonctionnalité non implémentée" })
    }),
)

module.exports = router
