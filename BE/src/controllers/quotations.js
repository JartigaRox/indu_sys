import { getConnection, sql } from '../../db.js';

// ---------------------------------------------------
// 1. CREAR COTIZACIÓN (POST)
// ---------------------------------------------------
export const createQuote = async (req, res) => {
    const { 
        clienteId, 
        empresaId, 
        nombreQuienCotiza, 
        telefonoSnapshot, 
        atencionASnapshot, 
        direccionSnapshot, 
        items, // Array de productos
        fechaEntrega, // <--- NUEVO: Fecha estimada
        vendedorId // <--- NUEVO: ID del vendedor seleccionado
    } = req.body;

    if (!clienteId || !items || items.length === 0) {
        return res.status(400).json({ message: "Faltan datos del cliente o productos" });
    }

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // A. Generar Número Correlativo
        const idResult = await transaction.request().query("SELECT ISNULL(MAX(CotizacionID), 0) + 1 as NextID FROM Cotizaciones");
        const nextId = idResult.recordset[0].NextID;
        
        const initials = nombreQuienCotiza ? nombreQuienCotiza.substring(0, 2).toUpperCase() : 'XX';
        const numeroCotizacion = `${initials}-${nextId.toString().padStart(6, '0')}`; 

        // B. Calcular Total
        const totalGeneral = items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);

        // C. Insertar Encabezado
        const requestHeader = new sql.Request(transaction);
        const resultHeader = await requestHeader
            .input("numero", sql.NVarChar, numeroCotizacion)
            .input("clienteId", sql.Int, clienteId)
            .input("empresaId", sql.Int, empresaId || 1)
            .input("nombreQuien", sql.NVarChar, nombreQuienCotiza)
            .input("tel", sql.NVarChar, telefonoSnapshot)
            .input("atencion", sql.NVarChar, atencionASnapshot)
            .input("dir", sql.NVarChar, direccionSnapshot)
            .input("total", sql.Decimal(18, 2), totalGeneral)
            .input("fechaEntrega", sql.DateTime, fechaEntrega || null)
            .input("vendedorId", sql.Int, vendedorId || null) // <--- Guardamos vendedor
            .query(`
                INSERT INTO Cotizaciones (
                    NumeroCotizacion, ClienteID, EmpresaID, NombreQuienCotiza, 
                    TelefonoSnapshot, AtencionASnapshot, DireccionSnapshot, 
                    TotalCotizacion, Estado, FechaEntregaEstimada, VendedorID
                )
                OUTPUT INSERTED.CotizacionID
                VALUES (
                    @numero, @clienteId, @empresaId, @nombreQuien, 
                    @tel, @atencion, @dir, 
                    @total, 'Pendiente', @fechaEntrega, @vendedorId
                )
            `);

        const cotizacionId = resultHeader.recordset[0].CotizacionID;

        // D. Insertar Detalles
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

        await transaction.commit();
        res.status(201).json({ message: "Cotización creada exitosamente", numero: numeroCotizacion });

    } catch (error) {
        if (transaction._aborted === false) await transaction.rollback();
        console.error(error);
        res.status(500).json({ message: "Error al crear cotización", error: error.message });
    }
};

