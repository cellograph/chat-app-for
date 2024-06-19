import express from "express";
import logger from "morgan";
import dotenv from "dotenv";
import { createClient } from "@libsql/client";
import { Server } from "socket.io";
import { createServer } from "node:http";
import { v4 as uuidv4 } from "uuid";

dotenv.config();
const app = express();
const server = createServer(app);
const io = new Server(server, { connectionStateRecovery: true });

const db = createClient({
	url: process.env.DATABASE_URL,
	authToken: process.env.DATABASE_AUTH_TOKEN,
});

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

const port = process.env.PORT ?? 3000;

app.use(logger("dev"));
app.use(express.json());
app.use(express.static("client"));

const activeUsers = {};

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

		if (!activeUsers[token]) {
			activeUsers[token] = {};
		}
		activeUsers[token][username] = socket;

		// Send previous messages to the newly connected user
		try {
			const messages = await db.execute({
				sql: `SELECT username, content, date FROM messages WHERE token = ? ORDER BY date ASC`,
				args: [token],
			});

			messages.rows.forEach((msg) => {
				socket.emit("message", msg.content, msg.username);
			});
		} catch (error) {
			console.error("Error fetching messages from database:", error);
		}

		socket.on("disconnect", async () => {
			console.log(`User with username ${username} and token ${token} disconnected`);
			delete activeUsers[token][username];
			if (Object.keys(activeUsers[token]).length === 0) {
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
		});

		socket.on("message", async (msg) => {
			const now = new Date();
			const formattedDate = now.toLocaleString();

			try {
				await db.execute({
					sql: `INSERT INTO messages (token, username, content, date) VALUES (?, ?, ?, ?)`,
					args: [token, username, msg, formattedDate],
				});

				Object.keys(activeUsers[token]).forEach((user) => {
					activeUsers[token][user].emit("message", msg, username);
				});
			} catch (error) {
				console.error("Error inserting message into database:", error);
			}
		});
	}
});

app.get("/", (req, res) => {
	res.sendFile(process.cwd() + "/client/index.html");
});

server.listen(port, () => {
	console.log(`Chat App listening on port http://localhost:${port}`);
});
