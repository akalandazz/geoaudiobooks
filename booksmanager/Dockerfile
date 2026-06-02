FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY bm.py .
COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

ENTRYPOINT ["booksmanager"]
CMD ["--help"]
