import { getConnection, sql } from '../../db.js';

// Helper functions para conversión de tipos
const toInt = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const parsed = parseInt(val);
    return isNaN(parsed) ? null : parsed;
};

const toDecimal = (val) => {
    if (val === null || val === undefined || val === '') return 0;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
};

const toStr = (val) => {
    return val === null || val === undefined ? '' : String(val);
};

const toDate = (val) => {
    if (!val) return null;
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
};

// 1. Obtener listado de Órdenes
export const getOrders = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                o.OrdenID,
                o.NumeroOrden,
                o.CotizacionID,
                o.FechaEntrega,
                o.FechaCreacion,
                o.TotalPagado,
                o.PagoPendiente,
                o.MontoVenta,
                c.NumeroCotizacion,
                c.FechaRealizacion,
                cli.NombreCliente,
                e.Nombre as NombreEmpresa,
                eo.Nombre as EstadoNombre,
                eo.ColorHex,
                u.Username as ElaboradoPor
            FROM Ordenes o
            INNER JOIN Cotizaciones c ON o.CotizacionID = c.CotizacionID
            INNER JOIN Clientes cli ON c.ClienteID = cli.ClienteID
            LEFT JOIN Empresas e ON c.EmpresaID = e.EmpresaID
            LEFT JOIN EstadosOrden eo ON o.EstadoOrdenID = eo.EstadoOrdenID
            LEFT JOIN Usuarios u ON o.UsuarioID = u.UsuarioID
            ORDER BY o.FechaCreacion DESC
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. OBTENER DETALLE DE LA ORDEN
export const getOrderById = async (req, res) => {
    const { id } = req.params;
    
    // Validar y convertir el ID
    const cotizacionId = toInt(id);
    if (!cotizacionId) {
        return res.status(400).json({ message: "ID de cotización inválido" });
    }
    
    try {
        const pool = await getConnection();
        
        // A. Encabezado + Cliente + Empresa (¡Con nombres correctos!)
        const header = await pool.request()
            .input("id", sql.Int, cotizacionId)
            .query(`
                SELECT 
                    c.CotizacionID, c.NumeroCotizacion, c.FechaRealizacion, c.EmpresaID,
                    cli.NombreCliente, cli.DireccionCalle, cli.Telefono as TelefonoCliente,
                    cli.AtencionA,
                    m.Nombre as Municipio, dep.Nombre as Departamento,
                    
                    -- Datos de Empresa
                    e.Nombre as EmpresaNombre, 
                    e.Direccion as EmpresaDireccion, 
                    e.NRC,  -- <--- IMPORTANTE: Asegúrate que en tu BD se llame 'NRC'
                    e.Telefono as EmpresaTelefono,
                    e.CorreoElectronico as EmpresaEmail,
                    e.PaginaWeb as EmpresaWeb
                FROM Cotizaciones c
                INNER JOIN Clientes cli ON c.ClienteID = cli.ClienteID
                LEFT JOIN Distritos d ON cli.DistritoID = d.DistritoID
                LEFT JOIN Municipios m ON d.MunicipioID = m.MunicipioID
                LEFT JOIN Departamentos dep ON m.DepartamentoID = dep.DepartamentoID
                LEFT JOIN Empresas e ON c.EmpresaID = e.EmpresaID
                WHERE c.CotizacionID = @id AND c.Estado = 'Aceptada'
            `);

        // B. Detalles (Productos)
        const details = await pool.request()
            .input("id", sql.Int, cotizacionId)
            .query(`
                SELECT 
                    d.Cantidad, 
                    p.Nombre as NombreProducto, 
                    p.CodigoProducto,
                    p.Descripcion,
                    p.ProductoID -- Necesario para la imagen
                FROM DetalleCotizaciones d
                INNER JOIN Productos p ON d.ProductoID = p.ProductoID
                WHERE d.CotizacionID = @id
            `);

        if (header.recordset.length === 0) {
            return res.status(404).json({ message: "Orden no encontrada o no está Aceptada" });
        }

        const data = header.recordset[0];
        data.items = details.recordset;

        res.json(data);

    } catch (error) {
        console.error("Error en getOrderById:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getOrderOptions = async (req, res) => {
    try {
        const pool = await getConnection();
        
        const metodos = await pool.request().query(`
            SELECT 
                MetodoID,
                Nombre
            FROM MetodosPago
            ORDER BY Nombre
        `);
        
        const estadosFactura = await pool.request().query(`
            SELECT 
                EstadoFacturaID,
                Nombre
            FROM EstadosFactura
            ORDER BY EstadoFacturaID
        `);
        
        const estadosOrden = await pool.request().query(`
            SELECT 
                EstadoOrdenID,
                Nombre,
                ColorHex
            FROM EstadosOrden
            ORDER BY EstadoOrdenID
        `);

        res.json({
            paymentMethods: metodos.recordset || [],
            invoiceStatuses: estadosFactura.recordset || [],
            orderStatuses: estadosOrden.recordset || []
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ... imports ...

export const createOrder = async (req, res) => {
    // Extraemos los datos del body (que vienen como texto desde FormData)
    const body = req.body;
    
    // Obtenemos el ID del usuario desde el token (inyectado por verifyToken)
    const usuarioId = req.user.id;

    // Manejo de archivos (si no se subió nada, asignamos null)
    const docAnticipo = req.files?.['docAnticipo']?.[0]?.path || null;
    const docComplemento = req.files?.['docComplemento']?.[0]?.path || null;

    // LIMPIEZA Y CONVERSIÓN DE DATOS
    // Usamos las funciones helper para garantizar que sean del tipo correcto
    const datos = {
        cotizacionId:       toInt(body.cotizacionId),
        usuarioId:          toInt(usuarioId),
        fechaEntrega:       toDate(body.fechaEntrega),
        ubicacionEntrega:   toStr(body.ubicacionEntrega),
        
        montoVenta:         toDecimal(body.montoVenta),
        pagoAnticipo:       toDecimal(body.pagoAnticipo),
        metodoAnticipoId:   toInt(body.metodoAnticipoId),
        
        pagoComplemento:    toDecimal(body.pagoComplemento),
        metodoComplementoId: toInt(body.metodoComplementoId),
        
        estadoFacturaId:    toInt(body.estadoFacturaId),
        estadoOrdenId:      toInt(body.estadoOrdenId),
        observaciones:      toStr(body.observaciones)
    };

    // Cálculos de servidor (más seguro)
    const totalPagado = datos.pagoAnticipo + datos.pagoComplemento;
    const pagoPendiente = datos.montoVenta - totalPagado;

    try {
        const pool = await getConnection();

        // Obtener el NumeroCotizacion para generar el NumeroOrden
        const cotizacion = await pool.request()
            .input('CotizacionID', sql.Int, datos.cotizacionId)
            .query('SELECT NumeroCotizacion FROM Cotizaciones WHERE CotizacionID = @CotizacionID');
        
        const numeroOrden = `OP-${cotizacion.recordset[0].NumeroCotizacion}`;

        await pool.request()
            .input('NumeroOrden', sql.NVarChar, numeroOrden)
            .input('CotizacionID', sql.Int, datos.cotizacionId)
            .input('UsuarioID', sql.Int, datos.usuarioId)
            .input('FechaEntrega', sql.DateTime, datos.fechaEntrega)
            .input('UbicacionEntrega', sql.NVarChar, datos.ubicacionEntrega)
            
            .input('MontoVenta', sql.Decimal(18,2), datos.montoVenta)
            .input('PagoAnticipo', sql.Decimal(18,2), datos.pagoAnticipo)
            .input('MetodoAnticipoID', sql.Int, datos.metodoAnticipoId)
            .input('DocAnticipoPDF', sql.NVarChar, docAnticipo)
            
            .input('PagoComplemento', sql.Decimal(18,2), datos.pagoComplemento)
            .input('MetodoComplementoID', sql.Int, datos.metodoComplementoId)
            .input('DocComplementoPDF', sql.NVarChar, docComplemento)
            
            .input('TotalPagado', sql.Decimal(18,2), totalPagado)
            .input('PagoPendiente', sql.Decimal(18,2), pagoPendiente)
            
            .input('EstadoFacturaID', sql.Int, datos.estadoFacturaId)
            .input('EstadoOrdenID', sql.Int, datos.estadoOrdenId)
            .input('Observaciones', sql.NVarChar, datos.observaciones)
            .query(`
                INSERT INTO Ordenes (
                    NumeroOrden, CotizacionID, UsuarioID, FechaEntrega, UbicacionEntrega,
                    MontoVenta, PagoAnticipo, MetodoAnticipoID, DocAnticipoPDF,
                    PagoComplemento, MetodoComplementoID, DocComplementoPDF,
                    TotalPagado, PagoPendiente, EstadoFacturaID, EstadoOrdenID, Observaciones
                ) VALUES (
                    @NumeroOrden, @CotizacionID, @UsuarioID, @FechaEntrega, @UbicacionEntrega,
                    @MontoVenta, @PagoAnticipo, @MetodoAnticipoID, @DocAnticipoPDF,
                    @PagoComplemento, @MetodoComplementoID, @DocComplementoPDF,
                    @TotalPagado, @PagoPendiente, @EstadoFacturaID, @EstadoOrdenID, @Observaciones
                )
            `);

        res.json({ message: 'Orden de Pedido creada exitosamente' });

    } catch (error) {
        console.error("Error SQL:", error); // Esto te mostrará el error exacto en la consola del servidor
        res.status(500).json({ message: 'Error al guardar la orden: ' + error.message });
    }
};

// BE/src/controllers/orders.js

export const getOrdersList = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                o.*, 
                q.NumeroCotizacion, 
                q.NombreCliente,
                q.FechaRealizacion as FechaAprobacion, -- Fecha de cotización aceptada
                q.NombreQuienCotiza as EjecutivoVenta, -- Quien hizo la cotización
                u.Username as ElaboradoPor,            -- Quien hizo la orden
                eo.Nombre as EstadoNombre, 
                eo.ColorHex
            FROM Ordenes o
            JOIN Cotizaciones q ON o.CotizacionID = q.CotizacionID
            LEFT JOIN EstadosOrden eo ON o.EstadoOrdenID = eo.EstadoOrdenID
            LEFT JOIN Usuarios u ON o.UsuarioID = u.UsuarioID -- Join para nombre de usuario
            ORDER BY o.FechaCreacion DESC
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener orden completa por ID (para edición)
export const getFullOrderById = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    o.*,
                    eo.Nombre as EstadoNombre,
                    eo.ColorHex
                FROM Ordenes o
                LEFT JOIN EstadosOrden eo ON o.EstadoOrdenID = eo.EstadoOrdenID
                WHERE o.OrdenID = @id
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }
        
        res.json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Actualizar orden
export const updateOrder = async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    const datos = {
        fechaEntrega: toDate(body.fechaEntrega),
        ubicacionEntrega: toStr(body.ubicacionEntrega),
        pagoAnticipo: toDecimal(body.pagoAnticipo),
        metodoAnticipoId: toInt(body.metodoAnticipoId),
        pagoComplemento: toDecimal(body.pagoComplemento),
        metodoComplementoId: toInt(body.metodoComplementoId),
        estadoFacturaId: toInt(body.estadoFacturaId),
        estadoOrdenId: toInt(body.estadoOrdenId),
        observaciones: toStr(body.observaciones)
    };

    const totalPagado = datos.pagoAnticipo + datos.pagoComplemento;

    try {
        const pool = await getConnection();
        
        // Obtener MontoVenta de la orden
        const orden = await pool.request()
            .input('OrdenID', sql.Int, id)
            .query('SELECT MontoVenta FROM Ordenes WHERE OrdenID = @OrdenID');
        
        if (orden.recordset.length === 0) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }

        const montoVenta = orden.recordset[0].MontoVenta;
        const pagoPendiente = montoVenta - totalPagado;

        await pool.request()
            .input('OrdenID', sql.Int, id)
            .input('FechaEntrega', sql.DateTime, datos.fechaEntrega)
            .input('UbicacionEntrega', sql.NVarChar, datos.ubicacionEntrega)
            .input('PagoAnticipo', sql.Decimal(18,2), datos.pagoAnticipo)
            .input('MetodoAnticipoID', sql.Int, datos.metodoAnticipoId)
            .input('PagoComplemento', sql.Decimal(18,2), datos.pagoComplemento)
            .input('MetodoComplementoID', sql.Int, datos.metodoComplementoId)
            .input('TotalPagado', sql.Decimal(18,2), totalPagado)
            .input('PagoPendiente', sql.Decimal(18,2), pagoPendiente)
            .input('EstadoFacturaID', sql.Int, datos.estadoFacturaId)
            .input('EstadoOrdenID', sql.Int, datos.estadoOrdenId)
            .input('Observaciones', sql.NVarChar, datos.observaciones)
            .query(`
                UPDATE Ordenes SET
                    FechaEntrega = @FechaEntrega,
                    UbicacionEntrega = @UbicacionEntrega,
                    PagoAnticipo = @PagoAnticipo,
                    MetodoAnticipoID = @MetodoAnticipoID,
                    PagoComplemento = @PagoComplemento,
                    MetodoComplementoID = @MetodoComplementoID,
                    TotalPagado = @TotalPagado,
                    PagoPendiente = @PagoPendiente,
                    EstadoFacturaID = @EstadoFacturaID,
                    EstadoOrdenID = @EstadoOrdenID,
                    Observaciones = @Observaciones
                WHERE OrdenID = @OrdenID
            `);

        res.json({ message: 'Orden actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};