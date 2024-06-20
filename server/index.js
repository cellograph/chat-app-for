import express from "express";
import logger from "morgan";
import dotenv from "dotenv";
import { createClient } from "@libsql/client";
import { Server } from "socket.io";
import { createServer } from "node:http";
import { v4 as uuidv4 } from "uuid";

// Load environment variables from .env file
dotenv.config();

// Initialize Express app and create HTTP server
const app = express();
const server = createServer(app);

// Initialize Socket.IO server with connection state recovery
const io = new Server(server, { connectionStateRecovery: true });

// Create database client
const db = createClient({
	url: process.env.DATABASE_URL,
	authToken: process.env.DATABASE_AUTH_TOKEN,
});

// Ensure necessary database tables exist
await db.execute(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT,
        username TEXT,
        content TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

await db.execute(`
    CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Define the port for the Express app
const port = process.env.PORT ?? 3000;

// Middleware setup
app.use(logger("dev")); // Logging middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.static("client")); // Serve static files from 'client' directory

// Object to track active users and their counts by token
const activeUsers = {};
const activeUserCounts = {};

// Socket.IO middleware for authentication and error handling
io.use(async (socket, next) => {
	const token = socket.handshake.auth.token;
	const username = socket.handshake.auth.username;

	if (!token || !username) {
		if (socket.handshake.query.purpose === "generateToken") {
			return next();
		}
		return next(new Error("Authentication error"));
	}

	try {
		const result = await db.execute({
			sql: `SELECT token FROM tokens WHERE token = ?`,
			args: [token],
		});

		if (result.rows.length === 0) {
			return next(new Error("Invalid token"));
		}

		socket.token = token;
		socket.username = username;
		next();
	} catch (error) {
		return next(new Error("Database error"));
	}
});

// Socket.IO event handlers
io.on("connection", async (socket) => {
	const purpose = socket.handshake.query.purpose;

	if (purpose === "generateToken") {
		socket.on("generateToken", async () => {
			const generatedToken = uuidv4().split("-")[0];
			await db
				.execute({
					sql: `INSERT INTO tokens (token) VALUES (?)`,
					args: [generatedToken],
				})
				.catch((error) => {
					console.error("Error inserting token into database:", error);
				});
			socket.emit("generated-token", generatedToken);
			socket.disconnect();
		});
	} else {
		const token = socket.token;
		const username = socket.username;

		console.log(`User connected with username: ${username} and token: ${token}`);

		// Manage active users and their counts
		if (!activeUsers[token]) {
			activeUsers[token] = {};
			activeUserCounts[token] = 0;
		}

		activeUsers[token][username] = socket;
		activeUserCounts[token]++;

		// Emit current user count to all clients
		io.emit("update-user-count", activeUserCounts[token]);

		// Send previous messages to the newly connected user
		try {
			const messages = await db.execute({
				sql: `SELECT username, content, date FROM messages WHERE token = ? ORDER BY date ASC`,
				args: [token],
			});

			messages.rows.forEach((msg) => {
				socket.emit("message", msg.content, msg.username, msg.date);
			});
		} catch (error) {
			console.error("Error fetching messages from database:", error);
		}

		socket.on("disconnect", async () => {
			console.log(`User with username ${username} and token ${token} disconnected`);
			delete activeUsers[token][username];
			activeUserCounts[token]--;

			if (activeUserCounts[token] === 0) {
				// No users left with this token, delete the token and its messages from the database
				try {
					await db.execute({
						sql: `DELETE FROM tokens WHERE token = ?`,
						args: [token],
					});
					await db.execute({
						sql: `DELETE FROM messages WHERE token = ?`,
						args: [token],
					});
				} catch (error) {
					console.error("Error deleting token/messages from database:", error);
				}
			}

			// Emit updated user count to all clients
			io.emit("update-user-count", activeUserCounts[token]);
		});

		socket.on("message", async (msg) => {
			const now = new Date();
			const formattedDate = now.toISOString();

			try {
				await db.execute({
					sql: `INSERT INTO messages (token, username, content, date) VALUES (?, ?, ?, ?)`,
					args: [token, username, msg, formattedDate],
				});

				Object.keys(activeUsers[token]).forEach((user) => {
					activeUsers[token][user].emit("message", msg, username, formattedDate);
				});
			} catch (error) {
				console.error("Error inserting message into database:", error);
			}
		});
	}
});

// Serve index.html for root URL
app.get("/", (req, res) => {
	res.sendFile(process.cwd() + "/client/index.html");
});

// Start listening on the specified port
server.listen(port, () => {
	console.log(`Chat App listening on port http://localhost:${port}`);
});
