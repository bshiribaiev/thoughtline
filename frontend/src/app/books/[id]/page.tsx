"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import styles from "../page.module.css";

type Book = { id: number; name: string; created_at: string };
type Note = { id: number; book_id: number; content: string; note_date: string };

export default function BookDetail() {
  const params = useParams<{ id: string }>();
  const bookId = Number(params.id);

  const [book, setBook] = useState<Book | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteContent, setNoteContent] = useState("");

  async function load() {
    const [bRes, nRes] = await Promise.all([
      fetch(`/api/books/${bookId}`, { cache: "no-store" }),
      fetch(`/api/books/${bookId}/notes`, { cache: "no-store" }),
    ]);
    if (bRes.ok) setBook(await bRes.json());
    if (nRes.ok) setNotes(await nRes.json());
  }

  useEffect(() => {
    if (Number.isFinite(bookId)) load();
  }, [bookId]);

  async function handleCreateNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const content = noteContent.trim();
    if (!content) return;
    await fetch(`/api/books/${bookId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setNoteContent("");
    await load();
  }

  async function handleDeleteNote(id: number) {
    if (!confirm("Delete this note?")) return;
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    await load();
  }

  if (!Number.isFinite(bookId)) {
    return <main className={styles.main}><p>Invalid book id.</p></main>;
  }

  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <p><Link href="/books">← Back to books</Link></p>
        <h2>{book ? book.name : `Book ${bookId}`}</h2>

        <form onSubmit={handleCreateNote} className={styles.formRow}>
          <input
            className={styles.input}
            placeholder="New note"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
          <button className={styles.button} type="submit">Add Note</button>
        </form>

        <ul>
          {notes.map((n) => (
            <li key={n.id}>
              {n.note_date}: {n.content}
              <button
                className={styles.button}
                style={{ marginLeft: 8 }}
                onClick={() => handleDeleteNote(n.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}