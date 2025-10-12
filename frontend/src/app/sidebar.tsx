"use client";

import { useState } from "react";

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="appShell">
        {open && (
        <aside className="siteSidebar">
          <button className="sidebarToggle" aria-label="Hide sidebar" onClick={() => setOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <nav>
            <ul>
              <li><a href="#">All Books</a></li>
              <li><a href="#">Notes</a></li>
              <li><a href="#">Thoughts</a></li>
            </ul>
          </nav>
        </aside>
      )}
        {!open && (
        <button className="sidebarToggle show" aria-label="Show sidebar" onClick={() => setOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
      </button>
      )}
      <div className="siteContent">{children}</div>
    </div>
  );
}