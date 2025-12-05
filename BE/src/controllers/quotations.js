import { getConnection, sql } from '../../db.js';

// ---------------------------------------------------
// 1. CREAR COTIZACIÓN (Transacción + Multi-Empresa)
// ---------------------------------------------------
export const createQuote = async (req, res) => {
    const { 
        clienteId, 
        empresaId, // <--- Nuevo: ID de la empresa (1 o 2)
        nombreQuienCotiza, 
        telefonoSnapshot, 
        atencionASnapshot, 
        direccionSnapshot, 
        items // Array: [{ productoId, cantidad, precio }, ...]
    } = req.body;

    if (!clienteId || !items || items.length === 0) {
        return res.status(400).json({ message: "Faltan datos del cliente o productos" });
    }

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        // Iniciamos transacción
        await transaction.begin();

        // A. Generar Número Correlativo Seguro
        // Buscamos el ID máximo actual y le sumamos 1
        const idResult = await transaction.request()
            .query("SELECT ISNULL(MAX(CotizacionID), 0) + 1 as NextID FROM Cotizaciones");
        
        const nextId = idResult.recordset[0].NextID;
        
        // Generar las iniciales del usuario (Ej: Juan Perez -> JU, si no hay nombre usa XX)
        const initials = nombreQuienCotiza ? nombreQuienCotiza.substring(0, 2).toUpperCase() : 'XX';
        
        // Formato final: JU-000001 (Rellena con ceros hasta 6 dígitos)
        const numeroCotizacion = `${initials}-${nextId.toString().padStart(6, '0')}`; 

        // B. Calcular Total General
        const totalGeneral = items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);

        // C. Insertar Encabezado (Incluyendo EmpresaID)
        const requestHeader = new sql.Request(transaction);
        const resultHeader = await requestHeader
            .input("numero", sql.NVarChar, numeroCotizacion)
            .input("clienteId", sql.Int, clienteId)
            .input("empresaId", sql.Int, empresaId || 1) // Si no viene, asume empresa 1
            .input("nombreQuien", sql.NVarChar, nombreQuienCotiza)
            .input("tel", sql.NVarChar, telefonoSnapshot)
            .input("atencion", sql.NVarChar, atencionASnapshot)
            .input("dir", sql.NVarChar, direccionSnapshot)
            .input("total", sql.Decimal(18, 2), totalGeneral)
            .query(`
                INSERT INTO Cotizaciones (
                    NumeroCotizacion, ClienteID, EmpresaID, NombreQuienCotiza, 
                    TelefonoSnapshot, AtencionASnapshot, DireccionSnapshot, 
                    TotalCotizacion, Estado
                )
                OUTPUT INSERTED.CotizacionID
                VALUES (
                    @numero, @clienteId, @empresaId, @nombreQuien, 
                    @tel, @atencion, @dir, 
                    @total, 'Pendiente'
                )
            `);

        const cotizacionId = resultHeader.recordset[0].CotizacionID;

        // D. Insertar Detalles (Productos)
        for (const item of items) {
            const requestDetail = new sql.Request(transaction);
            await requestDetail
                .input("cotId", sql.Int, cotizacionId)
                .input("prodId", sql.Int, item.productoId)
                .input("cant", sql.Int, item.cantidad)
                .input("precio", sql.Decimal(18, 2), item.precio)
                .query(`
                    INSERT INTO DetalleCotizaciones (CotizacionID, ProductoID, Cantidad, PrecioUnitario)
                    VALUES (@cotId, @prodId, @cant, @precio)
                `);
        }

        // Confirmar todo
        await transaction.commit();

        res.status(201).json({ message: "Cotización creada exitosamente", numero: numeroCotizacion });

    } catch (error) {
        if (transaction._aborted === false) { 
             await transaction.rollback();
        }
        console.error(error);
        res.status(500).json({ message: "Error al crear cotización", error: error.message });
    }
};

