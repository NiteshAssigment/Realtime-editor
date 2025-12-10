import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill"; 
import "react-quill/dist/quill.snow.css";
// NOTE: Assuming you have a CSS file for the custom styles below (e.g., './EditorPage.css')
// import './EditorPage.css'; 

import { DocumentAPI } from "../api/documentApi";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import AccessDeniedPage from "./AccessDeniedPage"; 

const EditorPage = () => {
  const { id: documentId } = useParams();
  const quillRef = useRef();
  const navigate = useNavigate();
  const { user, getAuthHeaders } = useAuth();
  const { socket } = useSocket();

  const [quill, setQuill] = useState(null);
  const [documentTitle, setDocumentTitle] = useState("Loading...");
  const [collaborators, setCollaborators] = useState([]);
  const [documentOwnerId, setDocumentOwnerId] = useState(null);
    
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const docApi = useMemo(() => DocumentAPI(getAuthHeaders), [getAuthHeaders]);

// --- Handle Quill Content Changes (No change) ---
  const handleChange = useCallback(
    (delta, oldDelta, source) => {
      const q = quillRef.current;
      if (socket == null || q == null) return;
      if (source === "user") {
        socket.emit("send-changes", {
          documentId,
          delta: delta,
          content: JSON.stringify(q.getContents()),
        });
      }
    },
    [socket, documentId]
  );
 
// --- Quill Initialization and Ref (No change) ---
  const wrapperRef = useCallback(
    (wrapper) => {
      if (wrapper == null) return;
      wrapper.innerHTML = "";
      const editor = document.createElement("div");
      wrapper.append(editor);

      const q = new ReactQuill.Quill(editor, {
        theme: "snow",
        modules: {
          toolbar: [
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "image"],
            ["clean"],
          ],
        },
      });
      quillRef.current = q;
      q.on("text-change", handleChange);
      setQuill(q);
      q.enable(false); 
    },
    [handleChange]
  ); 
  
// --- Document Fetching and Socket Joining (No change) ---
  useEffect(() => {
    if (!socket || !user) return; 

    const fetchDocument = async () => {
        setLoading(true); 
        setError(null);
        setAccessDenied(false);
        const q = quillRef.current; 

      try {
        const document = await docApi.getDocumentById(documentId);
        setDocumentTitle(document.title);
        setDocumentOwnerId(document.ownerId._id.toString()); 
        
        if (q) {
            if (document.content) {
                q.setContents(JSON.parse(document.content), "silent");
            }
        }

        socket.emit("join-document", {
          documentId,
          userId: user._id,
          username: user.username,
        });
        
      } catch (error) {
        console.error("Document fetch error:", error);
        if (error.response?.status === 403) {
            setAccessDenied(true);
        } else {
            setError("Could not load document or an unhandled error occurred.");
        }
      } finally {
        setLoading(false); 
        const q = quillRef.current;
        if (q && !accessDenied) { 
            q.enable(true); 
        }
      }
    };

    fetchDocument();

    return () => {
      if (socket) {
        socket.emit("leave-document", documentId);
      }
    };
  }, [socket, documentId, user, docApi]); 

// --- Socket Handlers for Realtime Updates (No change) ---
  useEffect(() => {
    if (socket == null || quill == null) return;

    const receiveChangesHandler = (delta) => {
      quill.updateContents(delta, "silent");
    };

    socket.on("receive-changes", receiveChangesHandler);
    socket.on("collaborator-update", setCollaborators);

    return () => {
      socket.off("receive-changes", receiveChangesHandler);
      socket.off("collaborator-update", setCollaborators);
    };
  }, [socket, quill]);

// --- Share and Link Functions (No change) ---
  const handleCopyLink = () => {
      const shareLink = `${window.location.origin}/document/${documentId}`;
      
      navigator.clipboard.writeText(shareLink)
          .then(() => {
              alert('🔗 Document link copied to clipboard!');
          })
          .catch(err => {
              console.error('Failed to copy text: ', err);
              alert('Could not copy link. Please copy it manually from the URL bar.');
          });
  };
    
  const handleShare = async () => {
    const email = prompt(
      "Enter the email of the user you want to add as a collaborator:"
    );
    if (email) {
      try {
        const result = await docApi.addCollaborator(documentId, email);
        alert(result.message);
      } catch (error) {
        alert(`Share failed: ${error}`);
      }
    }
  };
  
  const isOwner = user && documentOwnerId && documentOwnerId === user._id.toString(); 

// --- Conditional Rendering (No change) ---
  if (loading) return <div className="auth-page-wrapper"><p>Loading document...</p></div>;
  if (accessDenied) return <AccessDeniedPage documentId={documentId} />; 
  if (error) return <div className="auth-page-wrapper"><p className="error-message">{error}</p></div>;

// --- Main Render (UI Elements Updated) ---
  return (
    <div className="editor-container">
      <header className="editor-header">
        <h1 className="document-title">{documentTitle}</h1> 
        <div className="header-actions">
            
            {/* Owner Actions */}
          {isOwner && (
            <>
              <button onClick={handleShare} className="btn btn-primary share-button">
                Share Document
              </button>
              <button 
                onClick={handleCopyLink} 
                className="btn btn-secondary copy-link-button" // Updated class name
              >
                🔗 Copy Link
              </button>
            </>
          )}
            
            {/* Collaborator List */}
          <span className="collaborator-status">
                👥 Active: **{collaborators.map((c) => c.username).join(", ")}**
            </span>

            {/* Navigation */}
          <button onClick={() => navigate("/")} className="btn btn-tertiary back-button">
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="editor-wrapper-container" ref={wrapperRef}>
        {/* Quill is mounted here */}
      </div>
        
    {/* 🛑 UI FIX: Removed the incorrect inline <style jsx="true"> block */}
    </div>
  );
};

export default EditorPage;

