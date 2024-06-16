import express from "express";
import logger from "morgan";

const app = express();
const port = process.env.PORT ?? 3000;

app.use(logger("dev"));
app.use(express.static("client"));

app.get("/", (req, res) => {
	res.sendFile(process.cwd() + "/client/index.html");
});

app.listen(3000, () => {
	console.log(`Chat App listening on port http://localhost:${port}`);
});
