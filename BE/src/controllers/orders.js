import { pool } from '../../db.js';

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
    return isNaN(date.getTime()) ? null : date; // Postgres acepta objetos Date de JS
};

// 1. Obtener listado de Órdenes (Vista General)
export const getOrders = async (req, res) => {
    try {
        let query = `
            SELECT 
                o.OrdenID as "OrdenID",
                o.NumeroOrden as "NumeroOrden",
                o.CotizacionID as "CotizacionID",
                o.FechaEntrega as "FechaEntrega",
                o.FechaCreacion as "FechaCreacion",
                o.TotalPagado as "TotalPagado",
                o.PagoPendiente as "PagoPendiente",
                o.MontoVenta as "MontoVenta",
                COALESCE(o.UbicacionEntrega, '') as "UbicacionEntrega",
                c.NumeroCotizacion as "NumeroCotizacion",
                c.FechaRealizacion as "FechaRealizacion",
                c.VendedorID as "VendedorID",
                cli.NombreCliente as "NombreCliente",
                COALESCE(cli.DireccionCalle, '') as "DireccionCalle",
                COALESCE(e.Nombre, '') as "NombreEmpresa",
                COALESCE(eo.Nombre, 'Sin Estado') as "EstadoNombre",
                COALESCE(eo.ColorHex, '#ffffff') as "ColorHex",
                COALESCE(u.Username, 'N/A') as "ElaboradoPor",
                COALESCE(v.Username, 'N/A') as "EjecutivoVenta",
                o.MetodoAnticipoID as "MetodoAnticipoID",
                o.MetodoComplementoID as "MetodoComplementoID",
                COALESCE(mp1.Nombre, '') as "MetodoAnticipoNombre",
                COALESCE(mp2.Nombre, '') as "MetodoComplementoNombre"
            FROM Ordenes o
            INNER JOIN Cotizaciones c ON o.CotizacionID = c.CotizacionID
            INNER JOIN Clientes cli ON c.ClienteID = cli.ClienteID
            LEFT JOIN Empresas e ON c.EmpresaID = e.EmpresaID
            LEFT JOIN EstadosOrden eo ON o.EstadoOrdenID = eo.EstadoOrdenID
            LEFT JOIN Usuarios u ON o.UsuarioID = u.UsuarioID
            LEFT JOIN Usuarios v ON c.VendedorID = v.UsuarioID
            LEFT JOIN MetodosPago mp1 ON o.MetodoAnticipoID = mp1.MetodoID
            LEFT JOIN MetodosPago mp2 ON o.MetodoComplementoID = mp2.MetodoID
        `;

        const params = [];
        // --- LÓGICA DE SEGURIDAD ---
        if (req.user.rolId !== 1) {
            query += " WHERE o.UsuarioID = $1";
            params.push(req.user.id);
        }

        query += " ORDER BY o.FechaCreacion DESC";

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error en getOrders:', error);
        res.status(500).json({ message: error.message });
    }
};

// 2. OBTENER DETALLE DE LA ORDEN (Para vista de detalle)
export const getOrderById = async (req, res) => {
    const { id } = req.params;
    
    const cotizacionId = toInt(id);
    if (!cotizacionId) {
        return res.status(400).json({ message: "ID de cotización inválido" });
    }
    
    try {
        // A. Encabezado + Cliente + Empresa
        const header = await pool.query(`
            SELECT 
                c.CotizacionID as "CotizacionID", c.NumeroCotizacion as "NumeroCotizacion", c.FechaRealizacion as "FechaRealizacion", c.EmpresaID as "EmpresaID",
                cli.NombreCliente as "NombreCliente", cli.DireccionCalle as "DireccionCalle", cli.Telefono as "TelefonoCliente",
                cli.AtencionA as "AtencionA",
                m.Nombre as "Municipio", dep.Nombre as "Departamento",
                
                e.Nombre as "EmpresaNombre", 
                e.Direccion as "EmpresaDireccion", 
                e.NRC as "NRC",
                e.NIT as "NIT",
                e.Telefono as "EmpresaTelefono",
                e.CorreoElectronico as "EmpresaEmail",
                e.PaginaWeb as "EmpresaWeb"
            FROM Cotizaciones c
            INNER JOIN Clientes cli ON c.ClienteID = cli.ClienteID
            LEFT JOIN Distritos d ON cli.DistritoID = d.DistritoID
            LEFT JOIN Municipios m ON d.MunicipioID = m.MunicipioID
            LEFT JOIN Departamentos dep ON m.DepartamentoID = dep.DepartamentoID
            LEFT JOIN Empresas e ON c.EmpresaID = e.EmpresaID
            WHERE c.CotizacionID = $1 AND c.Estado = 'Aceptada'
        `, [cotizacionId]);

        // B. Detalles (Productos)
        const details = await pool.query(`
            SELECT 
                d.Cantidad as "Cantidad", 
                p.Nombre as "NombreProducto", 
                p.CodigoProducto as "CodigoProducto",
                p.Descripcion as "Descripcion",
                -- Nota: Ajusta la URL base si es necesario para producción
                CASE WHEN p.Imagen IS NOT NULL THEN 'https://tu-url-backend.up.railway.app/api/products/image/' || CAST(p.ProductoID AS TEXT) ELSE NULL END as "ImagenURL",
                p.ProductoID as "ProductoID"
            FROM DetalleCotizaciones d
            INNER JOIN Productos p ON d.ProductoID = p.ProductoID
            WHERE d.CotizacionID = $1
        `, [cotizacionId]);

        if (header.rows.length === 0) {
            return res.status(404).json({ message: "Orden no encontrada o no está Aceptada" });
        }

        const data = header.rows[0];
        data.items = details.rows;

        res.json(data);

    } catch (error) {
        console.error("Error en getOrderById:", error);
        res.status(500).json({ message: error.message });
    }
};

