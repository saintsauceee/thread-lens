import itertools
import os
import threading
from dataclasses import dataclass, field
from datetime import datetime, timedelta


_RPM_LIMIT = 4   # stay under 5 RPM with a safety margin
_RPD_LIMIT = 18  # stay under 20 RPD with a safety margin


@dataclass
class _KeyStats:
    rpm_count: int = 0
    rpd_count: int = 0
    rpm_window: datetime = field(default_factory=datetime.now)
    rpd_window: datetime = field(default_factory=datetime.now)


class KeyRotator:
    """Round-robin API key rotator with per-key RPM/RPD tracking."""

    def __init__(self, keys: list[str]) -> None:
        if not keys:
            raise RuntimeError("No API keys provided")
        self._keys = keys
        self._stats: dict[str, _KeyStats] = {k: _KeyStats() for k in keys}
        self._cycle = itertools.cycle(keys)
        self._current = next(self._cycle)
        self._lock = threading.Lock()

    def _refresh(self, stats: _KeyStats) -> None:
        now = datetime.now()
        if now - stats.rpm_window >= timedelta(minutes=1):
            stats.rpm_count = 0
            stats.rpm_window = now
        if now - stats.rpd_window >= timedelta(days=1):
            stats.rpd_count = 0
            stats.rpd_window = now

    def _available(self, key: str) -> bool:
        s = self._stats[key]
        self._refresh(s)
        return s.rpm_count < _RPM_LIMIT and s.rpd_count < _RPD_LIMIT

    def get_key(self) -> str:
        """Return the next available key and increment its counters."""
        with self._lock:
            for _ in range(len(self._keys)):
                if self._available(self._current):
                    s = self._stats[self._current]
                    s.rpm_count += 1
                    s.rpd_count += 1
                    key = self._current
                    self._current = next(self._cycle)
                    return key
                self._current = next(self._cycle)
        raise RuntimeError("All API keys have exceeded their rate limits")

    def mark_rate_limited(self, key: str) -> None:
        """Force-exhaust a key's RPM quota after receiving a 429."""
        with self._lock:
            self._stats[key].rpm_count = _RPM_LIMIT


def _load_keys() -> list[str]:
    keys = [os.getenv(f"GOOGLE_API_KEY_{i}") for i in range(1, 6)]
    keys = [k for k in keys if k]
    if not keys:
        fallback = os.getenv("GOOGLE_API_KEY")
        if fallback:
            keys.append(fallback)
    return keys


_rotator: KeyRotator | None = None


def get_rotator() -> KeyRotator:
    global _rotator
    if _rotator is None:
        keys = _load_keys()
        if not keys:
            raise RuntimeError(
                "Set GOOGLE_API_KEY_1 … GOOGLE_API_KEY_5 (or GOOGLE_API_KEY) in your .env"
            )
        _rotator = KeyRotator(keys)
    return _rotator
