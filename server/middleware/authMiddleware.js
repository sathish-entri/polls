const jwt = require('jsonwebtoken');

// Middleware to protect any admin route (superadmin OR regular admin)
// Accepts token from httpOnly cookie (desktop) OR Authorization Bearer header (mobile)
const protect = (req, res, next) => {
    try {
        // Try cookie first (desktop browsers)
        let token = req.cookies.adminToken;

        // Fallback: Authorization Bearer header (mobile browsers that block cross-domain cookies)
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Admin login required.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please login again.'
        });
    }
};

// Middleware to protect super admin only routes
// Accepts token from cookie OR Authorization Bearer header
const protectSuperAdmin = (req, res, next) => {
    try {
        // Try cookie first
        let token = req.cookies.adminToken;

        // Fallback: Authorization Bearer header
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Admin login required.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Only superadmin role can access these routes
        if (decoded.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only the Super Admin can perform this action.'
            });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please login again.'
        });
    }
};

module.exports = { protect, protectSuperAdmin };
