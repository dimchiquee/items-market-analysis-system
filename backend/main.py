from fastapi import FastAPI
from auth.steam import router as auth_router

app = FastAPI(title="Steam Market Analysis API")

app.include_router(auth_router, prefix="/auth")

@app.get("/")
async def root():
    return {"message": "Welcome to the Steam Market Analysis API"}