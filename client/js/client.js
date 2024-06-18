import { io } from "https://cdn.socket.io/4.5.1/socket.io.esm.min.js";

let socket;
let currentToken;
let currentUsername;

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

function connectToChat(token, username) {
	if (token === "" || username === "") {
		alert("Token and username cannot be empty");
		return;
	}

	socket = io({
		auth: {
			token: token,
			username: username,
			serverOffset: 0,
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

	socket.on("message", (msg, senderUsername) => {
		const messages = document.getElementById("messages");
		const li = document.createElement("li");
		li.textContent = `${msg}`;

		const small = document.createElement("small");
		small.textContent = new Date().toLocaleString();

		small.style.fontSize = "0.5rem";
		small.style.color = "#999";

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
		const randomNumber = Math.floor(Math.random() * 1000);
		tokenDisplay.textContent = randomNumber;
		tokenInput.value = randomNumber;
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
