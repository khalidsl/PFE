const express = require("express");
const router = express.Router();
const { authenticateJWT, isAdmin } = require("../middleware/auth.middleware");
const voteController = require("../controllers/vote.controller");

// Route pour récupérer les statistiques du tableau de bord
router.get("/stats", authenticateJWT, isAdmin, voteController.getDashboardStats);

// Autres routes liées au tableau de bord peuvent être ajoutées ici

module.exports = router;