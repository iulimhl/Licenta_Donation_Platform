from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import engine, Base

from routers import ping, donations, auth, needs, messages, home, organizations, verification

import models.donation as donation_model
import models.need as need_model
import models.message as message_model
import models.user as user_model

Base.metadata.create_all(bind=engine)

app = FastAPI(title="IASIdoneaza API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ping.router)
app.include_router(donations.router)
app.include_router(needs.router)
app.include_router(auth.router)
app.include_router(messages.router)
app.include_router(organizations.router)
app.include_router(home.router)
app.include_router(verification.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to IASIdoneaza API"}