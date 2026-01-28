# Quick Fix for Database Connection

## Issue 1: Port 3000 Already in Use ✅ FIXED
The script killed the process. Port 3000 is now free.

## Issue 2: Database Connection - Fix Your .env File

Your `.env` file has **swapped values**:
- ❌ `DB_HOST=postgres` (should be `localhost`)
- ❌ `DB_USER=localhost` (should be `postgres`)

### Fix It Now:

**Option 1: Manual Edit**
Open `.env` file and change:
```env
DB_HOST=localhost    # Change from 'postgres'
DB_USER=postgres     # Change from 'localhost'
```

**Option 2: PowerShell Command**
```powershell
cd MIS_Project1/server
(Get-Content .env) -replace 'DB_HOST=postgres', 'DB_HOST=localhost' -replace 'DB_USER=localhost', 'DB_USER=postgres' | Set-Content .env
```

### Correct .env File Should Look Like:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mis_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
```

## After Fixing:

1. **Restart the server**:
   ```bash
   npm run dev
   ```

2. **You should see**:
   ```
   ✅ Database connection configured: postgres@localhost:5432/mis_db
   ✅ Database connection test successful!
   Server running on http://localhost:3000
   ```

3. **Test the connection**:
   ```bash
   curl http://localhost:3000/
   ```

## Still Not Working?

1. **Check PostgreSQL is running in WSL**:
   ```bash
   wsl
   sudo service postgresql status
   ```

2. **If not running, start it**:
   ```bash
   wsl
   sudo service postgresql start
   ```

3. **Verify database exists**:
   ```bash
   wsl
   psql -h localhost -U postgres -l
   ```

4. **If database doesn't exist, create it**:
   ```bash
   wsl
   createdb -h localhost -U postgres mis_db
   ```

