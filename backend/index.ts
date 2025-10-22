import express, { type Request, type Response } from 'express';
import pg from "pg";
import dotenv from "dotenv";
import { embedText, toPgVectorLiteral } from "./embeddings.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config()

const app = express();
const port = 3001;

const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASSWORD;

// Create a client to connect to postgres
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

// Get a single book by ID
app.get("/books/:bookId", async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const result = await db.query(
      "SELECT * FROM books WHERE id = $1",
      [bookId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

// Update a book
app.put("/books/:bookId", async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const { name } = req.body;
    const result = await db.query(
      "UPDATE books SET name = $1 WHERE id = $2 RETURNING *",
      [name, bookId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

// Delete a book (and all its notes due to CASCADE)
app.delete("/books/:bookId", async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const result = await db.query(
      "DELETE FROM books WHERE id = $1 RETURNING *",
      [bookId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.json({ message: "Book deleted successfully", book: result.rows[0] });
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

    const embedding = await embedText(content);

    const result = await db.query(
      `INSERT INTO book_notes (book_id, content, note_date, embedding)
       VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4::vector)
       RETURNING *`,
      [bookId, content, note_date, toPgVectorLiteral(embedding)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

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

// Create a thought
app.post("/thoughts", async (req: Request, res: Response) => {
  try {
    const { content, thought_date } = req.body;
    const embedding = await embedText(content);

    const result = await db.query(
      `INSERT INTO thoughts (content, thought_date, embedding)
       VALUES ($1, COALESCE($2, CURRENT_DATE), $3::vector)
       RETURNING *`,
      [content, thought_date, toPgVectorLiteral(embedding)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

// Get all thoughts
app.get("/thoughts", async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      "SELECT * FROM thoughts ORDER BY thought_date DESC LIMIT 50"
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

// Get a single thought by ID
app.get("/thoughts/:thoughtId", async (req: Request, res: Response) => {
  try {
    const { thoughtId } = req.params;
    const result = await db.query(
      "SELECT * FROM thoughts WHERE id = $1",
      [thoughtId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Thought not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

// Update a thought
app.put("/thoughts/:thoughtId", async (req: Request, res: Response) => {
  try {
    const { thoughtId } = req.params;
    const { content, thought_date } = req.body;

    // Only generate embedding if content is provided
    if (typeof content === "string" && content.trim() !== "") {
      const embedding = await embedText(content);
      const result = await db.query(
        `UPDATE thoughts 
         SET content = $1, 
             thought_date = COALESCE($2, thought_date),
             embedding = $3::vector
         WHERE id = $4 RETURNING *`,
        [content, thought_date, toPgVectorLiteral(embedding), thoughtId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Thought not found" });
      }
      return res.json(result.rows[0]);
    } else {
      const result = await db.query(
        `UPDATE thoughts 
         SET thought_date = COALESCE($1, thought_date)
         WHERE id = $2 RETURNING *`,
        [thought_date, thoughtId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Thought not found" });
      }
      return res.json(result.rows[0]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

// Delete a thought
app.delete("/thoughts/:thoughtId", async (req: Request, res: Response) => {
  try {
    const { thoughtId } = req.params;
    const result = await db.query(
      "DELETE FROM thoughts WHERE id = $1 RETURNING *",
      [thoughtId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Thought not found" });
    }
    res.json({ message: "Thought deleted successfully", thought: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

// Get a single note by ID
app.get("/notes/:noteId", async (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    const result = await db.query(
      "SELECT * FROM book_notes WHERE id = $1",
      [noteId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Note not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

// Update a note
app.put("/notes/:noteId", async (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    const { content, note_date } = req.body;

    if (typeof content === "string" && content.trim() !== "") {
      const embedding = await embedText(content);
      const result = await db.query(
        `UPDATE book_notes
         SET content = $1,
             note_date = COALESCE($2, note_date),
             embedding = $3::vector
         WHERE id = $4
         RETURNING *`,
        [content, note_date, toPgVectorLiteral(embedding), noteId]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: "Note not found" });
      return res.json(result.rows[0]);
    } else {
      const result = await db.query(
        `UPDATE book_notes
         SET note_date = COALESCE($1, note_date)
         WHERE id = $2
         RETURNING *`,
        [note_date, noteId]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: "Note not found" });
      return res.json(result.rows[0]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

// Delete a note
app.delete("/notes/:noteId", async (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    const result = await db.query(
      "DELETE FROM book_notes WHERE id = $1 RETURNING *",
      [noteId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Note not found" });
    }
    res.json({ message: "Note deleted successfully", note: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

// Semantic search
app.get("/thoughts/search", async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (!q) return res.json([]);

    const qEmbedding = await embedText(q);
    const rows = await db.query(
      `SELECT id, content, thought_date
       FROM thoughts
       WHERE embedding IS NOT NULL
       ORDER BY embedding <-> $1::vector
       LIMIT 20`,
      [toPgVectorLiteral(qEmbedding)]
    );

    res.json(rows.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Search error" });
  }
});

app.get("/books/:bookId/notes/search", async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const q = String(req.query.q ?? "").trim();
    if (!q) return res.json([]);

    const qEmbedding = await embedText(q);
    const rows = await db.query(
      `SELECT id, content, note_date
       FROM book_notes
       WHERE book_id = $2 AND embedding IS NOT NULL
       ORDER BY embedding <-> $1::vector
       LIMIT 20`,
      [toPgVectorLiteral(qEmbedding), bookId]
    );
    res.json(rows.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Search error" });
  }
});

// Search endpoint
app.get("/search", async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (!q) return res.json([]);

    const qEmbedding = await embedText(q);
    const rows = await db.query(
      `
      SELECT * FROM (
        SELECT 
          id, content, thought_date AS date, 'thought' AS kind,
          (embedding <-> $1::vector) AS distance
        FROM thoughts
        WHERE embedding IS NOT NULL

        UNION ALL

        SELECT 
          id, content, note_date AS date, 'note' AS kind,
          (embedding <-> $1::vector) AS distance
        FROM book_notes
        WHERE embedding IS NOT NULL
      ) AS combined
      ORDER BY distance
      LIMIT 20
      `,
      [toPgVectorLiteral(qEmbedding)]
    );

    res.json(rows.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Search error" });
  }
});

// Gemini chat endpoint
app.post("/chat", async (req: Request, res: Response) => {
  try {
    const q = String(req.body?.q ?? "").trim();
    if (!q) return res.status(400).json({ error: "Missing query" });

    const qEmbedding = await embedText(q);
    const { rows: ctx } = await db.query(
      `
      SELECT * FROM (
        SELECT id, content, thought_date AS date, 'thought' AS kind, (embedding <-> $1::vector) AS distance
        FROM thoughts WHERE embedding IS NOT NULL
        UNION ALL
        SELECT id, content, note_date   AS date, 'note'    AS kind, (embedding <-> $1::vector) AS distance
        FROM book_notes WHERE embedding IS NOT NULL
      ) AS combined
      ORDER BY distance
      LIMIT 12
      `,
      [toPgVectorLiteral(qEmbedding)]
    );

    const context = ctx.map(r => `[${r.kind} ${r.date}] ${r.content}`).join("\n");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

    const prompt =
      "You are my personal thinking companion. Ground answers strictly in the user's notes below. " +
      "If unsure, say you don't know. Cite like [thought 2025-10-05] when relevant. Be concise.\n\n" +
      `Question: ${q}\n\nUser notes:\n${context}`;

    const result = await model.generateContent([{ text: prompt }]);
    const answer = result.response.text();

    res.json({ answer, sources: ctx.slice(0, 5) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Chat error" });
  }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
})