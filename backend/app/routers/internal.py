import os
from fastapi import APIRouter, Depends, HTTPException, Header
from app import schemas
from app.tasks import process_event

router = APIRouter(prefix="/internal", tags=["internal"])

_INTERNAL_KEY = os.environ.get("INTERNAL_API_KEY", "")


def require_internal_key(x_internal_key: str = Header(...)):
    if not _INTERNAL_KEY or x_internal_key != _INTERNAL_KEY:
        raise HTTPException(status_code=401, detail="Invalid internal key")


@router.post("/events", status_code=202, dependencies=[Depends(require_internal_key)])
def emit_event(body: schemas.EventIn):
    process_event.delay(body.type, body.payload)
    return {"status": "queued"}
