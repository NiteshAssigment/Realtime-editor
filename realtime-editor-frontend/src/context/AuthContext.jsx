import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = 'http://localhost:5000/api/auth'; 

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const getAuthHeaders = () => ({
        headers: {
            Authorization: `Bearer ${user?.token}`,
        },
    });

    const login = async (email, password) => {
        try {
            const response = await axios.post(`${API_URL}/login`, { email, password });
            const userData = response.data;
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            return userData;
        } catch (error) {
            throw error.response.data.message || 'Login failed';
        }
    };

    const register = async (username, email, password) => {
        try {
            const response = await axios.post(`${API_URL}/register`, { username, email, password });
            const userData = response.data;
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            return userData;
        } catch (error) {
            throw error.response.data.message || 'Registration failed';
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, getAuthHeaders }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};