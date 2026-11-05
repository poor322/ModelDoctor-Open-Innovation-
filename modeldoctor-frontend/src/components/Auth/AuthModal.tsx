/* ────────────────────────────────────────
   AuthModal — Login / Register glassmorphism modal
   ──────────────────────────────────────── */

"use client";

import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthProvider";

type Tab = "login" | "register";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const { login, register } = useAuth();
    const [tab, setTab] = useState<Tab>("login");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setUsername("");
        setEmail("");
        setPassword("");
        setError(null);
    };

    const switchTab = (t: Tab) => {
        setTab(t);
        resetForm();
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (tab === "login") {
                await login(username, password);
            } else {
                await register(username, email, password);
            }
            resetForm();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        {/* Glass card */}
                        <div className="bg-gradient-to-b from-[#14142a]/95 to-[#0d0d1a]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl">
                            {/* Header gradient line */}
                            <div className="h-[2px] bg-gradient-to-r from-transparent via-accent-blue/50 to-transparent" />

                            <div className="p-8">
                                {/* Title */}
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-bold text-text-primary mb-1">
                                        {tab === "login" ? "Welcome Back" : "Create Account"}
                                    </h2>
                                    <p className="text-xs text-text-muted/60">
                                        {tab === "login"
                                            ? "Sign in to diagnose your ML code"
                                            : "Join ModelDoctor to start diagnosing"}
                                    </p>
                                </div>

                                {/* Tab switcher */}
                                <div className="flex rounded-xl bg-white/[0.04] p-1 mb-6">
                                    {(["login", "register"] as Tab[]).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => switchTab(t)}
                                            className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${tab === t
                                                    ? "bg-gradient-to-r from-accent-blue/20 to-accent-teal/20 text-text-primary shadow-sm border border-white/[0.06]"
                                                    : "text-text-muted/50 hover:text-text-muted/80"
                                                }`}
                                        >
                                            {t === "login" ? "Sign In" : "Register"}
                                        </button>
                                    ))}
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Username */}
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider text-text-muted/60 mb-1.5 font-medium">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                            minLength={3}
                                            placeholder="e.g. astroid_dev"
                                            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-text-primary placeholder:text-text-muted/30 focus:outline-none focus:border-accent-blue/40 focus:ring-1 focus:ring-accent-blue/20 transition-all"
                                        />
                                    </div>

                                    {/* Email — register only */}
                                    {tab === "register" && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <label className="block text-[10px] uppercase tracking-wider text-text-muted/60 mb-1.5 font-medium">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                placeholder="you@example.com"
                                                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-text-primary placeholder:text-text-muted/30 focus:outline-none focus:border-accent-blue/40 focus:ring-1 focus:ring-accent-blue/20 transition-all"
                                            />
                                        </motion.div>
                                    )}

                                    {/* Password */}
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider text-text-muted/60 mb-1.5 font-medium">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            placeholder="••••••••"
                                            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-text-primary placeholder:text-text-muted/30 focus:outline-none focus:border-accent-blue/40 focus:ring-1 focus:ring-accent-blue/20 transition-all"
                                        />
                                    </div>

                                    {/* Error */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400"
                                            >
                                                {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 bg-gradient-to-r from-accent-blue to-accent-teal text-white hover:shadow-lg hover:shadow-accent-blue/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                {tab === "login" ? "Signing in..." : "Creating account..."}
                                            </span>
                                        ) : tab === "login" ? (
                                            "Sign In"
                                        ) : (
                                            "Create Account"
                                        )}
                                    </button>
                                </form>

                                {/* Divider */}
                                <div className="mt-6 text-center">
                                    <p className="text-[10px] text-text-muted/40">
                                        {tab === "login" ? "Don't have an account? " : "Already have an account? "}
                                        <button
                                            onClick={() => switchTab(tab === "login" ? "register" : "login")}
                                            className="text-accent-blue/80 hover:text-accent-blue transition-colors font-medium"
                                        >
                                            {tab === "login" ? "Register" : "Sign In"}
                                        </button>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
