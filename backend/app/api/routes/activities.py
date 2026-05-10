from fastapi import APIRouter


router = APIRouter(prefix="/activities", tags=["activities"])


@router.get("/feed")
async def activity_feed() -> dict[str, list[dict[str, str]]]:
    return {"items": []}
