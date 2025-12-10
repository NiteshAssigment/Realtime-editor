const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Untitled Document',
  },
  content: {
    type: String,
    default: '',
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  collaborators: [{
        // This is the field the controller now expects: collab.user
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        role: { 
            type: String, 
            enum: ['read', 'write'], 
            default: 'read' 
        },
        _id: false // Prevents Mongoose from creating sub-document IDs
    }],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);