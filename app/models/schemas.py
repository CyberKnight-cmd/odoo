"""
API-facing request/response models.

These are deliberately decoupled from the internal Ride data model
(app/data/loader.py) so the matching module can be dropped into an
existing codebase without forcing a schema change on the core Ride
entity.
"""

from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class LatLon(BaseModel):
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "latitude": 22.584,
                "longitude": 88.402
            }
        }
    )


class MatchRequest(BaseModel):
    org_id: str = Field("ORG_KOL_001", description="Tenant/organization id — hard filter")
    pickup: LatLon
    destination: LatLon
    travel_date: str = Field("2026-08-10", description="YYYY-MM-DD")
    requested_hour: float = Field(18.0, description="24h hour, e.g. 18.5 = 18:30")
    seats: int = Field(1, ge=1, description="Number of seats requested")
    max_fare: Optional[float] = Field(60.0, description="Optional maximum fare per seat")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "org_id": "ORG_KOL_001",
                "pickup": {
                    "latitude": 22.584,
                    "longitude": 88.402
                },
                "destination": {
                    "latitude": 22.50,
                    "longitude": 88.38
                },
                "travel_date": "2026-08-10",
                "requested_hour": 18.0,
                "seats": 1,
                "max_fare": 60.0
            }
        }
    )


class ScoreBreakdown(BaseModel):
    pickupScore: float
    destinationScore: float
    detourScore: float
    timeScore: float
    fareScore: float

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "pickupScore": 100.0,
                "destinationScore": 100.0,
                "detourScore": 100.0,
                "timeScore": 100.0,
                "fareScore": 100.0
            }
        }
    )


class RideMatchResult(BaseModel):
    rideId: str
    driverName: str
    matchScore: float
    breakdown: ScoreBreakdown
    reasons: List[str]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "rideId": "R000001",
                "driverName": "Chanchal",
                "matchScore": 88.45,
                "breakdown": {
                    "pickupScore": 92.10,
                    "destinationScore": 89.50,
                    "detourScore": 85.00,
                    "timeScore": 90.00,
                    "fareScore": 75.00
                },
                "reasons": [
                    "Pickup walk distance: 0.23 km",
                    "Dropoff walk distance: 0.31 km",
                    "Driver detour distance: 0.85 km",
                    "Departure time difference: 0 mins",
                    "Fare within budget: $47.00"
                ]
            }
        }
    )


class MatchResponse(BaseModel):
    results: List[RideMatchResult]
    candidatesConsidered: int
    totalRidesInSystem: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "results": [
                    {
                        "rideId": "R000001",
                        "driverName": "Chanchal",
                        "matchScore": 88.45,
                        "breakdown": {
                            "pickupScore": 92.10,
                            "destinationScore": 89.50,
                            "detourScore": 85.00,
                            "timeScore": 90.00,
                            "fareScore": 75.00
                        },
                        "reasons": [
                            "Pickup walk distance: 0.23 km",
                            "Dropoff walk distance: 0.31 km",
                            "Driver detour distance: 0.85 km",
                            "Departure time difference: 0 mins",
                            "Fare within budget: $47.00"
                        ]
                    }
                ],
                "candidatesConsidered": 12,
                "totalRidesInSystem": 20000
            }
        }
    )
