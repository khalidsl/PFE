const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const morgan = require("morgan")
const path = require("path")
const blockchainService = require("./services/blockchain.service")
require("dotenv").config()

// Import des routes
const authRoutes = require("./routes/auth.routes")
const electionRoutes = require("./routes/election.routes")
const voteRoutes = require("./routes/vote.routes")

// Initialisation de l'application Express
const app = express()

// Configuration des middlewares
app.use(express.json())
app.use(cookieParser())
app.use(morgan("dev"))
app.use(
  cors({
    origin:"http://localhost:3000",
    credentials: true,
  }),
)

// Routes API
app.use("/api/auth", authRoutes)
app.use("/api/elections", electionRoutes)
app.use("/api/votes", voteRoutes)

// Route de test pour vérifier que l'API fonctionne
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "API is running" })
})

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    message: err.message || "Une erreur est survenue sur le serveur",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  })
})

// Connexion à MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?authSource=admin`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    )
    console.log(`MongoDB connecté: ${conn.connection.host}`)

    // Initialiser la blockchain après la connexion à MongoDB
    await blockchainService.initializeBlockchain()

    return conn
  } catch (error) {
    console.log("Erreur de connexion à MongoDB:", error.message)
    console.error(`Erreur: ${error.message}`)
    process.exit(1)
  }
}

// Démarrage du serveur
connectDB().then(() => {
  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`)
  })
})

// Planifier le minage des blocs toutes les 5 minutes
setInterval(
  async () => {
    try {
      const newBlock = await blockchainService.mineVotes()
      if (newBlock) {
        console.log(`Nouveau bloc miné: ${newBlock.hash}`)

        // Mettre à jour les votes avec les informations du bloc
        const Vote = require("./models/Vote")
        await Vote.updateMany(
          { blockHash: { $exists: false } },
          {
            blockHash: newBlock.hash,
            blockIndex: blockchainService.getFullBlockchain().length - 1,
          },
        )
      }
    } catch (error) {
      console.error("Erreur lors du minage planifié:", error)
    }
  },
  5 * 60 * 1000,
) // 5 minutes

module.exports = app
