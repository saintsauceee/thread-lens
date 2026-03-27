from dotenv import load_dotenv

load_dotenv()

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from thread_lens_db import close_db, init_db

from research.cache import close_cache, init_cache
from research.queue import close_rabbitmq, init_rabbitmq
from research.routes import auth, research

CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await init_cache()
    await init_rabbitmq()
    yield
    await close_rabbitmq()
    await close_cache()
    await close_db()


app = FastAPI(title="Thread Lens Research API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(research.router)


def main() -> None:
    import uvicorn
    uvicorn.run("research.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()
