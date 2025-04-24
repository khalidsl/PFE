const nodemailer = require("nodemailer")
require("dotenv").config()

// Configuration du transporteur d'email
const createTransporter = async () => {
  // Récupérer les informations de configuration depuis les variables d'environnement
  const config = {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT === "465", // true pour 465, false pour les autres ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  }

  console.log("Configuration email:", {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user ? "configuré" : "non configuré",
  })

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
      console.log("URL de prévisualisation Ethereal:", nodemailer.getTestMessageUrl)
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

// Envoyer un email avec un code OTP
const sendOTPEmail = async (user, otpCode, validityMinutes) => {
  // En mode développement, on peut simuler l'envoi
  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV] Email OTP pour ${user.email} avec code: ${otpCode}`)
    console.log(`[DEV] Le code est valide pendant ${validityMinutes} minutes`)
    return { success: true, dev: true }
  }

  await sendEmail({
    to: user.email,
    subject: "Votre code de vérification",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Code de vérification</h2>
        <p>Bonjour ${user.name},</p>
        <p>Voici votre code de vérification pour le système de vote électronique:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px;">${otpCode}</span>
        </div>
        <p>Ce code est valable pendant ${validityMinutes} minutes.</p>
        <p>Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.</p>
        <p>Cordialement,<br>L'équipe E-Voting</p>
      </div>
    `,
  })

  return { success: true }
}

// Envoyer un email de confirmation de vote
const sendVoteConfirmationEmail = async (user, electionTitle, candidateName) => {
  // En mode développement, on peut simuler l'envoi
  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV] Email de confirmation de vote pour ${user.email}`)
    console.log(`[DEV] Élection: ${electionTitle}, Candidat: ${candidateName}`)
    return { success: true, dev: true }
  }

  await sendEmail({
    to: user.email,
    subject: "Confirmation de vote",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Confirmation de vote</h2>
        <p>Bonjour ${user.name},</p>
        <p>Nous confirmons que votre vote pour l'élection <strong>${electionTitle}</strong> a été enregistré avec succès.</p>
        <p>Vous avez voté pour: <strong>${candidateName}</strong></p>
        <p>Date et heure du vote: ${new Date().toLocaleString()}</p>
        <p>Merci de votre participation!</p>
        <p>Cordialement,<br>L'équipe E-Voting</p>
      </div>
    `,
  })

  return { success: true }
}

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendVoteConfirmationEmail,
}
