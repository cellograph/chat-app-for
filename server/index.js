import express from "express";
import logger from "morgan";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { createServer } from "node:http";

dotenv.config();
const app = express();
const server = createServer(app);
const io = new Server(server, { connectionStateRecovery: true });

const port = process.env.PORT ?? 3000;

app.use(logger("dev"));
app.use(express.json());
app.use(express.static("client"));

io.on("connection", (socket) => {
	console.log(`User connected with username: ${socket.handshake.auth.username}`);

	socket.on("disconnect", () => {
		console.log(`User with username ${socket.handshake.auth.username} disconnected`);
	});

	socket.on("message", async (msg) => {
		const now = new Date();
		const formattedDate = now.toLocaleString();

		const messageData = {
			username: socket.handshake.auth.username,
			content: msg,
			date: formattedDate,
		};

		io.emit("message", messageData.content, messageData.date, messageData.username);
	});
});

app.get("/", (req, res) => {
	res.sendFile(process.cwd() + "/client/index.html");
});

server.listen(port, () => {
	console.log(`Chat App listening on port http://localhost:${port}`);
});
