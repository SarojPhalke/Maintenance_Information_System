# Fix Database Connection Issue

## Problem
Your `.env` file has incorrect values. The terminal shows:
- Host: `postgres` ❌ (should be `localhost`)
- User: `localhost` ❌ (should be `postgres`)

## Solution

Update your `.env` file in the `server` directory:

```env
# Database Configuration (WSL PostgreSQL)
DB_HOST=localhost          # ← Change from 'postgres' to 'localhost'
DB_PORT=5432              # ← Use 5432 (standard) or 5431 if that's your port
DB_NAME=mis_db
DB_USER=postgres          # ← Change from 'localhost' to 'postgres'
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000                 # ← Change to 3001 if port 3000 is in use
```

## Steps to Fix

1. **Stop the current server** (Ctrl+C if running)

2. **Kill process on port 3000** (if needed):
   ```powershell
   # Find process using port 3000
   netstat -ano | findstr :3000
   
   # Kill the process (replace PID with actual process ID)
   taskkill /PID <PID> /F
   ```

3. **Update `.env` file** with correct values above

4. **Restart server**:
   ```bash
   npm run dev
   ```

## Verify Connection

After restarting, you should see:
```
✅ Database connection configured: postgres@localhost:5432/mis_db
✅ Database connection test successful!
✅ JWT_SECRET loaded from environment variables
Server running on http://localhost:3000
```

## If Still Not Working

1. **Check PostgreSQL is running in WSL**:
   ```bash
   wsl
   sudo service postgresql status
   ```

2. **Test connection manually**:
   ```bash
   wsl
   psql -h localhost -U postgres -d mis_db
   ```

3. **Check WSL port forwarding** (if accessing from Windows):
   - WSL should forward port 5432 to Windows
   - If using custom port (5431), ensure it's forwarded

4. **Verify database exists**:
   ```bash
   wsl
   psql -h localhost -U postgres -l
   # Look for mis_db in the list
   ```

