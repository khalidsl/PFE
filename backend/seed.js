const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const User = require("./models/User")
const Election = require("./models/Election")
const Vote = require("./models/Vote")
require("dotenv").config()

// Fonction pour se connecter à MongoDB
const connectDB = async () => {
  try {
    console.log("Tentative de connexion à MongoDB...")
    
    // URL de connexion adaptée pour Docker
    const mongoURL = `mongodb://${process.env.DB_USER || 'evoting_user'}:${process.env.DB_PASSWORD || 'evoting_password'}@${process.env.DB_HOST || 'mongodb'}:${process.env.DB_PORT || '27017'}/${process.env.DB_NAME || 'evoting_db'}?authSource=admin`;
    
    console.log(`URL de connexion: ${mongoURL.replace(/:[^:]*@/, ':****@')}`);
    
    const conn = await mongoose.connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    
    console.log(`MongoDB connecté: ${conn.connection.host}`)
    return conn
  } catch (error) {
    console.error(`Erreur de connexion: ${error.message}`)
    console.error("Stack trace:", error.stack)
    console.log("Vérifiez vos variables d'environnement et assurez-vous que MongoDB est en cours d'exécution")
    process.exit(1)
  }
}

// Données de seed - Utilisateurs
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

// Adapter les dates des élections pour avoir des élections terminées (pour les résultats)
const currentDate = new Date();
const oneMonthAgo = new Date(currentDate);
oneMonthAgo.setMonth(currentDate.getMonth() - 1);
const twoMonthsAgo = new Date(currentDate);
twoMonthsAgo.setMonth(currentDate.getMonth() - 2);
 
