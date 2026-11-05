/* ────────────────────────────────────────
   UserMenu — Authenticated user info + logout
   ──────────────────────────────────────── */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthProvider";

export default function UserMenu() {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (!user) return null;

    const initials = user.username.slice(0, 2).toUpperCase();

    return (
        <div className="relative" ref={menuRef}>
            {/* Avatar button */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/[0.04] transition-colors"
            >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-blue/30 to-accent-teal/30 border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-text-primary">
                    {initials}
                </div>
                <span className="text-xs font-medium text-text-muted hidden sm:inline">
                    {user.username}
                </span>
                <svg
                    className={`w-3 h-3 text-text-muted/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M3 4.5L6 7.5L9 4.5" />
                </svg>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 rounded-xl bg-[#14142a]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl overflow-hidden z-50"
                    >
                        {/* User info */}
                        <div className="px-4 py-3 border-b border-white/[0.06]">
                            <p className="text-sm font-semibold text-text-primary">{user.username}</p>
                            <p className="text-[10px] text-text-muted/50 mt-0.5 truncate">{user.email}</p>
                        </div>

                        {/* Actions */}
                        <div className="p-1.5">
                            <button
                                onClick={() => {
                                    setOpen(false);
                                    logout();
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                Sign Out
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
