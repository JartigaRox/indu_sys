// BE/src/controllers/clients.js
import { getConnection, sql } from '../../db.js';

export const createClient = async (req, res) => {
  const { 
    codigo, 
    nombre, 
    atencionA, 
    telefono, 
    email, 
    direccion, 
    distritoId 
  } = req.body;

  if (!codigo || !nombre || !distritoId) {
    return res.status(400).json({ message: "Código, Nombre y Distrito son obligatorios" });
  }

  try {
    const pool = await getConnection();

    await pool.request()
      .input("codigo", sql.NVarChar, codigo)
      .input("nombre", sql.NVarChar, nombre)
      .input("atencionA", sql.NVarChar, atencionA)
      .input("telefono", sql.NVarChar, telefono)
      .input("email", sql.NVarChar, email)
      .input("direccion", sql.NVarChar, direccion)
      .input("distritoId", sql.Int, distritoId)
      .query(`
        INSERT INTO Clientes (CodigoCliente, NombreCliente, AtencionA, Telefono, CorreoElectronico, DireccionCalle, DistritoID)
        VALUES (@codigo, @nombre, @atencionA, @telefono, @email, @direccion, @distritoId)
      `);

    res.status(201).json({ message: "Cliente registrado correctamente" });

  } catch (error) {
    if (error.number === 2627) { // Error de duplicado en SQL
        return res.status(400).json({ message: "El código de cliente ya existe" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const getClients = async (req, res) => {
  try {
    const pool = await getConnection();
    // Hacemos JOIN para traer la info completa de ubicación en una sola consulta
    const result = await pool.request().query(`
      SELECT 
        c.ClienteID, c.CodigoCliente, c.NombreCliente, c.AtencionA, c.Telefono, c.CorreoElectronico, c.DireccionCalle,
        d.Nombre as Distrito, m.Nombre as Municipio, dep.Nombre as Departamento
      FROM Clientes c
      INNER JOIN Distritos d ON c.DistritoID = d.DistritoID
      INNER JOIN Municipios m ON d.MunicipioID = m.MunicipioID
      INNER JOIN Departamentos dep ON m.DepartamentoID = dep.DepartamentoID
    `);
    
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};