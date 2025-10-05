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
    port: 5432,
});

// Test database connection
try {
    await db.connect();
    console.log('Successfully connected to the database!');
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  }

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("build"));

// Insert a book into books table
app.post("/books", async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      "INSERT INTO books (name) VALUES ($1) RETURNING *", [req.body.name]
    );
    res.status(201).json(result.rows[0])
  } 
  catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error"})
  }
})

// Get all books
app.get("/books", async (req: Request, res: Response) => {
  try {
    const result = await db.query("SELECT * FROM books ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

// Insert a note into book_notes table
app.post("/books/:bookId/notes", async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const { content, note_date } = req.body;

    const result = await db.query(
      `INSERT INTO book_notes (book_id, content, note_date) VALUES ($1, $2, 
      COALESCE($3, CURRENT_DATE)) RETURNING *`, [bookId, content, note_date]
    );
    res.status(201).json(result.rows[0]);
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" })
  }
})

// Get all notes for a book
app.get("/books/:bookId/notes", async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const result = await db.query(
      "SELECT * FROM book_notes WHERE book_id = $1 ORDER BY note_date DESC",
      [bookId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
})