// ---------------------------------------------------
// 2. ACTUALIZAR COTIZACIÓN (PUT) - "Editar"
// ---------------------------------------------------
export const updateQuote = async (req, res) => {
    const { id } = req.params;
    const { 
        clienteId, 
        empresaId, 
        nombreQuienCotiza, 
        telefonoSnapshot, 
        atencionASnapshot, 
        direccionSnapshot, 
        items,
        fechaEntrega
    } = req.body;

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const totalGeneral = items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);

        // 1. Actualizar Encabezado
        await transaction.request()
            .input("id", sql.Int, parseInt(id))
            .input("clienteId", sql.Int, clienteId)
            .input("empresaId", sql.Int, empresaId)
            .input("nombreQuien", sql.NVarChar, nombreQuienCotiza)
            .input("tel", sql.NVarChar, telefonoSnapshot)
            .input("atencion", sql.NVarChar, atencionASnapshot)
            .input("dir", sql.NVarChar, direccionSnapshot)
            .input("total", sql.Decimal(18, 2), totalGeneral)
            .input("fechaEntrega", sql.DateTime, fechaEntrega || null)
            .query(`
                UPDATE Cotizaciones SET
                    ClienteID = @clienteId,
                    EmpresaID = @empresaId,
                    NombreQuienCotiza = @nombreQuien,
                    TelefonoSnapshot = @tel,
                    AtencionASnapshot = @atencion,
                    DireccionSnapshot = @dir,
                    TotalCotizacion = @total,
                    FechaEntregaEstimada = @fechaEntrega
                WHERE CotizacionID = @id
            `);

        // 2. Borrar productos viejos
        await transaction.request()
            .input("id", sql.Int, parseInt(id))
            .query("DELETE FROM DetalleCotizaciones WHERE CotizacionID = @id");

        // 3. Insertar productos nuevos
        for (const item of items) {
            await transaction.request()
                .input("cotId", sql.Int, parseInt(id))
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

// ---------------------------------------------------
// 3. LISTAR TODAS (GET)
// ---------------------------------------------------
export const getQuotes = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                c.CotizacionID, c.NumeroCotizacion, c.FechaRealizacion, 
                c.TotalCotizacion, c.Estado, c.FechaEntregaEstimada,
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
// 4. OBTENER DETALLE COMPLETO (GET /:id) - Para PDF y Edición
// ---------------------------------------------------
export const getQuoteById = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        
        // Consulta Maestra (Encabezado + Cliente + Ubicación + Empresa + Vendedor)
        const header = await pool.request()
            .input("id", sql.Int, parseInt(id))
            .query(`
                SELECT 
                    c.CotizacionID,
                    c.NumeroCotizacion,
                    c.FechaRealizacion,
                    c.ClienteID,
                    c.EmpresaID,
                    c.NombreQuienCotiza,
                    c.TelefonoSnapshot,
                    c.AtencionASnapshot,
                    c.DireccionSnapshot,
                    c.TotalCotizacion,
                    c.Estado,
                    c.FechaEntregaEstimada,
                    c.UsuarioDecision,
                    cli.NombreCliente, cli.CorreoElectronico, 
                    cli.Telefono, cli.AtencionA, cli.DireccionCalle,
                    d.Nombre as Distrito,
                    m.Nombre as Municipio, dep.Nombre as Departamento,
                    
                    -- DATOS EMPRESA (Para el PDF)
                    e.Nombre as EmpresaNombre, 
                    e.Direccion as EmpresaDireccion,
                    e.NRC,
                    e.NIT,
                    e.Telefono as TelefonoEmpresa,
                    e.Celular as CelularEmpresa,
                    e.CorreoElectronico as EmailEmpresa,
                    e.PaginaWeb as WebEmpresa,
                    
                    -- DATOS VENDEDOR (Para firma y sello)
                    c.VendedorID,
                    v.Username as VendedorUsername
                FROM Cotizaciones c
                INNER JOIN Clientes cli ON c.ClienteID = cli.ClienteID
                LEFT JOIN Distritos d ON cli.DistritoID = d.DistritoID
                LEFT JOIN Municipios m ON d.MunicipioID = m.MunicipioID
                LEFT JOIN Departamentos dep ON m.DepartamentoID = dep.DepartamentoID
                LEFT JOIN Empresas e ON c.EmpresaID = e.EmpresaID
                LEFT JOIN Usuarios v ON c.VendedorID = v.UsuarioID
                WHERE c.CotizacionID = @id
            `);

        // Consulta Detalles
        const details = await pool.request()
            .input("id", sql.Int, parseInt(id))
            .query(`
                SELECT 
                    d.*, 
                    p.ProductoID,
                    p.Nombre as NombreProducto, 
                    p.CodigoProducto,
                    p.Descripcion,
                    CASE WHEN p.Imagen IS NOT NULL THEN 'http://localhost:5000/api/products/image/' + CAST(p.ProductoID AS NVARCHAR) ELSE NULL END as ImagenURL
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
// 5. CAMBIAR ESTADO (PATCH) - Registra Usuario
// ---------------------------------------------------
export const updateQuoteStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; 
    
    // Validación de parámetros
    if (!id || !status) {
        return res.status(400).json({ message: 'ID y estado son requeridos' });
    }
    
    // Obtenemos el usuario del token (req.user viene del middleware verifyToken)
    const usuarioDecision = req.user ? req.user.username : 'Sistema';

    try {
        const pool = await getConnection();
        const cotizacionId = parseInt(id);
        
        if (isNaN(cotizacionId)) {
            return res.status(400).json({ message: 'ID de cotización inválido' });
        }
        
        // Si el estado es "Rechazada", eliminamos la orden asociada (si existe)
        if (status === 'Rechazada') {
            await pool.request()
                .input("cotizacionId", sql.Int, cotizacionId)
                .query("DELETE FROM Ordenes WHERE CotizacionID = @cotizacionId");
        }
        
        // Actualizamos el estado de la cotización
        await pool.request()
            .input("id", sql.Int, cotizacionId)
            .input("status", sql.NVarChar, status)
            .input("user", sql.NVarChar, usuarioDecision)
            .query("UPDATE Cotizaciones SET Estado = @status, UsuarioDecision = @user WHERE CotizacionID = @id");

        res.json({ message: `Estado actualizado a ${status}` });
    } catch (error) {
        console.error('Error en updateQuoteStatus:', error);
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------------
// 6. SIGUIENTE NUMERO (GET)
// ---------------------------------------------------
export const getNextQuoteNumber = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT ISNULL(MAX(CotizacionID), 0) + 1 as NextID FROM Cotizaciones");
        res.json({ nextId: result.recordset[0].NextID });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};