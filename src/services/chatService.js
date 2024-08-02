import { dbClient } from "../database/dbClient.js";
import { v4 as uuidv4 } from "uuid";

export const generateToken = async () => {
  try {
    const generatedToken = uuidv4().split("-")[0];
    console.log(generatedToken);
    const t = await dbClient.run(
      `INSERT INTO tokens (token) VALUES (?)`,
      generatedToken
    );

    console.log({ t });
    return generatedToken;
  } catch (error) {
    console.log({ error });
  }
};

export const saveMessage = async (token, username, content) => {
  const now = new Date();
  const formattedDate = now.toISOString();

  await dbClient.run(
    `INSERT INTO messages (token, username, content, date) VALUES (?, ?, ?, ?)`,
    token,
    username,
    content,
    formattedDate
  );
};

export const getMessages = async (token) => {
  const result = await dbClient.get(
    `SELECT username, content, date FROM messages WHERE token = ? ORDER BY date ASC`,
    token
  );
  console.log({ ch: result });
  return result;
};

export const deleteTokenAndMessages = async (token) => {
  await dbClient.run(`DELETE FROM tokens WHERE token = ?`, token);
  await dbClient.run(`DELETE FROM messages WHERE token = ?`, token);
};
