import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { ENDPOINTS } from '../constants/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }){
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Restore session on app launch
        (async () => {
            try {
                const storedToken = await AsyncStorage.getItem('authToken');
                const storedUser = await AsyncStorage.getItem('authUser');
                if (storedToken && storedUser){
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                }
            } catch(e){
                console.error('Faied to restore session', e);
            } finally {
                setLoading(false);
            }
        })(); // immediately call the function upon definition
    }, []);

    const isNetworkError = (e) => {
        const msg = e.message?.toLowerCase() || '';
        return (
            msg.includes('network request failed') ||
            msg.includes('fetch failed') ||
            msg.includes('failed to fetch') ||
            msg.includes('unable to resolve host') ||
            msg.includes('networkerror') ||
            msg.includes('timeout')
        );
    }

    const login = async (username, password) => {
        try {
            const res = await fetch(ENDPOINTS.login, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data =  await res.json();
            if (!res.ok) throw new Error(data.detail || 'Login Failed');

            const authToken = data.access;
            await AsyncStorage.setItem('authToken', authToken);
            await AsyncStorage.setItem('authUser', JSON.stringify(data.user || { username }));
            setToken(authToken);
            setUser(data.user || { username });
            return data;
        } catch (e) {
            if (isNetworkError(e)) {
                throw new Error('Please turn on your internet connection') 
            }
            throw e;
        }    
    }

    const register = async (username, password) => {
        try {
            const res = await fetch(ENDPOINTS.register, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Registration failed');
        
            const authToken = data.access;
            await AsyncStorage.setItem('authToken', authToken);
            await AsyncStorage.setItem('authUser', JSON.stringify(data.user || { username }));
            setToken(authToken);
            setUser(data.user || { username });
            return data;
        } catch (e) {
            if (isNetworkError(e)) {
                throw new Error('Please turn on your internet connection') 
            }
            throw e;
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('authUser');
        setToken(null);
        setUser(null);
    };

    // Authenticated fetch helper
    const authFetch = async (url, options = {}) => {
        try {
            const res = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    ...(options.headers || {}),
                },
            })

            if (res.status === 401) {
                await logout();
                throw new Error('Session expired. Please log in again.');
            }
            return res;
        } catch (e) {
            if (isNetworkError(e)) {
                throw new Error('Please turn on your internet connection') 
            }
            throw e;
        }
        
    }

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, authFetch }}>
            {children}
        </AuthContext.Provider>
    );

}


export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
