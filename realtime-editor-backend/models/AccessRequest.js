// models/AccessRequestModel.js

const mongoose = require('mongoose');

const AccessRequestSchema = new mongoose.Schema({
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
    },
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // 🛑 NEW FIELD ADDED
    requestedRole: {
        type: String,
        enum: ['read', 'write'], // Ensures the role is one of these two
        default: 'read',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'granted', 'denied'],
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('AccessRequest', AccessRequestSchema);