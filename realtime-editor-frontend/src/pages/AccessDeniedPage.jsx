import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { DocumentAPI } from "../api/documentApi";

const AccessDeniedPage = () => {
  const { id: documentId } = useParams();
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  // 🆕 NEW STATE: To store the requested role (default to read)
  const [requestedRole, setRequestedRole] = useState("read");

  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState(null);

  const docApi = DocumentAPI(getAuthHeaders);

  const handleRequestAccess = async () => {
    console.log("Requesting access for document:", documentId, "with role:", requestedRole);
    if (!user) {
      alert("You must be logged in to request access.");
      navigate("/login");
      return;
    }

    setRequestError(null);
    try {
    console.log("Calling requestAccess API...");
      // 🛑 CRITICAL CHANGE: Pass the requestedRole to the API
      const result = await docApi.requestAccess(documentId, requestedRole);
      console.log("Access request result:", result);
      alert(result.message);
      setRequestSent(true);
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to send access request.";
      setRequestError(message);
    }
  };

  return (
    <div className="access-denied-container">
      <div className="access-denied-card">
        <h2>Docs: You need access</h2>

        {requestSent ? (
          <p className="status-message success">
            ✅ Request for **{requestedRole.toUpperCase()}** access sent!
          </p>
        ) : (
          <>
            <p className="main-message">
              **Request access**, or switch to an account with access.
            </p>

            <div className="user-info-box">
              <p>You are currently logged in as:</p>
              <p className="user-email">**{user?.email || "N/A"}**</p>

              {/* 🆕 ROLE SELECTION UI */}
              <div className="role-selector-group">
                <label htmlFor="access-role">Desired Access Level:</label>
                <select
                  id="access-role"
                  value={requestedRole}
                  onChange={(e) => setRequestedRole(e.target.value)}
                  className="role-select"
                >
                  <option value="read">Viewer (Read-only)</option>
                  <option value="write">Editor (Read & Write)</option>
                </select>
              </div>

              <button
                onClick={handleRequestAccess} // <--- IS THIS CORRECTLY TYPED?
                className="btn btn-primary access-button"
                disabled={!user} // <--- IS THE USER OBJECT TRUTHY?
              >
                Request **{requestedRole.toUpperCase()}** access
              </button>
            </div>

            <button
              onClick={() => navigate("/login")}
              className="btn btn-secondary switch-button"
            >
              Switch account
            </button>

            {requestError && (
              <p className="status-message error">🛑 {requestError}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AccessDeniedPage;
