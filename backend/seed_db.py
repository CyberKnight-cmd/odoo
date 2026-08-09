"""
Bulk Seed script for the new MongoDB database.
Creates:
  - 1 ADMIN user
  - 1 regular USER (driver@odoo.com)
  - 50 Ride offers (rideroffers) across major Indian cities
  - 250 Ride requests (riders) geographically distributed near the offers

Run with: uv run python seed_db.py
"""

import asyncio
import random
from datetime import datetime, UTC, timedelta
from dotenv import load_dotenv
load_dotenv()

from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from mongodb.collections import users, riders, rideroffers
from security.hash_and_verify import hash_keyword
from matching.h3_index import get_h3_cell

# ---------------------------------------------------------------------------
# Seed accounts
# ---------------------------------------------------------------------------

ADMIN = {
    "name": "Admin User",
    "email": "admin@odoo.com",
    "phno": "9000000001",
    "password": hash_keyword("Admin@1234"),
    "role": "ADMIN",
    "email_verified": True,
    "phone_verify_required": False,
    "profile_required": False,
    "pwd_change_required": False,
}

USER = {
    "name": "Test Driver",
    "email": "driver@odoo.com",
    "phno": "9000000002",
    "password": hash_keyword("Driver@1234"),
    "role": "USER",
    "email_verified": True,
    "phone_verify_required": False,
    "profile_required": False,
    "pwd_change_required": False,
}


# ---------------------------------------------------------------------------
# Base Routes for Bulk Generation
# ---------------------------------------------------------------------------

BASE_ROUTES = [
    {"city": "Delhi", "sl": "Connaught Place, Delhi", "slat": 28.6315, "slon": 77.2167, "el": "Noida Sector 18", "elat": 28.5708, "elon": 77.3260},
    {"city": "Delhi2", "sl": "Dwarka, Delhi", "slat": 28.5921, "slon": 77.0460, "el": "Gurgaon Cyber City", "elat": 28.4950, "elon": 77.0950},
    {"city": "Mumbai", "sl": "Bandra, Mumbai", "slat": 19.0596, "slon": 72.8295, "el": "Thane", "elat": 19.2183, "elon": 72.9781},
    {"city": "Bengaluru", "sl": "Koramangala, Bengaluru", "slat": 12.9352, "slon": 77.6245, "el": "Whitefield, Bengaluru", "elat": 12.9698, "elon": 77.7500},
    {"city": "Hyderabad", "sl": "Jubilee Hills, Hyderabad", "slat": 17.4324, "slon": 78.4074, "el": "HITEC City, Hyderabad", "elat": 17.4435, "elon": 78.3772},
    {"city": "Chennai", "sl": "T Nagar, Chennai", "slat": 13.0418, "slon": 80.2341, "el": "OMR, Chennai", "elat": 12.9010, "elon": 80.2279},
    {"city": "Pune", "sl": "Shivajinagar, Pune", "slat": 18.5314, "slon": 73.8446, "el": "Hinjawadi, Pune", "elat": 18.5913, "elon": 73.7389},
    {"city": "Kolkata", "sl": "Salt Lake, Kolkata", "slat": 22.5868, "slon": 88.4025, "el": "Park Street, Kolkata", "elat": 22.5535, "elon": 88.3510}
]

def add_noise(coord, variance=0.03):
    """Add small random noise to a coordinate (~3km max variance)."""
    return coord + random.uniform(-variance, variance)


async def seed_users() -> str:
    """Insert admin and user; return the USER's _id string."""
    user_id = None
    for account in [ADMIN, USER]:
        try:
            result = await users.insert_one(account.copy())
            inserted_id = str(result.inserted_id)
            print(f"  ✓ Created {account['role']}: {account['email']}")
        except DuplicateKeyError:
            existing = await users.find_one({"email": account["email"]})
            inserted_id = str(existing["_id"])
            print(f"  ↩ Already exists {account['role']}: {account['email']}")
        if account["role"] == "USER":
            user_id = inserted_id
    return user_id


