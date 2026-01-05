import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true, // IMPORTANT: no duplicate emails
      lowercase: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true, // For login
      minlength: 6,
    },
  },
  {
    timestamps: true, // auto adds createdAt & updatedAt
  }
);

export default mongoose.model("users", userSchema);
