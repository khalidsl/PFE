import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, nationalId } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ email }, { nationalId }],
    });
    
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      nationalId,
      role: "voter", // Default role
    });
    
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        nationalId: user.nationalId,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for:", email);
    
    // Check for user email
    const user = await User.findOne({ email });
    console.log("User found:", user ? "Yes" : "No");

    if (user) {
      const isMatch = await user.comparePassword(password);
      console.log("Password match:", isMatch ? "Yes" : "No");
      

      
      if (isMatch) {
        res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          nationalId: user.nationalId,
          role: user.role,
          token: generateToken(user._id),
        });
      } else {
        res.status(401).json({ message: "Invalid email or password" });
      }
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        nationalId: user.nationalId,
        role: user.role,
        hasVoted: user.hasVoted,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/auth/admin
// @desc    Create an admin user
// @access  Private/Admin
router.post("/admin", protect, admin, async (req, res) => {
  try {
    const { name, email, password, nationalId } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ email }, { nationalId }],
    });
    
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    // Create new admin user
    const user = await User.create({
      name,
      email,
      password,
      nationalId,
      role: "admin",
    });
    
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        nationalId: user.nationalId,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;