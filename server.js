
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// Read JSON request bodies
app.use(express.json());
app.use(express.static("public"));

// Store sessions in MySQL
const sessionStore = new MySQLStore(
    {
        createDatabaseTable: true,
        clearExpired: true
    },
    pool
);
app.locals.sessionStore = sessionStore;

// Configure authentication sessions
app.use(
    session({
        name: "auth.sid",
        secret: process.env.SESSION_SECRET,
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false, // Local HTTP development only
            sameSite: "lax",
            maxAge: 1000 * 60 * 60
        }
    })
);

// Test route
app.get("/", (req, res) => {
    res.send("User Authentication API is running!");
});

const bcrypt = require("bcrypt");

// Signup API
app.post("/api/auth/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (cleanName.length > 100 || cleanEmail.length > 255) {
            return res.status(400).json({
                message: "Name or email is too long"
            });
        }

        // Basic email format validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(cleanEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
            return res.status(400).json({
                message: "Password must be at least 12 characters and no more than 72 UTF-8 bytes"
            });
        }

        // Check whether the email already exists
        const [existingUsers] = await pool.execute(
            "SELECT id FROM users WHERE email = ?",
            [cleanEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "An account with this email already exists"
            });
        }

        // Hash the password; never store the plain-text password
        const passwordHash = await bcrypt.hash(password, 12);

        // Insert the new account
        const [result] = await pool.execute(
            `INSERT INTO users (name, email, password_hash)
             VALUES (?, ?, ?)`,
            [cleanName, cleanEmail, passwordHash]
        );

        return res.status(201).json({
            message: "Account created successfully",
            user: {
                id: result.insertId,
                name: cleanName,
                email: cleanEmail
            }
        });
    } catch (error) {
        // Also handle duplicate emails if simultaneous requests race
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "An account with this email already exists"
            });
        }

        console.error("Signup error:", error.message);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
});


// Start server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

module.exports = app;
app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error("Logout error:", error.message);

            return res.status(500).json({
                message: "Unable to log out right now"
            });
        }

        res.clearCookie("auth.sid", {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/"
        });

        return res.status(200).json({
            message: "Logout successful"
        });
    });
});


app.get("/api/auth/profile", async (req, res) => {
    try {
        // Check whether the user has a login session.
        if (!req.session.userId) {
            return res.status(401).json({
                message: "Please log in to access your profile"
            });
        }

        // Fetch the user's profile without the password hash.
        const [users] = await pool.execute(
            `SELECT id, name, email, created_at
             FROM users
             WHERE id = ?`,
            [req.session.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "User account not found"
            });
        }

        return res.status(200).json({
            user: users[0]
        });
    } catch (error) {
        console.error("Profile error:", error.message);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
});


app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const [users] = await pool.execute(
            `SELECT id, name, email, password_hash
             FROM users
             WHERE email = ?`,
            [cleanEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Create a fresh session after successful authentication.
        req.session.regenerate((error) => {
            if (error) {
                console.error("Session regeneration error:", error.message);

                return res.status(500).json({
                    message: "Unable to log in right now"
                });
            }

            req.session.userId = user.id;

            req.session.save((saveError) => {
                if (saveError) {
                    console.error("Session save error:", saveError.message);

                    return res.status(500).json({
                        message: "Unable to log in right now"
                    });
                }

                return res.status(200).json({
                    message: "Login successful",
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email
                    }
                });
            });
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
});

