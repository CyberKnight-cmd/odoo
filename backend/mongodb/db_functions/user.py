from bson import ObjectId
from fastapi import HTTPException
from Request_and_Response.Requests import FindRideRequest, OfferRideRequest
from mongodb.collections import riders, rideroffers
from mongodb.models import Rider, RiderOffer
from pymongo.errors import PyMongoError
from datetime import datetime


async def save_ride_request(user_id: str, ride_data: FindRideRequest) -> bool:
    """Store a ride request (findride) in the riders collection."""
    rider = Rider(
        user_id=ObjectId(user_id),
        start_location=ride_data.start_location,
        end_destination=ride_data.end_destination,
        date_time=ride_data.date_time,
        no_of_seats=ride_data.no_of_seats,
        status=ride_data.status,
    )

    try:
        await riders.insert_one(rider.model_dump())
        return True
    except PyMongoError as e:
        raise HTTPException(
            status_code=500,
            detail="Database error while saving ride request."
        )


async def save_ride_offer(user_id: str, offer_data: OfferRideRequest) -> bool:
    """Store/Update a ride offer (offerride) in the rideroffers collection."""
    offer = RiderOffer(
        user_id=ObjectId(user_id),
        start_location=offer_data.start_location,
        end_destination=offer_data.end_destination,
        date_time=offer_data.date_time,
        available_seats=offer_data.available_seats,
        cost_per_seat=offer_data.cost_per_seat,
    )

    try:
        # Perform an update (upsert) to ensure only one offer exists per user
        await rideroffers.update_one(
            {"user_id": ObjectId(user_id)},
            {"$set": offer.model_dump()},
            upsert=True
        )
        return True
    except PyMongoError as e:
        raise HTTPException(
            status_code=500,
            detail="Database error while saving ride offer."
        )


async def get_user_offer_info(user_id: str) -> dict | None:
    """Fetch the ride offer details for a specific user."""
    try:
        res = await rideroffers.find_one({"user_id": ObjectId(user_id)})
        if res:
            res["_id"] = str(res["_id"])
            res["user_id"] = str(res["user_id"])
            if isinstance(res.get("date_time"), datetime):
                res["date_time"] = res["date_time"].isoformat()
            return res
        return None
    except PyMongoError:
        raise HTTPException(
            status_code=500,
            detail="Database error while retrieving user offer info."
        )


async def get_user_rider_info(user_id: str) -> list[dict]:
    """Fetch all ride request details for a specific user."""
    try:
        cursor = riders.find({"user_id": ObjectId(user_id)}).sort("_id", -1)
        res_list = await cursor.to_list(length=None)
        for res in res_list:
            res["_id"] = str(res["_id"])
            res["user_id"] = str(res["user_id"])
            if isinstance(res.get("date_time"), datetime):
                res["date_time"] = res["date_time"].isoformat()
        return res_list
    except PyMongoError:
        raise HTTPException(
            status_code=500,
            detail="Database error while retrieving user rider info."
        )


async def get_ride_status(user_id: str) -> str | None:
    """Retrieve the status of the latest ride request for a user."""
    try:
        # Find the latest ride request for this user
        result = await riders.find_one(
            {"user_id": ObjectId(user_id)},
            projection={"status": 1},
            sort=[("_id", -1)]
        )
        if result:
            return result.get("status")
        return None
    except PyMongoError as e:
        raise HTTPException(
            status_code=500,
            detail="Database error while retrieving ride status."
        )


async def get_all_riders(exclude_user_id: str | None = None, page: int = 1, limit: int = 10) -> dict:
    """Retrieve the paginated list of riders from the riders collection, optionally excluding a user."""
    try:
        query = {}
        if exclude_user_id:
            query = {"user_id": {"$ne": ObjectId(exclude_user_id)}}

        total = await riders.count_documents(query)
        skip = (page - 1) * limit
        cursor = riders.find(query).sort("_id", -1).skip(skip).limit(limit)
        riders_list = await cursor.to_list(length=None)
        return {
            "total": total,
            "page": page,
            "limit": limit,
            "riders": riders_list
        }
    except PyMongoError as e:
        raise HTTPException(
            status_code=500,
            detail="Database error while retrieving riders list."
        )


async def update_ride_status(user_id: str, new_status: str) -> bool:
    """Update the status of ride requests for a user in the riders collection."""
    try:
        # We update all matching ride requests for this user to be consistent
        result = await riders.update_many(
            {"user_id": ObjectId(user_id)},
            {"$set": {"status": new_status}}
        )
        return result.matched_count > 0
    except PyMongoError as e:
        raise HTTPException(
            status_code=500,
            detail="Database error while updating ride status."
        )
