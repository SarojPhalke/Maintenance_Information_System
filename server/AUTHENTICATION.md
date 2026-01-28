# Authentication & Authorization Guide

## Overview

This document explains the authentication system implemented in the server, following industry-standard security practices.

## What is `auth.js` Used For?

The `auth.js` middleware file (`src/middleware/auth.js`) is **essential** for securing your API endpoints. It provides:

1. **Authentication**: Verifies that users are who they claim to be
2. **Authorization**: Controls what users can access based on their roles
3. **Security**: Protects sensitive operations (create, update, delete)
4. **User Context**: Injects user information into requests for use in route handlers

## Why It's Needed

**Without authentication middleware:**
- ❌ Anyone can create, update, or delete data
- ❌ No way to track who made changes
- ❌ No role-based access control
- ❌ Security vulnerability

**With authentication middleware:**
- ✅ Only authenticated users can perform write operations
- ✅ User identity is tracked (`req.user`)
- ✅ Role-based access control (RBAC)
- ✅ Industry-standard security

## Architecture

### Files Structure

```
server/
├── src/
│   ├── middleware/
│   │   └── auth.js          # Authentication & authorization middleware
│   └── supabaseClient.js    # Supabase client for token verification
└── server.js                # Express routes (uses auth middleware)
```

### How It Works

1. **Frontend** sends JWT token in `Authorization: Bearer <token>` header
2. **authMiddleware** extracts and verifies token with Supabase
3. **User profile** is fetched from database (role, name, etc.)
4. **req.user** is populated with user info
5. **Route handler** can access `req.user` and proceed

## Middleware Functions

### 1. `authMiddleware`

**Purpose**: Required authentication for protected routes

**Usage**:
```javascript
app.post('/api/assets', authMiddleware, async (req, res) => {
  // req.user is available here
  console.log(req.user.id);      // User ID
  console.log(req.user.email);   // User email
  console.log(req.user.role);    // User role (ADMIN, MANAGER, etc.)
});
```

**Behavior**:
- ✅ Verifies JWT token
- ✅ Fetches user profile from database
- ✅ Attaches user info to `req.user`
- ❌ Returns 401 if token is missing or invalid

### 2. `optionalAuthMiddleware`

**Purpose**: Optional authentication (works with or without token)

**Usage**:
```javascript
app.get('/api/public', optionalAuthMiddleware, async (req, res) => {
  if (req.isAuthenticated) {
    // User is logged in
    console.log(req.user);
  } else {
    // Public access
  }
});
```

**Behavior**:
- ✅ Verifies token if provided
- ✅ Sets `req.isAuthenticated = true/false`
- ✅ Never fails (always calls `next()`)

### 3. `requireRole(['ADMIN', 'MANAGER'])`

**Purpose**: Role-based access control (RBAC)

**Usage**:
```javascript
// Only ADMIN can access
app.delete('/api/assets/:id', authMiddleware, requireAdmin, handler);

// ADMIN or MANAGER can access
app.put('/api/settings', authMiddleware, requireManager, handler);

// Custom roles
app.get('/api/reports', authMiddleware, requireRole(['ADMIN', 'MANAGER', 'ANALYST']), handler);
```

**Available Helpers**:
- `requireAdmin` - Shorthand for `requireRole(['ADMIN'])`
- `requireManager` - Shorthand for `requireRole(['ADMIN', 'MANAGER'])`

**Behavior**:
- ✅ Must be used AFTER `authMiddleware`
- ✅ Checks if `req.user.role` is in allowed roles list
- ❌ Returns 403 if user doesn't have required role

## Protected Routes

### Currently Protected Endpoints

**Write Operations (Require Authentication)**:
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

**Read Operations (Public)**:
- `GET /api/assets` - List assets
- `GET /api/assets/:id` - Get asset details
- `GET /api/breakdowns` - List breakdowns
- `GET /api/spares` - List spare parts
- `GET /api/pm` - List PM schedules
- `GET /api/utilities` - List utility logs

