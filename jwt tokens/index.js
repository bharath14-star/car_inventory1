// index.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import route from "./routes/userRoute.js";

dotenv.config();

const app = express();
app.use(express.json());

// mount routes
app.use("/api/user", route);

const PORT = process.env.PORT || 5000;
const MONGOURL = process.env.MONGO_URL;

mongoose
  .connect(MONGOURL)
  .then(() => {
    console.log("Database connected successfully");
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  })
  .catch((error) => console.log("DB Error:", error));
