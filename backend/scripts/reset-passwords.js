/**
 * Script pour corriger les problèmes d'authentification
 * Ce script va recréer les utilisateurs avec des mots de passe fonctionnels
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

// URL de connexion MongoDB
let mongoURL;
if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD) {
  // Construction de l'URL à partir des variables d'environnement
  mongoURL = `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || '27017'}/${process.env.DB_NAME || 'evoting_db'}?authSource=admin`;
} else {
  // URL de repli pour le développement local ou dans Docker
  mongoURL = 'mongodb://evoting_user:evoting_password@mongodb:27017/evoting_db?authSource=admin';
}

// Variables globales
const DEFAULT_PASSWORD = 'password123';
const EMAIL_VERIFIED = true;

async function fixAuthIssues() {
  console.log('Démarrage de la réparation des comptes utilisateurs...');
  console.log(`URL de connexion: ${mongoURL.replace(/:[^:]*@/, ':****@')}`);
  
  try {
    // Connexion à MongoDB
    await mongoose.connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connecté à MongoDB avec succès');

    // Récupérer tous les utilisateurs existants
    const existingUsers = await User.find({});
    console.log(`Nombre d'utilisateurs trouvés: ${existingUsers.length}`);

    if (existingUsers.length === 0) {
      console.log('Aucun utilisateur trouvé. Création des utilisateurs par défaut...');
      await createDefaultUsers();
    } else {
      // Corriger tous les utilisateurs existants
      console.log('Correction des utilisateurs existants...');
      await fixExistingUsers(existingUsers);
    }

    console.log('\n=== CORRECTION TERMINÉE ===');
    console.log('Vous pouvez maintenant vous connecter avec:');
    console.log(`- Email: admin@example.com | Mot de passe: ${DEFAULT_PASSWORD}`);
    console.log(`- Email: test1@example.com | Mot de passe: ${DEFAULT_PASSWORD}`);
    console.log(`- Email: test2@example.com | Mot de passe: ${DEFAULT_PASSWORD}`);
    
    // Déconnexion de MongoDB
    await mongoose.disconnect();
    console.log('Déconnexion de MongoDB');
    
  } catch (error) {
    console.error('ERREUR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

async function createDefaultUsers() {
  // Liste des utilisateurs par défaut
  const defaultUsers = [
    {
      name: "Admin User",
      email: "admin@example.com",
      nationalId: "ADMIN123",
      password: DEFAULT_PASSWORD,
      role: "admin",
      isEmailVerified: EMAIL_VERIFIED,
    },
    {
      name: "Test User 1",
      email: "test1@example.com",
      nationalId: "TEST1234",
      password: DEFAULT_PASSWORD,
      role: "voter",
      isEmailVerified: EMAIL_VERIFIED,
    },
    {
      name: "Test User 2",
      email: "test2@example.com",
      nationalId: "TEST5678",
      password: DEFAULT_PASSWORD,
      role: "voter",
      isEmailVerified: EMAIL_VERIFIED,
    }
  ];

  // Créer chaque utilisateur
  for (const userData of defaultUsers) {
    try {
      // Hacher le mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Créer l'utilisateur
      const newUser = await User.create({
        name: userData.name,
        email: userData.email,
        nationalId: userData.nationalId,
        password: hashedPassword,
        role: userData.role,
        isEmailVerified: userData.isEmailVerified
      });
      
      console.log(`Utilisateur créé: ${newUser.name} (${newUser.email})`);
    } catch (error) {
      console.error(`Erreur lors de la création de l'utilisateur ${userData.email}:`, error.message);
    }
  }
}

async function fixExistingUsers(users) {
  for (const user of users) {
    try {
      console.log(`Traitement de l'utilisateur: ${user.email}`);
      
      // Générer un nouveau mot de passe haché
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);
      
      // Mettre à jour le mot de passe et s'assurer que l'email est vérifié
      user.password = hashedPassword;
      user.isEmailVerified = EMAIL_VERIFIED;
      
      // Supprimer toute information liée à la vérification
      user.otpHash = undefined;
      user.otpSalt = undefined;
      user.otpCreatedAt = undefined;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      
      // Sauvegarder l'utilisateur
      await user.save();
      
      // Tester le mot de passe après la mise à jour
      const isPasswordValid = await bcrypt.compare(DEFAULT_PASSWORD, user.password);
      
      console.log(`Utilisateur mis à jour: ${user.name} (${user.email})`);
      console.log(`Mot de passe (${DEFAULT_PASSWORD}) valide: ${isPasswordValid ? 'Oui' : 'Non'}`);
      console.log(`Email vérifié: ${user.isEmailVerified ? 'Oui' : 'Non'}`);
      
      if (!isPasswordValid) {
        console.error(`AVERTISSEMENT: Le mot de passe pour ${user.email} n'est pas valide après mise à jour!`);
      }
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'utilisateur ${user.email}:`, error.message);
    }
  }
  
  // Vérifier et créer les utilisateurs manquants
  const emails = users.map(user => user.email);
  const defaultEmails = ["admin@example.com", "test1@example.com", "test2@example.com"];
  
  for (const email of defaultEmails) {
    if (!emails.includes(email)) {
      console.log(`Utilisateur ${email} manquant, création en cours...`);
      
      // Créer l'utilisateur manquant
      const role = email === "admin@example.com" ? "admin" : "voter";
      const name = email === "admin@example.com" ? "Admin User" : `Test User ${email.charAt(4)}`;
      const nationalId = email === "admin@example.com" ? "ADMIN123" : `TEST${email.charAt(4)}${Math.floor(Math.random() * 1000)}`;
      
      // Hacher le mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);
      
      // Créer l'utilisateur
      const newUser = await User.create({
        name,
        email,
        nationalId,
        password: hashedPassword,
        role,
        isEmailVerified: EMAIL_VERIFIED
      });
      
      console.log(`Utilisateur créé: ${newUser.name} (${newUser.email})`);
    }
  }
}

// Exécuter le script
fixAuthIssues();
