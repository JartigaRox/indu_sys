import { getConnection, sql } from '../../db.js';

// ---------------------------------------------------
// 1. CREAR CLIENTE (Simplificado y Automático)
// ---------------------------------------------------
export const createClient = async (req, res) => {
    // Ya no esperamos 'codigo' del frontend
    const { 
        nombre, 
        atencionA, 
        telefono, 
        email, 
        direccion, 
        distritoId 
    } = req.body;

    // VALIDACIÓN MÍNIMA: Solo el nombre es obligatorio
    if (!nombre) {
        return res.status(400).json({ message: "El nombre del cliente es obligatorio" });
    }

    try {
        const pool = await getConnection();

        // A. GENERAR CÓDIGO AUTOMÁTICO (CL-0000X)
        // Buscamos el ID más alto actual y le sumamos 1
        const idResult = await pool.request().query("SELECT ISNULL(MAX(ClienteID), 0) + 1 as NextID FROM Clientes");
        const nextId = idResult.recordset[0].NextID;
        
        // Formato: CL-00001 (Rellena con ceros a la izquierda hasta 5 dígitos)
        const codigoAuto = `CL-${nextId.toString().padStart(5, '0')}`;

        // B. INSERTAR (Usando valores o NULL si vienen vacíos)
        await pool.request()
            .input("codigo", sql.NVarChar, codigoAuto)
            .input("nombre", sql.NVarChar, nombre)
            // El operador || null asegura que si viene string vacío "", se guarde como NULL
            .input("atencionA", sql.NVarChar, atencionA || null)
            .input("telefono", sql.NVarChar, telefono || null)
            .input("email", sql.NVarChar, email || null)
            .input("direccion", sql.NVarChar, direccion || null)
            .input("distritoId", sql.Int, distritoId || null) 
            .query(`
                INSERT INTO Clientes (
                    CodigoCliente, NombreCliente, AtencionA, 
                    Telefono, CorreoElectronico, DireccionCalle, DistritoID
                )
                VALUES (
                    @codigo, @nombre, @atencionA, 
                    @telefono, @email, @direccion, @distritoId
                )
            `);

        res.status(201).json({ message: "Cliente registrado correctamente", codigo: codigoAuto });

    } catch (error) {
        // Manejo de error por duplicados (ej: si el nombre o código ya existiera y fuera unique)
        if (error.number === 2627) { 
            return res.status(400).json({ message: "Error: El cliente ya existe." });
        }
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------------
// 2. OBTENER LISTA DE CLIENTES
// ---------------------------------------------------
export const getClients = async (req, res) => {
    try {
        const pool = await getConnection();
        // Usamos LEFT JOIN para que traiga al cliente AUNQUE no tenga ubicación asignada
        const result = await pool.request().query(`
            SELECT 
                c.ClienteID, c.CodigoCliente, c.NombreCliente, c.AtencionA, 
                c.Telefono, c.CorreoElectronico, c.DireccionCalle,
                d.Nombre as Distrito, m.Nombre as Municipio, dep.Nombre as Departamento
            FROM Clientes c
            LEFT JOIN Distritos d ON c.DistritoID = d.DistritoID
            LEFT JOIN Municipios m ON d.MunicipioID = m.MunicipioID
            LEFT JOIN Departamentos dep ON m.DepartamentoID = dep.DepartamentoID
        `);
        
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------------
// 3. OBTENER UN CLIENTE POR ID (Para Editar)
// ---------------------------------------------------
export const getClientById = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        // Traemos también los IDs de Municipio y Departamento para pre-llenar los combos
        const result = await pool.request()
            .input("id", sql.Int, id)
            .query(`
                SELECT 
                    c.ClienteID, c.CodigoCliente as codigo, c.NombreCliente as nombre, 
                    c.AtencionA as atencionA, c.Telefono as telefono, c.CorreoElectronico as email, 
                    c.DireccionCalle as direccion, c.DistritoID as distritoId,
                    d.MunicipioID, m.DepartamentoID
                FROM Clientes c
                LEFT JOIN Distritos d ON c.DistritoID = d.DistritoID
                LEFT JOIN Municipios m ON d.MunicipioID = m.MunicipioID
                WHERE c.ClienteID = @id
            `);

        if (result.recordset.length === 0) return res.status(404).json({ message: "Cliente no encontrado" });
        
        res.json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------------
// 4. ACTUALIZAR CLIENTE
// ---------------------------------------------------
export const updateClient = async (req, res) => {
    const { id } = req.params;
    const { nombre, atencionA, telefono, email, direccion, distritoId } = req.body;

    if (!nombre) {
        return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    try {
        const pool = await getConnection();
        await pool.request()
            .input("id", sql.Int, id)
            .input("nombre", sql.NVarChar, nombre)
            .input("atencionA", sql.NVarChar, atencionA || null)
            .input("telefono", sql.NVarChar, telefono || null)
            .input("email", sql.NVarChar, email || null)
            .input("direccion", sql.NVarChar, direccion || null)
            .input("distritoId", sql.Int, distritoId || null)
            .query(`
                UPDATE Clientes SET
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