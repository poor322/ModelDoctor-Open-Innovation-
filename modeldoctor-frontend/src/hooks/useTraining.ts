/* ────────────────────────────────────────
   useTraining hook — state management
   for the model training workflow
   ──────────────────────────────────────── */

"use client";

import { useState, useCallback } from "react";
import { trainModel } from "@/lib/api";
import { TrainResponse, TrainingState } from "@/lib/training-types";

export function useTraining() {
    const [state, setState] = useState<TrainingState>("idle");
    const [result, setResult] = useState<TrainResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const runTraining = useCallback(
        async (originalCode: string, correctedCode: string) => {
            setState("training");
            setResult(null);
            setError(null);

            try {
                const response = await trainModel(originalCode, correctedCode);
                setResult(response);
                setState(response.status === "success" ? "complete" : "error");
                if (response.status !== "success") {
                    setError(response.summary);
                }
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Training failed unexpectedly.";
                setError(message);
                setState("error");
            }
        },
        []
    );

    const resetTraining = useCallback(() => {
        setState("idle");
        setResult(null);
        setError(null);
    }, []);

    return { state, result, error, runTraining, resetTraining };
}
