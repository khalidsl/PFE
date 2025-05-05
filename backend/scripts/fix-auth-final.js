/**
 * Script final pour corriger les problèmes d'authentification
 * Ce script contourne le middleware de hachage automatique du modèle User
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// URL de connexion MongoDB
const mongoURL = `mongodb://${process.env.DB_USER || 'evoting_user'}:${process.env.DB_PASSWORD || 'evoting_password'}@${process.env.DB_HOST || 'mongodb'}:${process.env.DB_PORT || '27017'}/${process.env.DB_NAME || 'evoting_db'}?authSource=admin`;

// Connexion à MongoDB
mongoose.connect(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connecté à MongoDB avec succès'))
.catch(err => {
  console.error('Erreur de connexion à MongoDB:', err);
  process.exit(1);
});

// Variables globales
const DEFAULT_PASSWORD = 'password123';

// Fonction principale
async function fixAuthentication() {
  try {
    console.log('Démarrage de la correction finale des problèmes d\'authentification...');
    console.log(`URL de connexion: ${mongoURL.replace(/:[^:]*@/, ':****@')}`);
    
    // Utiliser la connexion directe à MongoDB pour éviter les middlewares
    const db = mongoose.connection;
    
    // Attendre que la connexion soit établie
    if (db.readyState !== 1) {
      await new Promise(resolve => {
        db.once('open', resolve);
      });
    }
    
    // Obtenir la collection d'utilisateurs directement (évite les middlewares)
    const usersCollection = db.collection('users');
    
    // Vérifier si la collection existe
    const collections = await db.db.listCollections({ name: 'users' }).toArray();
    if (collections.length === 0) {
      console.log('La collection "users" n\'existe pas. Création de la collection...');
      await db.db.createCollection('users');
    }
    
    // Hacher le mot de passe une seule fois
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);
    
    // Liste des utilisateurs par défaut
    const defaultUsers = [
      {
        name: "Admin User",
        email: "admin@example.com",
        nationalId: "ADMIN123",
        password: hashedPassword,
        role: "admin",
        isEmailVerified: true,
        isActive: true,
        hasVoted: {},
        createdAt: new Date()
      },
      {
        name: "Test User 1",
        email: "test1@example.com",
        nationalId: "TEST1234",
        password: hashedPassword,
        role: "voter",
        isEmailVerified: true,
        isActive: true,
        hasVoted: {},
        createdAt: new Date()
      },
      {
        name: "Test User 2",
        email: "test2@example.com",
        nationalId: "TEST5678",
        password: hashedPassword,
        role: "voter",
        isEmailVerified: true,
        isActive: true,
        hasVoted: {},
        createdAt: new Date()
      }
    ];
    
    // Supprimer tous les utilisateurs existants
    console.log('Suppression des utilisateurs existants...');
    await usersCollection.deleteMany({});
    console.log('Utilisateurs supprimés avec succès.');
    
    // Insérer les nouveaux utilisateurs
    console.log('Création des nouveaux utilisateurs...');
    const result = await usersCollection.insertMany(defaultUsers);
    console.log(`${result.insertedCount} utilisateurs créés avec succès.`);
    
    // Vérifier les utilisateurs insérés
    const users = await usersCollection.find({}).toArray();
    console.log('\nUtilisateurs disponibles:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}), rôle: ${user.role}`);
    });
    
    console.log('\n=== CORRECTION TERMINÉE ===');
    console.log('Vous pouvez maintenant vous connecter avec:');
    console.log(`- Email: admin@example.com | Mot de passe: ${DEFAULT_PASSWORD}`);
    console.log(`- Email: test1@example.com | Mot de passe: ${DEFAULT_PASSWORD}`);
    console.log(`- Email: test2@example.com | Mot de passe: ${DEFAULT_PASSWORD}`);
    
    // Fermer la connexion à MongoDB
    await mongoose.disconnect();
    console.log('Déconnexion de MongoDB');
    process.exit(0);
    
  } catch (error) {
    console.error('ERREUR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter le script
fixAuthentication();