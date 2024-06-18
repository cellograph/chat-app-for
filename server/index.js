import express from "express";
import logger from "morgan";
import dotenv from "dotenv";
import { createClient } from "@libsql/client";
import { Server } from "socket.io";
import { createServer } from "node:http";

dotenv.config();
const app = express();
const server = createServer(app);
const io = new Server(server, {
	connectionStateRecovery: {
		maxRetries: 10,
		retryTimeout: 1000,
	},
});

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

const port = process.env.PORT ?? 3000;

app.use(logger("dev"));
app.use(express.json());
app.use(express.static("client"));

const activeUsers = {};

io.use((socket, next) => {
	const token = socket.handshake.auth.token;
	const username = socket.handshake.auth.username;

	if (!token || !username) {
		return next(new Error("Authentication error"));
	}

	socket.token = token;
	socket.username = username;
	next();
});

io.on("connection", (socket) => {
	const token = socket.token;
	const username = socket.username;

	console.log(`User connected with username: ${username} and token: ${token}`);

	if (!activeUsers[token]) {
		activeUsers[token] = {};
	}
	activeUsers[token][username] = socket;

	socket.on("disconnect", () => {
		console.log(`User with username ${username} and token ${token} disconnected`);
		delete activeUsers[token][username];
		if (Object.keys(activeUsers[token]).length === 0) {
			delete activeUsers[token];
		}
	});

	socket.on("message", async (msg) => {
		if (Object.keys(activeUsers[token]).length >= 2) {
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
		} else {
			console.log("Message not saved. Less than two users connected with the same token.");
		}
	});
});

app.get("/", (req, res) => {
	res.sendFile(process.cwd() + "/client/index.html");
});

server.listen(port, () => {
	console.log(`Chat App listening on port http://localhost:${port}`);
});
