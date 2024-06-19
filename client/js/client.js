import { io } from "https://cdn.socket.io/4.5.1/socket.io.esm.min.js";

let socket;
let currentToken;
let currentUsername;
const userColors = {};

function getToken() {
	socket = io({
		query: {
			purpose: "generateToken",
		},
	});

	socket.on("connect", () => {
		console.log("Conectado al servidor para generar token");
		socket.emit("generateToken");

		socket.on("generated-token", (token) => {
			console.log("Token recibido:", token);
			const tokenDisplay = document.getElementById("token-display");
			tokenDisplay.textContent = token;

			socket.disconnect();
			console.log("Socket desconectado después de recibir el token");
		});

		socket.on("token-error", (message) => {
			console.error(message);
			alert("Error generating token. Please try again.");
			socket.disconnect();
		});
	});

	socket.on("connect_error", (err) => {
		console.error("Error de conexión:", err);
	});
}

async function copyTextToClipboard(textToCopy) {
	try {
		if (navigator?.clipboard?.writeText) {
			await navigator.clipboard.writeText(textToCopy);
		}
		console.log("Text copied to clipboard:", textToCopy);
	} catch (err) {
		console.error("Error copying text:", err);
	}
}

function getColorForUser(username) {
	if (!userColors[username]) {
		const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
		userColors[username] = randomColor;
	}
	return userColors[username];
}

function connectToChat(token, username) {
	if (token === "" || username === "") {
		alert("Token and username cannot be empty");
		return;
	}

	socket = io({
		auth: {
			token: token,
			username: username,
		},
	});

	socket.on("connect", () => {
		document.getElementById("auth").classList.add("hidden");
		document.getElementById("chat").classList.remove("hidden");
		currentToken = token;
		currentUsername = username;
	});

	document.getElementById("form").addEventListener("submit", (e) => {
		e.preventDefault();
		const input = document.getElementById("input");
		if (input.value) {
			socket.emit("message", input.value);
			input.value = "";
		}
	});

	socket.on("message", (msg, senderUsername, timestamp) => {
		const messages = document.getElementById("messages");
		const li = document.createElement("li");
		li.textContent = `${msg}`;

		const small = document.createElement("small");
		small.textContent = new Date(timestamp).toLocaleString();
		const smallName = document.createElement("small");
		smallName.textContent = senderUsername;

		smallName.style.fontSize = "0.5rem";
		smallName.style.color = "#999";
		small.style.fontSize = "0.5rem";
		small.style.color = "#999";

		li.style.backgroundColor = getColorForUser(senderUsername);

		li.appendChild(smallName);
		li.appendChild(small);

		if (senderUsername === currentUsername) {
			li.classList.add("own-message");
		}

		messages.appendChild(li);
		messages.scrollTop = messages.scrollHeight;
	});
}

document.addEventListener("DOMContentLoaded", () => {
	const loginForm = document.getElementById("login-form");
	const tokenInput = document.getElementById("token-input");
	const generateTokenButton = document.getElementById("generate-token");
	const tokenDisplay = document.getElementById("token-display");
	const usernameInput = document.getElementById("username-input");

	loginForm.addEventListener("submit", (e) => {
		e.preventDefault();
		const token = tokenInput.value.trim();
		const username = usernameInput.value.trim();
		connectToChat(token, username);
	});

	generateTokenButton.addEventListener("click", (e) => {
		e.preventDefault();
		getToken();
	});

	tokenDisplay.addEventListener("click", () => {
		const textToCopy = tokenDisplay.textContent;
		copyTextToClipboard(textToCopy)
			.then(() => {
				alert("Token copied to clipboard!");
			})
			.catch((err) => {
				console.error("Error copying token:", err);
			});
	});

	usernameInput.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			const token = tokenInput.value.trim();
			const username = usernameInput.value.trim();
			connectToChat(token, username);
		}
	});
});
