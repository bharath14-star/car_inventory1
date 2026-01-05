// controllers/usercontroller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/usermodel.js"; // adjust path if needed

const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// SIGNUP / CREATE
export const create = async (req, res) => {
  try {
    const { name, email, address, password } = req.body;
    if (!name || !email || !address || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const userExist = await User.findOne({ email });
    if (userExist)
      return res.status(400).json({ message: "User already exists." });

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      address,
      password: hashedPassword,
    });
    const savedUser = await newUser.save();

    const token = generateToken(savedUser);
    const userResp = savedUser.toObject();
    delete userResp.password;

    res.status(201).json({ user: userResp, token });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials." });

    const token = generateToken(user);
    const userResp = user.toObject();
    delete userResp.password;

    res.status(200).json({ user: userResp, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// GET ALL USERS (protected)
export const fetch = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    if (!users.length)
      return res.status(404).json({ message: "No users found." });
    res.status(200).json(users);
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// UPDATE USER (protected)
export const update = async (req, res) => {
  try {
    const id = req.params.id;

    const userExist = await User.findById(id);
    if (!userExist) return res.status(404).json({ message: "User not found." });

    // If password is present in update payload, hash it
    if (req.body.password) {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
      const salt = await bcrypt.genSalt(saltRounds);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(id, req.body, {
      new: true,
    }).select("-password");
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// DELETE USER (protected)
export const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const userExist = await User.findById(id);
    if (!userExist) return res.status(404).json({ message: "User not found." });

    await User.findByIdAndDelete(id);
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
