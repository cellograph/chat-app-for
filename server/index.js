import express from "express";
import logger from "morgan";
import { Server } from "socket.io";
import { createServer } from "node:http";

const app = express();
const server = createServer(app);
const io = new Server(server);
const port = process.env.PORT ?? 3000;
app.use(logger("dev"));
app.use(express.static("client"));

io.on("connection", (socket) => {
	console.log("A user connected");
	socket.on("disconnect", () => {
		console.log("A user has disconnected");
	});
	socket.on("message", (msg) => {
		console.log("message received: ", msg);
	});
});

app.get("/", (req, res) => {
	res.sendFile(process.cwd() + "/client/index.html");
});

server.listen(3000, () => {
	console.log(`Chat App listening on port http://localhost:${port}`);
});
