from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from recommender import get_recommendations

app = FastAPI(title="PantryAI ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RequestBody(BaseModel):
    ingredients: List[str]
    mode: str = "maximize_fridge"


@app.post("/recipes/suggest")
def suggest_recipes(data: RequestBody):
    ingredients_str = ",".join(data.ingredients)
    results = get_recommendations(ingredients_str)
    return results


@app.get("/recipes/suggest")
def suggest_recipes_get(ingredients: str = Query(..., description="Comma-separated ingredients")):
    results = get_recommendations(ingredients)
    return results


@app.get("/health")
def health():
    return {"status": "ok", "service": "PantryAI ML"}