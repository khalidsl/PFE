/**
 * Script de réparation complète du système d'authentification
 * Ce script effectue une analyse complète et répare tous les problèmes connus
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
require('dotenv').config();

// URL de connexion MongoDB
const mongoURL = `mongodb://${process.env.DB_USER || 'evoting_user'}:${process.env.DB_PASSWORD || 'evoting_password'}@${process.env.DB_HOST || 'mongodb'}:${process.env.DB_PORT || '27017'}/${process.env.DB_NAME || 'evoting_db'}?authSource=admin`;

// Paramètres globaux
const ADMIN_PASSWORD = 'admin123';
const USER_PASSWORD = 'user123';

// Se connecter à MongoDB
console.log('===== DIAGNOSTIC ET RÉPARATION COMPLÈTE DU SYSTÈME =====');
console.log(`Connexion à MongoDB: ${mongoURL.replace(/:[^:]*@/, ':****@')}`);

mongoose.connect(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connecté à MongoDB avec succès');
  runRepair();
})
.catch(err => {
  console.error('❌ Erreur de connexion à MongoDB:', err.message);
  process.exit(1);
});

// Fonction principale de réparation
async function runRepair() {
  try {
    const db = mongoose.connection;
    
    // 1. Diagnostic complet du système
    console.log('\n===== DIAGNOSTIC DU SYSTÈME =====');
    
    // 1.1 Vérifier les modèles
    console.log('\n1. Vérification des modèles...');
    await checkModels();
    
    // 1.2 Vérifier les collections et données
    console.log('\n2. Vérification des collections et données...');
    await checkCollections(db);
    
    // 1.3 Analyser la configuration
    console.log('\n3. Vérification de la configuration...');
    checkConfig();
    
    // 2. Réinitialisation complète des utilisateurs
    console.log('\n===== RÉINITIALISATION COMPLÈTE DES UTILISATEURS =====');
    await resetUsers(db);
    
    // 3. Vérification finale
    console.log('\n===== VÉRIFICATION FINALE =====');
    await finalCheck(db);
    
    console.log('\n===== RÉPARATION TERMINÉE =====');
    console.log('Vous pouvez maintenant vous connecter avec:');
    console.log(`- ADMIN: admin@example.com / ${ADMIN_PASSWORD}`);
    console.log(`- UTILISATEUR: user1@example.com / ${USER_PASSWORD}`);
    console.log(`- UTILISATEUR: user2@example.com / ${USER_PASSWORD}`);
    
    // Déconnexion et terminaison
    await mongoose.disconnect();
    console.log('Déconnexion de MongoDB réussie');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE:', error.message);
    console.error(error.stack);
    try {
      await mongoose.disconnect();
    } catch (e) {
      // Ignorer les erreurs de déconnexion
    }
    process.exit(1);
  }
}

// Fonction pour vérifier les modèles
async function checkModels() {
  try {
    // Vérifier le modèle User
    const userModelPath = '../models/User.js';
    console.log(`- Analyse du modèle User (${userModelPath})...`);
    
    try {
      const User = require(userModelPath);
      console.log('✅ Modèle User chargé avec succès');
      
      // Vérifier si le modèle a un middleware pre-save pour le hachage
      const hasPreSave = User.schema.pre && User.schema._hasPreSaveHook;
      console.log(`- Middleware pre-save pour hachage: ${hasPreSave ? 'OUI' : 'NON'}`);
      
      // Vérifier si le modèle a une méthode comparePassword
      const hasComparePassword = typeof User.schema.methods.comparePassword === 'function';
      console.log(`- Méthode comparePassword: ${hasComparePassword ? 'OUI' : 'NON'}`);
      
    } catch (err) {
      console.error(`❌ Erreur lors du chargement du modèle User: ${err.message}`);
    }
  } catch (err) {
    console.error(`❌ Erreur lors de la vérification des modèles: ${err.message}`);
  }
}

// Fonction pour vérifier les collections et données
async function checkCollections(db) {
  try {
    // Vérifier les collections existantes
    const collections = await db.db.listCollections().toArray();
    console.log(`- Collections trouvées: ${collections.length}`);
    
    for (const collection of collections) {
      console.log(`  • ${collection.name}`);
    }
    
    // Vérifier la collection Users
    if (collections.some(c => c.name === 'users')) {
      const usersCollection = db.collection('users');
      const userCount = await usersCollection.countDocuments();
      console.log(`- Utilisateurs dans la base de données: ${userCount}`);
      
      const users = await usersCollection.find({}).toArray();
      
      if (users.length > 0) {
        console.log('- Liste des utilisateurs:');
        
        for (const user of users) {
          console.log(`  • ${user.name} (${user.email}), rôle: ${user.role}, vérifié: ${user.isEmailVerified ? 'OUI' : 'NON'}, actif: ${user.isActive ? 'OUI' : 'NON'}`);
          console.log(`    Hash du mot de passe: ${user.password ? user.password.substring(0, 20) + '...' : 'NON DÉFINI'}`);
        }
        
        // Vérifier si un utilisateur admin existe
        const adminUser = users.find(u => u.role === 'admin');
        if (adminUser) {
          console.log(`✅ Utilisateur admin trouvé: ${adminUser.email}`);
        } else {
          console.log('❌ Aucun utilisateur admin trouvé');
        }
      }
    } else {
      console.log('❌ Collection "users" non trouvée');
    }
  } catch (err) {
    console.error(`❌ Erreur lors de la vérification des collections: ${err.message}`);
  }
}

// Fonction pour vérifier la configuration
function checkConfig() {
  try {
    // Vérifier les variables d'environnement critiques
    console.log('- Variables d\'environnement:');
    
    const criticalVars = [
      'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DB_NAME',
      'JWT_SECRET', 'PORT', 'NODE_ENV'
    ];
    
    for (const varName of criticalVars) {
      const value = process.env[varName];
      if (varName.includes('PASSWORD') || varName.includes('SECRET')) {
        console.log(`  • ${varName}: ${value ? '✅ définie' : '❌ non définie'}`);
      } else {
        console.log(`  • ${varName}: ${value || '❌ non définie'}`);
      }
    }
  } catch (err) {
    console.error(`❌ Erreur lors de la vérification de la configuration: ${err.message}`);
  }
}

// Fonction pour réinitialiser les utilisateurs
async function resetUsers(db) {
  try {
    const usersCollection = db.collection('users');
    
    // Supprimer tous les utilisateurs existants
    console.log('1. Suppression de tous les utilisateurs existants...');
    const deleteResult = await usersCollection.deleteMany({});
    console.log(`✅ ${deleteResult.deletedCount} utilisateurs supprimés`);
    
    // Créer un nouvel utilisateur admin
    console.log('\n2. Création d\'un nouvel utilisateur administrateur...');
    
    // Générer un hash pour le mot de passe admin
    const adminSalt = await bcrypt.genSalt(10);
    const adminHashedPassword = await bcrypt.hash(ADMIN_PASSWORD, adminSalt);
    
    const adminUser = {
      name: "Administrateur",
      email: "admin@example.com",
      nationalId: "ADMIN001",
      password: adminHashedPassword,
      role: "admin",
      isEmailVerified: true,
      isActive: true,
      hasVoted: {},
      createdAt: new Date()
    };
    
    await usersCollection.insertOne(adminUser);
    console.log('✅ Utilisateur administrateur créé avec succès');
    
    // Créer deux utilisateurs test
    console.log('\n3. Création de deux utilisateurs test...');
    
    // Générer un hash pour le mot de passe utilisateur
    const userSalt = await bcrypt.genSalt(10);
    const userHashedPassword = await bcrypt.hash(USER_PASSWORD, userSalt);
    
    const testUsers = [
      {
        name: "Utilisateur 1",
        email: "user1@example.com",
        nationalId: "USER001",
        password: userHashedPassword,
        role: "voter",
        isEmailVerified: true,
        isActive: true,
        hasVoted: {},
        createdAt: new Date()
      },
      {
        name: "Utilisateur 2",
        email: "user2@example.com",
        nationalId: "USER002",
        password: userHashedPassword,
        role: "voter",
        isEmailVerified: true,
        isActive: true,
        hasVoted: {},
        createdAt: new Date()
      }
    ];
    
    await usersCollection.insertMany(testUsers);
    console.log('✅ Utilisateurs test créés avec succès');
    
    console.log('\n4. Vérification des utilisateurs créés...');
    const users = await usersCollection.find({}).toArray();
    
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}), rôle: ${user.role}`);
    });
  } catch (err) {
    console.error(`❌ Erreur lors de la réinitialisation des utilisateurs: ${err.message}`);
    throw err; // Remonter l'erreur pour arrêter le script
  }
}

// Fonction pour la vérification finale
async function finalCheck(db) {
  try {
    console.log('Exécution des vérifications finales...');
    
    const usersCollection = db.collection('users');
    
    // Vérifier l'utilisateur admin
    const admin = await usersCollection.findOne({ email: 'admin@example.com' });
    if (!admin) {
      throw new Error('L\'utilisateur admin n\'existe pas après la réinitialisation');
    }
    
    // Vérifier le rôle admin
    if (admin.role !== 'admin') {
      console.log('⚠️ Le rôle de l\'utilisateur admin n\'est pas correctement défini');
      console.log(`  Rôle actuel: "${admin.role}" (type: ${typeof admin.role})`);
      console.log('  Correction du rôle...');
      
      await usersCollection.updateOne(
        { _id: admin._id },
        { $set: { role: 'admin' } }
      );
      
      console.log('✅ Rôle admin corrigé');
    } else {
      console.log('✅ Rôle de l\'utilisateur admin correctement défini');
    }
    
    // Tester la validation du mot de passe
    console.log('\nTest de validation du mot de passe admin...');
    const isPasswordValid = await bcrypt.compare(ADMIN_PASSWORD, admin.password);
    if (!isPasswordValid) {
      console.log('❌ Échec de la validation du mot de passe admin');
      
      // Recréer le hash et mettre à jour
      console.log('  Régénération du hash du mot de passe admin...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);
      
      await usersCollection.updateOne(
        { _id: admin._id },
        { $set: { password: hashedPassword } }
      );
      
      console.log('✅ Mot de passe admin corrigé');
    } else {
      console.log('✅ Validation du mot de passe admin réussie');
    }
    
    console.log('\nTous les tests sont passés. Le système d\'authentification est prêt.');
  } catch (err) {
    console.error(`❌ Erreur lors de la vérification finale: ${err.message}`);
    throw err;
  }
}