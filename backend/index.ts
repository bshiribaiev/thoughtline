import express, { type Request, type Response } from 'express';
import pg from "pg";
import dotenv from "dotenv";

dotenv.config()

const app = express();
const port = 3001;

const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASSWORD;

const db = new pg.Client({
    user: dbUser,
    host: "localhost",
    database: "thoughtline",
    password: dbPass,
    port: 5433,
});

try {
    await db.connect();
    console.log('Successfully connected to the database!');
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  }

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
})