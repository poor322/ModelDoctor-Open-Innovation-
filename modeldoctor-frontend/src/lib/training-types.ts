/* ────────────────────────────────────────
   Training types — TypeScript interfaces
   ──────────────────────────────────────── */

export interface TrainMetric {
    epoch: number;
    loss: number | null;
    accuracy: number | null;
    val_loss: number | null;
    val_accuracy: number | null;
}

export interface TrainResponse {
    status: "success" | "error" | "timeout";
    metrics: TrainMetric[];
    total_epochs: number;
    final_loss: number | null;
    final_accuracy: number | null;
    final_val_accuracy: number | null;
    summary: string;
    execution_time_ms: number;
    stdout: string;
    stderr: string;
    corrected_code: string;
}

export type TrainingState = "idle" | "training" | "complete" | "error";