**Admin Only**:
- `GET /api/users` - List all users
- `DELETE /api/assets/:id` - Delete asset
- `DELETE /api/spares/:id` - Delete spare part
- `DELETE /api/pm/:id` - Delete PM schedule

## Environment Variables Required

Add these to your `.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Optional, for admin operations
```

**Where to find these**:
1. Go to your Supabase project dashboard
2. Settings → API
3. Copy `URL` and `anon public` key
4. Copy `service_role` key (keep this secret!)

## Frontend Integration

### Sending Authenticated Requests

```javascript
// After user logs in, get the token from Supabase
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Include token in API requests
fetch('http://localhost:3000/api/assets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`  // ← Required!
  },
  body: JSON.stringify(assetData)
});
```

### Handling Auth Errors

```javascript
try {
  const response = await fetch('/api/assets', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 401) {
    // Token expired or invalid - redirect to login
    window.location.href = '/login';
  } else if (response.status === 403) {
    // User doesn't have permission
    alert('You do not have permission to perform this action');
  }
} catch (error) {
  console.error('Request failed:', error);
}
```

## Industry Best Practices Implemented

✅ **JWT Token Verification**: Uses Supabase's built-in JWT verification
✅ **Token Expiration**: Automatically handled by Supabase
✅ **Role-Based Access Control (RBAC)**: Flexible role checking
✅ **User Context Injection**: `req.user` available in all protected routes
✅ **Security Headers**: Adds `X-Authenticated-User` header
✅ **Error Handling**: Clear, user-friendly error messages
✅ **Separation of Concerns**: Auth logic separated into middleware
✅ **Non-blocking Optional Auth**: Public routes can work with/without auth

## Security Considerations

### ✅ What's Secure

- JWT tokens are verified using Supabase's secure verification
- Tokens expire automatically (handled by Supabase)
- Role-based access control prevents unauthorized access
- User identity is verified before any write operations

### ⚠️ Important Notes

1. **Service Role Key**: Keep `SUPABASE_SERVICE_ROLE_KEY` secret! Never expose it to frontend.
2. **HTTPS in Production**: Always use HTTPS in production to protect tokens in transit
3. **Token Storage**: Frontend should store tokens securely (httpOnly cookies or secure storage)
4. **Rate Limiting**: Consider adding rate limiting to prevent brute force attacks
5. **CORS**: Ensure CORS is properly configured (already done in `server.js`)

## Testing Authentication

### Test Protected Endpoint (Should Fail)

```bash
# Without token - should return 401
curl http://localhost:3000/api/assets \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"asset_code":"TEST001"}'
```

### Test Protected Endpoint (Should Succeed)

```bash
# With token - should work
curl http://localhost:3000/api/assets \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"asset_code":"TEST001","asset_name":"Test Asset"}'
```

## Troubleshooting

### Error: "Authentication required"

**Cause**: No token provided or token format is wrong

**Solution**: 
- Ensure frontend sends `Authorization: Bearer <token>` header
- Check that token is not expired
- Verify user is logged in

### Error: "Invalid or expired token"

**Cause**: Token verification failed

**Solution**:
- User needs to log in again
- Check Supabase credentials in `.env`
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct

### Error: "Access denied"

**Cause**: User doesn't have required role

**Solution**:
- Check user's role in database: `SELECT role FROM profiles WHERE id = 'user-id'`
- Ensure route uses correct `requireRole()` middleware
- User may need role upgrade from admin

### Warning: "Supabase credentials not found"

**Cause**: Missing environment variables

**Solution**:
- Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `.env`
- Restart server after adding variables

## Summary

The `auth.js` middleware is **essential** for securing your API. It:

1. ✅ Verifies user identity using JWT tokens
2. ✅ Enforces role-based access control
3. ✅ Protects sensitive operations
4. ✅ Follows industry-standard security practices
5. ✅ Provides user context to route handlers

**All write operations (POST, PUT, DELETE) are now protected** and require authentication. Read operations (GET) remain public for easier access, but you can add `optionalAuthMiddleware` if you want to track who's viewing data.

