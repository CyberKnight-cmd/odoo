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
