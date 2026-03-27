import asyncio
import json
import logging
import os

import aio_pika
from dotenv import load_dotenv

from worker.executor import execute_research

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

RABBITMQ_URL = os.environ.get("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
QUEUE_NAME = "research_jobs"


async def on_message(message: aio_pika.abc.AbstractIncomingMessage) -> None:
    async with message.process():
        job = json.loads(message.body)
        session_id = job.get("session_id", "unknown")
        log.info("Received job session_id=%s query=%s", session_id, job.get("query", "")[:80])
        try:
            await execute_research(job)
            log.info("Completed job session_id=%s", session_id)
        except Exception:
            log.exception("Failed job session_id=%s", session_id)


async def main() -> None:
    log.info("Connecting to RabbitMQ at %s", RABBITMQ_URL)
    connection = await aio_pika.connect_robust(RABBITMQ_URL)

    async with connection:
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)

        queue = await channel.declare_queue(QUEUE_NAME, durable=True)
        log.info("Listening on queue '%s'", QUEUE_NAME)

        await queue.consume(on_message)

        # Run forever until interrupted
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
