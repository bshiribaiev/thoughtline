"use client";

import { useState } from "react";
import styles from "./page.module.css";

type Item = {
    id: number;
    kind: "thought" | "note";
    content: string;
    date: string;
};

export default function Chat() {
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [lastQ, setLastQ] = useState("");
    const [answer, setAnswer] = useState("");
    const [sources, setSources] = useState<Item[]>([]);

    async function run() {
        const query = q.trim();
        if (!query) return; 

        setLoading(true);
        try {
            const r = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ q }),
            });
            if (!r.ok) {
                console.error("Chat failed", r.status, await r.text());
                setAnswer("");
                setSources([]);
                return;
            }
            const data = await r.json();
            if (!data || typeof data.answer !== "string") {
                console.error("Unexpected chat payload", data);
                setAnswer("");
                setSources([]);
                return;
            }
            setAnswer(data.answer);
            setSources(Array.isArray(data.sources) ? data.sources : []);
        } finally {
            setHasSearched(true);
            setLastQ(query);
            setLoading(false);
        }
    }

    return (
        <main className={styles.container}>
            <h2>Let's think</h2>
            <div className={styles.row}>
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search thoughts and notes…"
                    className={styles.input}
                />
                <button onClick={run} disabled={loading}>
                    {loading ? "Searching…" : "Search"}
                </button>
            </div>
            {hasSearched && !loading && (
            answer ? (
                <>
                <pre>{answer}</pre>
                {sources.length === 0 ? (
                    <p>No sources found.</p>
                ) : (
                    <ul>
                    {sources.map((s) => (
                        <li key={`${s.kind}-${s.id}`}>[{s.kind} {s.date}] {s.content}</li>
                    ))}
                    </ul>
                )}
                </>
            ) : (
                <p>No results.</p>
            )
            )}
        </main>
    );
}