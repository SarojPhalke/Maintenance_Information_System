import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
//dotenv.config() // JWT Secret Key - MUST be set in .env file
// Load .env file from server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// ======================================================
// JWT TOKEN SERVICE FOR LOCAL POSTGRESQL SETUP
// ======================================================
// This service handles JWT token generation and verification
// for authentication with local WSL PostgreSQL database
// ======================================================

// JWT Secret Key - Loaded from process.env
// Generate a strong secret: openssl rand -base64 32
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // Default: 7 days

// Validate JWT_SECRET is set
if (!process.env.JWT_SECRET || JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
  console.warn('⚠️  [JWT WARNING] Using default JWT secret. Please set JWT_SECRET in .env file for production!');
  console.warn('   Generate a secure secret: openssl rand -base64 32');
} else {
  console.log('✅ [JWT] JWT_SECRET loaded from environment variables');
}

/**
 * Generate JWT token for a user
 * @param {Object} payload - User data to encode in token
 * @param {string} payload.id - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.role - User role
 * @returns {string} JWT token
 */
export const generateToken = (payload) => {
  try {
    const tokenPayload = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      iat: Math.floor(Date.now() / 1000), // Issued at
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'mis-server',
      audience: 'mis-client'
    });

    console.log(`[JWT] Token generated for user: ${payload.email} (ID: ${payload.id})`);
    return token;
  } catch (error) {
    console.error('[JWT ERROR] Failed to generate token:', error);
    throw new Error('Failed to generate authentication token');
  }
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyToken = (token) => {
  try {
    if (!token) {
      throw new Error('Token is required');
    }

    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'mis-server',
      audience: 'mis-client'
    });

    console.log(`[JWT] Token verified for user: ${decoded.email} (ID: ${decoded.id})`);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.error('[JWT ERROR] Token expired:', error.expiredAt);
      throw new Error('Token has expired. Please log in again.');
    } else if (error.name === 'JsonWebTokenError') {
      console.error('[JWT ERROR] Invalid token:', error.message);
      throw new Error('Invalid token');
    } else if (error.name === 'NotBeforeError') {
      console.error('[JWT ERROR] Token not active yet:', error.date);
      throw new Error('Token not yet active');
    } else {
      console.error('[JWT ERROR] Token verification failed:', error.message);
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded token payload (not verified)
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('[JWT ERROR] Failed to decode token:', error);
    return null;
  }
};

/**
 * Refresh a token (generate new token with same user data)
 * @param {string} oldToken - Existing token to refresh
 * @returns {string} New JWT token
 */
export const refreshToken = (oldToken) => {
  try {
    // Decode without verification to get user data
    const decoded = jwt.decode(oldToken);
    
    if (!decoded || !decoded.id) {
      throw new Error('Invalid token for refresh');
    }

    // Generate new token with same user data
    return generateToken({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    });
  } catch (error) {
    console.error('[JWT ERROR] Failed to refresh token:', error);
    throw new Error('Failed to refresh token');
  }
};

export default {
  generateToken,
  verifyToken,
  decodeToken,
  refreshToken
};

