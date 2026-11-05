/* ────────────────────────────────────────
   API client for the FastAPI backend
   ──────────────────────────────────────── */

import { DiagnoseRequest, DiagnosisResponse, QuickScanResponse } from "./types";
import { getAuthHeaders } from "./auth";


const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

/**
 * Code-only diagnosis (JSON body — backward compatible).
 */
export async function diagnoseCode(
  request: DiagnoseRequest
): Promise<DiagnosisResponse> {
  return _fetchDiagnosis(`${API_BASE}/api/diagnose`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(request),
  });
}


/**
 * Lightweight Layer-1-only scan (no Gemini). Used for real-time editor feedback.
 */
export async function quickScan(code: string): Promise<QuickScanResponse> {
  return quickScanWithSignal(code);
}

/**
 * Lightweight Layer-1-only scan (no Gemini). Used for real-time editor feedback.
 * Accepts an optional AbortSignal so callers can cancel in-flight scans.
 */
export async function quickScanWithSignal(
  code: string,
  signal?: AbortSignal
): Promise<QuickScanResponse> {
  const res = await fetch(`${API_BASE}/api/quick-scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ code, language: "python" }),
    signal: signal ?? AbortSignal.timeout(5_000),
  });
  if (!res.ok) return { flags: [], scan_time_ms: 0 };
  return res.json();
}

async function _fetchDiagnosis(
  url: string,
  init: RequestInit
): Promise<DiagnosisResponse> {
  let res: Response;

  try {
    res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(90_000),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new Error("Diagnosis timed out. The code may be too long — try a shorter snippet.");
    }
    if (err instanceof TypeError) {
      throw new Error(
        "Cannot reach the ModelDoctor backend. Make sure the server is running on port 8000."
      );
    }
    throw new Error("Network error — please check your connection and try again.");
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(
      errBody?.detail || `Diagnosis failed with status ${res.status}`
    );
  }

  return res.json();
}


/**
 * Train the corrected ML model and return epoch-level metrics.
 */
export async function trainModel(
  originalCode: string,
  correctedCode: string
): Promise<import("./training-types").TrainResponse> {
  const res = await fetch(`${API_BASE}/api/train`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({
      original_code: originalCode,
      corrected_code: correctedCode,
      language: "python",
    }),
    signal: AbortSignal.timeout(150_000),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(errBody?.detail || `Training failed with status ${res.status}`);
  }

  return res.json();
}
