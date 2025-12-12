import { getConnection, sql } from '../../db.js';

// ---------------------------------------------------
// 1. CREAR COTIZACIÓN
// ---------------------------------------------------
export const createQuote = async (req, res) => {
    const { clienteId, empresaId, nombreQuienCotiza, telefonoSnapshot, atencionASnapshot, direccionSnapshot, items, vendedorId } = req.body;

    if (!clienteId || !items || items.length === 0) {
        return res.status(400).json({ message: "Faltan datos del cliente o productos." });
    }

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Generar ID único (Usamos una lógica más segura para evitar duplicados)
        const idResult = await transaction.request().query("SELECT ISNULL(MAX(CotizacionID), 0) + 1 as NextID FROM Cotizaciones");
        const nextId = idResult.recordset[0].NextID;
        const initials = nombreQuienCotiza ? nombreQuienCotiza.substring(0, 2).toUpperCase() : 'XX';
        const numeroCotizacion = `${initials}-${nextId.toString().padStart(6, '0')}`; 

        // 2. Calcular Total
        const total = items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);

        // 3. Insertar Encabezado
        // Nota: Si 'NumeroCotizacion' es UNIQUE y ya existe, aquí fallará.
        const headerRes = await new sql.Request(transaction)
            .input("num", sql.NVarChar, numeroCotizacion)
            .input("cid", sql.Int, clienteId)
            .input("eid", sql.Int, empresaId || 1)
            .input("nom", sql.NVarChar, nombreQuienCotiza)
            .input("tel", sql.NVarChar, telefonoSnapshot)
            .input("ate", sql.NVarChar, atencionASnapshot)
            .input("dir", sql.NVarChar, direccionSnapshot)
            .input("tot", sql.Decimal(18, 2), total)
            .input("vid", sql.Int, vendedorId || null)
            .query(`
                INSERT INTO Cotizaciones (NumeroCotizacion, ClienteID, EmpresaID, NombreQuienCotiza, TelefonoSnapshot, AtencionASnapshot, DireccionSnapshot, TotalCotizacion, Estado, VendedorID) 
                OUTPUT INSERTED.CotizacionID 
                VALUES (@num, @cid, @eid, @nom, @tel, @ate, @dir, @tot, 'Pendiente', @vid)
            `);

        const cotId = headerRes.recordset[0].CotizacionID;

        // 4. Insertar Detalles
        for (const item of items) {
            // Limpieza de descripción para evitar errores
            const descFinal = item.descripcion ? String(item.descripcion) : "";
            
            await new sql.Request(transaction)
                .input("cotId", sql.Int, cotId)
                .input("prodId", sql.Int, item.productoId)
                .input("cant", sql.Int, item.cantidad)
                .input("precio", sql.Decimal(18, 2), item.precio)
                .input("desc", sql.NVarChar(sql.MAX), descFinal) // IMPORTANTE: sql.MAX
                .query(`
                    INSERT INTO DetalleCotizaciones (CotizacionID, ProductoID, Cantidad, PrecioUnitario, Descripcion) 
                    VALUES (@cotId, @prodId, @cant, @precio, @desc)
                `);
        }

        await transaction.commit();
        res.status(201).json({ message: "Cotización creada exitosamente", numero: numeroCotizacion });

    } catch (error) {
        if (transaction._aborted === false) await transaction.rollback();
        // ESTO ES CLAVE: Mira tu consola del servidor si falla
        console.error("❌ ERROR CREANDO COTIZACIÓN:", error); 
        res.status(500).json({ message: "Error interno al guardar.", error: error.message });
    }
};

