const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Admin user schema - stores registered admin accounts in MongoDB
const adminSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true,
            minlength: [3, 'Username must be at least 3 characters'],
            maxlength: [30, 'Username cannot exceed 30 characters']
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters']
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: ''
        },
        // Role: 'superadmin' can create/delete other admins; 'admin' can only manage polls
        role: {
            type: String,
            enum: ['superadmin', 'admin'],
            default: 'admin'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        // Who created this admin account
        createdBy: {
            type: String,
            default: 'superadmin'
        },
        lastLogin: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Hash password before saving to database
adminSchema.pre('save', async function (next) {
    // Only hash if password was modified
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method: compare plain password with hashed password
adminSchema.methods.comparePassword = async function (plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
};

// Don't return password in JSON responses
adminSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.password;
        return ret;
    }
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
