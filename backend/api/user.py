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
) -> dict[str, str]:
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
    response_model=OfferRideResponse,
    status_code=status.HTTP_201_CREATED,
)
async def offer_ride(
    offer_data: OfferRideRequest,
    payload: dict = Depends(verify_user_access_token),
) -> dict[str, str]:
    """Submit a ride offer to find passengers."""
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token payload.",
        )

    await save_ride_offer(user_id, offer_data)
    return {"status": "Ride offer logged successfully"}


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
    payload: dict = Depends(verify_user_access_token),
) -> dict:
    """Get the paginated list of all riders/search requests from the riders collection, excluding logged in user."""
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token payload.",
        )

    res_data = await get_all_riders(exclude_user_id=user_id, page=page, limit=limit)
    
    # Map raw MongoDB dicts to match Pydantic schema (convert ObjectId user_id to str)
    mapped_riders = [
        {
            "user_id": str(r["user_id"]),
            "start_location": r["start_location"],
            "end_destination": r["end_destination"],
            "date_time": r["date_time"],
            "no_of_seats": r["no_of_seats"],
            "status": r.get("status", "pending")
        }
        for r in res_data["riders"]
    ]

    return {
        "total": res_data["total"],
        "page": res_data["page"],
        "limit": res_data["limit"],
        "riders": mapped_riders
    }


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
