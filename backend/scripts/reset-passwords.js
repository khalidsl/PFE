const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("dotenv").config()

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
    return conn
  } catch (error) {
    console.error(`Erreur: ${error.message}`)
    process.exit(1)
  }
}

// Fonction pour hacher un mot de passe
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}

// Fonction principale
const resetPasswords = async () => {
  try {
    await connectDB()

    // Récupérer le modèle User
    const User = mongoose.model(
      "User",
      new mongoose.Schema({
        name: String,
        email: String,
        password: String,
        nationalId: String,
        role: String,
        hasVoted: Map,
        isActive: Boolean,
        createdAt: Date,
      }),
    )

    // Hacher le mot de passe
    const hashedPassword = await hashPassword("password123")

    // Mettre à jour tous les utilisateurs
    const result = await User.updateMany({}, { $set: { password: hashedPassword } })

    console.log(`${result.modifiedCount} utilisateurs mis à jour`)

    // Afficher les utilisateurs
    const users = await User.find({}, { name: 1, email: 1 })
    console.log("Utilisateurs disponibles:")
    users.forEach((user) => {
      console.log(`- ${user.name} (${user.email})`)
    })

    process.exit(0)
  } catch (error) {
    console.error("Erreur:", error)
    process.exit(1)
  }
}

// Exécuter la fonction
resetPasswords()
