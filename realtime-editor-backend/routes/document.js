const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  addCollaborator,
  updateDocument,
  requestAccess,
  getPendingAccessRequests,
  handleAccessDecision,
} = require("../controllers/documentController");
const router = express.Router();

router.use(protect);

// 1. Routes for /api/documents/ (No ID segment)
router.route("/").post(createDocument).get(getDocuments);

// 2. STATIC/NAMED ROUTES (Must be defined before /:id)
router.get('/pending-requests', getPendingAccessRequests); // ✅ This now works
// router.post('/request-access', requestAccess);
// router.post('/access-decision', handleAccessDecision);

router.post("/share", addCollaborator); // Renamed from /share to /add-collaborator for clarity?

// 3. DYNAMIC ROUTES (Must be defined last)
router.post(
    '/:documentId/request-access', 
    protect, 
    requestAccess
);
router.put(
    '/:documentId/access-decision', 
    protect, 
    handleAccessDecision
);
router
  .route("/:id")
  .get(getDocumentById)
  .put(updateDocument)
  .delete(deleteDocument);


module.exports = router;