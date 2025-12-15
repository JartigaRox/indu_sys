import { pool } from '../../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, 
    port: process.env.SMTP_PORT, 
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    tls: { rejectUnauthorized: false }
});

export const getSellerTypes = async (req, res) => {
  try {
    const result = await pool.query('SELECT TipoVendedorID as "TipoVendedorID", Nombre as "Nombre" FROM TiposVendedor');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const register = async (req, res) => {
  const { username, password, rolId, email, tipoVendedorId } = req.body;
  const firmaFile = req.file;

  if (!username || !password || !rolId) {
    return res.status(400).json({ message: "Por favor envíe username, password y rolId" });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const query = `
      INSERT INTO Usuarios (Username, PasswordHash, CorreoElectronico, TipoVendedorID, RolID, FirmaSello) 
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    // Nota: Postgres usa buffers para BYTEA igual que SQL
    const values = [username, hash, email, tipoVendedorId || null, rolId, firmaFile ? firmaFile.buffer : null];

    await pool.query(query, values);
    res.status(201).json({ message: "Usuario creado exitosamente" });

  } catch (error) {
    // Código de error 23505 es violación de unique key en Postgres
    if (error.code === '23505') {
      return res.status(400).json({ message: "El nombre de usuario o correo ya existe" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    // Seleccionamos con alias para que coincida con el frontend
    const result = await pool.query(`
      SELECT UsuarioID as "UsuarioID", Username as "Username", PasswordHash as "PasswordHash", RolID as "RolID" 
      FROM Usuarios WHERE Username = $1
    `, [username]);

    if (result.rows.length === 0) return res.status(400).json({ message: "Usuario no encontrado" });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.PasswordHash);
    if (!validPassword) return res.status(401).json({ message: "Contraseña incorrecta" });

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

export const refreshToken = async (req, res) => {
  try {
    const token = req.headers['x-access-token'];
    if (!token) return res.status(401).json({ message: 'No se proporcionó token' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'cl@v3s0sp3ch0s@#');
    } catch (err) {
      decoded = jwt.decode(token);
      if (!decoded) return res.status(401).json({ message: 'Token inválido' });
    }

    const result = await pool.query(
        'SELECT UsuarioID as "UsuarioID", Username as "Username", RolID as "RolID" FROM Usuarios WHERE UsuarioID = $1', 
        [decoded.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

    const user = result.rows[0];
    const newToken = jwt.sign(
      { id: user.UsuarioID, username: user.Username, rolId: user.RolID },
      process.env.JWT_SECRET || 'cl@v3s0sp3ch0s@#',
      { expiresIn: '2h' }
    );

    res.json({ 
      token: newToken, 
      message: 'Token renovado exitosamente',
      rolId: user.RolID,
      username: user.Username
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.UsuarioID as "UsuarioID", 
        u.Username as "Username", 
        u.CorreoElectronico as "CorreoElectronico",
        u.RolID as "RolID",
        r.NombreRol as "NombreRol",
        u.TipoVendedorID as "TipoVendedorID",
        tv.Nombre as "TipoVendedor"
      FROM Usuarios u
      INNER JOIN Roles r ON u.RolID = r.RolID
      LEFT JOIN TiposVendedor tv ON u.TipoVendedorID = tv.TipoVendedorID
      ORDER BY u.UsuarioID DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.UsuarioID as "UsuarioID", 
        u.Username as "Username", 
        u.CorreoElectronico as "CorreoElectronico",
        u.RolID as "RolID",
        u.TipoVendedorID as "TipoVendedorID"
      FROM Usuarios u
      WHERE u.UsuarioID = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { username, email, rolId, tipoVendedorId, password } = req.body;
  const firmaFile = req.file;
  
  try {
    let query = 'UPDATE Usuarios SET Username = $1, CorreoElectronico = $2, RolID = $3, TipoVendedorID = $4';
    let values = [username, email, rolId, tipoVendedorId || null];
    let count = 5;

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      query += `, PasswordHash = $${count}`;
      values.push(hash);
      count++;
    }

    if (firmaFile) {
      query += `, FirmaSello = $${count}`;
      values.push(firmaFile.buffer);
      count++;
    }
    
    query += ` WHERE UsuarioID = $${count}`;
    values.push(req.params.id);
    
    await pool.query(query, values);
    res.json({ message: "Usuario actualizado exitosamente" });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ message: "El nombre de usuario o correo ya existe" });
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    // Primero verificar
    const check = await pool.query('SELECT UsuarioID FROM Usuarios WHERE UsuarioID = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });

    // Intentar borrar
    await pool.query('DELETE FROM Usuarios WHERE UsuarioID = $1', [req.params.id]);
    res.json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    // 23503 es ForeignKey Violation en Postgres
    if (error.code === '23503') {
        return res.status(400).json({ message: "No se puede eliminar el usuario porque tiene datos asociados" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const getRoles = async (req, res) => {
  try {
    const result = await pool.query('SELECT RolID as "RolID", NombreRol as "NombreRol" FROM Roles');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserSignature = async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(parseInt(id))) return res.status(404).send("ID inválido");

  try {
    // Postgres devuelve columnas en minúsculas por defecto en el driver 'pg' si no ponemos alias entre comillas
    // Para simplificar, accedemos a la propiedad en minúsculas del objeto row
    const result = await pool.query("SELECT FirmaSello FROM Usuarios WHERE UsuarioID = $1", [parseInt(id)]);
    
    // result.rows[0].firmasello (el driver pg lo pone en lowercase)
    if (result.rows.length === 0 || !result.rows[0].firmasello) {
      return res.status(404).send("Firma no encontrada"); 
    }
    
    const imageBuffer = result.rows[0].firmasello;
    let contentType = 'image/png';
    if (imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8) contentType = 'image/jpeg';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); 
    res.send(imageBuffer);

  } catch (error) {
    res.status(500).send("Error al obtener firma");
  }
};

export const getSellers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.UsuarioID as "UsuarioID", 
        u.Username as "Username",
        r.NombreRol as "NombreRol",
        tv.Nombre as "TipoVendedor"
      FROM Usuarios u
      INNER JOIN Roles r ON u.RolID = r.RolID
      LEFT JOIN TiposVendedor tv ON u.TipoVendedorID = tv.TipoVendedorID
      ORDER BY u.Username
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
    const { username } = req.body; 
    if (!username) return res.status(400).json({ message: "El nombre de usuario es requerido" });

    try {
        const result = await pool.query('SELECT UsuarioID as "UsuarioID", Username as "Username", CorreoElectronico as "CorreoElectronico" FROM Usuarios WHERE Username = $1', [username]);
        const user = result.rows[0];

        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });
        if (!user.CorreoElectronico) return res.status(400).json({ message: "Sin correo configurado." });

        const token = crypto.randomBytes(32).toString('hex');
        // Fecha en JS
        const expiry = new Date(Date.now() + 3600000); 

        await pool.query("UPDATE Usuarios SET ResetToken = $1, ResetTokenExpiry = $2 WHERE UsuarioID = $3", [token, expiry, user.UsuarioID]);

        const resetLink = `http://localhost:5173/reset-password/${token}`; 
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.CorreoElectronico,
            subject: 'Recuperación de Contraseña - Sistema GP',
            html: `
                <h2>Hola ${user.Username},</h2>
                <p>Haz clic para restablecer tu contraseña:</p>
                <a href="${resetLink}">Restablecer Contraseña</a>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: `Enlace enviado a ${user.CorreoElectronico}` });

    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: "Datos incompletos" });

    try {
        // En Postgres NOW() es la función de fecha
        const result = await pool.query('SELECT UsuarioID as "UsuarioID" FROM Usuarios WHERE ResetToken = $1 AND ResetTokenExpiry > NOW()', [token]);

        if (result.rows.length === 0) return res.status(400).json({ message: "El enlace es inválido o ha expirado." });

        const userId = result.rows[0].UsuarioID;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await pool.query("UPDATE Usuarios SET PasswordHash = $1, ResetToken = NULL, ResetTokenExpiry = NULL WHERE UsuarioID = $2", [hashedPassword, userId]);

        res.json({ message: "Contraseña actualizada correctamente." });
    } catch (error) {
        res.status(500).json({ message: "Error al restablecer la contraseña" });
    }
};