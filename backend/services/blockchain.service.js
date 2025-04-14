const Blockchain = require("../models/Blockchain")
const crypto = require("crypto")

// Initialiser la blockchain
const initializeBlockchain = async () => {
  try {
    let blockchain = await Blockchain.findOne()

    if (!blockchain) {
      console.log("Création d'une nouvelle blockchain...")
      const genesisBlock = {
        index: 0,
        timestamp: Date.now(),
        transactions: [],
        previousHash: "0",
        hash: calculateBlockHash({
          index: 0,
          timestamp: Date.now(),
          transactions: [],
          previousHash: "0",
          nonce: 0,
        }),
        nonce: 0,
      }

      blockchain = new Blockchain({
        chain: [genesisBlock],
        pendingTransactions: [],
      })

      await blockchain.save()
      console.log("Blockchain initialisée avec succès")
    } else {
      console.log(`Blockchain existante chargée avec ${blockchain.chain ? blockchain.chain.length : 0} blocs`)
    }

    // Vérifier que la blockchain a une chaîne valide
    if (!blockchain.chain || blockchain.chain.length === 0) {
      console.log("La chaîne blockchain est vide, création du bloc genesis...")
      const genesisBlock = {
        index: 0,
        timestamp: Date.now(),
        transactions: [],
        previousHash: "0",
        hash: calculateBlockHash({
          index: 0,
          timestamp: Date.now(),
          transactions: [],
          previousHash: "0",
          nonce: 0,
        }),
        nonce: 0,
      }

      blockchain.chain = [genesisBlock]
      await blockchain.save()
      console.log("Bloc genesis créé et ajouté à la blockchain")
    }

    return blockchain
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la blockchain:", error)
    // Créer une blockchain temporaire en mémoire pour éviter les erreurs
    return {
      chain: [
        {
          index: 0,
          timestamp: Date.now(),
          transactions: [],
          previousHash: "0",
          hash: "genesis_temporary",
          nonce: 0,
        },
      ],
      pendingTransactions: [],
      _id: "temporary",
      save: async () => {
        console.log("Sauvegarde temporaire (non persistante)")
      },
    }
  }
}

// Ajouter un vote à la blockchain
const addVoteToBlockchain = async (vote) => {
  try {
    const blockchain = await initializeBlockchain()

    const transaction = {
      voteId: vote._id.toString(),
      userId: vote.voter.toString(),
      electionId: vote.election.toString(),
      candidateId: vote.candidate.toString(),
      timestamp: vote.timestamp || Date.now(),
    }

    // Calculer le hash de la transaction
    const hash = crypto.createHash("sha256").update(JSON.stringify(transaction)).digest("hex")

    // Ajouter la transaction aux transactions en attente
    blockchain.pendingTransactions.push(transaction)
    await blockchain.save()

    console.log(`Vote ajouté aux transactions en attente: ${hash}`)
    return { success: true, hash }
  } catch (error) {
    console.error("Erreur lors de l'ajout du vote à la blockchain:", error)
    // Retourner un hash temporaire pour éviter les erreurs côté client
    const tempHash = crypto
      .createHash("sha256")
      .update(
        JSON.stringify({
          voteId: vote._id.toString(),
          timestamp: Date.now(),
        }),
      )
      .digest("hex")

    return { success: false, hash: tempHash, error: error.message }
  }
}

// Miner un nouveau bloc
const mineVotes = async () => {
  try {
    const blockchain = await initializeBlockchain()

    // Vérifier s'il y a des transactions en attente
    if (!blockchain.pendingTransactions || blockchain.pendingTransactions.length === 0) {
      console.log("Pas de transactions en attente à miner")
      return null
    }

    // S'assurer que la chaîne existe et contient au moins un bloc
    if (!blockchain.chain || blockchain.chain.length === 0) {
      console.error("La chaîne blockchain est vide ou non initialisée")
      return null
    }

    const lastBlock = blockchain.chain[blockchain.chain.length - 1]

    // Créer un nouveau bloc
    const newBlock = {
      index: lastBlock.index + 1,
      timestamp: Date.now(),
      transactions: [...blockchain.pendingTransactions],
      previousHash: lastBlock.hash,
      nonce: 0,
    }

    // Miner le bloc (trouver un nonce valide)
    let nonce = 0
    let hash = calculateBlockHash(newBlock)
    const difficulty = 2 // Ajuster selon les besoins

    while (hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
      nonce++
      newBlock.nonce = nonce
      hash = calculateBlockHash(newBlock)

      // Limiter le nombre d'itérations pour éviter une boucle infinie
      if (nonce > 10000) {
        console.log("Minage limité à 10000 itérations")
        break
      }
    }

    newBlock.hash = hash

    // Ajouter le bloc à la chaîne
    blockchain.chain.push(newBlock)
    blockchain.pendingTransactions = []
    await blockchain.save()

    console.log(`Nouveau bloc miné: ${hash}`)
    return newBlock
  } catch (error) {
    console.error("Erreur lors du minage d'un bloc:", error)
    return null
  }
}

