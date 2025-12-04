// BE/src/controllers/quotations.js
import { getConnection, sql } from '../../db.js';

export const createQuote = async (req, res) => {
    const { 
        clienteId, 
        nombreQuienCotiza, 
        telefonoSnapshot, 
        atencionASnapshot, 
        direccionSnapshot, 
        items // <--- Esto será un ARRAY de productos: [{ productoId, cantidad, precio }, ...]
    } = req.body;

    if (!clienteId || !items || items.length === 0) {
        return res.status(400).json({ message: "Faltan datos del cliente o productos" });
    }

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        // 1. Iniciar la Transacción (Modo seguro)
        await transaction.begin();

        // 2. Generar código único (Ej: COT-TIMESTAMP)
        const numeroCotizacion = `COT-${Date.now()}`; 

        // 3. Calcular el Total General (Sumando los subtotales de los items)
        const totalGeneral = items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);

        // 4. Insertar ENCABEZADO (Tabla Cotizaciones)
        // Nota: Usamos 'transaction.request()' en lugar de 'pool.request()'
        const requestHeader = new sql.Request(transaction);
        const resultHeader = await requestHeader
            .input("numero", sql.NVarChar, numeroCotizacion)
            .input("clienteId", sql.Int, clienteId)
            .input("nombreQuien", sql.NVarChar, nombreQuienCotiza)
            .input("tel", sql.NVarChar, telefonoSnapshot)
            .input("atencion", sql.NVarChar, atencionASnapshot)
            .input("dir", sql.NVarChar, direccionSnapshot)
            .input("total", sql.Decimal(18, 2), totalGeneral)
            .query(`
                INSERT INTO Cotizaciones (NumeroCotizacion, ClienteID, NombreQuienCotiza, TelefonoSnapshot, AtencionASnapshot, DireccionSnapshot, TotalCotizacion)
                OUTPUT INSERTED.CotizacionID -- Recuperamos el ID recién creado
                VALUES (@numero, @clienteId, @nombreQuien, @tel, @atencion, @dir, @total)
            `);

        const cotizacionId = resultHeader.recordset[0].CotizacionID;

        // 5. Insertar DETALLES (Tabla DetalleCotizaciones)
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

        // 6. Si llegamos aquí, todo está bien. ¡GUARDAR!
        await transaction.commit();

        res.status(201).json({ message: "Cotización creada exitosamente", numero: numeroCotizacion });

    } catch (error) {
        // 7. Si algo falló, deshacer todo (Rollback)
        if (transaction._aborted === false) { 
             await transaction.rollback();
        }
        res.status(500).json({ message: "Error al crear cotización", error: error.message });
    }
};

export const getQuotes = async (req, res) => {
    try {
        const pool = await getConnection();
        // Traemos datos básicos + nombre del cliente
        const result = await pool.request().query(`
            SELECT c.CotizacionID, c.NumeroCotizacion, c.FechaRealizacion, c.TotalCotizacion, 
                   cli.NombreCliente
            FROM Cotizaciones c
            INNER JOIN Clientes cli ON c.ClienteID = cli.ClienteID
            ORDER BY c.FechaRealizacion DESC
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener una cotización completa con sus productos (Para imprimir o ver detalle)
export const getQuoteById = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        
        // Consulta 1: Encabezado
        const header = await pool.request()
            .input("id", sql.Int, id)
            .query(`
                SELECT c.*, cli.NombreCliente, cli.CorreoElectronico 
                FROM Cotizaciones c
                INNER JOIN Clientes cli ON c.ClienteID = cli.ClienteID
                WHERE c.CotizacionID = @id
            `);

        // Consulta 2: Detalles (Productos)
        const details = await pool.request()
            .input("id", sql.Int, id)
            .query(`
                SELECT d.*, p.Nombre as NombreProducto, p.CodigoProducto
                FROM DetalleCotizaciones d
                INNER JOIN Productos p ON d.ProductoID = p.ProductoID
                WHERE d.CotizacionID = @id
            `);

        if (header.recordset.length === 0) return res.status(404).json({ message: "Cotización no encontrada" });

        // Unimos la respuesta
        const data = header.recordset[0];
        data.items = details.recordset;

        res.json(data);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};