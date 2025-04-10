const Block = require("./Block")
const VoteTransaction = require("./VoteTransaction")
const mongoose = require("mongoose")
const BlockchainModel = require("../models/Blockchain")

class Blockchain {
  constructor() {
    this.chain = []
    this.difficulty = 2
    this.pendingVotes = []
    this.miningReward = 0 // Pas de récompense pour le minage dans ce cas

    // Initialiser la blockchain avec le bloc genesis si elle est vide
    this.initializeChain()
  }

  async initializeChain() {
    try {
      // Vérifier si la blockchain existe déjà dans la base de données
      const storedChain = await BlockchainModel.find().sort({ index: 1 })

      if (storedChain.length > 0) {
        // Charger la chaîne existante
        this.chain = storedChain.map((block) => ({
          timestamp: block.timestamp,
          votes: block.votes.map(
            (vote) => new VoteTransaction(vote.electionId, vote.candidateId, vote.voterId, vote.signature),
          ),
          previousHash: block.previousHash,
          hash: block.hash,
          nonce: block.nonce,
          index: block.index,
        }))

        console.log(`Blockchain chargée avec ${this.chain.length} blocs`)
      } else {
        // Créer le bloc genesis
        console.log("Création du bloc genesis...")
        await this.createGenesisBlock()
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la blockchain:", error)
      // Créer le bloc genesis en cas d'erreur
      await this.createGenesisBlock()
    }
  }

  async createGenesisBlock() {
    const genesisBlock = new Block(Date.now(), [], "0")
    genesisBlock.mineBlock(this.difficulty)
    this.chain.push(genesisBlock)

    // Sauvegarder le bloc genesis dans la base de données
    await this.saveBlockToDB(genesisBlock, 0)

    console.log("Bloc genesis créé et sauvegardé")
  }

  async saveBlockToDB(block, index) {
    try {
      const blockData = {
        index,
        timestamp: block.timestamp,
        votes: block.votes.map((vote) => ({
          electionId: vote.electionId,
          candidateId: vote.candidateId,
          voterId: vote.voterId,
          signature: vote.signature,
        })),
        previousHash: block.previousHash,
        hash: block.hash,
        nonce: block.nonce,
      }

      await BlockchainModel.create(blockData)
      console.log(`Bloc #${index} sauvegardé dans la base de données`)
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde du bloc #${index}:`, error)
    }
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1]
  }

  // Ajouter un vote à la liste des votes en attente
  addVote(electionId, candidateId, voterId, privateKey) {
    const vote = new VoteTransaction(electionId, candidateId, voterId, privateKey)
    this.pendingVotes.push(vote)
    return vote
  }

  // Miner les votes en attente et créer un nouveau bloc
  async minePendingVotes() {
    if (this.pendingVotes.length === 0) {
      console.log("Pas de votes en attente à miner")
      return null
    }

    console.log(`Minage d'un nouveau bloc avec ${this.pendingVotes.length} votes...`)

    const block = new Block(Date.now(), this.pendingVotes, this.getLatestBlock().hash)

    block.mineBlock(this.difficulty)

    console.log("Bloc miné avec succès!")
    this.chain.push(block)

    // Sauvegarder le bloc dans la base de données
    await this.saveBlockToDB(block, this.chain.length - 1)

    // Réinitialiser les votes en attente
    this.pendingVotes = []

    return block
  }

  // Vérifier si la blockchain est valide
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i]
      const previousBlock = this.chain[i - 1]

      // Vérifier si le hash du bloc est valide
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        console.log("Hash du bloc invalide")
        return false
      }

      // Vérifier si le bloc pointe vers le bon bloc précédent
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.log("Lien de hash précédent invalide")
        return false
      }

      // Vérifier si tous les votes dans le bloc sont valides
      if (!currentBlock.hasValidVotes()) {
        console.log("Le bloc contient des votes invalides")
        return false
      }
    }

    return true
  }

  // Obtenir tous les votes pour une élection spécifique
  getVotesForElection(electionId) {
    const votes = []

    for (const block of this.chain) {
      for (const vote of block.votes) {
        if (vote.electionId === electionId) {
          votes.push(vote)
        }
      }
    }

    return votes
  }

  // Vérifier si un utilisateur a déjà voté pour une élection
  hasVoted(electionId, voterId) {
    for (const block of this.chain) {
      for (const vote of block.votes) {
        if (vote.electionId === electionId && vote.voterId === voterId) {
          return true
        }
      }
    }

    // Vérifier également dans les votes en attente
    for (const vote of this.pendingVotes) {
      if (vote.electionId === electionId && vote.voterId === voterId) {
        return true
      }
    }

    return false
  }

  // Obtenir l'historique des votes d'un utilisateur
  getUserVotingHistory(voterId) {
    const history = []

    for (const block of this.chain) {
      for (const vote of block.votes) {
        if (vote.voterId === voterId) {
          history.push({
            electionId: vote.electionId,
            candidateId: vote.candidateId,
            timestamp: block.timestamp,
            blockHash: block.hash,
          })
        }
      }
    }

    return history
  }
}

module.exports = Blockchain

