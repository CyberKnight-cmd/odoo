"""
FastAPI entrypoint.

Run with:
    uvicorn app.main:app --reload --port 8000

Then:
    POST http://localhost:8000/rides/match
"""

from __future__ import annotations
import os
from fastapi import FastAPI, HTTPException

from app.data.loader import load_rides_from_csv
from app.models.schemas import MatchRequest, MatchResponse
from app.services.ride_matching_service import RideMatchingService
from app.services.route_compatibility_service import RouteCompatibilityService, MapboxRouteProvider
from app.integrations import mapbox_client

app = FastAPI(title="Intelligent Ride Matching Service", version="1.0.0")

CSV_PATH = os.environ.get("RIDES_CSV_PATH", "data/rides.csv")

# Loaded once at startup. In a real integration this becomes a DB
# connection / repository instead of an in-memory CSV load.
store = load_rides_from_csv(CSV_PATH)

# If MAPBOX_ACCESS_TOKEN is set (.env), use real routed distance/ETA/
# detour with live traffic. Otherwise fall back to the dependency-free
# straight-line provider so the service still runs offline / without a key.
if mapbox_client.mapbox_configured():
    route_service = RouteCompatibilityService(route_provider=MapboxRouteProvider())
else:
    route_service = RouteCompatibilityService()

matching_service = RideMatchingService(store, route_service=route_service)


@app.get("/health")
def health():
    return {"status": "ok", "ridesLoaded": len(store)}


@app.post("/rides/match", response_model=MatchResponse)
def match_rides(req: MatchRequest):
    if req.seats < 1:
        raise HTTPException(status_code=400, detail="seats must be >= 1")
    return matching_service.match(req)