// ---------------------------------------------------
// 2. ACTUALIZAR COTIZACIÓN
// ---------------------------------------------------
export const updateQuote = async (req, res) => {
    const { id } = req.params;
    const { clienteId, empresaId, nombreQuienCotiza, telefonoSnapshot, atencionASnapshot, direccionSnapshot, items } = req.body;

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        const total = items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);

        await transaction.request()
            .input("id", sql.Int, parseInt(id))
            .input("cid", sql.Int, clienteId).input("eid", sql.Int, empresaId)
            .input("nom", sql.NVarChar, nombreQuienCotiza).input("tel", sql.NVarChar, telefonoSnapshot)
            .input("ate", sql.NVarChar, atencionASnapshot).input("dir", sql.NVarChar, direccionSnapshot)
            .input("tot", sql.Decimal(18, 2), total)
            .query(`UPDATE Cotizaciones SET ClienteID=@cid, EmpresaID=@eid, NombreQuienCotiza=@nom, TelefonoSnapshot=@tel, AtencionASnapshot=@ate, DireccionSnapshot=@dir, TotalCotizacion=@tot WHERE CotizacionID=@id`);

        await transaction.request().input("id", sql.Int, parseInt(id)).query("DELETE FROM DetalleCotizaciones WHERE CotizacionID = @id");

        for (const item of items) {
            const descFinal = item.descripcion ? String(item.descripcion) : "";
            await new sql.Request(transaction)
                .input("cotId", sql.Int, parseInt(id))
                .input("prodId", sql.Int, item.productoId)
                .input("cant", sql.Int, item.cantidad)
                .input("precio", sql.Decimal(18, 2), item.precio)
                .input("desc", sql.NVarChar(sql.MAX), descFinal)
                .query(`INSERT INTO DetalleCotizaciones (CotizacionID, ProductoID, Cantidad, PrecioUnitario, Descripcion) VALUES (@cotId, @prodId, @cant, @precio, @desc)`);
        }

        await transaction.commit();
        res.json({ message: "Actualizado correctamente" });
    } catch (error) {
        if (transaction._aborted === false) await transaction.rollback();
        console.error("❌ ERROR ACTUALIZANDO:", error);
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------------
// 3. OBTENER POR ID (GET)
// ---------------------------------------------------
export const getQuoteById = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        // Encabezado
        const header = await pool.request().input("id", sql.Int, parseInt(id))
            .query(`SELECT c.*, cli.NombreCliente, cli.CorreoElectronico, cli.Telefono, cli.AtencionA, cli.DireccionCalle, d.Nombre as Distrito, m.Nombre as Municipio, dep.Nombre as Departamento, e.Nombre as EmpresaNombre, e.Direccion as EmpresaDireccion, e.NRC, e.NIT, e.Telefono as TelefonoEmpresa, e.Celular as CelularEmpresa, e.CorreoElectronico as EmailEmpresa, e.PaginaWeb as WebEmpresa, c.VendedorID, v.Username as VendedorUsername FROM Cotizaciones c INNER JOIN Clientes cli ON c.ClienteID = cli.ClienteID LEFT JOIN Distritos d ON cli.DistritoID = d.DistritoID LEFT JOIN Municipios m ON d.MunicipioID = m.MunicipioID LEFT JOIN Departamentos dep ON m.DepartamentoID = dep.DepartamentoID LEFT JOIN Empresas e ON c.EmpresaID = e.EmpresaID LEFT JOIN Usuarios v ON c.VendedorID = v.UsuarioID WHERE c.CotizacionID = @id`);

        // Detalles: COALESCE asegura que si el detalle tiene descripción, la use. Si no, usa la del producto.
        const details = await pool.request().input("id", sql.Int, parseInt(id))
            .query(`
                SELECT 
                    d.DetalleID, d.CotizacionID, d.ProductoID, d.Cantidad, d.PrecioUnitario,
                    p.Nombre as NombreProducto, p.CodigoProducto,
                    COALESCE(d.Descripcion, p.Descripcion) as Descripcion,
                    CASE WHEN p.Imagen IS NOT NULL THEN 'http://localhost:5000/api/products/image/' + CAST(p.ProductoID AS NVARCHAR) ELSE NULL END as ImagenURL
                FROM DetalleCotizaciones d
                INNER JOIN Productos p ON d.ProductoID = p.ProductoID
                WHERE d.CotizacionID = @id
            `);

        if (header.recordset.length === 0) return res.status(404).json({ message: "No encontrado" });
        const data = header.recordset[0];
        data.items = details.recordset;
        res.json(data);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// ... Otras funciones se mantienen igual ...
export const getQuotes = async (req, res) => { try { const pool = await getConnection(); const result = await pool.request().query(`SELECT c.CotizacionID, c.NumeroCotizacion, c.FechaRealizacion, c.TotalCotizacion, c.Estado, cli.NombreCliente, e.Nombre as NombreEmpresa FROM Cotizaciones c INNER JOIN Clientes cli ON c.ClienteID = cli.ClienteID LEFT JOIN Empresas e ON c.EmpresaID = e.EmpresaID ORDER BY c.FechaRealizacion DESC`); res.json(result.recordset); } catch (error) { res.status(500).json({ message: error.message }); } };
export const updateQuoteStatus = async (req, res) => { const { id } = req.params; const { status } = req.body; if (!id || !status) return res.status(400).json({ message: 'Requeridos ID y status' }); const usuarioDecision = req.user ? req.user.username : 'Sistema'; try { const pool = await getConnection(); const cotId = parseInt(id); if (status === 'Rechazada') await pool.request().input("id", sql.Int, cotId).query("DELETE FROM Ordenes WHERE CotizacionID = @id"); await pool.request().input("id", sql.Int, cotId).input("st", sql.NVarChar, status).input("usr", sql.NVarChar, usuarioDecision).query("UPDATE Cotizaciones SET Estado = @st, UsuarioDecision = @usr WHERE CotizacionID = @id"); res.json({ message: "Estado actualizado" }); } catch (error) { res.status(500).json({ message: error.message }); } };
export const getNextQuoteNumber = async (req, res) => { try { const pool = await getConnection(); const result = await pool.request().query("SELECT ISNULL(MAX(CotizacionID), 0) + 1 as NextID FROM Cotizaciones"); res.json({ nextId: result.recordset[0].NextID }); } catch (error) { res.status(500).json({ message: error.message }); } };