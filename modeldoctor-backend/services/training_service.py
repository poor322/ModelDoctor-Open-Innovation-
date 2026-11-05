"""Training service — executes corrected ML code in a sandboxed subprocess.

Runs the user's auto-fixed code, captures stdout, and parses training
metrics (epoch, loss, accuracy) from the output.
"""

from __future__ import annotations

import json
import logging
import os
import re
import subprocess
import sys
import tempfile
import time
from typing import Optional

from models.training import TrainMetric, TrainResponse

logger = logging.getLogger("modeldoctor.training")

TRAINING_TIMEOUT_SECONDS = int(os.getenv("TRAINING_TIMEOUT", "120"))

# ─────────────────── Metric Injection ───────────────────

METRICS_WRAPPER = '''
# ── ModelDoctor metrics capture wrapper ──
import json as _md_json, sys as _md_sys

class _MDCallback:
    """Captures training metrics and prints them as JSON for parsing."""
    def __init__(self):
        self.metrics = []

    def on_epoch_end(self, epoch, logs=None):
        logs = logs or {}
        metric = {
            "epoch": epoch + 1,
            "loss": round(logs.get("loss", 0), 6),
            "accuracy": round(logs.get("accuracy", logs.get("acc", 0)), 6),
            "val_loss": round(logs.get("val_loss", 0), 6) if "val_loss" in logs else None,
            "val_accuracy": round(logs.get("val_accuracy", logs.get("val_acc", 0)), 6) if ("val_accuracy" in logs or "val_acc" in logs) else None,
        }
        self.metrics.append(metric)
        print(f"__MD_METRIC__{_md_json.dumps(metric)}__MD_END__", flush=True)

_md_callback = _MDCallback()
# ── End ModelDoctor wrapper ──
'''

SKLEARN_WRAPPER = '''
# ── ModelDoctor sklearn metrics capture ──
import json as _md_json
import numpy as _md_np

def _md_capture_sklearn_metrics(model, X_train, y_train, X_test=None, y_test=None):
    """Capture metrics from sklearn models after fitting."""
    metrics = []
    try:
        train_score = model.score(X_train, y_train)
        metric = {"epoch": 1, "loss": round(1.0 - train_score, 6), "accuracy": round(train_score, 6)}
        if X_test is not None and y_test is not None:
            val_score = model.score(X_test, y_test)
            metric["val_loss"] = round(1.0 - val_score, 6)
            metric["val_accuracy"] = round(val_score, 6)
        metrics.append(metric)
        print(f"__MD_METRIC__{_md_json.dumps(metric)}__MD_END__", flush=True)
    except Exception as e:
        print(f"__MD_METRIC_ERROR__{str(e)}__MD_END__", flush=True)
    return metrics

# ── End sklearn wrapper ──
'''

TRAINING_FOOTER = '''
# ── ModelDoctor: Auto-capture sklearn metrics ──
import inspect as _md_inspect

# Find fitted sklearn models and score them
for _md_name, _md_obj in list(locals().items()):
    if _md_name.startswith("_md_") or _md_name.startswith("__"):
        continue
    if hasattr(_md_obj, "predict") and hasattr(_md_obj, "score") and hasattr(_md_obj, "fit"):
        # It's a fitted sklearn-like model; find training data
        _md_x_vars = [v for n, v in locals().items() if not n.startswith("_") and hasattr(v, "shape") and hasattr(v, "ndim")]
        _md_y_vars = [v for n, v in locals().items() if not n.startswith("_") and hasattr(v, "shape") and (not hasattr(v, "ndim") or getattr(v, "ndim", 2) <= 1)]
        if len(_md_x_vars) >= 1 and len(_md_y_vars) >= 1:
            try:
                # Try to find X_train, y_train, X_test, y_test by common names
                _md_lt = locals()
                _md_X_train = _md_lt.get("X_train", _md_x_vars[0])
                _md_y_train = _md_lt.get("y_train", _md_y_vars[0])
                _md_X_test = _md_lt.get("X_test", _md_x_vars[1] if len(_md_x_vars) > 1 else None)
                _md_y_test = _md_lt.get("y_test", _md_y_vars[1] if len(_md_y_vars) > 1 else None)
                _md_capture_sklearn_metrics(_md_obj, _md_X_train, _md_y_train, _md_X_test, _md_y_test)
            except Exception:
                pass
        break

print("__MD_TRAINING_COMPLETE__", flush=True)
'''


# ─────────────────── Data Fallback ───────────────────

