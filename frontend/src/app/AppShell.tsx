"use client";

import { useEffect, useState } from "react";

type Props = { children: React.ReactNode };

export default function AppShell({ children }: Props) {
  const [open, setOpen] = useState<boolean | null>(null);

  // Initialize from localStorage or breakpoint
  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("sidebar")) as
      | "open"
      | "closed"
      | null;

    const desktop = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
    const initialOpen = stored ? stored === "open" : desktop;

    setOpen(initialOpen);
    document.body.dataset.sidebar = initialOpen ? "open" : "closed";
  }, []);

  const toggle = () => {
    const next = !(open ?? true);
    setOpen(next);
    document.body.dataset.sidebar = next ? "open" : "closed";
    try {
      localStorage.setItem("sidebar", next ? "open" : "closed");
    } catch {}
  };

  return (
    <div className="appShell">
      <aside className="sidebar">
        <h1>thoughtline</h1>
        <nav>
          <a href="/">Home</a>
        </nav>
      </aside>

      <div className="content">
        <button type="button" className="sidebarToggle" onClick={toggle} aria-pressed={open === false}>
          {open ? "Hide sidebar" : "Show sidebar"}
        </button>
        {children}
      </div>
    </div>
  );
}