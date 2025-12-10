import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DocumentAPI } from '../api/documentApi';

// Reusable Header Component
const Header = ({ user, logout, navigate }) => {
    const handleLogout = () => { 
        logout(); 
        navigate('/login'); 
    };
    return (
        <header className="dashboard-header-v2">
            <h1 className="logo-v2">CollaboraDoc</h1>
            <div className="user-info-group-v2">
                <span className="welcome-message-v2">👋 Hello, **{user.username}**</span>
                <button onClick={handleLogout} className="btn-v2 btn-tertiary-v2">Logout</button>
            </div>
        </header>
    );
}

// Main Dashboard Component
const DashboardPage = () => {
    const { user, getAuthHeaders, logout } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    
    const docApi = useMemo(() => DocumentAPI(getAuthHeaders), [getAuthHeaders]);

    // --- Data Fetching Functions (Omitted for brevity, logic unchanged) ---
    const fetchDocuments = useCallback(async () => {
        setError(null);
        try {
            const data = await docApi.getDocuments();
            setDocuments(data);
        } catch (err) {
            setError('Failed to load documents. Please try again.');
        }
    }, [docApi]);

    const fetchPendingRequests = useCallback(async () => {
        try {
            const requests = await docApi.getPendingAccessRequests();
            setPendingRequests(requests);
        } catch (err) {
            console.error("Failed to load pending requests:", err);
        }
    }, [docApi]);

    useEffect(() => {
        const loadDashboardData = async () => {
            await Promise.all([
                fetchDocuments(),
                fetchPendingRequests()
            ]);
            setLoading(false);
        };
        loadDashboardData();
    }, [fetchDocuments, fetchPendingRequests]);

    // --- Action Handlers (Omitted for brevity, logic unchanged) ---
    const handleDecision = async (requestId, documentId, action) => {
        const actionText = action === 'grant' ? 'accept' : 'reject';
        if (!window.confirm(`Are you sure you want to ${actionText} this access request?`)) {
            return;
        }

        try {
            const result = await docApi.handleAccessDecision(requestId, documentId, action);
            alert(result.message);
            
            setPendingRequests(prev => prev.filter(req => req._id !== requestId));
            
            if (action === 'grant') {
                fetchDocuments(); 
            }

        } catch (error) {
            alert(`Failed to process decision: ${error.response?.data?.message || error.message}`);
        }
    };
    
    const handleCreate = async () => {
        const title = prompt('Enter a title for the new document (optional):');
        if (title !== null) {
            try {
                const newDoc = await docApi.createDocument(title || 'Untitled Document');
                setDocuments([newDoc, ...documents]);
                navigate(`/document/${newDoc._id}`);
            } catch (err) {
                alert('Could not create document.');
            }
        }
    };

    const handleDelete = async (id, title) => {
        if (window.confirm(`Are you sure you want to delete the document: "${title}"?`)) {
            try {
                await docApi.deleteDocument(id);
                setDocuments(documents.filter(doc => doc._id !== id));
            } catch (err) {
                alert('Failed to delete document. Only the owner can delete it.');
            }
        }
    };

    const handleOpen = (id) => navigate(`/document/${id}`);

    // --- Loading and Error States ---
    if (loading) return <div className="dashboard-loader-v2"><p>Loading documents and requests...</p></div>;
    if (error) return <div className="dashboard-error-v2"><p>{error}</p></div>;

    // --- Component Render ---
    return (
        <div className="dashboard-container-v2">
            <Header user={user} logout={logout} navigate={navigate} />
            
            <div className="dashboard-content-v2">
                
                <div className='dashboard-actions'>
                    <h2 className='section-title-v2'>Your Workspace</h2>
                    <button onClick={handleCreate} className="btn-v2 btn-primary-v2 create-button-v2">
                        + Create New Document
                    </button>
                </div>

                {/* Pending Requests Section */}
                {pendingRequests.length > 0 && (
                    <div className="access-requests-section-v2">
                        <h3 className="section-subtitle-v2 notification-header">
                            🔔 Pending Access Requests ({pendingRequests.length})
                        </h3>
                        <div className="requests-grid-v2">
                            {pendingRequests.map(request => (
                                <div key={request._id} className="request-card-v2">
                                    <div className="request-info-v2">
                                        <h4>Request for: **{request.documentId.title}**</h4>
                                        <p>From: **{request.requesterId.username}** ({request.requesterId.email})</p>
                                    </div>
                                    <div className="card-actions-v2">
                                        <button 
                                            onClick={() => handleDecision(request._id, request.documentId._id, 'grant')}
                                            className="btn-v2 btn-success-v2"
                                        >
                                            Accept
                                        </button>
                                        <button 
                                            onClick={() => handleDecision(request._id, request.documentId._id, 'deny')}
                                            className="btn-v2 btn-danger-v2" 
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* My Documents Section */}
                <div className='document-list-section-v2'>
                    <h3 className="section-subtitle-v2">Collaborative Documents</h3>
                    {documents.length === 0 ? (
                        <div className='empty-state-v2'>
                            <p>You don't have any documents yet. Click **Create New Document** to start!</p>
                        </div>
                    ) : (
                        <div className="document-grid-v2">
                            {documents.map((doc) => {
                                const isOwner = doc.ownerId._id.toString() === user._id.toString();
                                return (
                                    <div key={doc._id} className="document-card-v2">
                                        <h4 className='document-title-v2'>{doc.title}</h4>
                                        <div className={`doc-status-tag ${isOwner ? 'owner-tag' : 'collaborator-tag'}`}>
                                            {isOwner ? 'Owner' : 'Collaborator'}
                                        </div>
                                        <p className='document-metadata'>
                                            {isOwner ? 'Created:' : 'Owned by:'} **{doc.ownerId.username}**
                                        </p>
                                        <p className='document-metadata'>
                                            Last Edited: {new Date(doc.updatedAt).toLocaleDateString()}
                                        </p>
                                        <div className="card-actions-v2">
                                            <button onClick={() => handleOpen(doc._id)} className="btn-v2 btn-secondary-v2">
                                                Open Document
                                            </button>
                                            {isOwner && (
                                                <button onClick={() => handleDelete(doc._id, doc.title)} className="btn-v2 btn-danger-text-v2">
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default DashboardPage;