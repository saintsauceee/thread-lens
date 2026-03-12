from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from research.routes import research

app = FastAPI(title="Thread Lens Research API")

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
