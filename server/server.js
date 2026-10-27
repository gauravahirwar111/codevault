require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        message: "CodeVault API is running",
        database: mongoose.connection.readyState === 1
            ? "connected"
            : "disconnected"
    });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
}

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        if (!name || !username || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = username.trim().toLowerCase();

        if (!/^[a-z0-9_-]{3,30}$/.test(normalizedUsername)) {
            return res.status(400).json({
                message: "Username must be 3-30 characters and use letters, numbers, _ or -"
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Enter a valid email address"
            });
        }

        const existingUser = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { username: normalizedUsername }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email or username is already registered"
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: name.trim(),
            username: normalizedUsername,
            email: normalizedEmail,
            passwordHash
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email or username is already registered"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: "Invalid user data"
            });
        }

        console.error("Registration error:", error.message);

        res.status(500).json({
            message: "Something went wrong during registration"
        });
    }
});


startServer();
