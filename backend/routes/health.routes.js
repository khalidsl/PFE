const express = require("express")
const router = express.Router()

// Route simple pour vérifier que l'API fonctionne
router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API is running",
    timestamp: new Date().toISOString(),
  })
})

module.exports = router
