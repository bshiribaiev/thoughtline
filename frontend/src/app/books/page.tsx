"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

type Book = { id: number; name: string; created_at: string };
type Note = { id: number; book_id: number; content: string; note_date: string };

export default function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [bookName, setBookName] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteContent, setNoteContent] = useState("");
  const [confirmBookId, setConfirmBookId] = useState<number | null>(null);

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
    const name = bookName.trim();
    if (!name) return;
    if (selectedBookId === null) return;
    await fetch(`/api/books/${selectedBookId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: noteContent }),
    });
    setNoteContent("");
    await loadNotes(selectedBookId);
  }

  async function handleDeleteNote(id: number) {
    if (selectedBookId === null) return;
    if (!confirm("Delete this note?")) return;
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    await loadNotes(selectedBookId);
  }

  async function handleDeleteBook(id: number) {
    if (!confirm("Delete this book and all its notes?")) return;
    await fetch(`/api/books/${id}`, { method: "DELETE" });
    if (selectedBookId === id) {
      setSelectedBookId(null);
      setNotes([]);
    }
    await loadBooks();
  }

  async function confirmDeleteBook() {
    if (confirmBookId == null) return;
    await fetch(`/api/books/${confirmBookId}`, { method: "DELETE" });
    if (selectedBookId === confirmBookId) {
      setSelectedBookId(null);
      setNotes([]);
    }
    setConfirmBookId(null);
    await loadBooks();
  }

  function cancelDeleteBook() {
    setConfirmBookId(null);
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
            required
          />
          <button className={styles.button} type="submit" disabled={!bookName.trim()}>
            Add Book
          </button>
          </form>

          <ul>
            {books.map((b) => (
              <li key={b.id}>
                <span className={styles.formRow}>
                  <button className={styles.linkButton} onClick={() => { handleSelectBook(b.id); }}>
                    {b.name}
                  </button>
                  <button
                    className={styles.button}
                    onClick={() => setConfirmBookId(b.id)}
                    style={{ marginLeft: 8 }}
                  >
                    Delete
                  </button>
                </span>
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
            </>
          )}
          {!selectedBookId && <p>Select a book to view/add notes.</p>}
        </section>
        {confirmBookId !== null && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3>Delete book?</h3>
            <p>This will delete the book and all its notes.</p>
            <div className={styles.modalActions}>
              <button className={styles.dangerButton} onClick={confirmDeleteBook}>
                Delete
              </button>
              <button className={styles.secondaryButton} onClick={cancelDeleteBook}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
        
      </div>
    </main>
  );
}