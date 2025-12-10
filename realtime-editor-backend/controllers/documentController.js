const Document = require("../models/Document");
const User = require("../models/User");
const AccessRequest = require("../models/AccessRequest");
const mongoose = require("mongoose");

// 🛠️ FIX 1: Define the isValidId helper function
const isValidId = (id) => {
    return id && mongoose.Types.ObjectId.isValid(id);
};

// --- CRUD Operations ---

const createDocument = async (req, res) => {
    try {
        // NOTE: If your Document schema uses the {user, role} array structure, 
        // you should initialize collaborators here with the owner's role:
        /*
        collaborators: [{
            user: req.user._id,
            role: 'write' 
        }],
        */
        const document = await Document.create({
            title: req.body.title || "Untitled Document",
            ownerId: req.user._id,
            // 🛑 MUST use the {user: ID, role: ROLE} format
            collaborators: [{ user: req.user._id, role: 'write' }], 
        });
        res.status(201).json(document);
    } catch (error) {
        res
            .status(500)
            .json({ message: "Failed to create document", error: error.message });
    }
};

const getDocuments = async (req, res) => {
    try {
        const documents = await Document.find({
            $or: [
                { ownerId: req.user._id }, // Check if the user is the owner
                // 🛠️ FIX: Check if req.user._id exists in the nested 'collaborators.user' field
                { 'collaborators.user': req.user._id }
            ],
        })
            .populate("ownerId", "username")
            .select("-content")
            .sort({ updatedAt: -1 });

        res.json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        res
            .status(500)
            .json({ message: "Failed to fetch documents", error: error.message });
    }
};

const getDocumentById = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id)
            .populate("ownerId", "username")
            // Assuming collaborators might contain complex objects {user, role}
            .populate("collaborators.user", "username email"); 

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }
        
        // Check if the user is the owner
        const isOwner = document.ownerId._id.equals(req.user._id);

        // Check if the user is a collaborator (handles both simple ID and {user, role} structures)
        const isCollaborator = document.collaborators.some((collab) => {
            // Check for both old simple ID format and new {user, role} format
            const collabId = collab.user ? collab.user._id : collab._id; 
            return collabId && collabId.equals(req.user._id);
        });

        const isAuthorized = isOwner || isCollaborator;

        if (!isAuthorized) {
            return res
                .status(403)
                .json({ message: "Not authorized to access this document" });
        }

        res.json(document);
    } catch (error) {
        res
            .status(500)
            .json({ message: "Error fetching document", error: error.message });
    }
};

const deleteDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        if (!document.ownerId.equals(req.user._id)) {
            return res
                .status(403)
                .json({ message: "Not authorized to delete this document" });
        }

        await Document.deleteOne({ _id: req.params.id });
        res.json({ message: "Document removed" });
    } catch (error) {
        res
            .status(500)
            .json({ message: "Error deleting document", error: error.message });
    }
};

const addCollaborator = async (req, res) => {
    try {
        const { documentId, email } = req.body;
        const collaboratorUser = await User.findOne({ email });

        if (!collaboratorUser) {
            return res
                .status(404)
                .json({ message: "User with that email not found." });
        }
        const document = await Document.findById(documentId);

        if (!document) {
            return res.status(404).json({ message: "Document not found." });
        }

        if (!document.ownerId.equals(req.user._id)) {
            return res
                .status(403)
                .json({ message: "Only the owner can add collaborators." });
        }
        
        // Check for existing collaborators, accommodating different schema formats
        const isAlreadyCollaborator = document.collaborators.some((collab) => {
             const collabId = collab.user || collab; // Get the ID, regardless of structure
             return collabId.equals(collaboratorUser._id);
        });
        
        if (isAlreadyCollaborator) {
            return res
                .status(400)
                .json({ message: "User is already a collaborator." });
        }
        
        // NOTE: If you are using the array of objects {user, role} for all collaborators, 
        // you MUST push the object here, not just the ID. Default role is 'write'
        document.collaborators.push({ user: collaboratorUser._id, role: 'write' });
        
        await document.save();
        res.json({
            message: `${collaboratorUser.username} added as collaborator.`,
            collaborator: {
                _id: collaboratorUser._id,
                username: collaboratorUser.username,
            },
        });
    } catch (error) {
        res
            .status(500)
            .json({ message: "Failed to add collaborator.", error: error.message });
    }
};

