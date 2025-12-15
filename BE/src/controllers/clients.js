import { pool } from '../../db.js';

// 1. CREAR CLIENTE
export const createClient = async (req, res) => {
    const { nombre, atencionA, telefono, email, direccion, distritoId } = req.body;

    if (!nombre) return res.status(400).json({ message: "El nombre del cliente es obligatorio" });

    try {
        // A. Generar código CL-0000X
        // COALESCE es el equivalente de ISNULL en Postgres
        const idResult = await pool.query('SELECT COALESCE(MAX("ClienteID"), 0) + 1 as "NextID" FROM Clientes');
        const nextId = idResult.rows[0].NextID;
        const codigoAuto = `CL-${nextId.toString().padStart(5, '0')}`;

        // B. Insertar
        await pool.query(`
            INSERT INTO Clientes (CodigoCliente, NombreCliente, AtencionA, Telefono, CorreoElectronico, DireccionCalle, DistritoID)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [codigoAuto, nombre, atencionA || null, telefono || null, email || null, direccion || null, distritoId || null]);

        res.status(201).json({ message: "Cliente registrado correctamente", codigo: codigoAuto });

    } catch (error) {
        if (error.code === '23505') return res.status(400).json({ message: "Error: El cliente ya existe." });
        res.status(500).json({ message: error.message });
    }
};

// 2. OBTENER LISTA
export const getClients = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                c.ClienteID as "ClienteID", c.CodigoCliente as "CodigoCliente", c.NombreCliente as "NombreCliente", 
                c.AtencionA as "AtencionA", c.Telefono as "Telefono", c.CorreoElectronico as "CorreoElectronico", 
                c.DireccionCalle as "DireccionCalle",
                d.Nombre as "Distrito", m.Nombre as "Municipio", dep.Nombre as "Departamento"
            FROM Clientes c
            LEFT JOIN Distritos d ON c.DistritoID = d.DistritoID
            LEFT JOIN Municipios m ON d.MunicipioID = m.MunicipioID
            LEFT JOIN Departamentos dep ON m.DepartamentoID = dep.DepartamentoID
        `);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 3. OBTENER POR ID
export const getClientById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT 
                c.ClienteID as "ClienteID", c.CodigoCliente as "codigo", c.NombreCliente as "nombre", 
                c.AtencionA as "atencionA", c.Telefono as "telefono", c.CorreoElectronico as "email", 
                c.DireccionCalle as "direccion", c.DistritoID as "distritoId",
                d.MunicipioID as "MunicipioID", m.DepartamentoID as "DepartamentoID"
            FROM Clientes c
            LEFT JOIN Distritos d ON c.DistritoID = d.DistritoID
            LEFT JOIN Municipios m ON d.MunicipioID = m.MunicipioID
            WHERE c.ClienteID = $1
        `, [id]);

        if (result.rows.length === 0) return res.status(404).json({ message: "Cliente no encontrado" });
        res.json(result.rows[0]);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 4. ACTUALIZAR
export const updateClient = async (req, res) => {
    const { id } = req.params;
    const { nombre, atencionA, telefono, email, direccion, distritoId } = req.body;

    if (!nombre) return res.status(400).json({ message: "El nombre es obligatorio" });

    try {
        await pool.query(`
            UPDATE Clientes SET
                NombreCliente = $1, AtencionA = $2, Telefono = $3,
                CorreoElectronico = $4, DireccionCalle = $5, DistritoID = $6
            WHERE ClienteID = $7
        `, [nombre, atencionA || null, telefono || null, email || null, direccion || null, distritoId || null, id]);

        res.json({ message: "Cliente actualizado correctamente" });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 5. ELIMINAR
export const deleteClient = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM Clientes WHERE ClienteID = $1", [id]);
        res.json({ message: "Cliente eliminado correctamente" });
    } catch (error) {
        if (error.code === '23503') return res.status(400).json({ message: "No se puede eliminar: tiene cotizaciones asociadas" });
        res.status(500).json({ message: error.message });
    }
};