import { getConnection, sql } from '../../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// ---------------------------------------------------
// CONFIGURACIÓN DE CORREO (NODEMAILER)
// ---------------------------------------------------
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, 
    port: process.env.SMTP_PORT, 
    secure: process.env.SMTP_SECURE === 'true', // Convierte string a boolean
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false // Ayuda en desarrollo si hay problemas de certificados
    },

});

// ---------------------------------------------------
// FUNCIONES DE AUTENTICACIÓN Y USUARIOS
// ---------------------------------------------------

// Obtener tipos de vendedor (para el combo de registro)
export const getSellerTypes = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT * FROM TiposVendedor');
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Registrar nuevo usuario
export const register = async (req, res) => {
  const { username, password, rolId, email, tipoVendedorId } = req.body;
  const firmaFile = req.file; // Imagen de firma/sello desde multer

  if (!username || !password || !rolId) {
    return res.status(400).json({ message: "Por favor envíe username, password y rolId" });
  }

  try {
    const pool = await getConnection();

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const request = pool.request()
      .input("username", sql.NVarChar, username)
      .input("email", sql.NVarChar, email)
      .input("passwordHash", sql.NVarChar, hash)
      .input("tipoVendedorId", sql.Int, tipoVendedorId || null)
      .input("rolId", sql.Int, rolId);

    // Si hay imagen de firma, agregarla
    if (firmaFile) {
      request.input("firmaSello", sql.VarBinary, firmaFile.buffer);
      await request.query("INSERT INTO Usuarios (Username, PasswordHash, CorreoElectronico, TipoVendedorID, RolID, FirmaSello) VALUES (@username, @passwordHash, @email, @tipoVendedorId, @rolId, @firmaSello)");
    } else {
      await request.query("INSERT INTO Usuarios (Username, PasswordHash, CorreoElectronico, TipoVendedorID, RolID) VALUES (@username, @passwordHash, @email, @tipoVendedorId, @rolId)");
    }

    res.status(201).json({ message: "Usuario creado exitosamente" });

  } catch (error) {
    if (error.number === 2627) {
      return res.status(400).json({ message: "El nombre de usuario o correo ya existe" });
    }
    res.status(500).json({ message: error.message });
  }
};

// Iniciar sesión
export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("username", sql.NVarChar, username)
      .query("SELECT * FROM Usuarios WHERE Username = @username");

    if (result.recordset.length === 0) return res.status(400).json({ message: "Usuario no encontrado" });

    const user = result.recordset[0];
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