const updateDocument = async (req, res) => {
    try {
        const documentId = req.params.id;
        const { title } = req.body;

        // 1. Find the document
        const document = await Document.findById(documentId);

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        // 2. Authorization Check (Owner or Collaborator can update)
        const isAuthorized =
            document.ownerId.equals(req.user._id) ||
            document.collaborators.some((collab) => {
                const collabId = collab.user || collab;
                return collabId.equals(req.user._id);
            });

        if (!isAuthorized) {
            return res
                .status(403)
                .json({ message: "Not authorized to update this document" });
        }

        // 3. Update the title and last updated time
        if (title) {
            document.title = title;
            document.lastUpdated = Date.now();
            await document.save();
        }

        res.json({ message: "Document updated successfully", document });
    } catch (error) {
        res
            .status(500)
            .json({ message: "Failed to update document", error: error.message });
    }
};

// --- Access Request Functions ---

const requestAccess = async (req, res) => {
    const { documentId } = req.params;
    const requesterId = req.user._id;
    const { requestedRole } = req.body; 

    if (!isValidId(documentId)) {
        return res.status(400).json({ message: 'Invalid document ID.' });
    }
    
    if (!['read', 'write'].includes(requestedRole)) {
        return res.status(400).json({ message: 'Invalid role requested. Must be "read" or "write".' });
    }

    try {
        const document = await Document.findById(documentId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found.' });
        }
        
        // 🛠️ FIX 2: Safely check if the user already has access (Owner or Collaborator)
        const isOwner = document.ownerId.equals(requesterId);
        
        const isCollaborator = document.collaborators.some(collab => {
            // Check for collaborators regardless of simple ID or {user, role} structure
            const collabId = collab.user || collab; 
            return collabId.equals(requesterId);
        });
        
        if (isOwner || isCollaborator) {
            return res.status(400).json({ message: 'You already have access to this document.' });
        }

        // Check if a pending request already exists
        const existingRequest = await AccessRequest.findOne({
            documentId,
            requesterId,
            status: 'pending',
        });
        
        if (existingRequest) {
             return res.status(400).json({ message: `Access request already pending.` });
        }

        // Create the new request
        const newRequest = new AccessRequest({
            documentId,
            requesterId,
            requestedRole: requestedRole,
        });

        await newRequest.save();

        res.status(201).json({ 
            message: `Access request for ${requestedRole} sent successfully to the document owner.` 
        });

    } catch (error) {
        console.error('Error requesting access:', error);
        res.status(500).json({ message: 'Server error during access request.' });
    }
};

const getPendingAccessRequests = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res
                .status(401)
                .json({ message: "Authentication required or user data missing." });
        }

        const ownerId = req.user._id;

        const ownedDocuments = await Document.find({ ownerId: ownerId }).select(
            "_id"
        );

        const documentIds = ownedDocuments
            .filter((doc) => doc && doc._id)
            .map((doc) => doc._id);

        const pendingRequests = await AccessRequest.find({
            documentId: { $in: documentIds },
            status: "pending",
        })
            .populate("requesterId", "username email")
            .populate("documentId", "title");

        res.json(pendingRequests);
    } catch (error) {
        console.error("Error fetching pending requests:", error);
        res
            .status(500)
            .json({ message: "Failed to fetch pending access requests." });
    }
};

const handleAccessDecision = async (req, res) => {
    const { documentId } = req.params;
    const { requestId, action } = req.body;
    const ownerId = req.user._id; 

    // NOTE: documentId is from params in this version, but requestId is from body
    if (!isValidId(documentId) || !isValidId(requestId)) { 
        return res.status(400).json({ message: 'Invalid ID provided.' });
    }

    try {
        const document = await Document.findById(documentId);
        if (!document || !document.ownerId.equals(ownerId)) {
            return res.status(403).json({ message: 'Access denied or document not found.' });
        }

        const request = await AccessRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Access request not found.' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request has already been processed.' });
        }

        if (action === 'grant') {
            const newRole = request.requestedRole; 

            // Prevent duplicate entries
            const isAlreadyCollaborator = document.collaborators.some(collab => {
                const collabId = collab.user || collab; 
                return collabId.equals(request.requesterId);
            });
            
            if (!isAlreadyCollaborator) {
                // 🛑 Ensure this push aligns with your Document model's collaborators schema!
                document.collaborators.push({
                    user: request.requesterId,
                    role: newRole, 
                });
                await document.save();
            }

            request.status = 'granted';
            await request.save();

            return res.json({ 
                message: `Access granted successfully as ${newRole}.` 
            });

        } else if (action === 'deny') {
            request.status = 'denied';
            await request.save();
            return res.json({ message: 'Access request denied.' });
        } else {
            return res.status(400).json({ message: 'Invalid action specified. Must be "grant" or "deny".' });
        }

    } catch (error) {
        console.error('Error handling access decision:', error);
        res.status(500).json({ message: 'Server error during decision processing.' });
    }
};

module.exports = {
    createDocument,
    getDocuments,
    getDocumentById,
    deleteDocument,
    addCollaborator,
    updateDocument,
    requestAccess,
    getPendingAccessRequests,
    handleAccessDecision,
};