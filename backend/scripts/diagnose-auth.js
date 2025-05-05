/**
 * Script de diagnostic pour l'authentification
 * Ce script vérifie la connexion à la base de données et affiche les informations des utilisateurs
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

// Fonction pour se connecter à MongoDB
const connectDB = async () => {
  try {
    console.log("Tentative de connexion à MongoDB...");
    
    // URL de connexion adaptée pour Docker ou développement local
    const mongoURL = `mongodb://${process.env.DB_USER || 'evoting_user'}:${process.env.DB_PASSWORD || 'evoting_password'}@${process.env.DB_HOST || 'mongodb'}:${process.env.DB_PORT || '27017'}/${process.env.DB_NAME || 'evoting_db'}?authSource=admin`;
    
    console.log(`URL de connexion: ${mongoURL.replace(/:[^:]*@/, ':****@')}`);
    
    const conn = await mongoose.connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB connecté: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Erreur de connexion: ${error.message}`);
    console.error("Stack trace:", error.stack);
    console.log("Vérifiez vos variables d'environnement et assurez-vous que MongoDB est en cours d'exécution");
    process.exit(1);
  }
};

// Fonction pour vérifier les utilisateurs existants
const checkUsers = async () => {
  try {
    // Se connecter à la base de données
    await connectDB();
    
    console.log("\n=== DIAGNOSTIC D'AUTHENTIFICATION ===\n");
    
    // Vérifier la base d'utilisateurs
    const users = await User.find().select('+password');
    console.log(`Nombre total d'utilisateurs dans la base de données: ${users.length}`);
    
    if (users.length === 0) {
      console.log("PROBLÈME: Aucun utilisateur trouvé dans la base de données.");
      console.log("SOLUTION: Exécutez le script seed.js pour créer les utilisateurs initiaux.");
      
      // Créer un utilisateur de test
      console.log("\nCréation d'un utilisateur de test...");
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("password123", salt);
      
      const testUser = await User.create({
        name: "Test User",
        email: "test@example.com",
        nationalId: "TEST123",
        password: hashedPassword,
        role: "voter",
        isEmailVerified: true
      });
      
      console.log(`Utilisateur de test créé: ${testUser.name} (${testUser.email})`);
      console.log("Vous pouvez maintenant vous connecter avec:");
      console.log("Email: test@example.com");
      console.log("Mot de passe: password123");
    } else {
      console.log("\nUtilisateurs trouvés dans la base de données:");
      
      for (const user of users) {
        console.log(`- ${user.name} (${user.email}), rôle: ${user.role}, email vérifié: ${user.isEmailVerified ? 'Oui' : 'Non'}`);
        
        // Vérifier si le mot de passe est correctement haché
        if (!user.password || user.password.length < 20) {
          console.log(`  PROBLÈME: Le mot de passe de ${user.email} semble invalide ou non haché.`);
        }
        
        // Vérifier si l'email est vérifié
        if (!user.isEmailVerified) {
          console.log(`  PROBLÈME: L'email de ${user.email} n'est pas vérifié.`);
          
          // Mettre à jour l'utilisateur pour marquer son email comme vérifié
          user.isEmailVerified = true;
          await user.save();
          console.log(`  CORRECTION: L'email de ${user.email} a été marqué comme vérifié.`);
        }
        
        // Vérifier si le mot de passe est "password123"
        const isPasswordValid = await bcrypt.compare("password123", user.password);
        console.log(`  Le mot de passe "password123" est ${isPasswordValid ? 'valide' : 'invalide'} pour cet utilisateur.`);
        
        if (!isPasswordValid) {
          // Réinitialiser le mot de passe à "password123"
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash("password123", salt);
          await user.save();
          console.log(`  CORRECTION: Le mot de passe de ${user.email} a été réinitialisé à "password123".`);
        }
      }
    }
    
    console.log("\n=== FIN DU DIAGNOSTIC ===\n");
    console.log("Vous devriez maintenant pouvoir vous connecter avec l'un des emails ci-dessus");
    console.log("et le mot de passe: password123");
    
    // Se déconnecter de MongoDB
    await mongoose.disconnect();
    console.log("Déconnexion de MongoDB");
  } catch (error) {
    console.error(`Erreur lors du diagnostic: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
};

// Exécuter le diagnostic
console.log("Démarrage du diagnostic d'authentification...");
checkUsers();