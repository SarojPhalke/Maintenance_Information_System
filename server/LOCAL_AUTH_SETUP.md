# Local PostgreSQL Authentication Setup

## Overview

This authentication system is configured for **local WSL PostgreSQL database** (not Supabase). It uses:
- **JWT (JSON Web Tokens)** for authentication
- **bcrypt** for password hashing
- **Local PostgreSQL** for user storage

## Installation

First, install the required packages:

```bash
cd server
npm install jsonwebtoken bcrypt
```

## Environment Variables

Add these to your `.env` file in the `server` directory:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Database Configuration (already configured)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mis_db
DB_USER=postgres
DB_PASSWORD=your_password
```

### Generate a Secure JWT Secret

**On Linux/WSL:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Or use an online generator:**
- Visit: https://generate-secret.vercel.app/32

Copy the generated secret and add it to your `.env` file as `JWT_SECRET`.

## How It Works

### 1. **User Registration** (`POST /api/register`)

```javascript
// Frontend request
const response = await fetch('http://localhost:3000/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword123',
    role: 'TECHNICIAN',
    full_name: 'John Doe'
  })
});

const { token, user } = await response.json();
// Store token: localStorage.setItem('token', token);
```

**What happens:**
1. Password is hashed with bcrypt (10 salt rounds)
2. User is saved to PostgreSQL `profiles` table
3. JWT token is generated and returned
4. Token contains: `id`, `email`, `role`

### 2. **User Login** (`POST /api/login`)

```javascript
// Frontend request
const response = await fetch('http://localhost:3000/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword123'
  })
});

const { token, user } = await response.json();
// Store token: localStorage.setItem('token', token);
```

**What happens:**
1. User is fetched from PostgreSQL by email
2. Password is verified using bcrypt
3. If password is plain text (legacy), it's automatically migrated to bcrypt
4. JWT token is generated and returned

### 3. **Protected API Calls**

```javascript
// Get token from storage
const token = localStorage.getItem('token');

// Make authenticated request
const response = await fetch('http://localhost:3000/api/assets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`  // ← Required!
  },
  body: JSON.stringify({
    asset_code: 'ASSET001',
    asset_name: 'Machine A'
  })
});

if (response.status === 401) {
  // Token expired or invalid - redirect to login
  localStorage.removeItem('token');
  window.location.href = '/login';
}
```

## Architecture

### Files Structure

```
server/
├── src/
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   └── services/
│       └── jwtService.js         # JWT token generation/verification
├── server.js                     # Express routes
└── .env                          # Environment variables
```

### Authentication Flow

```
1. User logs in → POST /api/login
   ↓
2. Server verifies password (bcrypt)
   ↓
3. Server generates JWT token
   ↓
4. Token sent to frontend
   ↓
5. Frontend stores token
   ↓
6. Frontend sends token in Authorization header
   ↓
7. authMiddleware verifies token
   ↓
8. User profile fetched from PostgreSQL
   ↓
9. req.user populated with user info
   ↓
10. Route handler executes
```

## Protected Routes

### Currently Protected Endpoints

**Write Operations (Require Authentication):**
- `POST /api/assets` - Create asset
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset (Admin only)
- `POST /api/breakdowns` - Create breakdown
- `PUT /api/breakdowns/:id` - Update breakdown
- `POST /api/spares` - Create spare part
- `PUT /api/spares/:id` - Update spare part
- `DELETE /api/spares/:id` - Delete spare part (Admin only)
- `POST /api/spares/transaction` - Issue/return spare parts
- `POST /api/pm` - Create PM schedule
- `PUT /api/pm/:id` - Update PM schedule
- `DELETE /api/pm/:id` - Delete PM schedule (Admin only)
- `POST /api/utilities` - Create utility log

**Read Operations (Public):**
- `GET /api/assets` - List assets
- `GET /api/assets/:id` - Get asset details
- `GET /api/breakdowns` - List breakdowns
- `GET /api/spares` - List spare parts
- `GET /api/pm` - List PM schedules
- `GET /api/utilities` - List utility logs

**Admin Only:**
- `GET /api/users` - List all users
- `DELETE /api/assets/:id` - Delete asset
- `DELETE /api/spares/:id` - Delete spare part
- `DELETE /api/pm/:id` - Delete PM schedule

## User Roles

Supported roles (case-insensitive):
- `ADMIN` - Full access, can delete records
- `MANAGER` - Can manage most operations
- `TECHNICIAN` - Can create/update maintenance records
- `OPERATOR` - Can create breakdowns and view data
- `VIEWER` - Read-only access

## Security Features

✅ **Password Hashing**: All passwords are hashed with bcrypt (10 salt rounds)
✅ **JWT Tokens**: Secure token-based authentication
✅ **Token Expiration**: Tokens expire after 7 days (configurable)
✅ **Role-Based Access Control**: Different permissions for different roles
✅ **Password Migration**: Legacy plain-text passwords automatically migrated to bcrypt
✅ **Secure Headers**: Adds `X-Authenticated-User` header

## Testing

### Test Registration

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "role": "TECHNICIAN",
    "full_name": "Test User"
  }'
```

### Test Login

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### Test Protected Endpoint

```bash
# Replace YOUR_TOKEN with token from login response
curl -X POST http://localhost:3000/api/assets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "asset_code": "TEST001",
    "asset_name": "Test Asset",
    "status": "ACTIVE"
  }'
```

## Troubleshooting

### Error: "JWT secret not configured"

**Solution**: Add `JWT_SECRET` to your `.env` file

### Error: "Invalid or expired token"

**Causes**:
- Token has expired (default: 7 days)
- Token is malformed
- JWT_SECRET doesn't match

**Solution**: User needs to log in again

### Error: "User not found"

**Cause**: User was deleted from database but token still exists

**Solution**: User needs to register again or contact admin

### Error: "bcrypt module not found"

**Solution**: Run `npm install bcrypt jsonwebtoken`

### Password Migration

If you have existing users with plain-text passwords:
1. They will work on first login
2. Password is automatically hashed and updated in database
3. Subsequent logins use bcrypt verification

## Migration from Supabase

If you were previously using Supabase auth:

1. ✅ **Already Done**: Removed Supabase client dependency from auth middleware
2. ✅ **Already Done**: Updated to use JWT service instead
3. **You Need To**:
   - Install packages: `npm install jsonwebtoken bcrypt`
   - Add `JWT_SECRET` to `.env`
   - Update frontend to use new login/register endpoints
   - Migrate existing users' passwords (they'll auto-migrate on first login)

## Frontend Integration Example

```javascript
// auth.js (frontend)
class AuthService {
  async login(email, password) {
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    
    const { token, user } = await response.json();
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
  }
  
  async register(email, password, role, fullName) {
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role, full_name: fullName })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }
    
    const { token, user } = await response.json();
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
  }
  
  getToken() {
    return localStorage.getItem('token');
  }
  
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  
  isAuthenticated() {
    return !!this.getToken();
  }
}

export default new AuthService();
```

## Summary

✅ **JWT-based authentication** for local PostgreSQL
✅ **bcrypt password hashing** for security
✅ **Role-based access control** (RBAC)
✅ **Automatic password migration** for legacy users
✅ **Token expiration** (7 days default)
✅ **All write operations protected**

Your API is now secure and ready for production use with local WSL PostgreSQL!

