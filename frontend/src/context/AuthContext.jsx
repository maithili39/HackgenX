import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({
                    id: payload.userId,
                    role: payload.role,
                    department: payload.department || null,
                    name: payload.name || ''
                });
            } catch (err) {
                logout();
            }
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        const res = await axios.post(`${__API_BASE__}/api/auth/login`, { email, password });
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return res.data.user;
    };

    const register = async (name, email, password, role = 'citizen', department = null, otp) => {
        const res = await axios.post(`${__API_BASE__}/api/auth/register`, { name, email, password, role, department, otp });
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return res.data.user;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
