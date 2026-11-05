"""Training endpoint — POST /train.

Accepts corrected ML code, trains the model in a sandboxed subprocess,
and returns epoch-level training metrics.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from dependencies.auth import get_current_user
from models.training import TrainRequest, TrainResponse
from services.training_service import train_corrected_code

logger = logging.getLogger("modeldoctor.training")
router = APIRouter()

MAX_CODE_LENGTH = 50_000


@router.post("/train", response_model=TrainResponse)
async def train_model(
    request: TrainRequest,
    _user: dict = Depends(get_current_user),
) -> TrainResponse:
    """Train the corrected ML model and return metrics."""
    code = request.corrected_code.strip()

    if len(code) < 10:
        raise HTTPException(
            status_code=400,
            detail="Corrected code too short for training.",
        )
    if len(code) > MAX_CODE_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Code too long ({len(code):,} chars). Max is {MAX_CODE_LENGTH:,}.",
        )

    logger.info("Training request received (%d chars)", len(code))
    result = await train_corrected_code(
        original_code=request.original_code,
        corrected_code=code,
    )
    logger.info(
        "Training complete: status=%s, epochs=%d, time=%dms",
        result.status, result.total_epochs, result.execution_time_ms,
    )
    return result
