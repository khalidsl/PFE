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
  // {
  //   name: "John Doe",
  //   email: "john@example.com",
  //   nationalId: "JD123456",
  //   password: "password123",
  //   role: "voter",
  // },
  // {
  //   name: "Jane Smith",
  //   email: "jane@example.com",
  //   nationalId: "JS789012",
  //   password: "password123",
  //   role: "voter",
  // },
]

const elections = [
  {
    title: "Élection présidentielle 2023",
    description: "Élection présidentielle nationale pour la période 2023-2027",
    startDate: new Date("2023-05-01"),
    endDate: new Date("2023-05-15"),
    isActive: true,
    candidates: [
      {
        name: "Alexandre Dupont",
        party: "Parti Progressiste",
        bio: "Ancien ministre de l'économie avec 15 ans d'expérience politique",
        imageUrl: "https://randomuser.me/api/portraits/men/1.jpg",
      },
      {
        name: "Marie Laurent",
        party: "Alliance Démocratique",
        bio: "Avocate spécialisée en droits humains et ancienne sénatrice",
        imageUrl: "https://randomuser.me/api/portraits/women/2.jpg",
      },
      {
        name: "Thomas Moreau",
        party: "Union Nationale",
        bio: "Entrepreneur et philanthrope engagé dans le développement durable",
        imageUrl: "https://randomuser.me/api/portraits/men/3.jpg",
      },
    ],
  },
  {
    title: "Référendum sur la réforme constitutionnelle",
    description: "Vote sur la proposition de réforme de la constitution nationale",
    startDate: new Date("2023-06-01"),
    endDate: new Date("2023-06-10"),
    isActive: false,
    candidates: [
      {
        name: "Pour",
        party: "Soutien à la réforme",
        bio: "Voter pour approuver les changements proposés à la constitution",
      },
      {
        name: "Contre",
        party: "Opposition à la réforme",
        bio: "Voter contre les changements proposés à la constitution",
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

