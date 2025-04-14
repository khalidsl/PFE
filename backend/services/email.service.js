const nodemailer = require("nodemailer")
require("dotenv").config()

// Configuration du transporteur d'email
const createTransporter = async () => {
  // Récupérer les informations de configuration depuis les variables d'environnement
  const config = {
    host: process.env.EMAIL_HOST || "smtp.ethereal.email",
    port: process.env.EMAIL_PORT || "587",
    secure: false, // true pour 465, false pour les autres ports
    auth: {
      user: process.env.EMAIL_USER || "melany44@ethereal.email",
      pass: process.env.EMAIL_PASSWORD || "caa8ZzG2uPsRgjGzw6",
    },
  }

  console.log("Configuration email:", config)

  // Créer un transporteur réutilisable
  const transporter = nodemailer.createTransport(config)

  // Vérifier la connexion
  try {
    await transporter.verify()
    console.log("Connexion au serveur SMTP établie avec succès")
    return transporter
  } catch (error) {
    console.error("Erreur de connexion au serveur SMTP:", error)

    // En mode développement, utiliser un transporteur de test (ethereal.email)
    if (process.env.NODE_ENV === "development") {
      console.log("Utilisation du transporteur de test Ethereal en mode développement")

      // Créer un compte de test Ethereal
      const testAccount = await nodemailer.createTestAccount()

      // Créer un transporteur Ethereal
      const etherealTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })

      console.log("Compte de test Ethereal créé:", testAccount.user)
      return etherealTransporter
    }

    // En production, renvoyer l'erreur
    throw error
  }
}

// Cache du transporteur pour éviter de le recréer à chaque envoi
let cachedTransporter = null

// Fonction pour envoyer un email
const sendEmail = async (options) => {
  try {
    // Utiliser le transporteur en cache ou en créer un nouveau
    if (!cachedTransporter) {
      cachedTransporter = await createTransporter()
    }

    // Définir l'expéditeur par défaut
    const from = process.env.EMAIL_FROM || "E-Voting System <noreply@evoting.com>"

    // Envoyer l'email
    const info = await cachedTransporter.sendMail({
      from,
      ...options,
    })

    console.log(`Email envoyé: <${info.messageId}>`)

    // Si nous utilisons Ethereal, afficher l'URL de prévisualisation
    if (info.messageId && info.messageId.includes("ethereal")) {
      console.log("URL de prévisualisation: ", nodemailer.getTestMessageUrl(info))
    }

    return info
  } catch (error) {
    console.error("Erreur d'envoi d'email:", error)

    // Si l'erreur est liée au transporteur, réinitialiser le cache
    if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT" || error.code === "EAUTH") {
      console.log("Réinitialisation du transporteur d'email en raison d'une erreur de connexion")
      cachedTransporter = null
    }

    // En mode développement, simuler un envoi réussi
    if (process.env.NODE_ENV === "development") {
      console.log("Mode développement: simulation d'un envoi d'email réussi")
      return {
        messageId: `dev-${Date.now()}@localhost`,
        envelope: { to: [options.to] },
      }
    }

    throw error
  }
}

// Envoyer un email de vérification
const sendVerificationEmail = async (user, token) => {
  // En mode développement, on peut simuler l'envoi
  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV] Email de vérification pour ${user.email} avec token: ${token}`)
    console.log(
      `[DEV] URL de vérification: ${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${token}`,
    )
    return { success: true, dev: true }
  }

  const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${token}`

  await sendEmail({
    to: user.email,
    subject: "Vérification de votre adresse email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Vérification de votre adresse email</h2>
        <p>Bonjour ${user.name},</p>
        <p>Merci de vous être inscrit sur notre système de vote électronique. Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
        <p style="margin: 20px 0;">
          <a href="${verificationUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Vérifier mon email</a>
        </p>
        <p>Ou copiez et collez ce lien dans votre navigateur :</p>
        <p style="word-break: break-all;">${verificationUrl}</p>
        <p>Ce lien expirera dans 24 heures.</p>
        <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
        <p>Cordialement,<br>L'équipe E-Voting</p>
      </div>
    `,
  })
}

// Envoyer un email de confirmation de connexion
const sendLoginConfirmationEmail = async (user) => {
  // En mode développement, on peut simuler l'envoi
  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV] Email de confirmation de connexion pour ${user.email}`)
    return { success: true, dev: true }
  }

  try {
    await sendEmail({
      to: user.email,
      subject: "Confirmation de connexion",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Confirmation de connexion</h2>
          <p>Bonjour ${user.name},</p>
          <p>Nous vous informons qu'une connexion à votre compte a été effectuée le ${new Date().toLocaleString()}.</p>
          <p>Si vous n'êtes pas à l'origine de cette connexion, veuillez immédiatement changer votre mot de passe et contacter notre support.</p>
          <p>Cordialement,<br>L'équipe E-Voting</p>
        </div>
      `,
    })
  } catch (error) {
    // Capturer l'erreur mais ne pas la propager pour ne pas bloquer la connexion
    console.error("Erreur d'envoi d'email de confirmation:", error)
  }
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendLoginConfirmationEmail,
}
