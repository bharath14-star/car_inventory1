// routes/userRoute.js
import express from "express";
import {
  fetch,
  create,
  update,
  deleteUser,
  login,
} from "../controllers/usercontroller.js";
import auth from "../middleware/auth.js";

const route = express.Router();

// Public
route.post("/signup", create);
route.post("/login", login);

// Protected
route.get("/getAllUsers", auth, fetch);
route.put("/update/:id", auth, update);
route.delete("/delete/:id", auth, deleteUser);

export default route;
