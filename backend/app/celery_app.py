import os
from celery import Celery
from celery.schedules import crontab

celery = Celery(
    "geoaudiobooks",
    broker=os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
)
celery.conf.task_serializer = "json"
celery.conf.result_serializer = "json"
celery.conf.accept_content = ["json"]
celery.autodiscover_tasks(["app"])

celery.conf.beat_schedule = {
    "purge-old-idempotency-keys-daily": {
        "task": "app.tasks.purge_old_idempotency_keys",
        "schedule": crontab(hour=3, minute=0),  # 03:00 UTC daily
    },
}
