from mongodb.collections import users, sessions

async def init_indexes():

    #Indexes for users collection
    await users.create_index(
        "email",
        unique=True
    )

    await users.create_index(
        "phno",
        unique=True
    )
    
    # #Index for sessions collection
    # await sessions.create_index(
    #     "session_id",
    #     unique=True
    # )
