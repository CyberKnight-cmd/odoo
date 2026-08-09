# ============================================================
#  Odoo Carpooling App — Login Credentials
# ============================================================

## Admin Account
  Email    : admin@odoo.com
  Phone    : 9000000001
  Password : Admin@1234
  Role     : ADMIN

## Driver / User Account
  Email    : driver@odoo.com
  Phone    : 9000000002
  Password : Driver@1234
  Role     : USER

## MongoDB
  URI      : mongodb+srv://aryagupta164_db_user:mZmAV8THY5ca2WVT@cluster0.n2lhdqm.mongodb.net
  Database : Odoo

## Mapbox
  Token    : <your-mapbox-token-redacted-for-github>

## Starting the server
  cd /home/cyberknight/blind-copy/new/odoo/backend
  uv run fastapi dev main.py

## Starting the frontend
  cd /home/cyberknight/blind-copy/new/odoo/frontend
  npm run dev
