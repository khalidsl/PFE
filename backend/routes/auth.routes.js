const express = require("express")
const router = express.Router()
const { body } = require("express-validator")
const authController = require("../controllers/auth.controller")
const { authenticateJWT, isAdmin } = require("../middleware/auth.middleware")

// Validation pour l'enregistrement
const registerValidation = [
  body("name").notEmpty().withMessage("Le nom est requis"),
  body("email").isEmail().withMessage("Email invalide"),
  body("nationalId").notEmpty().withMessage("Numéro d'identité national requis"),
  body("password").isLength({ min: 6 }).withMessage("Le mot de passe doit contenir au moins 6 caractères"),
]

// Routes publiques
router.post("/register", registerValidation, authController.register)
router.post("/login", authController.login)
router.post("/logout", authController.logout)

// Nouvelles routes pour OTP
router.post("/verify-otp", authController.verifyOTP)
router.post("/resend-otp", authController.resendOTP)

// Anciennes routes de vérification d'email (conservées pour rétrocompatibilité)
router.get("/verify-email/:token", authController.verifyEmail)
router.post("/resend-verification", authController.resendVerificationEmail)

// Routes protégées
router.get("/profile", authenticateJWT, authController.getProfile)
router.put("/profile", authenticateJWT, authController.updateProfile)

// Routes admin
router.get("/users", authenticateJWT, isAdmin, authController.getAllUsers)

module.exports = router
