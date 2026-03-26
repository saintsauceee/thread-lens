from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture
async def client():
    with patch("research.main.init_db", new_callable=AsyncMock), \
         patch("research.main.init_cache", new_callable=AsyncMock):
        from research.main import app

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            yield c


@pytest.fixture
def mock_db():
    """Patches get_db with a fake async context manager yielding a dummy connection."""

    @asynccontextmanager
    async def _fake_db():
        yield MagicMock()

    with patch("research.routes.research.get_db", _fake_db):
        yield


@pytest.fixture(autouse=True)
def mock_cache():
    """Patches all cache functions so tests don't need Redis."""
    with patch("research.routes.research.get_cached_kb", new_callable=AsyncMock, return_value=None), \
         patch("research.routes.research.get_cached_kb_list", new_callable=AsyncMock, return_value=None), \
         patch("research.routes.research.set_cached_kb", new_callable=AsyncMock), \
         patch("research.routes.research.set_cached_kb_list", new_callable=AsyncMock), \
         patch("research.routes.research.invalidate_kb", new_callable=AsyncMock), \
         patch("research.routes.research.invalidate_kb_list", new_callable=AsyncMock):
        yield
