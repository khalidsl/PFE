const User = require("../models/User")
const jwt = require("jsonwebtoken")
const { validationResult } = require("express-validator")
const otpService = require("../services/otp.service")
const emailService = require("../services/email.service")
const crypto = require("crypto")

//  token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
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
    // En mode dév, on peut définir isEmailVerified à true pour faciliter les tests
    const isDevMode = process.env.NODE_ENV === "development"

    const user = await User.create({
      name,
      email,
      nationalId,
      password,
      isEmailVerified: isDevMode ? true : false, // Vérification automatique en dev
    })

    if (user) {
      // Générer un code OTP seulement si on n'est pas en mode dev
      let otpCode = null
      if (!isDevMode) {
        otpCode = otpService.generateOTP()
        const hashedOTP = otpService.hashOTP(otpCode)
        user.setOTP(hashedOTP)
        await user.save()

        // Envoyer l'email avec le code OTP
        try {
          await emailService.sendOTPEmail(user, otpCode, otpService.OTP_VALIDITY_MINUTES)
          console.log(`Email OTP envoyé à ${user.email}`)
        } catch (emailError) {
          console.error("Erreur d'envoi d'email OTP:", emailError)
          // Continuer même si l'envoi d'email échoue
        }
      }

      // Générer un token JWT
      const token = generateToken(user._id)

      // Envoyer la réponse
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        nationalId: user.nationalId,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        token,
        otpCode: isDevMode ? null : otpCode, // Inclure le code OTP dans la réponse
        requiresVerification: !isDevMode,
        message: isDevMode
          ? "Compte créé avec succès (vérification désactivée en mode développement)"
          : `Un code de vérification a été envoyé à votre adresse email. Il est valide pendant ${otpService.OTP_VALIDITY_MINUTES} minutes.`,
      })
    } else {
      res.status(400).json({ message: "Données utilisateur invalides" })
    }
  } catch (error) {
    console.error("Erreur d'enregistrement:", error)
    res.status(500).json({ message: "Erreur serveur", error: error.message })
  }
}

// Vérifier le code OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ message: "Email et code OTP requis" })
    }

    // Trouver l'utilisateur avec cet email
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" })
    }

    // Vérifier si l'utilisateur est déjà vérifié
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Compte déjà vérifié" })
    }

    // Vérifier si l'OTP existe
    if (!user.otpHash || !user.otpSalt || !user.otpCreatedAt) {
      return res.status(400).json({ message: "Aucun code OTP trouvé. Veuillez demander un nouveau code." })
    }

    // Vérifier si l'OTP a expiré
    if (otpService.isOTPExpired(user.otpCreatedAt)) {
      return res.status(400).json({ message: "Code OTP expiré. Veuillez demander un nouveau code." })
    }

    // Vérifier si l'OTP est correct
    const isValid = otpService.verifyOTP(otp, user.otpHash, user.otpSalt)

    if (!isValid) {
      return res.status(400).json({ message: "Code OTP invalide" })
    }

    // Marquer l'utilisateur comme vérifié
    user.isEmailVerified = true
    user.otpHash = undefined
    user.otpSalt = undefined
    user.otpCreatedAt = undefined
    await user.save()

    // Générer un nouveau token JWT
    const token = generateToken(user._id)

    res.json({
      message: "Compte vérifié avec succès",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        nationalId: user.nationalId,
        role: user.role,
        isEmailVerified: true,
      },
    })
  } catch (error) {
    console.error("Erreur de vérification OTP:", error)
    res.status(500).json({ message: "Erreur serveur", error: error.message })
  }
}

// Renvoyer un nouveau code OTP
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: "L'adresse email est requise" })
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" })
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Compte déjà vérifié" })
    }

    // Générer un nouveau code OTP
    const otpCode = otpService.generateOTP()
    const hashedOTP = otpService.hashOTP(otpCode)
    user.setOTP(hashedOTP)
    await user.save()

    // Envoyer l'email avec le nouveau code OTP
    try {
      await emailService.sendOTPEmail(user, otpCode, otpService.OTP_VALIDITY_MINUTES)
      console.log(`Nouvel email OTP envoyé à ${user.email}`)
    } catch (emailError) {
      console.error("Erreur d'envoi d'email OTP:", emailError)
      // Continuer même si l'envoi d'email échoue
    }

    // Répondre immédiatement
    res.json({
      message: "Nouveau code OTP généré et envoyé avec succès",
      otpCode: process.env.NODE_ENV === "development" ? otpCode : undefined,
      validityMinutes: otpService.OTP_VALIDITY_MINUTES,
    })
  } catch (error) {
    console.error("Erreur de génération d'OTP:", error)
    res.status(500).json({ message: "Erreur serveur", error: error.message })
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

    // En mode développement, on peut ignorer la vérification d'email
    const isDevMode = process.env.NODE_ENV === "development"

    // Vérifier si l'email est vérifié (sauf en mode dev)
    if (!isDevMode && !user.isEmailVerified) {
      // Générer un nouveau code OTP pour faciliter la vérification
      const otpCode = otpService.generateOTP()
      const hashedOTP = otpService.hashOTP(otpCode)
      user.setOTP(hashedOTP)
      await user.save()

      // Envoyer l'email avec le code OTP
      try {
        await emailService.sendOTPEmail(user, otpCode, otpService.OTP_VALIDITY_MINUTES)
        console.log(`Email OTP envoyé à ${user.email} lors de la connexion`)
      } catch (emailError) {
        console.error("Erreur d'envoi d'email OTP lors de la connexion:", emailError)
        // Continuer même si l'envoi d'email échoue
      }

      return res.status(401).json({
        message: "Veuillez vérifier votre compte avant de vous connecter",
        needsVerification: true,
        otpCode: isDevMode ? otpCode : undefined,
        email: user.email,
      })
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
      isEmailVerified: user.isEmailVerified,
      token,
    })
  } catch (error) {
    console.error("Erreur de connexion:", error)
    res.status(500).json({ message: "Erreur serveur", error: error.message })
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
        isEmailVerified: user.isEmailVerified,
      })
    } else {
      res.status(404).json({ message: "Utilisateur non trouvé" })
    }
  } catch (error) {
    console.error("Erreur de récupération du profil:", error)
    res.status(500).json({ message: "Erreur serveur", error: error.message })
  }
}

