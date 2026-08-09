from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from Request_and_Response.Requests import FindRideRequest, OfferRideRequest
from Request_and_Response.Responses import (
    FindRideResponse,
    OfferRideResponse,
    ObserveStatusResponse,
    RiderDetailsResponse,
    UpdateStatusResponse,
    PaginatedRidersResponse,
    SearchDriversResponse,
    SearchRidersResponse,
)
from dependency.token_dependency import verify_user_access_token
from mongodb.db_functions.user import (
    save_ride_request,
    save_ride_offer,
    get_ride_status,
    get_all_riders,
    update_ride_status,
    get_user_offer_info,
    get_user_rider_info,
    search_drivers_in_db,
    search_riders_in_db,
)
from mongodb.db_functions.admin import delete_user_data

router = APIRouter(
    prefix="/user",
    tags=["User"]
)


@router.get("/getinfoforoffers")
async def getinfoforoffers(payload: dict = Depends(verify_user_access_token)):
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token payload.",
        )
    info = await get_user_offer_info(user_id)
    if not info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No ride offer found for this user.",
        )
    return info


@router.get("/getinfoforriders")
async def getinfoforriders(payload: dict = Depends(verify_user_access_token)):
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token payload.",
        )
    return await get_user_rider_info(user_id)


@router.post(
    "/findride",
    response_model=FindRideResponse,
    status_code=status.HTTP_201_CREATED,
)
async def find_ride(
    ride_data: FindRideRequest,
    payload: dict = Depends(verify_user_access_token),
) -> dict:
    """Submit a ride request to find matching drivers."""
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token payload.",
        )

    await save_ride_request(user_id, ride_data)
    return {"status": "Ride request logged successfully"}


@router.post(
    "/offerride",
    response_model=SearchRidersResponse,
    status_code=status.HTTP_201_CREATED,
)
async def offer_ride(
    offer_data: OfferRideRequest,
    payload: dict = Depends(verify_user_access_token),
) -> dict:
    """Submit a ride offer to find passengers."""
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token payload.",
        )

    await save_ride_offer(user_id, offer_data)
    results = await search_riders_in_db(
        driver_id=user_id,
        start_lat=offer_data.start_lat,
        start_lon=offer_data.start_lon,
        dest_lat=offer_data.dest_lat,
        dest_lon=offer_data.dest_lon,
        available_seats=offer_data.available_seats
    )
    return {"results": results}


@router.get("/observe_status", response_model=ObserveStatusResponse)
async def observe_status(
    payload: dict = Depends(verify_user_access_token),
) -> dict[str, str]:
    """Retrieve the status of the current user's ride request."""
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token payload.",
        )

    current_status = await get_ride_status(user_id)
    if current_status is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No ride request found for this user.",
        )

    return {"status": current_status}


@router.get("/show_riders", response_model=PaginatedRidersResponse)
async def show_riders(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    start_lat: float | None = Query(None),
    start_lon: float | None = Query(None),
    dest_lat: float | None = Query(None),
    dest_lon: float | None = Query(None),
    available_seats: int | None = Query(None),
    payload: dict = Depends(verify_user_access_token),
) -> dict:
    """Get the paginated list of riders/search requests intelligently matched for the driver."""
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token payload.",
        )

    try:
        # Resolve Driver's route parameters
        s_lat, s_lon, d_lat, d_lon, seats = start_lat, start_lon, dest_lat, dest_lon, available_seats

        # If any query parameter is missing, fallback to driver's active offer in the DB
        if None in (s_lat, s_lon, d_lat, d_lon, seats):
            offer_info = await get_user_offer_info(user_id)
            if not offer_info:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Missing query parameters and no active ride offer found for this user."
                )
            s_lat = offer_info.get("start_lat")
            s_lon = offer_info.get("start_lon")
            d_lat = offer_info.get("dest_lat")
            d_lon = offer_info.get("dest_lon")
            seats = offer_info.get("available_seats", 1)
            
            # If the DB offer is stale (missing coordinates), geocode it on the fly
            if None in (s_lat, s_lon, d_lat, d_lon):
                from matching.routing import geocode_address
                start_loc = offer_info.get("start_location", "")
                end_dest = offer_info.get("end_destination", "")
                if start_loc:
                    s_lat, s_lon = geocode_address(start_loc)
                if end_dest:
                    d_lat, d_lon = geocode_address(end_dest)

        if None in (s_lat, s_lon, d_lat, d_lon) or (s_lat == 0.0 and s_lon == 0.0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Active offer is missing spatial coordinates and geocoding failed."
            )

        # Perform intelligent matching
        all_matches = await search_riders_in_db(
            driver_id=user_id,
            start_lat=s_lat,
            start_lon=s_lon,
            dest_lat=d_lat,
            dest_lon=d_lon,
            available_seats=seats
        )

        # Paginate manually after matching
        total = len(all_matches)
        skip = (page - 1) * limit
        paginated_matches = all_matches[skip:skip + limit]

        mapped_riders = [
            {
                "user_id": str(r["user_id"]),
                "start_location": r["start_location"],
                "end_destination": r["end_destination"],
                "start_lat": r.get("start_lat"),
                "start_lon": r.get("start_lon"),
                "dest_lat": r.get("dest_lat"),
                "dest_lon": r.get("dest_lon"),
                "date_time": r["date_time"],
                "no_of_seats": r["no_of_seats"],
                "status": r.get("status", "pending"),
                "pickup_distance_km": r.get("pickup_distance_km"),
                "pickup_eta_minutes": r.get("pickup_eta_minutes"),
                "match_score": r.get("match_score"),
            }
            for r in paginated_matches
        ]

        return {
            "total": total,
            "page": page,
            "limit": limit,
            "riders": mapped_riders
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        raise HTTPException(
            status_code=500,
            detail=f"Error in show_riders: {str(e)}\n{traceback.format_exc()}"
        )


@router.put("/status/{user_id}", response_model=UpdateStatusResponse)
async def change_state(
    user_id: str,
    change_state: str,  # Mandatory query parameter
    payload: dict = Depends(verify_user_access_token),
) -> dict[str, str]:
    """Update the ride request status for a specified user_id."""
    updated = await update_ride_status(user_id, change_state)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No ride request found for the specified user ID.",
        )

    return {"status": "State updated successfully"}


@router.delete("/delete")
async def delete_user_account(
    payload: dict = Depends(verify_user_access_token),
) -> dict[str, str]:
    """Delete the logged-in user's account and all associated data."""
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token payload.",
        )
    
    deleted = await delete_user_data(user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    
    return {"status": "User deleted successfully"}
