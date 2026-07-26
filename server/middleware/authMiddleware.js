const jwt = require('jsonwebtoken');

// Middleware to protect any admin route (superadmin OR regular admin)
const protect = (req, res, next) => {
    try {
        const token = req.cookies.adminToken;
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
// Only the .env superadmin can access these routes
const protectSuperAdmin = (req, res, next) => {
    try {
        const token = req.cookies.adminToken;
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
