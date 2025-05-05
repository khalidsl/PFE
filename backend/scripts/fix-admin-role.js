/**
 * Script pour corriger le rôle d'administrateur
 * Ce script s'assure que l'utilisateur admin a le rôle exactement formatté en "admin" (minuscules)
 */

const mongoose = require('mongoose');
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

async function fixAdminRole() {
  try {
    console.log('Démarrage de la correction du rôle administrateur...');
    
    // Utiliser la connexion directe à MongoDB pour éviter les middlewares
    const db = mongoose.connection;
    
    // Attendre que la connexion soit établie
    if (db.readyState !== 1) {
      await new Promise(resolve => {
        db.once('open', resolve);
      });
    }
    
    // Obtenir la collection d'utilisateurs directement
    const usersCollection = db.collection('users');
    
    // Trouver tous les utilisateurs qui devraient être admin
    const adminEmails = ['admin@example.com']; // Liste des emails qui devraient être admin
    
    console.log('Utilisateurs avant correction:');
    const allUsers = await usersCollection.find({}).toArray();
    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}), rôle: "${user.role}" (type: ${typeof user.role})`);
    });
    
    // Mettre à jour tous les utilisateurs avec ces emails pour avoir le rôle "admin" (minuscules)
    for (const email of adminEmails) {
      const result = await usersCollection.updateOne(
        { email: email },
        { $set: { role: "admin" } } // Importance des guillemets doubles pour s'assurer du format exact
      );
      
      if (result.matchedCount > 0) {
        console.log(`L'utilisateur ${email} a été mis à jour avec le rôle "admin"`);
      } else {
        console.log(`Aucun utilisateur trouvé avec l'email ${email}`);
      }
    }
    
    // Vérifier les changements
    console.log('\nUtilisateurs après correction:');
    const updatedUsers = await usersCollection.find({}).toArray();
    updatedUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}), rôle: "${user.role}" (type: ${typeof user.role})`);
    });
    
    // Fermer la connexion à MongoDB
    await mongoose.disconnect();
    console.log('\nDéconnexion de MongoDB');
    
    console.log('\n=== CORRECTION TERMINÉE ===');
    console.log('Vous devriez maintenant pouvoir accéder aux pages d\'administration');
    console.log('en vous connectant avec: admin@example.com');

    process.exit(0);
  } catch (error) {
    console.error('ERREUR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter le script
fixAdminRole();