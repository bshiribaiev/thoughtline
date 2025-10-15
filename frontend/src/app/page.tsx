"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

type Book = { id: number; name: string; created_at: string };
type Note = { id: number; book_id: number; content: string; note_date: string };

export default function Page() {
  const [books, setBooks] = useState<Book[]>([]);
  const [bookName, setBookName] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteContent, setNoteContent] = useState("");

  async function loadBooks() {
    const res = await fetch("/api/books", { cache: "no-store" });
    setBooks(await res.json());
  }

  async function loadNotes(bookId: number) {
    const res = await fetch(`/api/books/${bookId}/notes`, { cache: "no-store" });
    setNotes(await res.json());
  }

  // Handlers and UI logic
  async function handleCreateBook(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: bookName }),
    });
    setBookName("");
    await loadBooks();
  }

  async function handleSelectBook(bookId: number) {
    setSelectedBookId(bookId);
    await loadNotes(bookId);
  }

  async function handleCreateNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedBookId === null) return;
    await fetch(`/api/books/${selectedBookId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: noteContent }),
    });
    setNoteContent("");
    await loadNotes(selectedBookId);
  }

  useEffect(() => {
    loadBooks();
  }, []);

  return (
    <main className={styles.main}>

      <div className={styles.content}>
        <section>
          <h2>Books</h2>
          <form onSubmit={handleCreateBook} className={styles.formRow}>
            <input
              className={styles.input}
              placeholder="New book name"
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
            />
            <button className={styles.button} type="submit">Add Book</button>
          </form>

          <ul>
            {books.map((b) => (
              <li key={b.id}>
                <button className={styles.linkButton} onClick={() => { handleSelectBook(b.id); }}>
                  {b.name}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Notes {selectedBookId ? `(Book ${selectedBookId})` : ""}</h2>
          {selectedBookId && (
            <>
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
                  <li key={n.id}>{n.note_date}: {n.content}</li>
                ))}
              </ul>
            </>
          )}
          {!selectedBookId && <p>Select a book to view/add notes.</p>}
        </section>

        
      </div>
    </main>
  );
}