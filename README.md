# Realtime-editor

## 📝 Overview

This project is a full-stack, realtime collaborative document editor, similar to Google Docs. It allows multiple users to simultaneously edit a single document, with changes synchronized instantly across all active sessions using WebSockets.

The application is split into two main components:
1.  **`realtime-editor-frontend`**: A React application for the user interface.
2.  **`realtime-editor-backend`**: A Node.js/Express server handling authentication, document storage (MongoDB), and WebSocket management (Socket.io).

## ✨ Features

* **Realtime Co-editing:** Instant synchronization of document content.
* **User Authentication:** Secure registration, login, and token-based protection.
* **Document Management:** Create, save, and delete personal documents.
* **Access Control & Roles:**
    * Document ownership and explicit collaboration.
    * Access request mechanism (`read`/`write` roles) for unauthorized users.

## ⚙️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React, Axios | Built with React for a dynamic SPA. |
| **Backend** | Node.js, Express | RESTful API and server environment. |
| **Database** | MongoDB, Mongoose | NoSQL database for document and user data. |
| **Realtime** | Socket.io | Bi-directional communication for content synchronization. |
| **Auth** | JWT (JSON Web Tokens) | Secure, stateless authentication. |

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### 1. Prerequisites

* Node.js (LTS recommended)
* MongoDB Instance (Local or remote Atlas cluster)

### 2. Backend Setup

The backend handles the API and socket connections.

1.  **Navigate to the backend directory:**
    ```bash
    cd realtime-editor-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a file named `.env` in the `realtime-editor-backend` directory and add your configuration:
    ```env
    # --- MongoDB Configuration ---
    MONGO_URI=mongodb+srv://<user>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority
    PORT=5000

    # --- JWT Authentication ---
    JWT_SECRET=YOUR_VERY_STRONG_JWT_SECRET_KEY
    JWT_EXPIRE=30d
    ```

4.  **Run the backend server:**
    ```bash
    npm run dev
    ```
    The server should start on `http://localhost:5000`.

### 3. Frontend Setup

The frontend connects to the running backend.

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../realtime-editor-frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a file named `.env` or `.env.local` in the `realtime-editor-frontend` directory and define the backend API and Socket URL:
    ```env
    # Adjust ports if your setup is different
    REACT_APP_API_URL=http://localhost:5000/api
    REACT_APP_SOCKET_URL=http://localhost:5000
    ```

4.  **Run the frontend application:**
    ```bash
    npm start
    ```
    The frontend should open in your browser, typically at `http://localhost:3000`.

## 🔒 Access Control (How the Request System Works)

The application enforces strict access control using a collaboration array with roles (`read`, `write`).

* **Owner:** Has implicit `write` access and manages requests.
* **Request Access:** When a user without access attempts to view a document, they are redirected to an Access Denied page where they can submit a request for `read` or `write` permission.
* **Handle Decision:** The document owner receives a list of pending requests and can **Grant** (adding the user to the collaborators array with the requested role) or **Deny** the access.

## 🤝 Contribution

If you would like to contribute to this project, please feel free to fork the repository and submit a pull request!

---

## 📄 License

[Specify your license here, e.g., MIT, ISC, or UNLICENSED]
