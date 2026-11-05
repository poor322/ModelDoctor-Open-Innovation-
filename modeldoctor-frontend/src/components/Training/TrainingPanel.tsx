/* ────────────────────────────────────────
   TrainingPanel — Premium training dashboard
   with metrics table, chart, and code viewer
   ──────────────────────────────────────── */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TrainResponse, TrainingState } from "@/lib/training-types";

interface TrainingPanelProps {
    state: TrainingState;
    result: TrainResponse | null;
    error: string | null;
}

export default function TrainingPanel({
    state,
    result,
    error,
}: TrainingPanelProps) {
    if (state === "idle") return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
        >
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-accent-purple/80"
                >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                Model Training
            </h3>

            {/* Training in progress */}
            <AnimatePresence mode="wait">
                {state === "training" && (
                    <motion.div
                        key="training"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="glass-strong rounded-2xl p-8 text-center"
                    >
                        {/* Animated training visualization */}
                        <div className="w-20 h-20 mx-auto mb-4 relative">
                            <div className="absolute inset-0 rounded-full border-2 border-accent-purple/20" />
                            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-purple animate-spin" />
                            <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-accent-blue animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
                            <div className="absolute inset-4 rounded-full border-2 border-transparent border-t-accent-teal animate-spin" style={{ animationDuration: "2s" }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#trainGrad)" strokeWidth="2">
                                    <defs>
                                        <linearGradient id="trainGrad" x1="0" y1="0" x2="24" y2="24">
                                            <stop offset="0%" stopColor="#A855F7" />
                                            <stop offset="100%" stopColor="#00DEB4" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                </svg>
                            </div>
                        </div>

                        <h3 className="text-base font-bold text-text-primary/80 mb-1.5">
                            Training Model...
                        </h3>
                        <p className="text-xs text-text-muted/50 max-w-xs mx-auto leading-relaxed">
                            Executing the corrected ML code and capturing training metrics.
                            This may take up to 2 minutes.
                        </p>

                        {/* Animated progress dots */}
                        <div className="flex justify-center gap-1.5 mt-4">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-2 h-2 rounded-full bg-accent-purple/60"
                                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                                    transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Error state */}
                {state === "error" && error && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="glass-strong rounded-2xl p-6 glow-red"
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-accent-red/15 flex items-center justify-center flex-shrink-0">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF2244" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-accent-red mb-1">Training Failed</h4>
                                <p className="text-xs text-text-muted/70 leading-relaxed">{error}</p>
                            </div>
                        </div>

                        {result?.stderr && (
                            <div className="mt-4">
                                <h5 className="text-[10px] uppercase tracking-wider text-text-muted/50 font-semibold mb-1.5">
                                    Error Output
                                </h5>
                                <pre className="bg-void/60 rounded-lg p-3 text-[11px] overflow-x-auto border border-accent-red/10 font-mono text-accent-red/60 max-h-32 overflow-y-auto">
                                    {result.stderr}
                                </pre>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Success — Training Results */}
                {state === "complete" && result && (
                    <motion.div
                        key="complete"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        {/* Summary card */}
                        <div className="glass-strong rounded-2xl p-6 gradient-border">
                            <div className="flex flex-col sm:flex-row items-center gap-5">
                                {/* Accuracy ring */}
                                <div className="relative w-24 h-24 flex-shrink-0">
                                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
                                        <motion.circle
                                            cx="50" cy="50" r="42" fill="none"
                                            stroke="url(#accGrad)"
                                            strokeWidth="6"
                                            strokeLinecap="round"
                                            strokeDasharray={264}
                                            initial={{ strokeDashoffset: 264 }}
                                            animate={{ strokeDashoffset: 264 - (264 * (result.final_accuracy || 0)) }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                        />
                                        <defs>
                                            <linearGradient id="accGrad" x1="0" y1="0" x2="100" y2="100">
                                                <stop offset="0%" stopColor="#A855F7" />
                                                <stop offset="50%" stopColor="#4285F4" />
                                                <stop offset="100%" stopColor="#00DEB4" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-xl font-bold gradient-text">
                                            {result.final_accuracy
                                                ? `${(result.final_accuracy * 100).toFixed(1)}%`
                                                : "—"}
                                        </span>
                                        <span className="text-[8px] uppercase tracking-wider text-text-muted/50 font-semibold">
                                            Accuracy
                                        </span>
                                    </div>
                                </div>

                                {/* Metrics summary */}
                                <div className="flex-1 space-y-2 text-center sm:text-left">
                                    <h4 className="text-sm font-bold text-text-primary">
                                        Training Complete ✨
                                    </h4>
                                    <p className="text-xs text-text-muted/70 leading-relaxed">
                                        {result.summary}
                                    </p>

                                    {/* Quick stats */}
                                    <div className="flex flex-wrap gap-3 text-[10px] font-mono text-text-muted/60">
                                        <span>⚡ {(result.execution_time_ms / 1000).toFixed(1)}s</span>
                                        <span>📈 {result.total_epochs} epochs</span>
                                        {result.final_loss !== null && (
                                            <span>📉 Loss: {result.final_loss.toFixed(4)}</span>
                                        )}
                                        {result.final_val_accuracy !== null && (
                                            <span>🎯 Val: {(result.final_val_accuracy * 100).toFixed(1)}%</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Metrics table */}
                        {result.metrics.length > 0 && (
                            <div className="glass-strong rounded-2xl p-4 overflow-hidden">
                                <h5 className="text-[10px] uppercase tracking-wider text-text-muted/60 font-semibold mb-3 flex items-center gap-2">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-blue/80">
                                        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                                    </svg>
                                    Epoch Metrics
                                </h5>

                                {/* Chart visualization */}
                                <div className="mb-4 h-24 flex items-end gap-[2px] px-2">
                                    {result.metrics.map((m, i) => {
                                        const acc = m.accuracy ?? 0;
                                        const height = Math.max(4, acc * 100);
                                        return (
                                            <motion.div
                                                key={i}
                                                className="flex-1 rounded-t-sm min-w-[3px]"
                                                style={{
                                                    background: `linear-gradient(to top, rgba(168,85,247,0.6), rgba(66,133,244,0.8))`,
                                                }}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${height}%` }}
                                                transition={{ duration: 0.5, delay: i * 0.05 }}
                                                title={`Epoch ${m.epoch}: ${(acc * 100).toFixed(1)}%`}
                                            />
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between text-[9px] text-text-muted/40 font-mono px-2 mb-3">
                                    <span>Epoch 1</span>
                                    <span>Epoch {result.metrics.length}</span>
                                </div>

                                {/* Table */}
                                <div className="overflow-x-auto max-h-48 overflow-y-auto">
                                    <table className="w-full text-[11px]">
                                        <thead>
                                            <tr className="text-text-muted/50 uppercase tracking-wider text-[9px] border-b border-white/[0.04]">
                                                <th className="text-left py-2 px-2 font-semibold">Epoch</th>
                                                <th className="text-right py-2 px-2 font-semibold">Loss</th>
                                                <th className="text-right py-2 px-2 font-semibold">Accuracy</th>
                                                <th className="text-right py-2 px-2 font-semibold">Val Loss</th>
                                                <th className="text-right py-2 px-2 font-semibold">Val Acc</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.metrics.map((m) => (
                                                <tr
                                                    key={m.epoch}
                                                    className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors"
                                                >
                                                    <td className="py-1.5 px-2 font-mono text-accent-purple/80">{m.epoch}</td>
                                                    <td className="py-1.5 px-2 text-right font-mono text-text-primary/70">
                                                        {m.loss?.toFixed(4) ?? "—"}
                                                    </td>
                                                    <td className="py-1.5 px-2 text-right font-mono text-accent-teal/80">
                                                        {m.accuracy ? `${(m.accuracy * 100).toFixed(2)}%` : "—"}
                                                    </td>
                                                    <td className="py-1.5 px-2 text-right font-mono text-text-primary/50">
                                                        {m.val_loss?.toFixed(4) ?? "—"}
                                                    </td>
                                                    <td className="py-1.5 px-2 text-right font-mono text-accent-blue/70">
                                                        {m.val_accuracy ? `${(m.val_accuracy * 100).toFixed(2)}%` : "—"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Corrected code viewer */}
                        {result.corrected_code && (
                            <div className="glass-strong rounded-2xl p-4">
                                <h5 className="text-[10px] uppercase tracking-wider text-accent-teal/70 font-semibold mb-2 flex items-center gap-2">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="16 18 22 12 16 6" />
                                        <polyline points="8 6 2 12 8 18" />
                                    </svg>
                                    Trained Code (With Fixes Applied)
                                </h5>
                                <pre className="bg-void/60 rounded-lg p-3 text-[11px] overflow-x-auto border border-accent-teal/10 font-mono text-text-primary/70 max-h-64 overflow-y-auto">
                                    <code>{result.corrected_code}</code>
                                </pre>
                            </div>
                        )}

                        {/* Stdout output */}
                        {result.stdout && (
                            <details className="glass-strong rounded-2xl overflow-hidden">
                                <summary className="px-4 py-3 text-[10px] uppercase tracking-wider text-text-muted/50 font-semibold cursor-pointer hover:bg-white/[0.02] transition-colors flex items-center gap-2">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="4 17 10 11 4 5" />
                                        <line x1="12" y1="19" x2="20" y2="19" />
                                    </svg>
                                    Console Output
                                </summary>
                                <pre className="px-4 pb-4 text-[11px] overflow-x-auto font-mono text-text-muted/50 max-h-48 overflow-y-auto whitespace-pre-wrap">
                                    {result.stdout}
                                </pre>
                            </details>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
