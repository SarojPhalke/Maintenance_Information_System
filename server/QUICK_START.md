# Quick Start Guide - Backend Testing

## Prerequisites Check

Run this first to verify your setup:

```bash
cd MIS_Project1/server
node test-server.js
```

This will check:
- ✅ Environment variables
- ✅ Database connection
- ✅ Required tables exist

## Start the Server

```bash
npm run dev
```

You should see:
```
✅ Database connection configured: ...
✅ Database connection test successful!
Server running on http://localhost:3000
```

## Test the Server

### 1. Test Server Health (No Auth Required)

**Using Browser:**
Open: http://localhost:3000/

**Using cURL:**
```bash
curl http://localhost:3000/
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Backend server is running and connected to the database!",
  "timestamp": "..."
}
```

### 2. Test User Registration

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@test.com\",\"password\":\"admin123\",\"role\":\"admin\",\"full_name\":\"Admin User\"}"
```

**Expected Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "full_name": "Admin User",
    "email": "admin@test.com",
    "role": "admin"
  }
}
```

**⚠️ Save the token!** You'll need it for protected endpoints.

### 3. Test Login

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@test.com\",\"password\":\"admin123\"}"
```

### 4. Test Protected Endpoint (Get Assets)

Replace `YOUR_TOKEN` with the token from registration/login:

```bash
curl -X GET http://localhost:3000/api/assets \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Test Create Asset (Protected)

```bash
curl -X POST http://localhost:3000/api/assets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"asset_code\":\"ASSET001\",\"asset_name\":\"Test Machine\",\"asset_location\":\"Plant 1\",\"bu_name\":\"BU-ENG\",\"asset_type\":\"machine\",\"manufacturer\":\"Test Mfg\",\"model_number\":\"MOD-001\",\"asset_status\":\"active\"}"
```

### 6. Test Public Endpoints (No Auth)

```bash
# Get all assets (public)
curl http://localhost:3000/api/assets

# Get dashboard stats (public)
curl http://localhost:3000/api/dashboard/stats

# Get breakdowns (public)
curl http://localhost:3000/api/breakdowns
```

## Common Errors & Solutions

### Error: "Database connection failed"
- Check PostgreSQL is running in WSL
- Verify `.env` file has correct credentials
- Test connection: `psql -h localhost -U postgres -d mis_db`

### Error: "Table doesn't exist"
- Run the schema SQL file: `psql -h localhost -U postgres -d mis_db -f ../db/schema.sql`

### Error: "JWT secret not configured"
- Add `JWT_SECRET=your-secret-key` to `.env` file

### Error: "Port 3000 already in use"
- Change `PORT=3001` in `.env` or stop other service

## Using REST Client (VS Code)

1. Install "REST Client" extension
2. Open `test-api.http`
3. Click "Send Request" above each request
4. For protected endpoints, first run login request and copy token to `@token` variable

## Using Postman

1. Create new collection
2. Set base URL: `http://localhost:3000`
3. For protected endpoints:
   - Add header: `Authorization: Bearer <token>`
   - Get token from login/register response

## Testing Checklist

- [ ] Server starts without errors
- [ ] Root endpoint (`/`) returns success
- [ ] User registration works
- [ ] User login returns token
- [ ] Protected endpoints require token (401 without token)
- [ ] Public endpoints work without token
- [ ] Asset CRUD operations work
- [ ] Breakdown creation works
- [ ] Spare parts operations work

## Next Steps

Once basic testing passes:
1. Test all CRUD operations
2. Test role-based access control
3. Test error handling
4. Test edge cases
5. Integrate with frontend

