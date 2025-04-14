const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const crypto = require("crypto")

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  nationalId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["voter", "admin"],
    default: "voter",
  },
  hasVoted: {
    type: Map,
    of: Boolean,
    default: {},
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  // Nouveaux champs pour OTP
  otpHash: String,
  otpSalt: String,
  otpCreatedAt: Date,
  // Conserver les anciens champs pour la rétrocompatibilité
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (enteredPassword) {
  try {
    // Si le mot de passe est vide, retourner false
    if (!enteredPassword) return false

    // Utiliser bcrypt pour comparer les mots de passe
    return await bcrypt.compare(enteredPassword, this.password)
  } catch (error) {
    console.error("Erreur lors de la comparaison des mots de passe:", error)
    return false
  }
}

// Méthode pour générer un token de vérification d'email (conservée pour rétrocompatibilité)
userSchema.methods.generateVerificationToken = function () {
  // Générer un token aléatoire
  const verificationToken = crypto.randomBytes(32).toString("hex")

  // Hacher le token et le stocker dans la base de données
  this.emailVerificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex")

  // Définir une date d'expiration (24 heures)
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000

  return verificationToken
}

// Nouvelle méthode pour configurer un code OTP
userSchema.methods.setOTP = function (otpData) {
  this.otpHash = otpData.hash
  this.otpSalt = otpData.salt
  this.otpCreatedAt = new Date()
  return this
}

// Middleware pour hacher le mot de passe avant l'enregistrement
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    console.error("Erreur lors du hachage du mot de passe:", error)
    next(error)
  }
})

const User = mongoose.model("User", userSchema)

module.exports = User