async def seed_bulk_offers(driver_user_id: str, num_offers: int = 50):
    await rideroffers.delete_many({})
    print(f"  🗑  Cleared rideroffers collection")

    now = datetime.now(UTC)
    docs = []
    
    # First offer always belongs to our test driver
    route = BASE_ROUTES[0]
    docs.append({
        "user_id": ObjectId(driver_user_id),
        "start_location": route["sl"],
        "end_destination": route["el"],
        "start_lat": route["slat"],
        "start_lon": route["slon"],
        "dest_lat": route["elat"],
        "dest_lon": route["elon"],
        "date_time": now + timedelta(hours=1),
        "available_seats": 3,
        "cost_per_seat": 80.0,
    })

    # Generate the rest
    for i in range(1, num_offers):
        route = random.choice(BASE_ROUTES)
        slat = add_noise(route["slat"])
        slon = add_noise(route["slon"])
        elat = add_noise(route["elat"])
        elon = add_noise(route["elon"])
        
        docs.append({
            "user_id": ObjectId(), # random user
            "start_location": f"Near {route['sl']} (Bulk-{i})",
            "end_destination": f"Near {route['el']} (Bulk-{i})",
            "start_lat": slat,
            "start_lon": slon,
            "dest_lat": elat,
            "dest_lon": elon,
            "date_time": now + timedelta(hours=random.randint(1, 48)),
            "available_seats": random.randint(1, 4),
            "cost_per_seat": round(random.uniform(30.0, 150.0), 2),
        })

    result = await rideroffers.insert_many(docs)
    print(f"  ✓ Inserted {len(result.inserted_ids)} ride offers")


async def seed_bulk_riders(num_riders: int = 250):
    await riders.delete_many({})
    print(f"  🗑  Cleared riders collection")

    now = datetime.now(UTC)
    docs = []
    
    # Generate riders distributed near the base routes
    for i in range(num_riders):
        route = random.choice(BASE_ROUTES)
        # Interpolate a point somewhere along the straight line between start and end
        fraction = random.uniform(0.1, 0.9)
        base_lat = route["slat"] + (route["elat"] - route["slat"]) * fraction
        base_lon = route["slon"] + (route["elon"] - route["slon"]) * fraction
        
        # Add a little noise so they aren't exactly on the straight line
        rlat = add_noise(base_lat, variance=0.04)
        rlon = add_noise(base_lon, variance=0.04)
        
        docs.append({
            "user_id": ObjectId(), # Random synthetic user ID
            "start_location": f"Pickup {route['city']} Region-{i}",
            "end_destination": f"Dropoff {route['city']} Region-{i}",
            "start_lat": rlat,
            "start_lon": rlon,
            "dest_lat": route["elat"],
            "dest_lon": route["elon"],
            "h3_pickup_cell": get_h3_cell(rlat, rlon),
            "date_time": now + timedelta(hours=random.randint(1, 48)),
            "no_of_seats": random.randint(1, 4),
            "status": "pending",
        })

    # Add a specific large cluster specifically around the Driver's route (Delhi) 
    # to ensure the Trip Map has plenty of matches to show
    driver_route = BASE_ROUTES[0]
    for i in range(20):
        fraction = random.uniform(0.1, 0.9)
        base_lat = driver_route["slat"] + (driver_route["elat"] - driver_route["slat"]) * fraction
        base_lon = driver_route["slon"] + (driver_route["elon"] - driver_route["slon"]) * fraction
        rlat = add_noise(base_lat, variance=0.02)
        rlon = add_noise(base_lon, variance=0.02)
        
        docs.append({
            "user_id": ObjectId(),
            "start_location": f"Guaranteed Match Delhi-{i}",
            "end_destination": driver_route["el"],
            "start_lat": rlat,
            "start_lon": rlon,
            "dest_lat": driver_route["elat"],
            "dest_lon": driver_route["elon"],
            "h3_pickup_cell": get_h3_cell(rlat, rlon),
            "date_time": now + timedelta(hours=random.randint(1, 10)),
            "no_of_seats": random.randint(1, 3),
            "status": "pending",
        })

    # Chunk inserts in case of large lists (though 300 is fine for Mongo)
    result = await riders.insert_many(docs)
    print(f"  ✓ Inserted {len(result.inserted_ids)} ride requests with distributed coordinates")


async def main():
    print("\n🚀 Bulk Seeding database...\n")

    print("👤 Checking accounts...")
    driver_user_id = await seed_users()

    print("\n🚗 Seeding bulk ride offers (rideroffers)...")
    await seed_bulk_offers(driver_user_id, num_offers=50)
    
    print("\n🛣  Seeding bulk ride requests (riders)...")
    await seed_bulk_riders(num_riders=250)


    print("\n✅ Bulk Seeding complete!\n")
    print("=" * 52)
    print("Login credentials:")
    print(f"  ADMIN → admin@odoo.com  | phno: 9000000001 | pwd: Admin@1234")
    print(f"  USER  → driver@odoo.com | phno: 9000000002 | pwd: Driver@1234")
    print("=" * 52)


if __name__ == "__main__":
    asyncio.run(main())
