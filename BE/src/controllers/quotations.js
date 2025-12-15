import { pool } from '../../db.js';

export const createQuote = async (req, res) => {
    const { clienteId, empresaId, nombreQuienCotiza, telefonoSnapshot, atencionASnapshot, direccionSnapshot, items, vendedorId, terminos } = req.body;
    if (!clienteId || !items || items.length === 0) return res.status(400).json({ message: "Datos faltantes" });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const idRes = await client.query('SELECT COALESCE(MAX("CotizacionID"), 0) + 1 as next FROM Cotizaciones');
        const nextId = idRes.rows[0].next;
        const initials = nombreQuienCotiza ? nombreQuienCotiza.substring(0, 2).toUpperCase() : 'XX';
        const num = `${initials}-${nextId.toString().padStart(6, '0')}`;
        const total = items.reduce((s, i) => s + (i.cantidad * i.precio), 0);

        const ins = await client.query(`
            INSERT INTO Cotizaciones ("NumeroCotizacion", "ClienteID", "EmpresaID", "NombreQuienCotiza", "TelefonoSnapshot", "AtencionASnapshot", "DireccionSnapshot", "TotalCotizacion", "Estado", "VendedorID", "Terminos")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pendiente', $9, $10)
            RETURNING "CotizacionID"
        `, [num, clienteId, empresaId || 1, nombreQuienCotiza, telefonoSnapshot, atencionASnapshot, direccionSnapshot, total, vendedorId, terminos]);

        const cotId = ins.rows[0].CotizacionID;

        for (const item of items) {
            await client.query(`
                INSERT INTO DetalleCotizaciones ("CotizacionID", "ProductoID", "Cantidad", "PrecioUnitario", "Descripcion")
                VALUES ($1, $2, $3, $4, $5)
            `, [cotId, item.productoId, item.cantidad, item.precio, item.descripcion || ""]);
        }

        await client.query('COMMIT');
        res.status(201).json({ message: "Creada", numero: num });
    } catch (e) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: e.message });
    } finally { client.release(); }
};

export const updateQuote = async (req, res) => {
    const { id } = req.params;
    const { clienteId, empresaId, nombreQuienCotiza, telefonoSnapshot, atencionASnapshot, direccionSnapshot, items, terminos } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const total = items.reduce((s, i) => s + (i.cantidad * i.precio), 0);

        await client.query(`
            UPDATE Cotizaciones SET "ClienteID"=$1, "EmpresaID"=$2, "NombreQuienCotiza"=$3, "TelefonoSnapshot"=$4, "AtencionASnapshot"=$5, "DireccionSnapshot"=$6, "TotalCotizacion"=$7, "Terminos"=$8
            WHERE "CotizacionID"=$9
        `, [clienteId, empresaId, nombreQuienCotiza, telefonoSnapshot, atencionASnapshot, direccionSnapshot, total, terminos, id]);

        await client.query('DELETE FROM DetalleCotizaciones WHERE "CotizacionID"=$1', [id]);

        for (const item of items) {
            await client.query(`INSERT INTO DetalleCotizaciones ("CotizacionID", "ProductoID", "Cantidad", "PrecioUnitario", "Descripcion") VALUES ($1, $2, $3, $4, $5)`, 
            [id, item.productoId, item.cantidad, item.precio, item.descripcion || ""]);
        }

        await client.query('COMMIT');
        res.json({ message: "Actualizada" });
    } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ message: e.message }); } finally { client.release(); }
};

export const getQuoteById = async (req, res) => {
    const { id } = req.params;
    try {
        const header = await pool.query(`
            SELECT c.*, cli."NombreCliente", cli."CorreoElectronico", cli."Telefono", cli."AtencionA", cli."DireccionCalle",
            d."Nombre" as "Distrito", m."Nombre" as "Municipio", dep."Nombre" as "Departamento",
            e."Nombre" as "EmpresaNombre", e."Direccion" as "EmpresaDireccion", e."NRC", e."NIT", e."Telefono" as "TelefonoEmpresa", e."Celular" as "CelularEmpresa", e."CorreoElectronico" as "EmailEmpresa", e."PaginaWeb" as "WebEmpresa",
            c."VendedorID", v."Username" as "VendedorUsername"
            FROM Cotizaciones c
            INNER JOIN Clientes cli ON c."ClienteID" = cli."ClienteID"
            LEFT JOIN Distritos d ON cli."DistritoID" = d."DistritoID"
            LEFT JOIN Municipios m ON d."MunicipioID" = m."MunicipioID"
            LEFT JOIN Departamentos dep ON m."DepartamentoID" = dep."DepartamentoID"
            LEFT JOIN Empresas e ON c."EmpresaID" = e."EmpresaID"
            LEFT JOIN Usuarios v ON c."VendedorID" = v."UsuarioID"
            WHERE c."CotizacionID" = $1
        `, [id]);

        const details = await pool.query(`
            SELECT d.*, p."Nombre" as "NombreProducto", p."CodigoProducto", COALESCE(d."Descripcion", p."Descripcion") as "Descripcion",
            CASE WHEN p."Imagen" IS NOT NULL THEN 'http://tu-url.railway.app/api/products/image/' || CAST(p."ProductoID" AS TEXT) ELSE NULL END as "ImagenURL"
            FROM DetalleCotizaciones d JOIN Productos p ON d."ProductoID"=p."ProductoID" WHERE d."CotizacionID"=$1
        `, [id]);

        if (header.rows.length === 0) return res.status(404).json({ message: "No encontrado" });
        const data = header.rows[0];
        data.items = details.rows;
        res.json(data);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getQuotes = async (req, res) => {
    try {
        let sql = `SELECT c."CotizacionID", c."NumeroCotizacion", c."FechaRealizacion", c."TotalCotizacion", c."Estado", cli."NombreCliente", e."Nombre" as "NombreEmpresa" FROM Cotizaciones c JOIN Clientes cli ON c."ClienteID"=cli."ClienteID" LEFT JOIN Empresas e ON c."EmpresaID"=e."EmpresaID"`;
        let params = [];
        if (req.user.rolId !== 1) {
            sql += ' WHERE c."VendedorID" = $1';
            params.push(req.user.id);
        }
        sql += ' ORDER BY c."FechaRealizacion" DESC';
        const resDb = await pool.query(sql, params);
        res.json(resDb.rows);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const updateQuoteStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user ? req.user.username : 'Sistema';
    try {
        if (status === 'Rechazada') await pool.query('DELETE FROM Ordenes WHERE "CotizacionID"=$1', [id]);
        await pool.query('UPDATE Cotizaciones SET "Estado"=$1, "UsuarioDecision"=$2 WHERE "CotizacionID"=$3', [status, user, id]);
        res.json({ message: "Estado actualizado" });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getNextQuoteNumber = async (req, res) => {
    try { res.json({ nextId: (await pool.query('SELECT COALESCE(MAX("CotizacionID"), 0) + 1 as next FROM Cotizaciones')).rows[0].next }); }
    catch (e) { res.status(500).json({ message: e.message }); }
};