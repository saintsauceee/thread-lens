import os

import aio_pika

RABBITMQ_URL = os.environ.get("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
QUEUE_NAME = "research_jobs"

_rmq_connection: aio_pika.abc.AbstractRobustConnection | None = None
_rmq_channel: aio_pika.abc.AbstractChannel | None = None


async def init_rabbitmq() -> None:
    global _rmq_connection, _rmq_channel
    _rmq_connection = await aio_pika.connect_robust(RABBITMQ_URL)
    _rmq_channel = await _rmq_connection.channel()
    await _rmq_channel.declare_queue(QUEUE_NAME, durable=True)


async def close_rabbitmq() -> None:
    global _rmq_connection, _rmq_channel
    if _rmq_connection:
        await _rmq_connection.close()
    _rmq_connection = None
    _rmq_channel = None


def get_rmq_channel() -> aio_pika.abc.AbstractChannel:
    assert _rmq_channel is not None, "RabbitMQ not initialized"
    return _rmq_channel
