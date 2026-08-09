# API Endpoints

Base path: /auth

## GET /week5
Request:
- None

Response:
```json
{
  "status": "Winning Odoo"
}
```

## POST /auth/signup
Request:
```json
{
  "name": "string",
  "phno": "string",
  "email": "string",
  "password": "string"
}
```

Response:
```json
{
  "status": "Entry successful"
}
```

## POST /auth/login
Request:
```json
{
  "email": "string",
  "phno": "string",
  "password": "string"
}
```

Response:
```json
{
  "accesstoken": "string",
  "refreshtoken": "string",
  "role": "string"
}
```

## POST /auth/refresh
Request:
Headers:
```http
Authorization: Bearer <refresh token>
```

Response:
```json
{
  "accesstoken": "string",
  "refreshtoken": "string"
}
```

## POST /auth/logout
Request:
Headers:
```http
Authorization: Bearer <access token>
```

Response:
```json
{
  "status": "Logout successful"
}
```

## Admin Endpoints

### GET /admin/getusers
Headers:
```http
Authorization: Bearer <admin access token>
```
Query parameters:
- `page` (int, default 1)
- `limit` (int, default 10)
- `search` (string, optional)

Response (PaginatedUsersResponse):
```json
{
  "total": 123,
  "page": 1,
  "limit": 10,
  "users": [
    {
      "user_id": "64a1f2...",
      "name": "Alice",
      "email": "alice@example.com",
      "phno": "1234567890",
      "role": "user"
    }
  ]
}
```

### GET /admin/change/role
Headers:
```http
Authorization: Bearer <admin access token>
```
Query parameters:
- `user_id` (string) — id of the user to update
- `user_role` (string) — new role (e.g. `admin`, `user`)

Response (UpdateRoleResponse):
```json
{
  "status": "Role Updated"
}
```

## User Endpoints

### POST /user/findride
Headers:
```http
Authorization: Bearer <access token>
```
Request body (FindRideRequest):
```json
{
  "start_location": "string",
  "end_destination": "string",
  "date_time": "2026-08-09T12:00:00",
  "no_of_seats": 2,
  "status": "pending"
}
```

Response (FindRideResponse):
```json
{
  "status": "Ride request logged successfully"
}
```

### POST /user/offerride
Headers:
```http
Authorization: Bearer <access token>
```
Request body (OfferRideRequest):
```json
{
  "start_location": "string",
  "end_destination": "string",
  "date_time": "2026-08-09T12:00:00",
  "available_seats": 3,
  "cost_per_seat": 10.5
}
```

Response (OfferRideResponse):
```json
{
  "status": "Ride offer logged successfully"
}
```

### GET /user/observe_status
Headers:
```http
Authorization: Bearer <access token>
```
Response (ObserveStatusResponse):
```json
{
  "status": "pending"
}
```

### GET /user/show_riders
Headers:
```http
Authorization: Bearer <access token>
```
Query parameters:
- `page` (int, default 1)
- `limit` (int, default 10)

Response (PaginatedRidersResponse):
```json
{
  "total": 20,
  "page": 1,
  "limit": 10,
  "riders": [
    {
      "user_id": "64a1f2...",
      "start_location": "A",
      "end_destination": "B",
      "date_time": "2026-08-09T12:00:00",
      "no_of_seats": 2,
      "status": "pending"
    }
  ]
}
```

### PUT /user/status/{user_id}
Headers:
```http
Authorization: Bearer <access token>
```
Path parameters:
- `user_id` (string) — id of the user whose ride status to change
Query parameters:
- `change_state` (string) — new state value

Response (UpdateStatusResponse):
```json
{
  "status": "State updated successfully"
}
```
