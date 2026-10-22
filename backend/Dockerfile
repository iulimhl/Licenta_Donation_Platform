FROM python:3.13-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY backend/requirements.txt backend/requirements-ai.txt /tmp/requirements/
RUN python -m pip install torch==2.12.0 --index-url https://download.pytorch.org/whl/cpu \
    && python -m pip install -r /tmp/requirements/requirements-ai.txt

RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2', revision='e8f8c211226b894fcb81acc59f3b34ba3efd5f42', cache_folder='/tmp/model-cache').save('/opt/models/donation-matching')" \
    && rm -rf /tmp/model-cache

ENV EMBEDDING_MODEL_NAME=/opt/models/donation-matching \
    HF_HUB_OFFLINE=1 \
    ALLOW_EMBEDDING_MODEL_DOWNLOAD=false

COPY backend/app/ /app/
COPY backend/docker_entrypoint.py /usr/local/bin/docker_entrypoint.py

RUN useradd --uid 10001 --create-home app \
    && mkdir -p /data /app/uploads/profiles /app/uploads/verification_documents \
    && chown -R app:app /data /app/uploads

USER app
RUN python -c "import os; from sentence_transformers import SentenceTransformer; model = SentenceTransformer(os.environ['EMBEDDING_MODEL_NAME'], local_files_only=True); assert model.get_sentence_embedding_dimension() == 384"
EXPOSE 8000

ENTRYPOINT ["python", "/usr/local/bin/docker_entrypoint.py"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--root-path", "/api", "--proxy-headers", "--forwarded-allow-ips", "*"]
