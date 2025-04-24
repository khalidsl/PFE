const express = require("express")
const router = express.Router()

// Route simple pour vérifier que l'API fonctionne
router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  })
})

// Route pour vérifier la connexion à la base de données
router.get("/db", async (req, res) => {
  try {
    // Vérifier si mongoose est connecté
    const mongoose = require("mongoose")
    const isConnected = mongoose.connection.readyState === 1

    res.status(200).json({
      status: isConnected ? "ok" : "error",
      message: isConnected ? "Database connection is active" : "Database connection is not active",
      dbHost: process.env.DB_HOST,
      dbName: process.env.DB_NAME,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error checking database connection",
      error: error.message,
    })
  }
})

// Route pour vérifier l'état du système
router.get("/system", (req, res) => {
  const os = require("os")

  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    hostname: os.hostname(),
    platform: os.platform(),
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      usage: (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(2) + "%",
    },
    cpus: os.cpus().length,
    timestamp: new Date().toISOString(),
  })
})

module.exports = router
