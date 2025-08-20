import express, { type Request, type Response } from 'express';
import pg from "pg";

const app = express();
const port = 3001;

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
})