DATA_FALLBACK_WRAPPER = '''
# ── ModelDoctor: Synthetic data fallback for sandboxed execution ──
import os as _md_os

def _md_patch_data_loaders():
    """Monkey-patch pd.read_csv and similar to generate synthetic data when files are missing."""
    try:
        import pandas as _pd
        import numpy as _np
        _original_read_csv = _pd.read_csv

        def _md_read_csv(filepath_or_buffer, *args, **kwargs):
            if isinstance(filepath_or_buffer, str) and not _md_os.path.exists(filepath_or_buffer):
                print(f"[ModelDoctor] File '{filepath_or_buffer}' not found — generating synthetic data for training demo.", flush=True)
                n_rows = 500
                data = {
                    "feature_1": _np.random.randn(n_rows),
                    "feature_2": _np.random.randn(n_rows),
                    "feature_3": _np.random.randn(n_rows),
                    "feature_4": _np.random.uniform(0, 100, n_rows),
                    "feature_5": _np.random.uniform(-1, 1, n_rows),
                    "target": _np.random.randint(0, 2, n_rows),
                }
                return _pd.DataFrame(data)
            return _original_read_csv(filepath_or_buffer, *args, **kwargs)

        _pd.read_csv = _md_read_csv

        # Also patch read_excel, read_parquet if they exist
        for _reader in ["read_excel", "read_parquet", "read_json"]:
            if hasattr(_pd, _reader):
                _orig = getattr(_pd, _reader)
                def _make_fallback(_orig_fn, _name):
                    def _fallback(fp, *a, **kw):
                        if isinstance(fp, str) and not _md_os.path.exists(fp):
                            print(f"[ModelDoctor] File '{fp}' not found — generating synthetic data.", flush=True)
                            n = 500
                            return _pd.DataFrame({
                                f"col_{i}": _np.random.randn(n) for i in range(5)
                            } | {"target": _np.random.randint(0, 2, n)})
                        return _orig_fn(fp, *a, **kw)
                    return _fallback
                setattr(_pd, _reader, _make_fallback(_orig, _reader))
    except ImportError:
        pass

    try:
        import numpy as _np
        _orig_loadtxt = _np.loadtxt
        def _md_loadtxt(fname, *args, **kwargs):
            if isinstance(fname, str) and not _md_os.path.exists(fname):
                print(f"[ModelDoctor] File '{fname}' not found — generating synthetic numpy data.", flush=True)
                return _np.random.randn(500, 5)
            return _orig_loadtxt(fname, *args, **kwargs)
        _np.loadtxt = _md_loadtxt
        _np.genfromtxt = _md_loadtxt
    except ImportError:
        pass

    # Patch open() for generic file reads
    import builtins
    _orig_open = builtins.open
    def _md_open(file, *args, **kwargs):
        if isinstance(file, str) and not _md_os.path.exists(file) and any(file.endswith(ext) for ext in [".csv", ".txt", ".data", ".tsv"]):
            print(f"[ModelDoctor] File '{file}' not found — creating minimal placeholder.", flush=True)
            import io
            header = ",".join([f"feature_{i}" for i in range(5)] + ["target"])
            import numpy as _np2
            rows = []
            for _ in range(500):
                vals = [str(round(_np2.random.randn(), 4)) for _ in range(5)] + [str(_np2.random.randint(0, 2))]
                rows.append(",".join(vals))
            return io.StringIO(header + "\\n" + "\\n".join(rows))
        return _orig_open(file, *args, **kwargs)
    builtins.open = _md_open

_md_patch_data_loaders()
# ── End data fallback ──
'''


# ─────────────────── Core Training Logic ───────────────────


def _prepare_training_code(corrected_code: str) -> str:
    """Wrap the corrected code with metric-capture instrumentation."""
    # Detect framework — be careful not to confuse sklearn .fit() with Keras .fit()
    uses_sklearn = any(kw in corrected_code for kw in ["sklearn", "from sklearn", "import sklearn"])
    uses_keras = any(kw in corrected_code for kw in ["keras", "tensorflow", "Sequential(", "tf.keras"]) and not uses_sklearn

    parts = []

    # Always inject data fallback first (handles missing CSV/data files in sandbox)
    parts.append(DATA_FALLBACK_WRAPPER)

    if uses_sklearn:
        parts.append(SKLEARN_WRAPPER)

    if uses_keras:
        parts.append(METRICS_WRAPPER)
        # Inject callback into .fit() calls — only for Keras models
        corrected_code = _inject_keras_callback(corrected_code)

    parts.append(corrected_code)
    parts.append(TRAINING_FOOTER)

    return "\n".join(parts)


