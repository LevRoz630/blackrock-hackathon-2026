from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import transactions

app = FastAPI(title="Think Before You Spend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
