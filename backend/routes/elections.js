import express from "express"
import Election from "../models/Election.js"
import { protect, admin } from "../middleware/auth.js"

const router = express.Router()

// @route   POST /api/elections
// @desc    Create a new election
// @access  Private/Admin
router.post("/", protect, admin, async (req, res) => {
  try {
    const { title, description, startDate, endDate, candidates } = req.body

    const election = await Election.create({
      title,
      description,
      startDate,
      endDate,
      candidates,
      createdBy: req.user._id,
    })

    res.status(201).json(election)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/elections
// @desc    Get all elections
// @access  Public
router.get("/", async (req, res) => {
  try {
    const elections = await Election.find({}).sort({ startDate: -1 })
    res.json(elections)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/elections/active
// @desc    Get all active elections
// @access  Public
router.get("/active", async (req, res) => {
  try {
    const now = new Date()
    const elections = await Election.find({
      startDate: { $lte: now },
      endDate: { $gte: now },
      isActive: true,
    }).sort({ endDate: 1 })

    res.json(elections)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/elections/:id
// @desc    Get election by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const election = await Election.findById(req.params.id)

    if (election) {
      res.json(election)
    } else {
      res.status(404).json({ message: "Election not found" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT /api/elections/:id
// @desc    Update an election
// @access  Private/Admin
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const { title, description, startDate, endDate, candidates, isActive } = req.body

    const election = await Election.findById(req.params.id)

    if (election) {
      election.title = title || election.title
      election.description = description || election.description
      election.startDate = startDate || election.startDate
      election.endDate = endDate || election.endDate
      election.candidates = candidates || election.candidates
      election.isActive = isActive !== undefined ? isActive : election.isActive

      const updatedElection = await election.save()
      res.json(updatedElection)
    } else {
      res.status(404).json({ message: "Election not found" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   DELETE /api/elections/:id
// @desc    Delete an election
// @access  Private/Admin
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const election = await Election.findById(req.params.id)

    if (election) {
      await election.deleteOne()
      res.json({ message: "Election removed" })
    } else {
      res.status(404).json({ message: "Election not found" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router

