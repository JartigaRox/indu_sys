// BE/src/controllers/auth.js
import { getConnection, sql } from '../../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  const { username, password, rolId,email } = req.body;

  if (!username || !password || !rolId) {
    return res.status(400).json({ message: "Por favor envíe username, password y rolId" });
  }

  try {
    const pool = await getConnection();

    // 1. Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // 2. Insertar en SQL Server
    const result = await pool.request()
      .input("username", sql.NVarChar, username)
      .input("email", sql.NVarChar, email)
      .input("passwordHash", sql.NVarChar, hash)
      .input("rolId", sql.Int, rolId)
      .query("INSERT INTO Usuarios (Username, CorreoElectronico, PasswordHash, RolID) VALUES (@username, @email, @passwordHash, @rolId)");

    res.status(201).json({ message: "Usuario creado exitosamente" });

  } catch (error) {
    // Código 2627 es violación de Unique Key en SQL Server (Usuario duplicado)
    if (error.number === 2627) {
      return res.status(400).json({ message: "El nombre de usuario ya existe" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const pool = await getConnection();

    // 1. Buscar usuario
    const result = await pool.request()
      .input("username", sql.NVarChar, username)
      .query("SELECT * FROM Usuarios WHERE Username = @username");

    if (result.recordset.length === 0) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    const user = result.recordset[0];

    // 2. Comparar contraseña (la que envía el usuario vs el hash en la BD)
    const validPassword = await bcrypt.compare(password, user.PasswordHash);

    if (!validPassword) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // 3. Generar Token
    const token = jwt.sign(
      { id: user.UsuarioID, username: user.Username, rolId: user.RolID },
      process.env.JWT_SECRET || 'cl@v3s0sp3ch0s@#',
      { expiresIn: '2h' }
    );

    res.json({ token, rolId: user.RolID, username: user.Username });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};