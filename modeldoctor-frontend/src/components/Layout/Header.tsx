/* ────────────────────────────────────────
   Header — Premium app header with auth
   ──────────────────────────────────────── */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/Auth/AuthProvider";
import UserMenu from "@/components/Auth/UserMenu";
import AuthModal from "@/components/Auth/AuthModal";

export default function Header() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex items-center justify-between px-6 py-3.5 border-b border-white/[0.06] glass-strong"
      >
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-teal/10">
            <div className="absolute inset-0 rounded-xl bg-accent-blue/10 blur-md" />
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none" className="relative z-10">
              <path d="M14 2L26 8v12l-12 6L2 20V8l12-6z" stroke="url(#logo-grad)" strokeWidth="1.5" fill="none" />
              <circle cx="14" cy="14" r="4" fill="url(#logo-grad)" />
              <path d="M14 10v8M10 14h8" stroke="#0A0A14" strokeWidth="1.5" />
              <defs>
                <linearGradient id="logo-grad" x1="2" y1="2" x2="26" y2="26">
                  <stop stopColor="#4285F4" />
                  <stop offset="1" stopColor="#00DEB4" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Brand */}
          <div>
            <h1 className="text-base font-bold tracking-tight">
              <span className="text-text-primary">Model</span>
              <span className="gradient-text">Doctor</span>
            </h1>
            <p className="text-[9px] uppercase tracking-[0.2em] text-text-muted font-medium">
              The MRI for your ML Pipeline
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-teal/[0.06] border border-accent-teal/10">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-teal animate-pulse-dot" />
            <span className="text-accent-teal/80 font-medium">Gemini 2.5 Flash</span>
          </span>
          <span className="hidden sm:inline-block px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] font-medium">
            Team ASTROID
          </span>

          {/* Auth section */}
          {!isLoading && (
            isAuthenticated ? (
              <UserMenu />
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-accent-blue to-accent-teal text-white hover:shadow-lg hover:shadow-accent-blue/20 transition-all active:scale-[0.97]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Sign In
              </button>
            )
          )}
        </div>
      </motion.header>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}

