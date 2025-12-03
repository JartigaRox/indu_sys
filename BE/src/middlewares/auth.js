// BE/src/middlewares/auth.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const verifyToken = (req, res, next) => {
  const token = req.headers['x-access-token'] || req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: "Se requiere un token para acceder aquí" });
  }

  // A veces el token viene como "Bearer xyz...", limpiamos el prefijo si existe
  const cleanToken = token.startsWith("Bearer ") ? token.slice(7, token.length) : token;

  try {
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET || 'cl@v3s0sp3ch0s@#');
    req.user = decoded; // Guardamos los datos del usuario en la petición para usarlos luego
    next(); // Todo bien, pase adelante
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

// Middleware extra para verificar si es Admin (Sudo)
export const isSudo = (req, res, next) => {
  // Asumimos que RolID 1 es 'sudo' basado en tu script SQL inicial
  if (req.user && req.user.rolId === 1) {
    next();
  } else {
    return res.status(403).json({ message: "Acceso denegado. Se requiere rol SUDO." });
  }
};