import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/documents";

export const DocumentAPI = (getAuthHeaders) => {
  const getDocuments = async () => {
    const response = await axios.get(API_BASE_URL, getAuthHeaders());
    return response.data;
  };

  const createDocument = async (title) => {
    const response = await axios.post(
      API_BASE_URL,
      { title },
      getAuthHeaders()
    );
    return response.data;
  };

  const deleteDocument = async (id) => {
    await axios.delete(`${API_BASE_URL}/${id}`, getAuthHeaders());
    return id;
  };
  const getDocumentById = async (id) => {
    const response = await axios.get(`${API_BASE_URL}/${id}`, getAuthHeaders());
    return response.data;
  };

  const addCollaborator = async (documentId, email) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/share`, 
            { documentId, email }, 
            getAuthHeaders()
        );
        return response.data;
    } catch (error) {
        throw error.response.data.message || 'Failed to share document.';
    }
};

const updateDocument = async (id, updates) => {
    try {
        // Use PUT request to update the document at the specific ID
        const response = await axios.put(`${API_BASE_URL}/${id}`, updates, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error.response.data.message || 'Failed to update document.';
    }
};

const requestAccess = async (documentId, requestedRole) => {
        try {
          console.log("In requestAccess API with documentId:", documentId, "and requestedRole:", requestedRole);
            const response = await axios.post(
                // 🛑 FIX 1 (Path): Removed '/documents' from the URL
                `${API_BASE_URL}/${documentId}/request-access`, 
                { requestedRole }, 
                // 🛑 FIX 2 (Headers): Passed the config object directly
                getAuthHeaders() 
            );
            console.log("requestAccess response:", response);
            return response.data;
        } catch (error) {
            throw error;
        }
    };

const getPendingAccessRequests = async () => {
    const response = await axios.get(`${API_BASE_URL}/pending-requests`, getAuthHeaders());
    return response.data;
};

const handleAccessDecision = async (requestId, documentId, action) => {
    // 🛑 FIX: Pass documentId to the URL
    const response = await axios.put(
        `${API_BASE_URL}/${documentId}/access-decision`, 
        { requestId, action }, 
        getAuthHeaders() // Assuming put is used and getAuthConfig is defined
    );
    return response.data;
};

  return { getDocuments, createDocument, deleteDocument, getDocumentById, addCollaborator,updateDocument, requestAccess, getPendingAccessRequests, handleAccessDecision};
};
