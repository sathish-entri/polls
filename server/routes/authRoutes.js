const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { protect, protectSuperAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// ── Helper: sign JWT and set httpOnly cookie ──────────────────────────────
const sendTokenCookie = (res, payload) => {
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('adminToken', token, {
        httpOnly: true,
        // secure=true required for sameSite=None (HTTPS only in production)
        secure: isProd,
        // 'none' allows cookies to be sent cross-domain (Vercel -> Render)
        // 'lax' is fine for local dev on same origin
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });
    return token;
};

// @route   POST /api/auth/login
// @desc    Admin login - checks superadmin .env first, then MongoDB admins
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // ── Check 1: Is this the superadmin from .env? ──────────
        const superUsername = process.env.ADMIN_USERNAME;
        const superPassword = process.env.ADMIN_PASSWORD;

        if (username === superUsername && password === superPassword) {
            const payload = { role: 'superadmin', username: superUsername, source: 'env' };
            sendTokenCookie(res, payload);
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                admin: { username: superUsername, role: 'superadmin' }
            });
        }

        // ── Check 2: Is this a registered admin from MongoDB? ───
        const adminDoc = await Admin.findOne({ username: username.trim() });

        if (!adminDoc) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        if (!adminDoc.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your admin account has been deactivated. Contact the super admin.'
            });
        }

        const isPasswordMatch = await adminDoc.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Update last login time
        adminDoc.lastLogin = new Date();
        await adminDoc.save();

        const payload = {
            role: adminDoc.role,
            username: adminDoc.username,
            adminId: adminDoc._id.toString(),
            source: 'db'
        };
        sendTokenCookie(res, payload);

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            admin: {
                username: adminDoc.username,
                role: adminDoc.role,
                email: adminDoc.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// @route   POST /api/auth/logout
// @desc    Admin logout - clears the JWT cookie
// @access  Admin
router.post('/logout', protect, (req, res) => {
    res.clearCookie('adminToken', { httpOnly: true, sameSite: 'lax' });
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @route   GET /api/auth/verify
// @desc    Verify admin session (used on page refresh)
// @access  Admin
router.get('/verify', protect, (req, res) => {
    return res.status(200).json({
        success: true,
        admin: {
            username: req.admin.username,
            role: req.admin.role
        }
    });
});

// ── Admin Management Routes (Super Admin Only) ─────────────────────────────

// @route   GET /api/auth/admins
// @desc    Get all registered admin accounts
// @access  Super Admin
router.get('/admins', protectSuperAdmin, async (req, res) => {
    try {
        const admins = await Admin.find().sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: admins.length,
            data: admins
        });
    } catch (error) {
        console.error('Get admins error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/auth/admins
// @desc    Create a new admin account (Super Admin only)
// @access  Super Admin
router.post('/admins', protectSuperAdmin, async (req, res) => {
    try {
        const { username, password, email, role } = req.body;

        // Validate required fields
        if (!username || !username.trim()) {
            return res.status(400).json({ success: false, message: 'Username is required' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Prevent duplicate username with the .env superadmin
        if (username.trim() === process.env.ADMIN_USERNAME) {
            return res.status(400).json({
                success: false,
                message: 'This username is reserved for the super admin'
            });
        }

        // Check if username already exists in DB
        const existing = await Admin.findOne({ username: username.trim() });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }

        // Create new admin (password auto-hashed by pre-save hook)
        const newAdmin = await Admin.create({
            username: username.trim(),
            password,
            email: email?.trim() || '',
            role: role === 'superadmin' ? 'admin' : (role || 'admin'), // Cannot create another superadmin
            createdBy: req.admin.username
        });

        return res.status(201).json({
            success: true,
            message: `Admin "${newAdmin.username}" created successfully`,
            data: newAdmin
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }
        console.error('Create admin error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PATCH /api/auth/admins/:id/toggle
// @desc    Activate or deactivate an admin account
// @access  Super Admin
router.patch('/admins/:id/toggle', protectSuperAdmin, async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        admin.isActive = !admin.isActive;
        await admin.save();

        return res.status(200).json({
            success: true,
            message: `Admin "${admin.username}" is now ${admin.isActive ? 'active' : 'deactivated'}`,
            data: admin
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/auth/admins/:id
// @desc    Delete an admin account
// @access  Super Admin
router.delete('/admins/:id', protectSuperAdmin, async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        await Admin.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            success: true,
            message: `Admin "${admin.username}" deleted successfully`
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PATCH /api/auth/admins/:id/password
// @desc    Reset an admin's password
// @access  Super Admin
router.patch('/admins/:id/password', protectSuperAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        const admin = await Admin.findById(req.params.id);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        admin.password = newPassword; // Will be hashed by pre-save hook
        await admin.save();

        return res.status(200).json({
            success: true,
            message: `Password for "${admin.username}" reset successfully`
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
