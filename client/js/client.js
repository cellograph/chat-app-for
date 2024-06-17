import { io } from "https://cdn.socket.io/4.5.1/socket.io.esm.min.js";

let socket;

document.addEventListener("DOMContentLoaded", () => {
	const tokenForm = document.getElementById("token-form");
	const tokenInput = document.getElementById("token-input");
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

		if (token === "") {
			alert("Token cannot be empty");
			return;
		}

		socket = io({
			auth: {
				token: token,
				serverOffset: 0,
			},
		});

		socket.on("connect", () => {
			authSection.classList.add("hidden");
			chatSection.classList.remove("hidden");
		});

		form.addEventListener("submit", (e) => {
			e.preventDefault();
			if (input.value) {
				socket.emit("message", input.value);
				input.value = "";
			}
		});

		socket.on("message", (msg, serverOffset) => {
			const li = document.createElement("li");
			li.textContent = msg;

			const small = document.createElement("small");
			small.textContent = formattedDateTime;

			small.style.fontSize = "0.5rem";
			small.style.color = "#999";

			li.appendChild(small);
			messages.appendChild(li);
			socket.auth.serverOffset = serverOffset;

			messages.scrollTop = messages.scrollHeight;
		});
	});
});
