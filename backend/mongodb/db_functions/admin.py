from fastapi import HTTPException
from pydantic import BaseModel, EmailStr
from mongodb.collections import users, sessions, riders, rideroffers
from bson import ObjectId
from pymongo.errors import DuplicateKeyError, PyMongoError


class Allusers(BaseModel):
    user_id: str
    name: str
    email: EmailStr
    phno: str
    role: str


async def getUsers(page: int = 1, limit: int = 10, search: str = None):

    query = {}
    if search:
        if "@" in search:
            query = {"email": {"$regex": f"^{search}", "$options": "i"}}
        elif search.isdigit():
            query = {"phno": {"$regex": f"^{search}"}}
        else:
            query = {"name": {"$regex": f"^{search}", "$options": "i"}}
    else:
        query = {}
        
    total = await users.count_documents(query)
    skip = (page - 1) * limit
    ans = await users.find(query, {'_id': 1, 'name': 1, 'email': 1, 'phno': 1, "role": 1}).skip(skip).limit(limit).to_list(length=None)

    l = [Allusers(
        user_id=str(i['_id']),
        name=i['name'],
        email=i['email'],
        phno=i['phno'],
        role=i['role']
    ) for i in ans]

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "users": l
    }


async def changeMemberRole(user_id: str, role: str):
    
    try:    
        ans = await users.update_one({'_id': ObjectId(user_id)}, {"$set": {'role': role}})
        
        if(ans.matched_count == 0):
            HTTPException(status_code=404, detail = "Id do not exist")
            
    except PyMongoError:
        HTTPException(status_code=404, detail = "Database error")


async def delete_user_data(user_id: str) -> bool:
    try:
        obj_id = ObjectId(user_id)
        await users.delete_one({"_id": obj_id})
        await sessions.delete_many({"user_id": obj_id})
        await riders.delete_many({"user_id": obj_id})
        await rideroffers.delete_many({"user_id": obj_id})
        return True
    except PyMongoError:
        raise HTTPException(status_code=500, detail="Database error while deleting user data")