"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

type Thought = { id: number; content: string; thought_date: string };

export default function Thoughts() {
    const [thoughts, setThoughts] = useState<Thought[]>([]);
    const [thoughtContent, setThoughtContent] = useState("");

    async function loadThoughts() {
        const res = await fetch("/api/thoughts", { cache: "no-store" });
        setThoughts(await res.json());
    }

    async function handleCreateThought(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        await fetch("/api/thoughts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: thoughtContent }),
        });
        setThoughtContent("");
        await loadThoughts();
    }

    useEffect(() => {
        loadThoughts()
    }, []
    )

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
                    <li key={t.id}>{t.thought_date}: {t.content}</li>
                ))}
            </ul>
        </section>
        </div>
        </main>
    );
}