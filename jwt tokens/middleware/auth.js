// middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/usermodel.js"; // adjust path if needed

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || req.headers.Authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "No token provided, authorization denied." });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user (without password)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid token: user not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Token is not valid." });
  }
};

export default auth;