// Refrescar token
export const refreshToken = async (req, res) => {
  try {
    const token = req.headers['x-access-token'];
    
    if (!token) {
      return res.status(401).json({ message: 'No se proporcionó token' });
    }

    // Verificar el token actual (incluso si está expirado, extraemos los datos)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'cl@v3s0sp3ch0s@#');
    } catch (err) {
      // Si está expirado, podemos extraer los datos de todos modos
      decoded = jwt.decode(token);
      if (!decoded) {
        return res.status(401).json({ message: 'Token inválido' });
      }
    }

    // Verificar que el usuario aún existe en la base de datos
    const pool = await getConnection();
    const result = await pool.request()
      .input("userId", sql.Int, decoded.id)
      .query("SELECT UsuarioID, Username, RolID FROM Usuarios WHERE UsuarioID = @userId");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = result.recordset[0];

    // Generar nuevo token con 2 horas de validez
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

// Obtener todos los usuarios
export const getUsers = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        u.UsuarioID, 
        u.Username, 
        u.CorreoElectronico,
        u.RolID,
        r.NombreRol,
        u.TipoVendedorID,
        tv.Nombre as TipoVendedor
      FROM Usuarios u
      INNER JOIN Roles r ON u.RolID = r.RolID
      LEFT JOIN TiposVendedor tv ON u.TipoVendedorID = tv.TipoVendedorID
      ORDER BY u.UsuarioID DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un usuario por ID
export const getUserById = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("id", sql.Int, req.params.id)
      .query(`
        SELECT 
          u.UsuarioID, 
          u.Username, 
          u.CorreoElectronico,
          u.RolID,
          u.TipoVendedorID
        FROM Usuarios u
        WHERE u.UsuarioID = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar usuario
export const updateUser = async (req, res) => {
  const { username, email, rolId, tipoVendedorId, password } = req.body;
  const firmaFile = req.file; // Imagen de firma/sello desde multer
  
  try {
    const pool = await getConnection();
    
    let updateQuery = `
      UPDATE Usuarios 
      SET Username = @username, 
          CorreoElectronico = @email, 
          RolID = @rolId, 
          TipoVendedorID = @tipoVendedorId
    `;
    
    const request = pool.request()
      .input("id", sql.Int, req.params.id)
      .input("username", sql.NVarChar, username)
      .input("email", sql.NVarChar, email)
      .input("rolId", sql.Int, rolId)
      .input("tipoVendedorId", sql.Int, tipoVendedorId || null);
    
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      request.input("passwordHash", sql.NVarChar, hash);
      updateQuery += `, PasswordHash = @passwordHash`;
    }

    // Si hay imagen de firma, agregarla
    if (firmaFile) {
      request.input("firmaSello", sql.VarBinary, firmaFile.buffer);
      updateQuery += `, FirmaSello = @firmaSello`;
    }
    
    updateQuery += ` WHERE UsuarioID = @id`;
    
    await request.query(updateQuery);
    
    res.json({ message: "Usuario actualizado exitosamente" });
  } catch (error) {
    if (error.number === 2627) {
      return res.status(400).json({ message: "El nombre de usuario o correo ya existe" });
    }
    res.status(500).json({ message: error.message });
  }
};

// Eliminar usuario
export const deleteUser = async (req, res) => {
  try {
    const pool = await getConnection();
    
    // Verificar si el usuario existe
    const checkUser = await pool.request()
      .input("id", sql.Int, req.params.id)
      .query("SELECT UsuarioID FROM Usuarios WHERE UsuarioID = @id");
    
    if (checkUser.recordset.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    // Intentar eliminar
    try {
      await pool.request()
        .input("id", sql.Int, req.params.id)
        .query("DELETE FROM Usuarios WHERE UsuarioID = @id");
      
      res.json({ message: "Usuario eliminado exitosamente" });
    } catch (deleteError) {
      if (deleteError.number === 547) {
        return res.status(400).json({ 
          message: "No se puede eliminar el usuario porque tiene cotizaciones u órdenes asociadas" 
        });
      }
      throw deleteError;
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener roles
export const getRoles = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT * FROM Roles');
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener firma/sello de un usuario
export const getUserSignature = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(404).send("ID de usuario inválido o no proporcionado");
  }

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("id", sql.Int, parseInt(id)) 
      .query("SELECT FirmaSello FROM Usuarios WHERE UsuarioID = @id");
    
    if (result.recordset.length === 0 || !result.recordset[0].FirmaSello) {
      return res.status(404).send("Firma no encontrada"); 
    }
    
    const imageBuffer = result.recordset[0].FirmaSello;
    
    let contentType = 'image/png';
    if (imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8) {
      contentType = 'image/jpeg';
    }
    
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=3600'); 
    res.send(imageBuffer);

  } catch (error) {
    console.error('Error DB en getUserSignature:', error.message);
    res.status(500).send("Error al obtener firma");
  }
};

// Obtener lista de usuarios vendedores
export const getSellers = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        u.UsuarioID, 
        u.Username,
        r.NombreRol,
        tv.Nombre as TipoVendedor
      FROM Usuarios u
      INNER JOIN Roles r ON u.RolID = r.RolID
      LEFT JOIN TiposVendedor tv ON u.TipoVendedorID = tv.TipoVendedorID
      ORDER BY u.Username
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------
// RECUPERACIÓN DE CONTRASEÑA
// ---------------------------------------------------

// 1. Solicitar recuperación (Busca por Username, envía a su Email)
export const forgotPassword = async (req, res) => {
    const { username } = req.body; 

    if (!username) return res.status(400).json({ message: "El nombre de usuario es requerido" });

    try {
        const pool = await getConnection();
        
        // 1. Verificar usuario y obtener correo
        const userResult = await pool.request()
            .input("username", sql.NVarChar, username)
            .query("SELECT UsuarioID, Username, CorreoElectronico FROM Usuarios WHERE Username = @username");

        const user = userResult.recordset[0];

        // Validaciones
        if (!user) {
            // Error 404 si el usuario no existe en la BD
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        if (!user.CorreoElectronico) {
            // Error si el usuario existe pero no tiene correo guardado
            return res.status(400).json({ message: "Este usuario no tiene un correo electrónico configurado. Contacte al administrador." });
        }

        // 2. Generar Token y Expiración (1 hora)
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000); 

        // 3. Guardar en BD
        await pool.request()
            .input("token", sql.NVarChar, token)
            .input("expiry", sql.DateTime, expiry)
            .input("id", sql.Int, user.UsuarioID)
            .query("UPDATE Usuarios SET ResetToken = @token, ResetTokenExpiry = @expiry WHERE UsuarioID = @id");

        // 4. Enviar Correo
        const resetLink = `http://localhost:5173/reset-password/${token}`; // URL del Frontend

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.CorreoElectronico,
            subject: 'Recuperación de Contraseña - Sistema GP',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #003366;">Hola ${user.Username},</h2>
                    <p>Recibimos una solicitud para restablecer tu contraseña.</p>
                    <p>Haz clic en el siguiente botón para crear una nueva:</p>
                    <br>
                    <a href="${resetLink}" style="padding: 10px 20px; background-color: #D4AF37; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer Contraseña</a>
                    <br><br>
                    <p style="font-size: 12px; color: #666;">Este enlace expira en 1 hora.</p>
                    <p style="font-size: 12px; color: #666;">Si no fuiste tú, ignora este mensaje.</p>
                </div>
            `
        };

        // Enviar con manejo de errores específico
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log("✅ Correo enviado correctamente: ", info.messageId);
            res.json({ message: `Se ha enviado un enlace al correo registrado para el usuario ${username}.` });
        } catch (mailError) {
            console.error("❌ Error enviando correo:", mailError);
            return res.status(500).json({ message: "Error técnico al enviar el correo. Revisa la consola del servidor." });
        }

    } catch (error) {
        console.error("Error general en forgotPassword:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// 2. Restablecer contraseña (Recibe token y nueva clave)
export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token || !newPassword) return res.status(400).json({ message: "Datos incompletos" });

    try {
        const pool = await getConnection();

        // 1. Validar token
        const userResult = await pool.request()
            .input("token", sql.NVarChar, token)
            .query("SELECT UsuarioID FROM Usuarios WHERE ResetToken = @token AND ResetTokenExpiry > GETDATE()");

        if (userResult.recordset.length === 0) {
            return res.status(400).json({ message: "El enlace es inválido o ha expirado." });
        }

        const userId = userResult.recordset[0].UsuarioID;

        // 2. Encriptar y actualizar
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await pool.request()
            .input("pass", sql.NVarChar, hashedPassword)
            .input("id", sql.Int, userId)
            .query("UPDATE Usuarios SET PasswordHash = @pass, ResetToken = NULL, ResetTokenExpiry = NULL WHERE UsuarioID = @id");

        res.json({ message: "Contraseña actualizada correctamente. Ahora puedes iniciar sesión." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al restablecer la contraseña" });
    }
};