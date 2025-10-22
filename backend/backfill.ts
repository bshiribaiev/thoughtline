import 'dotenv/config';
import pg from 'pg';
import { embedText, toPgVectorLiteral } from './embeddings.js';

const db = new pg.Client({
  user: process.env.DB_USER,
  host: 'localhost',
  database: 'thoughtline',
  password: process.env.DB_PASSWORD,
  port: 5432,
});

async function backfill() {
  await db.connect();

  const thoughts = await db.query("SELECT id, content FROM thoughts WHERE embedding IS NULL");
  for (const t of thoughts.rows) {
    const e = await embedText(t.content);
    await db.query("UPDATE thoughts SET embedding = $1::vector WHERE id = $2",
      [toPgVectorLiteral(e), t.id]);
  }

  const notes = await db.query("SELECT id, content FROM book_notes WHERE embedding IS NULL");
  for (const n of notes.rows) {
    const e = await embedText(n.content);
    await db.query("UPDATE book_notes SET embedding = $1::vector WHERE id = $2",
      [toPgVectorLiteral(e), n.id]);
  }

  await db.end();
}

backfill().catch(err => { console.error(err); process.exit(1); });