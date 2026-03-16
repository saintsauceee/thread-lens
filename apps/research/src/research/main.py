from dotenv import load_dotenv

load_dotenv()

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from thread_lens_db import init_db

from research.routes import research


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


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
