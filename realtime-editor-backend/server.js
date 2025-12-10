const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv').config();
const cors = require('cors');
const connectDB = require('./config/db');
const Document = require('./models/Document'); 

connectDB();

const app = express();
const server = http.createServer(app);
const FRONTEND_ORIGIN = 'http://localhost:5173'; 
const PORT = process.env.PORT || 5000;

app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));

app.use(cors({
    origin: FRONTEND_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/documents', require('./routes/document'));

const io = new Server(server, {
    cors: {
        origin: FRONTEND_ORIGIN,
        methods: ['GET', 'POST'],
    },
});

const updateDocumentContent = async (documentId, content) => {
    try {
        await Document.findByIdAndUpdate(documentId, { 
            content, 
            lastUpdated: Date.now() 
        });
    } catch (error) {
        console.error('Error saving document content:', error);
    }
};

const activeCollaborators = {}; 

io.on('connection', (socket) => {
    socket.on('join-document', ({ documentId, userId, username }) => {
        socket.join(documentId);

        if (!activeCollaborators[documentId]) {
            activeCollaborators[documentId] = {};
        }
        activeCollaborators[documentId][socket.id] = { userId, username };

        const collaboratorsList = Object.values(activeCollaborators[documentId]);
        io.to(documentId).emit('collaborator-update', collaboratorsList);
        socket.broadcast.to(documentId).emit('user-joined', username);
    });

    socket.on('send-changes', (data) => {
        const { documentId, delta, content } = data;
        socket.broadcast.to(documentId).emit('receive-changes', delta);
        updateDocumentContent(documentId, content); 
    });

    socket.on('disconnect', () => {
        for (const documentId in activeCollaborators) {
            if (activeCollaborators[documentId][socket.id]) {
                const { username } = activeCollaborators[documentId][socket.id];
                
                delete activeCollaborators[documentId][socket.id];

                const collaboratorsList = Object.values(activeCollaborators[documentId]);
                io.to(documentId).emit('collaborator-update', collaboratorsList);
                socket.broadcast.to(documentId).emit('user-left', username);
                
                break;
            }
        }
    });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));