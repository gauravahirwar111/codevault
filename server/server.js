const File = require("./models/File");
const Repository = require("./models/repository");
const authMiddleware = require("./middleware/authmiddleware");
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
        await mongoose.connect(process.env.MONGODB_URI);

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

app.post("/api/auth/login", async (req, res) => {
    console.log("Login request received:", req.body.identifier);
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                message: "Username/email and password are required"
            });
        }

        const loginId = identifier.trim().toLowerCase();

        console.log("Searching for user:", loginId);

        const user = await User.findOne({
            $or: [
                { email: loginId },
                { username: loginId }
            ]
        }).select("+passwordHash");

        console.log("User lookup completed:", !!user);

        if (!user) {
            return res.status(401).json({
                message: "Invalid username/email or password"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.passwordHash
        );

        console.log("User found:", !!user);
        console.log("Password matched:", isMatch);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid username/email or password"
            });
        }

        const token = jwt.sign(
            {
                sub: user._id.toString(),
                username: user.username
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1h"
            }
        );
        console.log("JWT generated:", !!token);
        console.log("Sending successful login response");

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
});
app.get("/api/debug/user", async (req, res) => {
    try {
        const user = await User.findOne({
            email: "gauravf519@gmail.com"
        }).select("+passwordHash");

        res.json({
            found: !!user,
            username: user?.username,
            hasPasswordHash: !!user?.passwordHash
        });
    } catch (error) {
        console.error("Debug lookup error:", error);
        res.status(500).json({ message: error.message });
    }
});

app.post("/api/repositories", authMiddleware, async (req, res) => {
    try {
        const { name, description, visibility } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Repository name is required."
            });
        }

        if (visibility && !["public", "private"].includes(visibility)) {
            return res.status(400).json({
                message: "Visibility must be public or private."
            });
        }

        const repository = await Repository.create({
            name: name.trim(),
            description: description || "",
            visibility: visibility || "public",
            owner: req.user.id
        });

        res.status(201).json({
            message: "Repository created successfully.",
            repository
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "You already have a repository with this name."
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message
            });
        }

        console.error("Repository creation error:", error);

        res.status(500).json({
            message: "Failed to create repository."
        });
    }
});

app.get("/api/repositories", authMiddleware, async (req, res) => {
    try {
        const repositories = await Repository.find({
            owner: req.user.id
        }).sort({ createdAt: -1 });

        res.json({ repositories });
    } catch (error) {
        console.error("Repository fetch error:", error);

        res.status(500).json({
            message: "Failed to fetch repositories."
        });
    }
});

app.post("/api/repositories/:repositoryId/files", authMiddleware, async (req, res) => {
    try {
        const { path, content = "" } = req.body;
        const { repositoryId } = req.params;

        if (!path || typeof path !== "string" || typeof content !== "string") {
            return res.status(400).json({
                message: "Valid file path and content are required."
            });
        }

        const normalizedPath = path.replace(/\\/g, "/");

        if (
            normalizedPath.startsWith("/") ||
            normalizedPath.split("/").some(part =>
                !part || part === "." || part === ".."
            ) ||
            normalizedPath.length > 500
        ) {
            return res.status(400).json({
                message: "Invalid file path."
            });
        }

        const repository = await Repository.findOne({
            _id: repositoryId,
            owner: req.user.id
        });

        if (!repository) {
            return res.status(404).json({
                message: "Repository not found."
            });
        }

        const file = await File.create({
            repository: repository._id,
            owner: req.user.id,
            path: normalizedPath,
            content
        });

        res.status(201).json({
            message: "File created successfully.",
            file
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "A file with this path already exists."
            });
        }

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid repository ID."
            });
        }

        console.error("File creation error:", error);

        res.status(500).json({
            message: "Failed to create file."
        });
    }
});

app.get("/api/repositories/:repositoryId/files", authMiddleware, async (req, res) => {
    try {
        const { repositoryId } = req.params;

        const repository = await Repository.findOne({
            _id: repositoryId,
            owner: req.user.id
        });

        if (!repository) {
            return res.status(404).json({
                message: "Repository not found."
            });
        }

        const files = await File.find({
            repository: repository._id,
            owner: req.user.id
        }).sort({ path: 1 });

        res.json({ files });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid repository ID."
            });
        }

        console.error("File listing error:", error);

        res.status(500).json({
            message: "Failed to fetch files."
        });
    }
});


startServer();
