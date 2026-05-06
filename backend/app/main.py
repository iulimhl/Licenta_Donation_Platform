from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ping, donations, auth, needs, messages
from db.database import engine, Base
import models.donation as donation_model
import models.need as need_model
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, donations, needs, messages, home, organizations
from db.database import engine, Base
import models.donation as donation_model
import models.need as need_model
import models.message as message_model
import models.user as user_model
from routers import organizations
from routers import home

Base.metadata.create_all(bind=engine)

app = FastAPI(title="IASIdoneaza API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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

@app.get("/")
def read_root():
    return {"message": "Welcome to IASIdoneaza API"}