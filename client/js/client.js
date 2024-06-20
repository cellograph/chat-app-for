import { io } from "https://cdn.socket.io/4.5.1/socket.io.esm.min.js";

// Variables to store socket connection, current token, and current username
let socket;
let currentToken;
let currentUsername;

// Object to store user colors based on username
const userColors = {};

/**
 * Function to generate a token by connecting to the server
 * and emitting a "generateToken" event.
 */
function getToken() {
	socket = io({
		query: {
			purpose: "generateToken",
		},
	});

	socket.on("connect", () => {
		console.log("Connected to the server to generate token");
		socket.emit("generateToken");

		socket.on("generated-token", (token) => {
			console.log("Received token:", token);
			const tokenDisplay = document.getElementById("token-display");
			tokenDisplay.textContent = token;

			socket.disconnect();
			console.log("Socket disconnected after receiving the token");
		});

		socket.on("token-error", (message) => {
			console.error(message);
			alert("Error generating token. Please try again.");
			socket.disconnect();
		});
	});

	socket.on("connect_error", (err) => {
		console.error("Connection error:", err);
	});
}

/**
 * Function to copy text to clipboard using the Clipboard API.
 * @param {string} textToCopy - The text to copy to clipboard.
 */
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

/**
 * Function to generate a random color for a user based on their username.
 * @param {string} username - The username of the user.
 * @returns {string} - The generated color in hexadecimal format.
 */
function getColorForUser(username) {
	if (!userColors[username]) {
		const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
		userColors[username] = randomColor;
	}
	return userColors[username];
}

/**
 * Function to connect to the chat using a given token and username.
 * @param {string} token - The token used to connect to the chat.
 * @param {string} username - The username used to connect to the chat.
 */
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

		const tokenUsed = document.getElementById("token-used");
		const userCount = document.getElementById("user-count");
		tokenUsed.textContent = `Token: ${currentToken}`;
		userCount.textContent = `Users connected: ${count}`;
		socket.emit("request-user-count");
	});

	socket.on("update-user-count", (count) => {
		const userCount = document.getElementById("user-count");
		userCount.textContent = `Users connected: ${count}`;
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
