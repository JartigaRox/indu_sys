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
    const idResult = await pool.request().query("SELECT ISNULL(MAX(ClienteID), 0) + 1 as NextID FROM Clientes");
    const nextId = idResult.recordset[0].NextID;
    const codigoAuto = `CL-${nextId.toString().padStart(5, '0')}`;

    await pool.request()
      .input("codigo", sql.NVarChar, codigoAuto)
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

// 3. Obtener un cliente por ID (para editar)
export const getClientById = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        // Hacemos JOIN para obtener los IDs padres (MunicipioID y DepartamentoID)
        // Esto es vital para pre-seleccionar los combobox en el frontend
        const result = await pool.request()
            .input("id", sql.Int, id)
            .query(`
                SELECT 
                    c.ClienteID, c.CodigoCliente as codigo, c.NombreCliente as nombre, 
                    c.AtencionA as atencionA, c.Telefono as telefono, c.CorreoElectronico as email, 
                    c.DireccionCalle as direccion, c.DistritoID as distritoId,
                    d.MunicipioID, m.DepartamentoID
                FROM Clientes c
                INNER JOIN Distritos d ON c.DistritoID = d.DistritoID
                INNER JOIN Municipios m ON d.MunicipioID = m.MunicipioID
                WHERE c.ClienteID = @id
            `);

        if (result.recordset.length === 0) return res.status(404).json({ message: "Cliente no encontrado" });
        
        res.json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Actualizar Cliente
export const updateClient = async (req, res) => {
    const { id } = req.params;
    const { codigo, nombre, atencionA, telefono, email, direccion, distritoId } = req.body;

    if (!codigo || !nombre || !distritoId) {
        return res.status(400).json({ message: "Datos incompletos" });
    }

    try {
        const pool = await getConnection();
        await pool.request()
            .input("id", sql.Int, id)
            .input("codigo", sql.NVarChar, codigo)
            .input("nombre", sql.NVarChar, nombre)
            .input("atencionA", sql.NVarChar, atencionA)
            .input("telefono", sql.NVarChar, telefono)
            .input("email", sql.NVarChar, email)
            .input("direccion", sql.NVarChar, direccion)
            .input("distritoId", sql.Int, distritoId)
            .query(`
                UPDATE Clientes SET
                    CodigoCliente = @codigo,
                    NombreCliente = @nombre,
                    AtencionA = @atencionA,
                    Telefono = @telefono,
                    CorreoElectronico = @email,
                    DireccionCalle = @direccion,
                    DistritoID = @distritoId
                WHERE ClienteID = @id
            `);

        res.json({ message: "Cliente actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};