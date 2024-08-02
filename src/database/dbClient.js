import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dotenv from "dotenv";

dotenv.config();

let db;

export const initializeDB = async () => {
  db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT,
      username TEXT,
      content TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export const dbClient = {
  run: async (...params) => {
    // console.log({ sql });
    const data = await db.run(...params);

    console.log(data);
    return data;
  },
  execute: async (sql) => {
    // console.log({ sql });
    const data = await db.run(sql.sql);

    console.log(data);
    return data;
  },
  query: async (sql, params) => {
    console.log(2, sql);
    return await db.all(sql.sql, sql.args[0]);
  },
  get: async (sql, params) => {
    console.log(3, sql);
    return await db.get(sql, params);
  },
};
