from fastapi import FastAPI
from app.routers import ping

app = FastAPI(title="Donation Platform API")

app.include_router(ping.router)