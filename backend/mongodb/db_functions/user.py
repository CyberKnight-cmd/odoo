from bson import ObjectId
from fastapi import HTTPException
from Request_and_Response.Requests import FindRideRequest, OfferRideRequest
from mongodb.collections import riders, rideroffers
from mongodb.models import Rider, RiderOffer
from pymongo.errors import PyMongoError
from datetime import datetime


async def save_ride_request(user_id: str, ride_data: FindRideRequest) -> bool:
    """Store a ride request (findride) in the riders collection."""
    from matching.h3_index import get_h3_cell
    from matching.routing import geocode_address
    
    # Geocode if missing
    if ride_data.start_lat is None or ride_data.start_lon is None:
        ride_data.start_lat, ride_data.start_lon = geocode_address(ride_data.start_location)
    if ride_data.dest_lat is None or ride_data.dest_lon is None:
        ride_data.dest_lat, ride_data.dest_lon = geocode_address(ride_data.end_destination)

    # Calculate H3 cell for the pickup location
    h3_pickup = get_h3_cell(ride_data.start_lat, ride_data.start_lon)

    rider = Rider(
        user_id=ObjectId(user_id),
        start_location=ride_data.start_location,
        end_destination=ride_data.end_destination,
        start_lat=ride_data.start_lat,
        start_lon=ride_data.start_lon,
        dest_lat=ride_data.dest_lat,
        dest_lon=ride_data.dest_lon,
        h3_pickup_cell=h3_pickup,
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
    from matching.routing import geocode_address

    # Geocode if missing
    if offer_data.start_lat is None or offer_data.start_lon is None:
        offer_data.start_lat, offer_data.start_lon = geocode_address(offer_data.start_location)
    if offer_data.dest_lat is None or offer_data.dest_lon is None:
        offer_data.dest_lat, offer_data.dest_lon = geocode_address(offer_data.end_destination)

    offer = RiderOffer(
        user_id=ObjectId(user_id),
        start_location=offer_data.start_location,
        end_destination=offer_data.end_destination,
        start_lat=offer_data.start_lat,
        start_lon=offer_data.start_lon,
        dest_lat=offer_data.dest_lat,
        dest_lon=offer_data.dest_lon,
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


async def search_drivers_in_db(
    start_location: str,
    end_destination: str,
    no_of_seats: int
) -> list[dict]:
    """Search for matching ride offers (drivers) for a given passenger request."""
    try:
        # Case-insensitive substring match for flexibility
        query = {
            "start_location": {"$regex": start_location, "$options": "i"},
            "end_destination": {"$regex": end_destination, "$options": "i"},
            "available_seats": {"$gte": no_of_seats}
        }
        cursor = rideroffers.find(query).sort("_id", -1)
        offers_list = await cursor.to_list(length=None)
        
        results = []
        for offer in offers_list:
            results.append({
                "offer_id": str(offer["_id"]),
                "driver_id": str(offer["user_id"]),
                "start_location": offer["start_location"],
                "end_destination": offer["end_destination"],
                "date_time": offer["date_time"],
                "available_seats": offer["available_seats"],
                "cost_per_seat": offer.get("cost_per_seat", 0.0)
            })
        return results
    except PyMongoError:
        raise HTTPException(
            status_code=500,
            detail="Database error while searching for drivers."
        )


async def search_riders_in_db(
    driver_id: str,
    start_lat: float,
    start_lon: float,
    dest_lat: float,
    dest_lon: float,
    available_seats: int
) -> list[dict]:
    """Search for matching passengers (riders) using route corridor + geographic proximity."""
    from matching.h3_index import haversine_distance, DEFAULT_PROXIMITY_THRESHOLD_KM
    from matching.routing import get_mapbox_route

    try:
        # 1. Get driver route via Mapbox
        route_coords, _, _ = get_mapbox_route(start_lon, start_lat, dest_lon, dest_lat)

        if not route_coords:
            return []

        # 2. Build a bounding box around the full route (with padding = threshold)
        padding = DEFAULT_PROXIMITY_THRESHOLD_KM / 111.0  # ~degrees
        all_lats = [p[0] for p in route_coords]
        all_lons = [p[1] for p in route_coords]
        min_lat = min(all_lats) - padding
        max_lat = max(all_lats) + padding
        min_lon = min(all_lons) - padding
        max_lon = max(all_lons) + padding

        # 3. Query DB with bounding box (fast pre-filter) + seat count + status
        query = {
            "start_lat": {"$gte": min_lat, "$lte": max_lat},
            "start_lon": {"$gte": min_lon, "$lte": max_lon},
            "no_of_seats": {"$lte": available_seats},
            "user_id": {"$ne": ObjectId(driver_id)},
            "status": {"$regex": "^(pending|active)$", "$options": "i"},
        }

        cursor = riders.find(query)
        riders_list = await cursor.to_list(length=None)

        results = []
        for r in riders_list:
            r_lat = r.get("start_lat")
            r_lon = r.get("start_lon")
            if r_lat is None or r_lon is None:
                continue

            # 4. Precise haversine filter against every point on the route polyline
            min_dist = min(
                haversine_distance(r_lat, r_lon, rt_lat, rt_lon)
                for rt_lat, rt_lon in route_coords
            )

            if min_dist <= DEFAULT_PROXIMITY_THRESHOLD_KM:
                results.append({
                    "user_id": str(r["user_id"]),
                    "start_location": r["start_location"],
                    "end_destination": r["end_destination"],
                    "start_lat": r_lat,
                    "start_lon": r_lon,
                    "dest_lat": r.get("dest_lat"),
                    "dest_lon": r.get("dest_lon"),
                    "date_time": r["date_time"],
                    "no_of_seats": r["no_of_seats"],
                    "status": r.get("status", "pending"),
                    "pickup_distance_km": round(min_dist, 2),
                    "pickup_eta_minutes": None,
                    "match_score": round(100 / (1 + min_dist), 2),
                })

        # 5. Rank by score (closest first)
        results.sort(key=lambda x: x["match_score"], reverse=True)
        return results

    except PyMongoError:
        raise HTTPException(
            status_code=500,
            detail="Database error while searching for passengers."
        )
