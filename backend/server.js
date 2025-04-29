const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const morgan = require("morgan")
const path = require("path")
require("dotenv").config()

// Définir le mode d'environnement (development par défaut)
process.env.NODE_ENV = process.env.NODE_ENV || "development"
console.log(`Mode d'environnement: ${process.env.NODE_ENV}`)

// Import des routes
const authRoutes = require("./routes/auth.routes")
const electionRoutes = require("./routes/election.routes")
const voteRoutes = require("./routes/vote.routes")
const healthRoutes = require("./routes/health.routes")
const dashboardRoutes = require("./routes/dashboard.routes") // Nouvelle route pour le tableau de bord

// Initialisation de l'application Express
const app = express()

// Configuration des middlewares
app.use(express.json())
app.use(cookieParser())
app.use(morgan("dev"))

// Configuration CORS améliorée - accepter toutes les origines en développement
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000", // Spécifier l'origine exacte au lieu du wildcard
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}

// Appliquer CORS avant les routes
app.use(cors(corsOptions))

// Log des requêtes entrantes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, "public")))

// Routes API
app.use("/api/auth", authRoutes)
app.use("/api/elections", electionRoutes)
app.use("/api/votes", voteRoutes)
app.use("/api/health", healthRoutes)
app.use("/api/dashboard", dashboardRoutes) // Route pour le dashboard administrateur

// Route de test pour vérifier que l'API fonctionne
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
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
    const mongoURI = `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?authSource=admin`
    console.log(
      `Tentative de connexion à MongoDB: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    )

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log(`MongoDB connecté: ${conn.connection.host}`)

    // Initialiser la blockchain après la connexion à MongoDB
    try {
      const blockchainService = require("./services/blockchain.service")
      await blockchainService.initializeBlockchain()
      console.log("Blockchain initialisée avec succès")
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la blockchain:", error)
      console.log("L'application continuera à fonctionner sans la blockchain")
    }

    return conn
  } catch (error) {
    console.error(`Erreur de connexion à MongoDB: ${error.message}`)
    console.log("L'application continuera sans connexion à la base de données")
    // Ne pas quitter le processus pour permettre au serveur de démarrer même sans DB
    // process.exit(1)
  }
}

// Démarrage du serveur
const startServer = async () => {
  try {
    // Tenter de se connecter à MongoDB, mais continuer même en cas d'échec
    await connectDB().catch((err) => {
      console.error("Impossible de se connecter à MongoDB, mais le serveur continuera:", err.message)
    })

    const PORT = process.env.PORT || 5000
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Serveur démarré sur le port ${PORT}`)
      console.log(`API accessible à http://localhost:${PORT}/api/health`)
    })

    // Gestion des erreurs du serveur
    server.on("error", (error) => {
      console.error("Erreur du serveur:", error)
    })

    // Planifier le minage des blocs toutes les 60 secondes
    try {
      const blockchainService = require("./services/blockchain.service")
      setInterval(
        async () => {
          try {
            console.log("Tentative de minage des votes en attente...")
            const newBlock = await blockchainService.mineVotes()
            if (newBlock) {
              console.log(`Nouveau bloc miné: ${newBlock.hash}`)

              // Mettre à jour les votes avec les informations du bloc
              const Vote = require("./models/Vote")
              await Vote.updateMany(
                { blockHash: { $exists: false } },
                {
                  blockHash: newBlock.hash,
                  blockIndex: newBlock.index,
                },
              )
            } else {
              console.log("Aucun nouveau bloc miné (pas de votes en attente)")
            }
          } catch (error) {
            console.error("Erreur lors du minage planifié:", error)
          }
        },
        60 * 1000, // 60 secondes
      )
    } catch (error) {
      console.error("Erreur lors de l'initialisation du service de minage:", error)
    }
  } catch (error) {
    console.error("Erreur lors du démarrage du serveur:", error)
  }
}

// Démarrer le serveur
startServer()

module.exports = app
