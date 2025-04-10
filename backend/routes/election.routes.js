const express = require("express")
const router = express.Router()
const { body } = require("express-validator")
const electionController = require("../controllers/election.controller")
const { authenticateJWT, isAdmin } = require("../middleware/auth.middleware")

// Validation pour la création d'élection
const electionValidation = [
  body("title").notEmpty().withMessage("Le titre est requis"),
  body("description").notEmpty().withMessage("La description est requise"),
  body("startDate").isISO8601().withMessage("Date de début invalide"),
  body("endDate").isISO8601().withMessage("Date de fin invalide"),
  body("candidates").isArray({ min: 1 }).withMessage("Au moins un candidat est requis"),
]

// Routes publiques
router.get("/", electionController.getElections)
router.get("/:id", electionController.getElectionById)

// Routes admin
router.post("/", authenticateJWT, isAdmin, electionValidation, electionController.createElection)
router.put("/:id", authenticateJWT, isAdmin, electionController.updateElection)
router.delete("/:id", authenticateJWT, isAdmin, electionController.deleteElection)

module.exports = router

