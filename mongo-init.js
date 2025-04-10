// Script d'initialisation MongoDB
var db = db.getSiblingDB("evoting_system")

// Créer les collections
db.createCollection("users")
db.createCollection("elections")
db.createCollection("votes")

// Créer un utilisateur administrateur
db.users.insertOne({
  name: "Admin",
  email: "admin@example.com",
  nationalId: "ADMIN123",
  password: "$2a$10$X7VYoYPHhRCc8XgMxQ9fT.IW5.6HSC.f.tNWMPtb9mfVaRcwQfnSq", // password123
  role: "admin",
  hasVoted: {},
  isActive: true,
  createdAt: new Date(),
})

// Créer quelques utilisateurs de test
db.users.insertMany([
  {
    name: "John Doe",
    email: "john@example.com",
    nationalId: "JD123456",
    password: "$2a$10$X7VYoYPHhRCc8XgMxQ9fT.IW5.6HSC.f.tNWMPtb9mfVaRcwQfnSq", // password123
    role: "voter",
    hasVoted: {},
    isActive: true,
    createdAt: new Date(),
  },
  {
    name: "Jane Smith",
    email: "jane@example.com",
    nationalId: "JS789012",
    password: "$2a$10$X7VYoYPHhRCc8XgMxQ9fT.IW5.6HSC.f.tNWMPtb9mfVaRcwQfnSq", // password123
    role: "voter",
    hasVoted: {},
    isActive: true,
    createdAt: new Date(),
  },
])

// Récupérer l'ID de l'administrateur
const adminId = db.users.findOne({ email: "admin@example.com" })._id

// Créer quelques élections de test
db.elections.insertMany([
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
    createdBy: adminId,
    createdAt: new Date(),
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
    createdBy: adminId,
    createdAt: new Date(),
  },
])

print("Initialisation de la base de données terminée")

