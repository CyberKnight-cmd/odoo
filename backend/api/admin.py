from fastapi import APIRouter, Depends, Query, HTTPException, status
from Request_and_Response.Responses import PaginatedUsersResponse, UpdateRoleResponse, DeleteUserResponse
from dependency.token_dependency import verify_admin_access_token
from mongodb.db_functions.admin import changeMemberRole, getUsers, delete_user_data

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get("/getusers", response_model=PaginatedUsersResponse)
async def getAllusers(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    search: str = Query(None),
    payload: dict = Depends(verify_admin_access_token)
):
    getList = await getUsers(page, limit, search)
    return getList


@router.get("/change/role", response_model=UpdateRoleResponse)
async def changeRole(user_id: str, user_role: str, payload: dict = Depends(verify_admin_access_token)):
    await changeMemberRole(user_id, user_role)
    return {'status': "Role Updated"}


@router.delete("/delete/{user_id}", response_model=DeleteUserResponse)
async def deleteUser(user_id: str, payload: dict = Depends(verify_admin_access_token)):
    await delete_user_data(user_id)
    return {"status": "User and associated data deleted successfully"}


@router.delete("/delete_self")
async def deleteSelf(payload: dict = Depends(verify_admin_access_token)):
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token payload.",
        )
    await delete_user_data(user_id)
    return {"status": "User and associated data deleted successfully"}
