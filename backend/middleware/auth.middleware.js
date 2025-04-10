const jwt = require("jsonwebtoken")
const User = require("../models/User")

// Middleware pour vérifier le token JWT
exports.authenticateJWT = async (req, res, next) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Non autorisé, token manquant" })
    }

    const token = authHeader.split(" ")[1]

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Trouver l'utilisateur correspondant
    const user = await User.findById(decoded.id).select("-password")

    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" })
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "Compte désactivé" })
    }

    // Ajouter l'utilisateur à la requête
    req.user = user
    next()
  } catch (error) {
    console.error("Erreur d'authentification:", error)
    return res.status(401).json({ message: "Non autorisé, token invalide" })
  }
}

// Middleware pour vérifier si l'utilisateur est un administrateur
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next()
  } else {
    res.status(403).json({ message: "Accès refusé, droits d'administrateur requis" })
  }
}

