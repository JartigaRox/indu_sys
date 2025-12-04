import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

// Creamos el contexto
const AuthContext = createContext();

// Hook personalizado para usar el contexto fácilmente
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
    return context;
};

// Proveedor del contexto (envuelve a toda la app)
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Al cargar la página, revisamos si ya hay un token guardado
    useEffect(() => {
        const checkLogin = () => {
            const token = localStorage.getItem('token');
            const username = localStorage.getItem('username');
            const rolId = localStorage.getItem('rolId');

            if (token && username) {
                setUser({ username, rolId: parseInt(rolId) });
                setIsAuthenticated(true);
            }
            setLoading(false);
        };
        checkLogin();
    }, []);

    // Función de Login
    const signin = async (userData) => {
        try {
            const res = await api.post('/auth/login', userData);
            const { token, username, rolId } = res.data;

            // Guardamos en LocalStorage
            localStorage.setItem('token', token);
            localStorage.setItem('username', username);
            localStorage.setItem('rolId', rolId);

            // Guardamos en el Estado
            setUser({ username, rolId });
            setIsAuthenticated(true);
            return true; // Éxito
        } catch (error) {
            console.error(error);
            // Devolvemos el mensaje de error del backend o uno genérico
            return error.response?.data?.message || "Error al iniciar sesión";
        }
    };

    // Función de Logout
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('rolId');
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{
            signin,
            logout,
            user,
            isAuthenticated,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};