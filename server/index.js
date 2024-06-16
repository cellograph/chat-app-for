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

await db.execute(
	`CREATE TABLE IF NOT EXISTS messages (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	content TEXT,
	date DATETIME DEFAULT CURRENT_TIMESTAMP
)`
);

const port = process.env.PORT ?? 3000;

app.use(logger("dev"));
app.use(express.static("client"));

io.on("connection", (socket) => {
	console.log("A user connected");
	socket.on("disconnect", () => {
		console.log("A user has disconnected");
	});
	socket.on("message", async (msg) => {
		let message;
		try {
			const now = new Date();
			const formattedDate = `${now.toLocaleTimeString()} ${now.toLocaleDateString()}`;
			message = await db.execute({
				sql: `INSERT INTO messages (content, date) VALUES (:msg, :date)`,
				args: { msg, date: formattedDate },
			});
		} catch (e) {
			console.log(e);
			return;
		}
		io.emit("message", msg);
	});
});

app.get("/", (req, res) => {
	res.sendFile(process.cwd() + "/client/index.html");
});

server.listen(3000, () => {
	console.log(`Chat App listening on port http://localhost:${port}`);
});
