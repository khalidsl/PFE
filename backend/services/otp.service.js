const crypto = require("crypto")

// Durée de validité du code OTP (en minutes)
const OTP_VALIDITY_MINUTES = 10

/**
 * Génère un code OTP numérique de la longueur spécifiée
 * @param {number} length - Longueur du code OTP (par défaut 6)
 * @returns {string} - Code OTP généré
 */
const generateOTP = (length = 6) => {
  // Générer un nombre aléatoire avec le nombre de chiffres spécifié
  const min = Math.pow(10, length - 1)
  const max = Math.pow(10, length) - 1

  // Utiliser crypto pour une meilleure randomisation
  const randomBytes = crypto.randomBytes(4)
  const randomNumber = Number.parseInt(randomBytes.toString("hex"), 16)

  // S'assurer que le nombre est dans la plage souhaitée
  const otp = (randomNumber % (max - min + 1)) + min

  return otp.toString()
}

/**
 * Hache un code OTP avec un sel pour le stockage sécurisé
 * @param {string} otp - Code OTP à hacher
 * @returns {object} - Objet contenant le hachage et le sel
 */
const hashOTP = (otp) => {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.createHmac("sha256", salt).update(otp).digest("hex")

  return {
    hash,
    salt,
  }
}

/**
 * Vérifie si un code OTP correspond au hachage stocké
 * @param {string} otp - Code OTP à vérifier
 * @param {string} hash - Hachage stocké
 * @param {string} salt - Sel utilisé pour le hachage
 * @returns {boolean} - True si le code OTP est valide
 */
const verifyOTP = (otp, hash, salt) => {
  const computedHash = crypto.createHmac("sha256", salt).update(otp).digest("hex")

  return computedHash === hash
}

/**
 * Vérifie si un code OTP a expiré
 * @param {Date} createdAt - Date de création du code OTP
 * @returns {boolean} - True si le code OTP a expiré
 */
const isOTPExpired = (createdAt) => {
  const now = new Date()
  const expiryTime = new Date(createdAt.getTime() + OTP_VALIDITY_MINUTES * 60000)

  return now > expiryTime
}

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  isOTPExpired,
  OTP_VALIDITY_MINUTES,
}
