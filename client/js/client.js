import { io } from "https://cdn.socket.io/4.5.1/socket.io.esm.min.js";

const socket = io({
	auth: {
		token: "123",
		username: "alex",
		serverOffset: 0,
	},
});

const input = document.getElementById("input");
const form = document.getElementById("form");
const now = new Date();
const formattedDateTime = now.toLocaleString();

form.addEventListener("submit", (e) => {
	e.preventDefault();
	if (input.value) {
		socket.emit("message", input.value);
		input.value = "";
	}
});

socket.on("message", (msg, serverOffset) => {
	// const item = `<li>${msg}</li>`;
	// messages.insertAdjacentHTML("beforeend", item);
	const li = document.createElement("li");
	li.textContent = msg;

	const small = document.createElement("small");
	small.textContent = formattedDateTime;

	small.style.fontSize = "0.5rem";
	small.style.color = "#999";

	li.appendChild(small);
	document.getElementById("messages").appendChild(li);
	socket.auth.serverOffset = serverOffset;
});
