"use client";
import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";

const NAV_LINKS = [
  { href: "/", label: "Markets" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/create", label: "Create Market" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="text-xl font-bold text-amber-400 min-h-0">
          BOXMEOUT
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-gray-300 hover:text-white transition-colors"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="w-9 h-9 flex items-center justify-center rounded-md text-gray-300 hover:text-white hover:bg-gray-800"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </li>
        </ul>

        {/* Hamburger — mobile only */}
        <button
          className="md:hidden flex items-center justify-center w-11 h-11 text-gray-300 hover:text-white"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? (
            // X icon
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            // Hamburger icon
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <ul className="md:hidden border-t border-gray-800 bg-gray-900 px-4 pb-4">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="flex items-center min-h-[44px] text-gray-300 hover:text-white transition-colors"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