// Mettre à jour le profil de l'utilisateur
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (user) {
      user.name = req.body.name || user.name

      // Si l'email change, il faut le vérifier à nouveau
      if (req.body.email && req.body.email !== user.email) {
        user.email = req.body.email

        // En mode développement, on peut ignorer la vérification d'email
        const isDevMode = process.env.NODE_ENV === "development"
        if (!isDevMode) {
          user.isEmailVerified = false

          // Générer un nouveau code OTP
          const otpCode = otpService.generateOTP()
          const hashedOTP = otpService.hashOTP(otpCode)
          user.setOTP(hashedOTP)

          // Envoyer l'email avec le code OTP
          try {
            await emailService.sendOTPEmail(user, otpCode, otpService.OTP_VALIDITY_MINUTES)
            console.log(`Email OTP envoyé à ${user.email} après changement d'email`)
          } catch (emailError) {
            console.error("Erreur d'envoi d'email OTP après changement d'email:", emailError)
            // Continuer même si l'envoi d'email échoue
          }

          await user.save()

          return res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            nationalId: user.nationalId,
            role: user.role,
            hasVoted: user.hasVoted,
            isEmailVerified: false,
            otpCode: isDevMode ? otpCode : undefined,
            message: "Email mis à jour. Veuillez vérifier votre nouvelle adresse email avec le code OTP envoyé.",
          })
        }
      }

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
        isEmailVerified: updatedUser.isEmailVerified,
      })
    } else {
      res.status(404).json({ message: "Utilisateur non trouvé" })
    }
  } catch (error) {
    console.error("Erreur de mise à jour du profil:", error)
    res.status(500).json({ message: "Erreur serveur", error: error.message })
  }
}

// Obtenir tous les utilisateurs (admin seulement)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select(
      "-password -otpHash -otpSalt -emailVerificationToken -emailVerificationExpires",
    )
    res.json(users)
  } catch (error) {
    console.error("Erreur de récupération des utilisateurs:", error)
    res.status(500).json({ message: "Erreur serveur", error: error.message })
  }
}

// Ajouter cette fonction si elle n'existe pas déjà dans le fichier
// Vérifier un email avec un token (ancienne méthode, conservée pour rétrocompatibilité)
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params

    if (!token) {
      return res.status(400).json({ message: "Token de vérification manquant" })
    }

    // Hacher le token pour le comparer avec celui stocké dans la base de données
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    // Trouver l'utilisateur avec ce token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ message: "Token invalide ou expiré" })
    }

    // Marquer l'utilisateur comme vérifié
    user.isEmailVerified = true
    user.emailVerificationToken = undefined
    user.emailVerificationExpires = undefined
    await user.save()

    // Générer un nouveau token JWT
    const jwtToken = generateToken(user._id)

    res.json({
      message: "Email vérifié avec succès",
      token: jwtToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        nationalId: user.nationalId,
        role: user.role,
        isEmailVerified: true,
      },
    })
  } catch (error) {
    console.error("Erreur de vérification d'email:", error)
    res.status(500).json({ message: "Erreur serveur", error: error.message })
  }
}

// Renvoyer un email de vérification (ancienne méthode, conservée pour rétrocompatibilité)
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: "L'adresse email est requise" })
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" })
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Compte déjà vérifié" })
    }

    // Générer un nouveau token de vérification
    const verificationToken = user.generateVerificationToken()
    await user.save()

    // URL de vérification
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`

    // Envoyer l'email avec le lien de vérification
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: "Vérification de votre compte",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Vérification de votre compte</h2>
            <p>Bonjour ${user.name},</p>
            <p>Veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse email :</p>
            <p>
              <a href="${verificationUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Vérifier mon email
              </a>
            </p>
            <p>Ou copiez ce lien dans votre navigateur :</p>
            <p>${verificationUrl}</p>
            <p>Ce lien est valable pendant 24 heures.</p>
            <p>Si vous n'avez pas demandé cette vérification, vous pouvez ignorer cet email.</p>
            <p>Cordialement,<br>L'équipe E-Voting</p>
          </div>
        `,
      })
      console.log(`Email de vérification envoyé à ${user.email}`)
    } catch (emailError) {
      console.error("Erreur d'envoi d'email de vérification:", emailError)
      // Continuer même si l'envoi d'email échoue
    }

    res.json({
      message: "Email de vérification envoyé avec succès",
      email: user.email,
    })
  } catch (error) {
    console.error("Erreur de renvoi d'email de vérification:", error)
    res.status(500).json({ message: "Erreur serveur", error: error.message })
  }
}