// Données de seed - Élections
const elections = [
  {
    title: "Élections législatives marocaines 2026",
    description: "Élections pour la Chambre des représentants du Maroc",
    startDate: currentDate,
    endDate: new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000), // une semaine après aujourd'hui
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
    startDate: twoMonthsAgo,
    endDate: oneMonthAgo,
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
    startDate: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 jours avant
    endDate: new Date(currentDate.getTime() - 23 * 24 * 60 * 60 * 1000), // 23 jours avant (donc déjà terminée)
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

// Fonction pour créer des votes simulés pour les élections terminées
const createSimulatedVotes = async (election, users) => {
  try {
    console.log(`Création de votes simulés pour l'élection: ${election.title}`);
    
    // Vérifier si l'élection est terminée
    const now = new Date();
    if (now <= new Date(election.endDate)) {
      console.log(`L'élection ${election.title} n'est pas encore terminée, pas de votes simulés`);
      return;
    }
    
    const voterUsers = users.filter(user => user.role === "voter");
    
    // Distribution aléatoire des votes entre les candidats
    for (const user of voterUsers) {
      const randomCandidateIndex = Math.floor(Math.random() * election.candidates.length);
      const randomCandidate = election.candidates[randomCandidateIndex];
      
      // Créer un vote avec une date aléatoire entre le début et la fin de l'élection
      const voteDate = new Date(
        new Date(election.startDate).getTime() + 
        Math.random() * (new Date(election.endDate).getTime() - new Date(election.startDate).getTime())
      );
      
      // Générer un hash pour le vote
      const voteHash = require('crypto')
        .createHash('sha256')
        .update(`${election._id}:${randomCandidate._id}:${user._id}:${voteDate.getTime()}:${process.env.ENCRYPTION_KEY || 'default_key'}`)
        .digest('hex');
      
      // Créer le vote
      const vote = await Vote.create({
        election: election._id,
        candidate: randomCandidate._id,
        voter: user._id,
        timestamp: voteDate,
        voteHash
      });
      
      console.log(`Vote créé: ID=${vote._id}`);
      
      // Mettre à jour le statut de vote de l'utilisateur
      if (!user.hasVoted) {
        user.hasVoted = new Map();
      }
      user.hasVoted.set(election._id.toString(), true);
      await user.save();
      
      console.log(`Vote enregistré pour ${user.name} dans l'élection "${election.title}"`);
    }
  } catch (error) {
    console.error(`Erreur lors de la création des votes simulés: ${error.message}`);
    console.error(error.stack);
  }
};

// Fonction pour importer les données
const importData = async () => {
  try {
    // Connexion à la base de données
    const conn = await connectDB()
    console.log("Connexion à la base de données réussie, début de l'importation des données...")

    // Supprimer les données existantes
    console.log("Suppression des données existantes...")
    await User.deleteMany({})
    console.log("Utilisateurs supprimés")
    await Election.deleteMany({})
    console.log("Élections supprimées")
    await Vote.deleteMany({})
    console.log("Votes supprimés")

    // Créer les utilisateurs
    console.log("Création des utilisateurs...")
    const createdUsers = []
    for (const user of users) {
      try {
        // Générer un sel pour le hachage du mot de passe
        const salt = await bcrypt.genSalt(10)
        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(user.password, salt)

        // Créer l'utilisateur avec le mot de passe haché
        const newUser = await User.create({
          ...user,
          password: hashedPassword,
          isEmailVerified: true, // IMPORTANT: Tous les utilisateurs sont vérifiés
        })

        createdUsers.push(newUser)
        console.log(`Utilisateur créé: ${newUser.name} (${newUser.email}) avec le mot de passe "${user.password}"`)
      } catch (userError) {
        console.error(`Erreur lors de la création de l'utilisateur ${user.email}:`, userError.message)
        console.error(userError.stack)
      }
    }

    // Vérifier que les utilisateurs ont été créés
    if (createdUsers.length === 0) {
      throw new Error("Aucun utilisateur n'a été créé. Vérifiez les logs pour plus de détails.")
    }

    // Trouver l'admin
    const adminUser = createdUsers.find((user) => user.role === "admin")
    if (!adminUser) {
      throw new Error("Aucun utilisateur admin n'a été créé")
    }
    console.log(`Admin trouvé: ${adminUser.name} (${adminUser.email})`)

    // Créer les élections
    console.log("Création des élections...")
    const createdElections = []
    for (const election of elections) {
      try {
        const newElection = await Election.create({
          ...election,
          createdBy: adminUser._id,
        })
        createdElections.push(newElection)
        console.log(`Élection créée: ${newElection.title} (${newElection._id})`)
      } catch (electionError) {
        console.error(`Erreur lors de la création de l'élection ${election.title}:`, electionError.message)
        console.error(electionError.stack)
      }
    }
    
    // Vérifier que les élections ont été créées
    if (createdElections.length === 0) {
      throw new Error("Aucune élection n'a été créée. Vérifiez les logs pour plus de détails.")
    }
    
    // Créer des votes simulés pour les élections terminées
    console.log("Création de votes simulés pour les élections terminées...")
    for (const election of createdElections) {
      try {
        if (new Date() > new Date(election.endDate)) {
          await createSimulatedVotes(election, createdUsers)
        }
      } catch (voteError) {
        console.error(`Erreur lors de la création de votes pour l'élection ${election.title}:`, voteError.message)
        console.error(voteError.stack)
      }
    }

    console.log("=============================================")
    console.log("DONNÉES IMPORTÉES AVEC SUCCÈS")
    console.log("=============================================")
    console.log("Utilisateurs créés:")
    for (const user of createdUsers) {
      console.log(`- ${user.name} (${user.email}), rôle: ${user.role}, mot de passe: password123`)
    }
    console.log("=============================================")
    console.log("Vous pouvez maintenant vous connecter avec ces identifiants.")
    
    // Se déconnecter proprement de MongoDB
    await mongoose.disconnect()
    console.log("Déconnexion de MongoDB")
    
    process.exit(0)
  } catch (error) {
    console.error(`Erreur lors de l'importation des données: ${error.message}`)
    console.error("Stack trace:", error.stack)
    process.exit(1)
  }
}

// Exécuter l'importation
console.log("Démarrage du processus d'importation des données...")
importData()

