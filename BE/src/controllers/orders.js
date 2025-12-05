import { getConnection, sql } from '../../db.js';

// 1. Obtener listado de Órdenes (Solo Cotizaciones Aceptadas)
export const getOrders = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                c.CotizacionID, c.NumeroCotizacion, c.FechaRealizacion, 
                c.Estado,
                cli.NombreCliente,
                e.Nombre as NombreEmpresa
            FROM Cotizaciones c
            INNER JOIN Clientes cli ON c.ClienteID = cli.ClienteID
            LEFT JOIN Empresas e ON c.EmpresaID = e.EmpresaID
            WHERE c.Estado = 'Aceptada'
            ORDER BY c.FechaRealizacion DESC
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. OBTENER DETALLE DE LA ORDEN
export const getOrderById = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        
        // A. Encabezado + Cliente + Empresa (¡Con nombres correctos!)
        const header = await pool.request()
            .input("id", sql.Int, id)
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
            .input("id", sql.Int, id)
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