// ---------------------------------------------------
// 2. LISTAR COTIZACIONES
// ---------------------------------------------------
export const getQuotes = async (req, res) => {
    try {
        const pool = await getConnection();
        // Traemos también el nombre de la empresa para ver en la lista si es necesario
        const result = await pool.request().query(`
            SELECT 
                c.CotizacionID, c.NumeroCotizacion, c.FechaRealizacion, 
                c.TotalCotizacion, c.Estado,
                cli.NombreCliente,
                e.Nombre as NombreEmpresa
            FROM Cotizaciones c
            INNER JOIN Clientes cli ON c.ClienteID = cli.ClienteID
            LEFT JOIN Empresas e ON c.EmpresaID = e.EmpresaID
            ORDER BY c.FechaRealizacion DESC
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------------
// 3. OBTENER DETALLE (Para PDF y Modal)
// ---------------------------------------------------
export const getQuoteById = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        
        // Consulta Encabezado + Datos Cliente + Datos Empresa
        const header = await pool.request()
            .input("id", sql.Int, id)
            .query(`
                SELECT 
                    c.*, 
                    cli.NombreCliente, cli.CorreoElectronico, 
                    m.Nombre as Municipio, dep.Nombre as Departamento,
                    e.Nombre as EmpresaNombre, e.Direccion as EmpresaDireccion
                FROM Cotizaciones c
                INNER JOIN Clientes cli ON c.ClienteID = cli.ClienteID
                LEFT JOIN Distritos d ON cli.DistritoID = d.DistritoID
                LEFT JOIN Municipios m ON d.MunicipioID = m.MunicipioID
                LEFT JOIN Departamentos dep ON m.DepartamentoID = dep.DepartamentoID
                LEFT JOIN Empresas e ON c.EmpresaID = e.EmpresaID
                WHERE c.CotizacionID = @id
            `);

        // Consulta Detalles (Productos)
        const details = await pool.request()
            .input("id", sql.Int, id)
            .query(`
                SELECT 
                    d.*, 
                    p.Nombre as NombreProducto, 
                    p.CodigoProducto,
                    p.Descripcion
                FROM DetalleCotizaciones d
                INNER JOIN Productos p ON d.ProductoID = p.ProductoID
                WHERE d.CotizacionID = @id
            `);

        if (header.recordset.length === 0) return res.status(404).json({ message: "Cotización no encontrada" });

        const data = header.recordset[0];
        data.items = details.recordset;

        res.json(data);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------------
// 4. CAMBIAR ESTADO (Aceptar/Rechazar)
// ---------------------------------------------------
export const updateQuoteStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Aceptada' o 'Rechazada'

    try {
        const pool = await getConnection();
        await pool.request()
            .input("id", sql.Int, id)
            .input("status", sql.NVarChar, status)
            .query("UPDATE Cotizaciones SET Estado = @status WHERE CotizacionID = @id");

        res.json({ message: `Estado actualizado a ${status}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------------
// 5. OBTENER SIGUIENTE NÚMERO (Para Vista Previa)
// ---------------------------------------------------
export const getNextQuoteNumber = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT ISNULL(MAX(CotizacionID), 0) + 1 as NextID FROM Cotizaciones");
        const nextId = result.recordset[0].NextID;
        res.json({ nextId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ... (Tus otras funciones)

// 6. ACTUALIZAR COTIZACIÓN COMPLETA (PUT)
export const updateQuote = async (req, res) => {
    const { id } = req.params;
    const { 
        clienteId, 
        empresaId, 
        nombreQuienCotiza, 
        telefonoSnapshot, 
        atencionASnapshot, 
        direccionSnapshot, 
        items 
    } = req.body;

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Calcular Nuevo Total
        const totalGeneral = items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);

        // 2. Actualizar Encabezado
        await transaction.request()
            .input("id", sql.Int, id)
            .input("clienteId", sql.Int, clienteId)
            .input("empresaId", sql.Int, empresaId)
            .input("nombreQuien", sql.NVarChar, nombreQuienCotiza)
            .input("tel", sql.NVarChar, telefonoSnapshot)
            .input("atencion", sql.NVarChar, atencionASnapshot)
            .input("dir", sql.NVarChar, direccionSnapshot)
            .input("total", sql.Decimal(18, 2), totalGeneral)
            .query(`
                UPDATE Cotizaciones SET
                    ClienteID = @clienteId,
                    EmpresaID = @empresaId,
                    NombreQuienCotiza = @nombreQuien,
                    TelefonoSnapshot = @tel,
                    AtencionASnapshot = @atencion,
                    DireccionSnapshot = @dir,
                    TotalCotizacion = @total
                WHERE CotizacionID = @id
            `);

        // 3. Borrar Detalles Antiguos (Para reescribirlos)
        await transaction.request()
            .input("id", sql.Int, id)
            .query("DELETE FROM DetalleCotizaciones WHERE CotizacionID = @id");

        // 4. Insertar Detalles Nuevos
        for (const item of items) {
            await transaction.request()
                .input("cotId", sql.Int, id)
                .input("prodId", sql.Int, item.productoId)
                .input("cant", sql.Int, item.cantidad)
                .input("precio", sql.Decimal(18, 2), item.precio)
                .query(`
                    INSERT INTO DetalleCotizaciones (CotizacionID, ProductoID, Cantidad, PrecioUnitario)
                    VALUES (@cotId, @prodId, @cant, @precio)
                `);
        }

        await transaction.commit();
        res.json({ message: "Cotización actualizada correctamente" });

    } catch (error) {
        if (transaction._aborted === false) await transaction.rollback();
        res.status(500).json({ message: error.message });
    }
};