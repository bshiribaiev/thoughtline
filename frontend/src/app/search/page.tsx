"use client";

import { useState } from "react";
import styles from "./page.module.css";

type Item = {
    id: number;
    kind: "thought" | "note";
    content: string;
    date: string;
};

export default function GlobalSearch() {
    const [q, setQ] = useState("");
    const [results, setResults] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [lastQ, setLastQ] = useState("");

    async function run() {
        const query = q.trim();
        if (!query) { setResults([]); return; }
        setLoading(true);

        try {
            const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { cache: "no-store" });
            if (!r.ok) {
                console.error("Search failed", r.status, await r.text());
                setResults([]);
                return;
            }
            const data = await r.json();
            if (!Array.isArray(data)) {
                console.error("Unexpected search payload", data);
                setHasSearched(true);
                setLastQ(query);
                return;
            }
            setResults(data);
            setHasSearched(true);
            setLastQ(query);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className={styles.container}>
            <h2>Search everything</h2>
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
            {hasSearched && !loading
                ? (results.length === 0
                    ? <p>No results for “{lastQ}”.</p>
                    : <ul className={styles.results}>
                        {results.map((r) => (
                            <li key={`${r.kind}-${r.id}`}>
                                <strong>{r.kind}</strong> — {r.date}: {r.content}
                            </li>
                        ))}
                    </ul>)
                : null}
        </main>
    );
}