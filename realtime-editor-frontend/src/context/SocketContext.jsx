import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const SERVER_URL = 'http://localhost:5000'; 

    useEffect(() => {
        if (user) {
            const newSocket = io(SERVER_URL);

            newSocket.on('connect', () => {
                console.log('Socket Connected:', newSocket.id);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
                console.log('Socket Disconnected');
            };
        }
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    return useContext(SocketContext);
};