import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const __API_BASE__ = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function useSocket(eventListeners = {}) {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io(__API_BASE__);
        setSocket(newSocket);

        // Register all provided event listeners
        Object.entries(eventListeners).forEach(([event, callback]) => {
            newSocket.on(event, callback);
        });

        // Cleanup on unmount
        return () => {
            Object.keys(eventListeners).forEach(event => {
                newSocket.off(event);
            });
            newSocket.disconnect();
        };
    }, []); // Empty dependency array ensures we only connect once per component mount

    return socket;
}
