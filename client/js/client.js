import { io } from "https://cdn.socket.io/4.5.1/socket.io.esm.min.js";

let socket;
let currentUsername; // Variable para almacenar el nombre de usuario actual

document.addEventListener("DOMContentLoaded", () => {
	const tokenForm = document.getElementById("token-form");
	const tokenInput = document.getElementById("token-input");
	const usernameInput = document.getElementById("username-input"); // Input para el username
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
				username: username, // Envía el username al servidor
				serverOffset: 0,
			},
		});

		socket.on("connect", () => {
			authSection.classList.add("hidden");
			chatSection.classList.remove("hidden");
			currentUsername = username; // Almacena el nombre de usuario actual
		});

		form.addEventListener("submit", (e) => {
			e.preventDefault();
			if (input.value) {
				socket.emit("message", input.value);
				input.value = "";
			}
		});

		socket.on("message", (msg, serverOffset, senderUsername) => {
			const li = document.createElement("li");
			li.textContent = msg;

			const small = document.createElement("small");
			small.textContent = formattedDateTime;

			small.style.fontSize = "0.5rem";
			small.style.color = "#999";

			li.appendChild(small);

			if (senderUsername === currentUsername) {
				li.classList.add("own-message"); // Agrega clase own-message si el mensaje es del usuario actual
			}

			messages.appendChild(li);
			messages.scrollTop = messages.scrollHeight;
		});
	});
});
