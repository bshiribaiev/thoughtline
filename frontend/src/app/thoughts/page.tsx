"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

type Thought = { id: number; content: string; thought_date: string };

export default function Thoughts() {
    const [thoughts, setThoughts] = useState<Thought[]>([]);
    const [thoughtContent, setThoughtContent] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState("");

    async function loadThoughts() {
        const res = await fetch("/api/thoughts", { cache: "no-store" });
        setThoughts(await res.json());
    }

    async function handleCreateThought(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!thoughtContent.trim()) return;
        await fetch("/api/thoughts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: thoughtContent }),
        });
        setThoughtContent("");
        await loadThoughts();
    }

    async function handleDeleteThought(id: number) {
        await fetch(`/api/thoughts/${id}`, { method: "DELETE" });
        await loadThoughts();
    }

    function startEdit(t: Thought) {
        setEditingId(t.id);
        setEditingValue(t.content);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditingValue("");
    }

    async function saveEdit() {
        if (editingId === null || !editingValue.trim()) return;
        await fetch(`/api/thoughts/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: editingValue }),
        });
        setEditingId(null);
        setEditingValue("");
        await loadThoughts();
    }

    useEffect(() => {
        loadThoughts();
    }, []);

    return (
        <main className={styles.main}>
            <div className={styles.content}>
                <section>
                    <h2>Thoughts</h2>
                    <form onSubmit={handleCreateThought} className={styles.formRow}>
                        <input
                            className={styles.input}
                            placeholder="New thought"
                            value={thoughtContent}
                            onChange={(e) => setThoughtContent(e.target.value)}
                        />
                        <button className={styles.button} type="submit">Add Thought</button>
                    </form>

                    <ul>
                        {thoughts.map((t) => (
                            <li key={t.id}>
                                {editingId === t.id ? (
                                    <span className={styles.formRow}>
                                        <input
                                            className={styles.input}
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                        />
                                        <button className={styles.button} onClick={saveEdit}>Save</button>
                                        <button className={styles.button} onClick={cancelEdit}>Cancel</button>
                                    </span>
                                ) : (
                                    <span className={styles.formRow}>
                                        <span>{t.thought_date}: {t.content}</span>
                                        <button className={styles.button} onClick={() => startEdit(t)}>Edit</button>
                                        <button className={styles.button} onClick={() => handleDeleteThought(t.id)}>Delete</button>
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </main>
    );
}