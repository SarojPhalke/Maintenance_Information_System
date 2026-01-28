//check code 97 to 100,178
// import { supabaseAuth } from '../supabaseClient.js';
import { verifyToken } from '../services/jwtService.js';
import sql from '../../db.js';

// ======================================================
// AUTHENTICATION MIDDLEWARE - INDUSTRY STANDARD PRACTICES
// ======================================================
// This middleware implements:
// 1. JWT token verification for local PostgreSQL setup // 1. JWT token verification using Supabase
// 2. User context injection (req.user)
// 3. Role-based access control (RBAC)
// 4. Proper error handling and security headers
// ======================================================

/**
 * Main authentication middleware
 * Verifies JWT token and attaches user info to request object
 * 
 * Usage: app.get('/api/protected', authMiddleware, handler)
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    // Format: "Bearer <token>"
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No valid authorization token provided. Please include: Authorization: Bearer <token>'
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Token is missing'
      });
    }
// Verify token with Supabase
// const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

// if (authError || !user) {
//   console.error('[AUTH ERROR] Token verification failed:', authError?.message);



    // Verify JWT token
    let decodedToken;
    try {
      decodedToken = verifyToken(token);
    } catch (tokenError) {
      console.error('[AUTH ERROR] Token verification failed:', tokenError.message);
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        message: tokenError.message || 'Your session has expired. Please log in again.'
      });
    }

    // Fetch user profile from local PostgreSQL database
    let userProfile = null;
    let userRole = null;
    
    try {
      const profileResult = await sql`
        SELECT id, full_name, email, role, created_at 
        FROM public.profiles 
        
        WHERE id = ${decodedToken.id} 
        LIMIT 1
      `;
      
      if (profileResult.length > 0) {
        userProfile = profileResult[0];
        userRole = userProfile.role;
        
        // Verify token role matches database role (security check)
        if (decodedToken.role !== userRole) {
          console.warn(`[AUTH WARNING] Role mismatch for user ${decodedToken.id}. Token role: ${decodedToken.role}, DB role: ${userRole}`);
          // Update token role to match database (user role may have changed)
          userRole = userProfile.role;
        }
      } else {
        // User not found in database - token might be for deleted user
        console.error(`[AUTH ERROR] User ${decodedToken.id} not found in database`);
        return res.status(401).json({ 
          error: 'User not found',
          message: 'User account does not exist. Please contact administrator.'
        });
      }
    } catch (dbError) {
      console.error('[AUTH ERROR] Failed to fetch user profile:', dbError);
      return res.status(500).json({ 
        error: 'Database error',
        message: 'Failed to verify user. Please try again.'
      });
    }

    // Attach user info to request object for use in route handlers
    req.user = {
      //2.id: user.id,
      //email: user.email,
      id: decodedToken.id,
      email: decodedToken.email || userProfile.email,
      role: userRole,

      //2.profile: userProfile,
        // Include raw Supabase user object if needed
      //supabaseUser: user
      profile: userProfile
    };

    // Add security headers
    //2.res.setHeader('X-Authenticated-User', user.id);
    res.setHeader('X-Authenticated-User', decodedToken.id);
    
    // Continue to next middleware/route handler
    next();
    
  } catch (err) {
    console.error('[AUTH ERROR] Unexpected error in auth middleware:', err);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'An unexpected error occurred during authentication'
    });
  }
};

/**
 * Optional authentication middleware
 * Tries to authenticate but doesn't fail if token is missing
 * Useful for routes that work with or without authentication
 * 
 * Usage: app.get('/api/public', optionalAuthMiddleware, handler)
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.isAuthenticated = false;
      req.user = null;
      return next();
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    if (!token) {
      req.isAuthenticated = false;
      req.user = null;
      return next();
    }
    // // Try to verify token
    // const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    // if (authError || !user) {
    // Try to verify JWT token
    let decodedToken;
    try {
      decodedToken = verifyToken(token);
    } catch (tokenError) {
      // Token invalid or expired - continue without authentication
      req.isAuthenticated = false;
      req.user = null;
      return next();
    }

    // Fetch user profile from database
    try {
      const profileResult = await sql`
        SELECT id, full_name, email, role, created_at 
        FROM public.profiles 
        WHERE id = ${decodedToken.id} //2.WHERE id = ${user.id}
        LIMIT 1
      `;
      
      if (profileResult.length > 0) {
        req.user = {
          id: decodedToken.id,//2. id: user.id,
                              //email: user.email,
          email: decodedToken.email || profileResult[0].email,
          role: profileResult[0].role,
          profile: profileResult[0]
        };
        req.isAuthenticated = true;
      } else {
        req.isAuthenticated = false;
        req.user = null;
      }
    } catch (dbError) {
      console.error('[AUTH ERROR] Failed to fetch user profile in optional auth:', dbError);
      req.isAuthenticated = false;
      req.user = null;
    }

    next();
    
  } catch (err) {
    console.error('[AUTH ERROR] Unexpected error in optional auth middleware:', err);
    req.isAuthenticated = false;
    req.user = null;
    next();
  }
};

/**
 * Role-based access control (RBAC) middleware factory
 * Creates middleware that checks if user has required role(s)
 * 
 * Usage: 
 *   app.get('/api/admin', authMiddleware, requireRole(['ADMIN']), handler)
 *   app.get('/api/manager', authMiddleware, requireRole(['ADMIN', 'MANAGER']), handler)
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // This middleware should be used AFTER authMiddleware
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please use authMiddleware before requireRole'
      });
    }

    const userRole = req.user.role;

    if (!userRole) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'User role not found'
      });
    }

    // Check if user's role is in the allowed roles list
    if (!allowedRoles.includes(userRole)) {
      console.warn(`[AUTH WARNING] Access denied for user ${req.user.id} with role ${userRole}. Required roles: ${allowedRoles.join(', ')}`);
      return res.status(403).json({ 
        error: 'Access denied',
        message: `This endpoint requires one of the following roles: ${allowedRoles.join(', ')}`,
        yourRole: userRole
      });
    }

    next();
  };
};

/**
 * Admin-only middleware (convenience wrapper)
 * Shorthand for requireRole(['ADMIN'])
 */
export const requireAdmin = requireRole(['ADMIN']);

/**
 * Manager or Admin middleware (convenience wrapper)
 * Allows both MANAGER and ADMIN roles
 */
export const requireManager = requireRole(['ADMIN', 'MANAGER']);