// Calculer le hash d'un bloc
const calculateBlockHash = (block) => {
  return crypto
    .createHash("sha256")
    .update(
      (block.index || 0).toString() +
        block.timestamp.toString() +
        JSON.stringify(block.transactions || []) +
        (block.previousHash || "") +
        (block.nonce || 0).toString(),
    )
    .digest("hex")
}

// Vérifier un vote dans la blockchain
const verifyVote = async (vote) => {
  try {
    const blockchain = await initializeBlockchain()
    const voteId = vote._id.toString()

    // Vérifier si la chaîne existe
    if (!blockchain.chain || blockchain.chain.length === 0) {
      return { verified: false, message: "Blockchain non initialisée" }
    }

    // Parcourir tous les blocs pour trouver la transaction
    for (const block of blockchain.chain) {
      if (!block.transactions) continue

      for (const transaction of block.transactions) {
        if (transaction.voteId === voteId) {
          // Vérifier que les données correspondent
          const dataMatch =
            transaction.userId === vote.voter.toString() &&
            transaction.electionId === vote.election.toString() &&
            transaction.candidateId === vote.candidate.toString()

          return {
            verified: dataMatch,
            blockIndex: block.index,
            blockHash: block.hash,
          }
        }
      }
    }

    // Vérifier si le vote est dans les transactions en attente
    if (blockchain.pendingTransactions) {
      for (const transaction of blockchain.pendingTransactions) {
        if (transaction.voteId === voteId) {
          return {
            verified: false,
            message: "Vote en attente d'inclusion dans un bloc",
          }
        }
      }
    }

    return { verified: false, message: "Vote non trouvé dans la blockchain" }
  } catch (error) {
    console.error("Erreur lors de la vérification du vote:", error)
    return { verified: false, message: "Erreur lors de la vérification: " + error.message }
  }
}

// Obtenir le statut de la blockchain
const getBlockchainStatus = async () => {
  try {
    const blockchain = await initializeBlockchain()

    // Vérifier si la chaîne existe
    if (!blockchain || !blockchain.chain || blockchain.chain.length === 0) {
      return {
        error: "Blockchain non initialisée",
        chainLength: 0,
        pendingVotes: 0,
        isValid: false,
      }
    }

    // Calculer des statistiques
    const chainLength = blockchain.chain.length
    const lastBlock = blockchain.chain[chainLength - 1]
    const pendingVotes = blockchain.pendingTransactions ? blockchain.pendingTransactions.length : 0

    // Vérifier l'intégrité de la chaîne
    const isValid = await validateChain(blockchain)

    // Vérifier que lastBlock a toutes les propriétés nécessaires
    if (!lastBlock) {
      return {
        error: "Dernier bloc non disponible",
        chainLength,
        pendingVotes,
        isValid,
      }
    }

    return {
      chainLength,
      latestBlock: {
        index: lastBlock.index || 0,
        timestamp: lastBlock.timestamp || Date.now(),
        hash: lastBlock.hash || "inconnu",
        voteCount: lastBlock.transactions ? lastBlock.transactions.length : 0,
      },
      pendingVotes,
      isValid,
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du statut de la blockchain:", error)
    // Retourner un état par défaut au lieu de lancer une erreur
    return {
      error: error.message,
      chainLength: 0,
      pendingVotes: 0,
      isValid: false,
    }
  }
}

// Valider l'intégrité de la chaîne
const validateChain = async (blockchain) => {
  try {
    if (!blockchain || !blockchain.chain || blockchain.chain.length <= 1) {
      return true // Une chaîne vide ou avec seulement le bloc genesis est valide
    }

    for (let i = 1; i < blockchain.chain.length; i++) {
      const currentBlock = blockchain.chain[i]
      const previousBlock = blockchain.chain[i - 1]

      // Vérifier que les blocs ont toutes les propriétés nécessaires
      if (!currentBlock || !previousBlock || !currentBlock.hash || !previousBlock.hash || !currentBlock.previousHash) {
        return false
      }

      // Vérifier le lien avec le bloc précédent
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false
      }

      // Vérifier le hash du bloc
      const calculatedHash = calculateBlockHash(currentBlock)
      if (currentBlock.hash !== calculatedHash) {
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Erreur lors de la validation de la chaîne:", error)
    return false
  }
}

module.exports = {
  initializeBlockchain,
  addVoteToBlockchain,
  mineVotes,
  verifyVote,
  getBlockchainStatus,
  validateChain,
}
