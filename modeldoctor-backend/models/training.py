"""Pydantic models for training request/response schemas."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


# ───── Request Models ─────


class TrainRequest(BaseModel):
    """Request body for POST /train."""

    original_code: str = Field(..., description="Original user code before fixes")
    corrected_code: str = Field(..., description="Code with auto-fixes applied")
    language: str = Field(default="python")


# ───── Response Models ─────


class TrainMetric(BaseModel):
    """A single epoch of training metrics."""

    epoch: int
    loss: Optional[float] = None
    accuracy: Optional[float] = None
    val_loss: Optional[float] = None
    val_accuracy: Optional[float] = None


class TrainResponse(BaseModel):
    """Full training result returned to the frontend."""

    status: str = Field(..., description="success | error | timeout")
    metrics: list[TrainMetric] = Field(default_factory=list)
    total_epochs: int = 0
    final_loss: Optional[float] = None
    final_accuracy: Optional[float] = None
    final_val_accuracy: Optional[float] = None
    summary: str = ""
    execution_time_ms: int = 0
    stdout: str = ""
    stderr: str = ""
    corrected_code: str = ""
