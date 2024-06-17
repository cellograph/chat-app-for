import express from "express";
import logger from "morgan";
import dotenv from "dotenv";
import { createClient } from "@libsql/client";
import { Server } from "socket.io";
import { createServer } from "node:http";

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
		content TEXT,
		date DATETIME DEFAULT CURRENT_TIMESTAMP
	)
`);

const port = process.env.PORT ?? 3000;

app.use(logger("dev"));
app.use(express.json());
app.use(express.static("client"));

const tokenMap = new Map();

io.use((socket, next) => {
	const token = socket.handshake.auth.token;
	if (token) {
		socket.token = token;
		next();
	} else {
		next(new Error("Authentication error"));
	}
});

io.on("connection", (socket) => {
	console.log(`User connected with token: ${socket.token}`);

	if (!tokenMap.has(socket.token)) {
		tokenMap.set(socket.token, []);
	}
	tokenMap.get(socket.token).push(socket);

	socket.on("disconnect", () => {
		console.log(`User with token ${socket.token} disconnected`);
		const sockets = tokenMap.get(socket.token);
		const index = sockets.indexOf(socket);
		if (index !== -1) {
			sockets.splice(index, 1);
		}
		if (sockets.length === 0) {
			tokenMap.delete(socket.token);
		}
	});

	socket.on("message", async (msg) => {
		try {
			const now = new Date();
			const formattedDate = now.toLocaleString();

			await db.execute({
				sql: `INSERT INTO messages (token, content, date) VALUES (:token, :content, :date)`,
				args: { token: socket.token, content: msg, date: formattedDate },
			});

			const messageData = {
				token: socket.token,
				content: msg,
				date: formattedDate,
			};

			const sockets = tokenMap.get(socket.token);
			if (sockets) {
				sockets.forEach((s) => s.emit("message", messageData.content, messageData.date));
			}
		} catch (error) {
			console.error(error);
		}
	});
});

app.get("/", (req, res) => {
	res.sendFile(process.cwd() + "/client/index.html");
});

server.listen(port, () => {
	console.log(`Chat App listening on port http://localhost:${port}`);
});
