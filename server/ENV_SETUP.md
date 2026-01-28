# Environment Variables Setup

## Required .env File Configuration

Create a `.env` file in the `server` directory with these variables:

```env
# Database Configuration (WSL PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mis_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
```

## Important Notes

1. **DB_HOST**: Must be `localhost` (not `postgres`) when accessing WSL PostgreSQL from Windows
2. **DB_PORT**: Default PostgreSQL port is `5432`. If your WSL PostgreSQL uses a different port, update it.
3. **DB_USER**: Usually `postgres` for default PostgreSQL installation
4. **DB_PASSWORD**: Your PostgreSQL password
5. **JWT_SECRET**: Generate a secure secret using: `openssl rand -base64 32`

## Verify Your Configuration

After creating/updating `.env`, restart the server:

```bash
npm run dev
```

You should see:
- ✅ Database connection configured
- ✅ Database connection test successful!
- ✅ JWT_SECRET loaded from environment variables

## Troubleshooting

### Error: "getaddrinfo ENOTFOUND postgres"
**Solution**: Change `DB_HOST=postgres` to `DB_HOST=localhost` in `.env`

### Error: "password authentication failed"
**Solution**: Verify `DB_PASSWORD` is correct in `.env`

### Error: "database does not exist"
**Solution**: Create the database: `createdb -h localhost -U postgres mis_db`

### Error: "JWT_SECRET not loaded"
**Solution**: Ensure `.env` file is in the `server` directory and restart the server

