import { io } from "https://cdn.socket.io/4.5.1/socket.io.esm.min.js";

const socket = io();

const input = document.getElementById("input");
const form = document.getElementById("form");

form.addEventListener("submit", (e) => {
	e.preventDefault();
	if (input.value) {
		socket.emit("message", input.value);
		input.value = "";
	}
});
