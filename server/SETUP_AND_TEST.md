# Backend Setup and Testing Guide

## Step 1: Environment Setup

Create a `.env` file in the `server` directory with the following:

```env
# Database Configuration (WSL PostgreSQL)
DB_HOST=localhost
DB_PORT=5431
DB_NAME=mis_db
DB_USER=postgres
DB_PASSWORD=1234

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
```

**Important:**

- Replace `your_password_here` with your actual PostgreSQL password
- Generate a secure JWT secret: `openssl rand -base64 32` (or use any random string)

## Step 2: Start the Server

```bash
cd MIS_Project1/server
npm run dev
```

The server will start on `http://localhost:3000`

## Step 3: Test the APIs

### Option 1: Using REST Client (VS Code Extension)

1. Install "REST Client" extension in VS Code
2. Open `test-api.http` file
3. Click "Send Request" above each request

### Option 2: Using cURL (Command Line)

#### Test Server Connection

```bash
curl http://localhost:3000/
```

#### Register a User

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\",\"role\":\"operator\",\"full_name\":\"Test User\"}"
```

#### Login

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}"
```

**Save the token from the login response!**

#### Test Protected Endpoint (Replace YOUR_TOKEN)

```bash
curl -X GET http://localhost:3000/api/assets \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Option 3: Using Postman

1. Import the collection (create requests manually)
2. Set base URL: `http://localhost:3000`
3. For protected endpoints, add header: `Authorization: Bearer <token>`

## Step 4: Quick Test Sequence

1. **Test Server**: `GET http://localhost:3000/`
2. **Register User**: `POST http://localhost:3000/api/register`
3. **Login**: `POST http://localhost:3000/api/login` (save token)
4. **Get Assets**: `GET http://localhost:3000/api/assets`
5. **Create Asset**: `POST http://localhost:3000/api/assets` (with token)
6. **Get Breakdowns**: `GET http://localhost:3000/api/breakdowns`
7. **Get Dashboard Stats**: `GET http://localhost:3000/api/dashboard/stats`

## Common Issues

### Issue: "Database connection failed"

**Solution**:

- Check PostgreSQL is running: `sudo service postgresql status` (in WSL)
- Verify database credentials in `.env`
- Ensure database `mis_db` exists

### Issue: "JWT secret not configured"

**Solution**: Add `JWT_SECRET` to `.env` file

### Issue: "Table doesn't exist"

**Solution**: Run the schema SQL file to create tables

### Issue: "Port 3000 already in use"

**Solution**: Change `PORT` in `.env` or stop the other service

## Testing Checklist

- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] Root endpoint returns success
- [ ] User registration works
- [ ] User login returns JWT token
- [ ] Protected endpoints require authentication
- [ ] Public endpoints work without token
- [ ] Asset CRUD operations work
- [ ] Breakdown creation works
- [ ] Spare parts operations work
