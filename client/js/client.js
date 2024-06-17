import { io } from "https://cdn.socket.io/4.5.1/socket.io.esm.min.js";

let socket;
let currentToken;
let currentUsername;

document.addEventListener("DOMContentLoaded", () => {
	const tokenForm = document.getElementById("token-form");
	const tokenInput = document.getElementById("token-input");
	const usernameInput = document.getElementById("username-input");
	const chatSection = document.getElementById("chat");
	const authSection = document.getElementById("auth");
	const input = document.getElementById("input");
	const form = document.getElementById("form");
	const messages = document.getElementById("messages");
	const now = new Date();
	const formattedDateTime = now.toLocaleString();

	tokenForm.addEventListener("submit", (e) => {
		e.preventDefault();
		const token = tokenInput.value.trim();
		const username = usernameInput.value.trim();

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
			authSection.classList.add("hidden");
			chatSection.classList.remove("hidden");
			currentToken = token;
			currentUsername = username;
		});

		form.addEventListener("submit", (e) => {
			e.preventDefault();
			if (input.value) {
				socket.emit("message", input.value);
				input.value = "";
			}
		});

		socket.on("message", (msg, senderUsername) => {
			const li = document.createElement("li");
			li.textContent = `${msg}`;

			const small = document.createElement("small");
			small.textContent = formattedDateTime;

			small.style.fontSize = "0.5rem";
			small.style.color = "#999";

			li.appendChild(small);

			if (senderUsername === currentUsername) {
				li.classList.add("own-message");
			}

			messages.appendChild(li);
			messages.scrollTop = messages.scrollHeight;
		});
	});
});
