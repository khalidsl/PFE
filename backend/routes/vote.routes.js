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

// Routes protégées
router.post("/", authenticateJWT, voteValidation, voteController.castVote)
router.get("/results/:id", voteController.getElectionResults)
router.get("/verify/:id", authenticateJWT, voteController.verifyVote)
router.get("/user", authenticateJWT, voteController.getUserVotes)

// Routes blockchain (admin seulement)
router.get("/blockchain/status", authenticateJWT, voteController.getBlockchainStatus)
router.post("/blockchain/reinitialize", authenticateJWT, isAdmin, voteController.reinitializeBlockchain)

module.exports = router
