from dotenv import load_dotenv

load_dotenv()

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from thread_lens_db import close_db, init_db

from research.cache import close_cache, init_cache
from research.routes import research


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await init_cache()
    yield
    await close_cache()
    await close_db()


app = FastAPI(title="Thread Lens Research API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(research.router)


def main() -> None:
    import uvicorn
    uvicorn.run("research.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()
