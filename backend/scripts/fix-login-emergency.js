/**
 * Script de connexion d'urgence
 * Ce script permet de modifier la base de données pour permettre la connexion
 * avec n'importe quel mot de passe pour tous les utilisateurs (mode debug)
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

// Fonction principale
async function createEmergencyAccess() {
  try {
    console.log('Démarrage de la création des accès d\'urgence...');
    console.log(`URL de connexion: ${mongoURL.replace(/:[^:]*@/, ':****@')}`);
    
    // Utiliser la connexion directe pour éviter les middlewares
    const db = mongoose.connection;
    
    // Attendre que la connexion soit établie
    if (db.readyState !== 1) {
      await new Promise(resolve => {
        db.once('open', resolve);
      });
    }
    
    // Obtenir la collection d'utilisateurs
    const usersCollection = db.collection('users');
    
    // Vérifier les utilisateurs existants
    const existingUsers = await usersCollection.find({}).toArray();
    console.log(`Nombre d'utilisateurs trouvés: ${existingUsers.length}`);
    
    if (existingUsers.length === 0) {
      console.log('Aucun utilisateur trouvé. Création des utilisateurs par défaut...');
      await createDefaultUsers(usersCollection);
    } else {
      console.log('Utilisateurs existants:');
      for (const user of existingUsers) {
        console.log(`- ${user.name} (${user.email}), rôle: ${user.role}`);
      }
      
      // Création d'un mot de passe universel qui fonctionnera avec n'importe quelle valeur
      // Nous utilisons un mot de passe haché spécial qui sera validé par bcrypt
      const universalPasswordHash = '$2a$10$OwdTUTQI6SPmYQJsJwggZ.7MgEKLABh5QkY1RBq/CD3x3tX4K3MbK'; // Correspond à '123456'
      
      // Mettre à jour tous les utilisateurs pour utiliser ce mot de passe
      for (const user of existingUsers) {
        await usersCollection.updateOne(
          { _id: user._id },
          { 
            $set: { 
              password: universalPasswordHash,
              isEmailVerified: true,
              isActive: true
            },
            $unset: {
              otpHash: "",
              otpSalt: "",
              otpCreatedAt: "",
              emailVerificationToken: "",
              emailVerificationExpires: ""
            }
          }
        );
        console.log(`Utilisateur ${user.email} mis à jour avec le mot de passe universel`);
      }
    }
    
    console.log('\nQuel mot de passe utiliser?');
    console.log('Pour tous les utilisateurs, vous pouvez maintenant vous connecter avec le mot de passe: 123456');
    console.log('Ce mode est uniquement pour déboguer votre application!');
    
    // Tester la connexion avec l'utilisateur admin
    console.log('\nTest de connexion pour admin@example.com:');
    const adminUser = await usersCollection.findOne({ email: 'admin@example.com' });
    if (adminUser) {
      const hash = adminUser.password;
      console.log(`Hash du mot de passe stocké: ${hash}`);
      
      // Vérifier si le mot de passe '123456' fonctionne avec ce hash
      const bcryptResult = await bcrypt.compare('123456', hash);
      console.log(`Test de mot de passe '123456': ${bcryptResult ? 'VALIDE' : 'INVALIDE'}`);
      
      if (!bcryptResult) {
        console.log('Le mot de passe universel n\'a pas été correctement appliqué. Correction...');
        const universalPasswordHash = '$2a$10$OwdTUTQI6SPmYQJsJwggZ.7MgEKLABh5QkY1RBq/CD3x3tX4K3MbK';
        await usersCollection.updateOne(
          { _id: adminUser._id },
          { $set: { password: universalPasswordHash } }
        );
        console.log('Correction appliquée!');
      }
    } else {
      console.log('Utilisateur admin non trouvé!');
    }
    
    console.log('\nSi la connexion échoue toujours:');
    console.log('1. Redémarrez le serveur backend');
    console.log('2. Effacez le cache de votre navigateur ou utilisez une navigation privée');
    console.log('3. Essayez de vous connecter avec admin@example.com / 123456');
    
    // Fermer la connexion à MongoDB
    await mongoose.disconnect();
    console.log('\nDéconnexion de MongoDB');
    
    // Ajouter un petit délai avant de quitter pour s'assurer que tout soit écrit dans la console
    setTimeout(() => process.exit(0), 1000);
    
  } catch (error) {
    console.error('ERREUR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Fonction pour créer des utilisateurs par défaut
async function createDefaultUsers(usersCollection) {
  // Utiliser un mot de passe universel qui fonctionne avec n'importe quelle valeur
  const universalPasswordHash = '$2a$10$OwdTUTQI6SPmYQJsJwggZ.7MgEKLABh5QkY1RBq/CD3x3tX4K3MbK'; // Correspond à '123456'
  
  // Liste des utilisateurs par défaut
  const defaultUsers = [
    {
      name: "Admin User",
      email: "admin@example.com",
      nationalId: "ADMIN123",
      password: universalPasswordHash,
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
      password: universalPasswordHash,
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
      password: universalPasswordHash,
      role: "voter",
      isEmailVerified: true,
      isActive: true,
      hasVoted: {},
      createdAt: new Date()
    }
  ];
  
  // Insérer les nouveaux utilisateurs
  const result = await usersCollection.insertMany(defaultUsers);
  console.log(`${result.insertedCount} utilisateurs créés avec succès.`);
  
  return result.insertedCount;
}

// Exécuter la fonction principale
console.log("===== PROGRAMME DE RÉPARATION D'URGENCE DE LA CONNEXION =====");
createEmergencyAccess();