// 3. Opciones para formularios (Combos)
export const getOrderOptions = async (req, res) => {
    try {
        const metodos = await pool.query('SELECT MetodoID as "MetodoID", Nombre as "Nombre" FROM MetodosPago ORDER BY Nombre');
        const estadosFactura = await pool.query('SELECT EstadoFacturaID as "EstadoFacturaID", Nombre as "Nombre" FROM EstadosFactura ORDER BY EstadoFacturaID');
        const estadosOrden = await pool.query('SELECT EstadoOrdenID as "EstadoOrdenID", Nombre as "Nombre", ColorHex as "ColorHex" FROM EstadosOrden ORDER BY EstadoOrdenID');

        res.json({
            paymentMethods: metodos.rows || [],
            invoiceStatuses: estadosFactura.rows || [],
            orderStatuses: estadosOrden.rows || []
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. CREAR ORDEN
export const createOrder = async (req, res) => {
    const body = req.body;
    const usuarioId = req.user.id;

    // Archivos
    const docAnticipo = req.files?.['docAnticipo']?.[0]?.path || null;
    const docComplemento = req.files?.['docComplemento']?.[0]?.path || null;

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

    const totalPagado = datos.pagoAnticipo + datos.pagoComplemento;
    const pagoPendiente = datos.montoVenta - totalPagado;

    try {
        // Obtener el NumeroCotizacion
        const cotRes = await pool.query('SELECT NumeroCotizacion as "NumeroCotizacion" FROM Cotizaciones WHERE CotizacionID = $1', [datos.cotizacionId]);
        
        if(cotRes.rows.length === 0) throw new Error("Cotización no encontrada");
        
        const numeroOrden = `OP-${cotRes.rows[0].NumeroCotizacion}`;

        await pool.query(`
            INSERT INTO Ordenes (
                NumeroOrden, CotizacionID, UsuarioID, FechaEntrega, UbicacionEntrega,
                MontoVenta, PagoAnticipo, MetodoAnticipoID, DocAnticipoPDF,
                PagoComplemento, MetodoComplementoID, DocComplementoPDF,
                TotalPagado, PagoPendiente, EstadoFacturaID, EstadoOrdenID, Observaciones
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
            )
        `, [
            numeroOrden, datos.cotizacionId, datos.usuarioId, datos.fechaEntrega, datos.ubicacionEntrega,
            datos.montoVenta, datos.pagoAnticipo, datos.metodoAnticipoId, docAnticipo,
            datos.pagoComplemento, datos.metodoComplementoId, docComplemento,
            totalPagado, pagoPendiente, datos.estadoFacturaId, datos.estadoOrdenId, datos.observaciones
        ]);

        res.json({ message: 'Orden de Pedido creada exitosamente' });

    } catch (error) {
        console.error("Error SQL:", error); 
        res.status(500).json({ message: 'Error al guardar la orden: ' + error.message });
    }
};

// 5. OBTENER LISTA SIMPLE DE ÓRDENES (Función extra que tenías en tu código)
export const getOrdersList = async (req, res) => {
    try {
        // Seleccionamos o.* explícitamente para mantener mayúsculas si es necesario, 
        // o confiamos en que el front maneje minúsculas. 
        // Para seguridad, expandimos los campos importantes.
        const result = await pool.query(`
            SELECT 
                o.OrdenID as "OrdenID", o.NumeroOrden as "NumeroOrden", o.CotizacionID as "CotizacionID",
                o.FechaEntrega as "FechaEntrega", o.FechaCreacion as "FechaCreacion",
                o.TotalPagado as "TotalPagado", o.PagoPendiente as "PagoPendiente", o.MontoVenta as "MontoVenta",
                o.UbicacionEntrega as "UbicacionEntrega", o.Observaciones as "Observaciones",
                o.UsuarioID as "UsuarioID",
                
                q.NumeroCotizacion as "NumeroCotizacion", 
                q.NombreCliente as "NombreCliente",
                q.FechaRealizacion as "FechaAprobacion", 
                q.NombreQuienCotiza as "EjecutivoVenta", 
                u.Username as "ElaboradoPor",            
                eo.Nombre as "EstadoNombre", 
                eo.ColorHex as "ColorHex"
            FROM Ordenes o
            JOIN Cotizaciones q ON o.CotizacionID = q.CotizacionID
            LEFT JOIN EstadosOrden eo ON o.EstadoOrdenID = eo.EstadoOrdenID
            LEFT JOIN Usuarios u ON o.UsuarioID = u.UsuarioID 
            ORDER BY o.FechaCreacion DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 6. OBTENER ORDEN COMPLETA POR ID (Para Edición)
export const getFullOrderById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT 
                o.OrdenID as "OrdenID", o.NumeroOrden as "NumeroOrden", o.CotizacionID as "CotizacionID",
                o.FechaEntrega as "FechaEntrega", o.UbicacionEntrega as "UbicacionEntrega",
                o.MontoVenta as "MontoVenta", o.PagoAnticipo as "PagoAnticipo", o.MetodoAnticipoID as "MetodoAnticipoID",
                o.DocAnticipoPDF as "DocAnticipoPDF", o.PagoComplemento as "PagoComplemento", o.MetodoComplementoID as "MetodoComplementoID",
                o.DocComplementoPDF as "DocComplementoPDF", o.TotalPagado as "TotalPagado", o.PagoPendiente as "PagoPendiente",
                o.EstadoFacturaID as "EstadoFacturaID", o.EstadoOrdenID as "EstadoOrdenID", o.Observaciones as "Observaciones",
                
                eo.Nombre as "EstadoNombre",
                eo.ColorHex as "ColorHex",
                ef.Nombre as "EstadoFacturaNombre",
                c.NombreQuienCotiza as "UsuarioModificacion",
                mp1.Nombre as "MetodoAnticipoNombre",
                mp2.Nombre as "MetodoComplementoNombre"
            FROM Ordenes o
            LEFT JOIN EstadosOrden eo ON o.EstadoOrdenID = eo.EstadoOrdenID
            LEFT JOIN EstadosFactura ef ON o.EstadoFacturaID = ef.EstadoFacturaID
            LEFT JOIN Cotizaciones c ON o.CotizacionID = c.CotizacionID
            LEFT JOIN MetodosPago mp1 ON o.MetodoAnticipoID = mp1.MetodoID
            LEFT JOIN MetodosPago mp2 ON o.MetodoComplementoID = mp2.MetodoID
            WHERE o.OrdenID = $1
        `, [parseInt(id)]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 7. ACTUALIZAR ORDEN
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

    let docAnticipoPDF = null;
    let docComplementoPDF = null;

    if (req.files) {
        if (req.files.docAnticipo && req.files.docAnticipo[0]) {
            docAnticipoPDF = req.files.docAnticipo[0].filename;
        }
        if (req.files.docComplemento && req.files.docComplemento[0]) {
            docComplementoPDF = req.files.docComplemento[0].filename;
        }
    }

    const totalPagado = datos.pagoAnticipo + datos.pagoComplemento;

    try {
        // Obtener MontoVenta
        const ordenRes = await pool.query('SELECT MontoVenta as "MontoVenta" FROM Ordenes WHERE OrdenID = $1', [parseInt(id)]);
        
        if (ordenRes.rows.length === 0) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }

        const montoVenta = ordenRes.rows[0].MontoVenta;
        const pagoPendiente = montoVenta - totalPagado;

        // Construcción dinámica del UPDATE
        let updateQuery = `
            UPDATE Ordenes SET
                FechaEntrega = $1,
                UbicacionEntrega = $2,
                PagoAnticipo = $3,
                MetodoAnticipoID = $4,
                PagoComplemento = $5,
                MetodoComplementoID = $6,
                TotalPagado = $7,
                PagoPendiente = $8,
                EstadoFacturaID = $9,
                EstadoOrdenID = $10,
                Observaciones = $11
        `;
        
        const values = [
            datos.fechaEntrega, datos.ubicacionEntrega, datos.pagoAnticipo, datos.metodoAnticipoId,
            datos.pagoComplemento, datos.metodoComplementoId, totalPagado, pagoPendiente,
            datos.estadoFacturaId, datos.estadoOrdenId, datos.observaciones
        ];

        let paramIndex = 12; // Siguiente índice para parámetros ($12)

        if (docAnticipoPDF) {
            updateQuery += `, DocAnticipoPDF = $${paramIndex}`;
            values.push(docAnticipoPDF);
            paramIndex++;
        }
        if (docComplementoPDF) {
            updateQuery += `, DocComplementoPDF = $${paramIndex}`;
            values.push(docComplementoPDF);
            paramIndex++;
        }

        updateQuery += ` WHERE OrdenID = $${paramIndex}`;
        values.push(parseInt(id));

        await pool.query(updateQuery, values);

        res.json({ message: 'Orden actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};