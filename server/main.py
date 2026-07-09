from fastapi import FastAPI

app = FastAPI(title="Paw:Paw API Server")

@app.get("/health")
def health_check():
    return {"status": "healthy", "infrastructure": "Linux/WSL2"}