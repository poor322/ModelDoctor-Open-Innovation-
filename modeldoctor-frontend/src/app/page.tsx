/* ────────────────────────────────────────
   Main Page — ModelDoctor Application
   ──────────────────────────────────────── */

"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Header from "@/components/Layout/Header";
import NeuralBackground from "@/components/Layout/NeuralBackground";
import CodeEditor from "@/components/Editor/CodeEditor";
import SampleCodeLoader from "@/components/Editor/SampleCodeLoader";
import DiagnoseButton from "@/components/UI/DiagnoseButton";
import LiveScanBadge from "@/components/UI/LiveScanBadge";
import LoadingState from "@/components/UI/LoadingState";
import ErrorState from "@/components/UI/ErrorState";
import DiagnosisReport from "@/components/Diagnosis/DiagnosisReport";
import TrainingPanel from "@/components/Training/TrainingPanel";
import AuthModal from "@/components/Auth/AuthModal";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useDiagnosis } from "@/hooks/useDiagnosis";
import { useTraining } from "@/hooks/useTraining";
import { useLiveScan } from "@/hooks/useLiveScan";
import { SAMPLE_CODES } from "@/lib/sample-codes";

const DEFAULT_CODE = SAMPLE_CODES[0].code;

export default function HomePage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated } = useAuth();
  const { state, result, error, runDiagnosis, reset } = useDiagnosis();
  const { state: trainState, result: trainResult, error: trainError, runTraining, resetTraining } = useTraining();
  const { flags: liveFlags, scanning: liveScanActive } = useLiveScan(code, state !== "scanning");

  const handleDiagnose = useCallback(() => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    runDiagnosis(code);
  }, [code, isAuthenticated, runDiagnosis]);

  const handleLoadSample = useCallback(
    (sampleCode: string) => {
      setCode(sampleCode);
      reset();
      resetTraining();
    },
    [reset, resetTraining]
  );

  const handleTrain = useCallback(() => {
    if (!result) return;
    // Build corrected code by applying all refactored_code fixes
    let corrected = code;
    for (const issue of result.issues) {
      if (issue.refactored_code && issue.location?.code_snippet) {
        corrected = corrected.replace(issue.location.code_snippet, issue.refactored_code);
      }
    }
    runTraining(code, corrected);
  }, [code, result, runTraining]);

  // Keyboard shortcut: Ctrl/Cmd + Enter
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (state !== "scanning") handleDiagnose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleDiagnose, state]);

  return (
    <div className="min-h-screen bg-void relative">
      <NeuralBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* ── Hero tagline ── */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              <span className="gradient-text-red">&quot;94% Accuracy.</span>{" "}
              <span className="text-text-muted/80">0% Trustworthy.&quot;</span>
            </h2>
            <p className="text-sm text-text-muted/60 max-w-lg mx-auto leading-relaxed">
              Paste your ML Python code below. ModelDoctor scans for silent
              failures — data leakage, overfitting traps, and bugs that
              never crash but silently corrupt your model.
            </p>
          </motion.div>

          {/* ── Two-column layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: Code Input */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                  Your ML Code
                </h3>
                <SampleCodeLoader onLoad={handleLoadSample} disabled={state === "scanning"} />
              </div>

              <CodeEditor code={code} onChange={setCode} disabled={state === "scanning"} liveFlags={liveFlags} />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-[10px] text-text-muted/50 font-mono">
                    {code.split("\n").length} lines &middot; Python
                  </p>
                  <LiveScanBadge flags={liveFlags} scanning={liveScanActive} />
                </div>
                <DiagnoseButton onClick={handleDiagnose} loading={state === "scanning"} disabled={!code.trim()} />
              </div>

            </motion.div>

            {/* RIGHT: Results */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">
                Diagnosis Report
              </h3>

              <AnimatePresence mode="wait">
                {/* Idle */}
                {state === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="glass-strong rounded-2xl p-10 text-center"
                  >
                    {/* ECG line idle graphic */}
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent-blue/10 to-accent-teal/10 flex items-center justify-center">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#idleGrad)" strokeWidth="1.5">
                        <defs>
                          <linearGradient id="idleGrad" x1="0" y1="0" x2="24" y2="24">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#00C9A7" />
                          </linearGradient>
                        </defs>
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-text-primary/80 mb-1.5">
                      Ready to Diagnose
                    </h3>
                    <p className="text-xs text-text-muted/50 max-w-xs mx-auto leading-relaxed">
                      Click{" "}
                      <span className="text-accent-blue font-semibold">Run Diagnosis</span>{" "}
                      or press{" "}
                      <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-text-muted/60 text-[10px] font-mono">
                        Ctrl+Enter
                      </kbd>{" "}
                      to scan your code.
                    </p>
                  </motion.div>
                )}

                {/* Loading */}
                {state === "scanning" && (
                  <motion.div key="scanning" exit={{ opacity: 0 }}>
                    <LoadingState />
                  </motion.div>
                )}

                {/* Error */}
                {state === "error" && error && (
                  <motion.div key="error" exit={{ opacity: 0 }}>
                    <ErrorState message={error} onRetry={handleDiagnose} />
                  </motion.div>
                )}

                {/* Success */}
                {state === "success" && result && (
                  <motion.div key="success" exit={{ opacity: 0 }} className="space-y-4">
                    <DiagnosisReport
                      report={result}
                      onTrain={handleTrain}
                      isTraining={trainState === "training"}
                    />
                    <TrainingPanel
                      state={trainState}
                      result={trainResult}
                      error={trainError}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* ── Footer ── */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-14 pt-6 border-t border-white/[0.04] text-center pb-6"
          >
            <p className="text-[10px] text-text-muted/30 font-mono tracking-wide">
              ModelDoctor &middot; Team ASTROID — Prabhas N &amp; Poornima Bhat &middot;
              Open Innovation Track &middot; &quot;Trustworthy ML, from the start.&quot;
            </p>
          </motion.footer>
        </main>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
