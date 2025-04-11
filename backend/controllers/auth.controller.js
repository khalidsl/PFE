const User = require("../models/User")
const jwt = require("jsonwebtoken")
const { validationResult } = require("express-validator")

// Générer un token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  })
}

// Enregistrer un nouvel utilisateur
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, nationalId, password } = req.body

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({
      $or: [{ email }, { nationalId }],
    })

    if (userExists) {
      return res.status(400).json({ message: "Utilisateur déjà enregistré" })
    }

    // Créer un nouvel utilisateur
    const user = await User.create({
      name,
      email,
      nationalId,
      password,
    })

    if (user) {
      // Générer un token
      const token = generateToken(user._id)

      // Envoyer la réponse
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        nationalId: user.nationalId,
        role: user.role,
        token,
      })
    } else {
      res.status(400).json({ message: "Données utilisateur invalides" })
    }
  } catch (error) {
    console.error("Erreur d'enregistrement:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
}

// Connecter un utilisateur
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Trouver l'utilisateur par email
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" })
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "Compte désactivé" })
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" })
    }

    // Générer un token
    const token = generateToken(user._id)

    // Envoyer la réponse
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      nationalId: user.nationalId,
      role: user.role,
      hasVoted: user.hasVoted,
      token,
    })
  } catch (error) {
    console.error("Erreur de connexion:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
}

// Déconnecter un utilisateur
exports.logout = (req, res) => {
  res.json({ message: "Déconnexion réussie" })
}

// Obtenir le profil de l'utilisateur
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        nationalId: user.nationalId,
        role: user.role,
        hasVoted: user.hasVoted,
      })
    } else {
      res.status(404).json({ message: "Utilisateur non trouvé" })
    }
  } catch (error) {
    console.error("Erreur de récupération du profil:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
}

// Mettre à jour le profil de l'utilisateur
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (user) {
      user.name = req.body.name || user.name
      user.email = req.body.email || user.email

      if (req.body.password) {
        user.password = req.body.password
      }

      const updatedUser = await user.save()

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        nationalId: updatedUser.nationalId,
        role: updatedUser.role,
        hasVoted: updatedUser.hasVoted,
      })
    } else {
      res.status(404).json({ message: "Utilisateur non trouvé" })
    }
  } catch (error) {
    console.error("Erreur de mise à jour du profil:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
}

// Obtenir tous les utilisateurs (admin seulement)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password")
    res.json(users)
  } catch (error) {
    console.error("Erreur de récupération des utilisateurs:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
}