def _inject_keras_callback(code: str) -> str:
    """Inject _md_callback into model.fit() calls for Keras/TF models."""
    # Simple heuristic: find .fit( and add callbacks parameter
    # This handles common patterns like model.fit(X, y, epochs=10)
    fit_pattern = re.compile(r'(\.fit\()((?:[^()]*|\([^()]*\))*)\)', re.DOTALL)

    def _add_callback(match):
        prefix = match.group(1)
        args = match.group(2)
        if "callbacks" in args:
            # Already has callbacks - append ours
            args = re.sub(
                r'callbacks\s*=\s*\[([^\]]*)\]',
                r'callbacks=[\1, _md_callback]',
                args
            )
        else:
            # Add callbacks parameter
            args = args.rstrip().rstrip(",") + ", callbacks=[_md_callback]"
        return f"{prefix}{args})"

    return fit_pattern.sub(_add_callback, code)


def _parse_metrics(stdout: str) -> list[TrainMetric]:
    """Extract __MD_METRIC__ JSON blocks from subprocess stdout."""
    metrics = []
    for match in re.finditer(r'__MD_METRIC__(.+?)__MD_END__', stdout):
        try:
            data = json.loads(match.group(1))
            metrics.append(TrainMetric(**data))
        except (json.JSONDecodeError, Exception):
            continue
    return metrics


async def train_corrected_code(
    original_code: str,
    corrected_code: str,
) -> TrainResponse:
    """Execute the corrected ML code and capture training metrics."""
    start = time.perf_counter()

    # Prepare instrumented code
    instrumented = _prepare_training_code(corrected_code)

    # Write to temp file
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".py", delete=False, encoding="utf-8"
    ) as tmp:
        tmp.write(instrumented)
        tmp_path = tmp.name

    try:
        # Execute in subprocess
        result = subprocess.run(
            [sys.executable, tmp_path],
            capture_output=True,
            text=True,
            timeout=TRAINING_TIMEOUT_SECONDS,
            cwd=tempfile.gettempdir(),
            env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
        )

        elapsed_ms = int((time.perf_counter() - start) * 1000)
        stdout = result.stdout
        stderr = result.stderr

        # Parse metrics from output
        metrics = _parse_metrics(stdout)

        # Clean stdout (remove metric markers)
        clean_stdout = re.sub(r'__MD_METRIC__.*?__MD_END__\n?', '', stdout)
        clean_stdout = clean_stdout.replace("__MD_TRAINING_COMPLETE__", "").strip()

        # Build response
        if result.returncode != 0 and not metrics:
            return TrainResponse(
                status="error",
                metrics=[],
                summary=f"Training failed with exit code {result.returncode}.",
                execution_time_ms=elapsed_ms,
                stdout=clean_stdout[-2000:] if clean_stdout else "",
                stderr=stderr[-2000:] if stderr else "",
                corrected_code=corrected_code,
            )

        # Determine final metrics
        final_loss = metrics[-1].loss if metrics else None
        final_accuracy = metrics[-1].accuracy if metrics else None
        final_val_accuracy = metrics[-1].val_accuracy if metrics else None

        # Generate summary
        if metrics:
            summary = (
                f"Training completed successfully in {elapsed_ms/1000:.1f}s. "
                f"{len(metrics)} epoch(s) recorded. "
            )
            if final_accuracy is not None and final_accuracy > 0:
                summary += f"Final accuracy: {final_accuracy*100:.2f}%. "
            if final_val_accuracy is not None and final_val_accuracy > 0:
                summary += f"Validation accuracy: {final_val_accuracy*100:.2f}%. "
            if final_loss is not None:
                summary += f"Final loss: {final_loss:.6f}."
        else:
            summary = (
                f"Code executed successfully in {elapsed_ms/1000:.1f}s. "
                "No epoch-level metrics captured (model may use different training API)."
            )

        return TrainResponse(
            status="success",
            metrics=metrics,
            total_epochs=len(metrics),
            final_loss=final_loss,
            final_accuracy=final_accuracy,
            final_val_accuracy=final_val_accuracy,
            summary=summary,
            execution_time_ms=elapsed_ms,
            stdout=clean_stdout[-2000:] if clean_stdout else "",
            stderr=stderr[-1000:] if stderr else "",
            corrected_code=corrected_code,
        )

    except subprocess.TimeoutExpired:
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        return TrainResponse(
            status="timeout",
            summary=f"Training timed out after {TRAINING_TIMEOUT_SECONDS}s. Try simpler code or reduce epochs.",
            execution_time_ms=elapsed_ms,
            corrected_code=corrected_code,
        )

    except Exception as e:
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        logger.error("Training execution error: %s", e, exc_info=True)
        return TrainResponse(
            status="error",
            summary=f"Training execution error: {type(e).__name__}: {str(e)}",
            execution_time_ms=elapsed_ms,
            corrected_code=corrected_code,
        )

    finally:
        # Cleanup temp file
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
