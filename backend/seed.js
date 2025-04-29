const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const User = require("./models/User")
const Election = require("./models/Election")
require("dotenv").config()

// Fonction pour se connecter à MongoDB
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
    console.log("Erreur de connexion à MongoDB hhhhh:")
    process.exit(1)
  }
}

// Données de seed
const users = [
  {
    name: "Admin User",
    email: "admin@example.com",
    nationalId: "ADMIN123",
    password: "password123",
    role: "admin",
  },
  {
    name: "test1",
    email: "test1@example.com",
    nationalId: "JD123456",
    password: "password123",
    role: "voter",
  },
  {
    name: "test2",
    email: "test2@example.com",
    nationalId: "JS789012",
    password: "password123",
    role: "voter",
  },
]
 
const elections = [
  {
    title: "Élections législatives marocaines 2026",
    description: "Élections pour la Chambre des représentants du Maroc",
    startDate: new Date("2026-09-01"),
    endDate: new Date("2026-09-08"),
    isActive: true,
    candidates: [
      {
        name: "Nabil Benabdellah",
        party: "PPS (Parti du Progrès et du Socialisme)",
        bio: "Secrétaire général du PPS, ancien ministre",
        imageUrl: "",
      },
      {
        name: "Aziz Akhannouch",
        party: "RNI (Rassemblement National des Indépendants)",
        bio: "Homme d'affaires et ancien ministre de l'Agriculture",
        imageUrl: "",
      },
      {
        name: "Abdelilah Benkirane",
        party: "PJD (Parti de la Justice et du Développement)",
        bio: "Ancien Premier ministre, figure politique majeure",
        imageUrl: "",
      },
    ],
  },
  {
    title: "Référendum sur la régionalisation avancée",
    description: "Vote sur le projet de régionalisation avancée au Maroc",
    startDate: new Date("2024-03-01"),
    endDate: new Date("2024-03-10"),
    isActive: false,
    candidates: [
      {
        name: "Pour",
        party: "Soutien au projet royal",
        bio: "Approbation de la réforme de régionalisation avancée",
      },
      {
        name: "Contre",
        party: "Opposition au projet",
        bio: "Rejet de la réforme proposée",
      },
    ],
  },
  {
    title: "Élections communales 2025",
    description: "Élections locales pour les conseils communaux au Maroc",
    startDate: new Date("2025-06-15"),
    endDate: new Date("2025-06-22"),
    isActive: false,
    candidates: [
      {
        name: "Fatima Zahra Mansouri",
        party: "PAM (Parti Authenticité et Modernité)",
        bio: "Maire de Marrakech, figure politique locale",
        imageUrl: "",
      },
      {
        name: "Omar El Bahraoui",
        party: "USFP (Union Socialiste des Forces Populaires)",
        bio: "Ancien député, spécialiste des questions locales",
        imageUrl: "",
      },
    ],
  },
]

// Fonction pour importer les données
const importData = async () => {
  try {
    // Connexion à la base de données
    const conn = await connectDB()

    // Supprimer les données existantes
    await User.deleteMany()
    await Election.deleteMany()

    // Créer les utilisateurs
    const createdUsers = []
    for (const user of users) {
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(user.password, salt)

      const newUser = await User.create({
        ...user,
        password: hashedPassword,
      })

      createdUsers.push(newUser)
    }

    // Trouver l'admin
    const adminUser = createdUsers.find((user) => user.role === "admin")

    // Créer les élections
    for (const election of elections) {
      await Election.create({
        ...election,
        createdBy: adminUser._id,
      })
    }

    console.log("Données importées avec succès")
    process.exit()
  } catch (error) {
    console.error(`Erreur: ${error.message}`)
    process.exit(1)
  }
}

// Exécuter l'importation
importData()

