import { pool } from '../../db.js';

export const getCategories = async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM Categorias')).rows); } 
    catch (e) { res.status(500).json({ message: e.message }); }
};

export const getSubcategories = async (req, res) => {
    if (!req.params.catId) return res.json([]);
    try { res.json((await pool.query('SELECT * FROM Subcategorias WHERE "CategoriaID"=$1', [req.params.catId])).rows); } 
    catch (e) { res.status(500).json({ message: e.message }); }
};

export const getTiposMueble = async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM TipoMuebles')).rows); } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getEstadosProducto = async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM EstadoProducto')).rows); } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getProducts = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, s."Nombre" as "Subcategoria", c."Nombre" as "Categoria", 
            tm."Tipo" as "TipoMueble", ep."Estado" as "EstadoProducto"
            FROM Productos p
            LEFT JOIN Subcategorias s ON p."SubcategoriaID" = s."SubcategoriaID"
            LEFT JOIN Categorias c ON s."CategoriaID" = c."CategoriaID"
            LEFT JOIN TipoMuebles tm ON p."TipoMuebleID" = tm."TipoMuebleID"
            LEFT JOIN EstadoProducto ep ON p."EstadoProductoID" = ep."EstadoProductoID"
        `);
        res.json(result.rows);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getProductImage = async (req, res) => {
    try {
        const result = await pool.query('SELECT "Imagen" FROM Productos WHERE "ProductoID"=$1', [req.params.id]);
        if (result.rows.length === 0 || !result.rows[0].Imagen) return res.status(404).send("No imagen");
        
        const img = result.rows[0].Imagen;
        res.setHeader('Content-Type', (img[0] === 0xFF) ? 'image/jpeg' : 'image/png');
        res.send(img);
    } catch (e) { res.status(500).send(e.message); }
};

export const createProduct = async (req, res) => {
    const { nombre, descripcion, subcategoriaId, tipoMuebleId, estadoProductoId } = req.body;
    const imagen = req.file ? req.file.buffer : null;

    try {
        // Obtener códigos
        const codes = await pool.query('SELECT s."CodigoSubcategoria" as sub, c."CodigoCategoria" as cat FROM Subcategorias s JOIN Categorias c ON s."CategoriaID"=c."CategoriaID" WHERE s."SubcategoriaID"=$1', [subcategoriaId]);
        if (codes.rows.length === 0) return res.status(400).json({ message: "Error subcategoria" });
        
        const { cat, sub } = codes.rows[0];
        
        // Correlativo (Postgres substring)
        const idRes = await pool.query('SELECT COALESCE(MAX(CAST(SUBSTRING("CodigoProducto" FROM LENGTH("CodigoProducto") - 3) AS INT)), 0) + 1 as next FROM Productos WHERE "SubcategoriaID"=$1', [subcategoriaId]);
        const nextId = idRes.rows[0].next;
        const codigo = `${cat}-${sub}-${nextId.toString().padStart(4, '0')}`;

        await pool.query(`
            INSERT INTO Productos ("CodigoProducto", "Nombre", "Descripcion", "SubcategoriaID", "TipoMuebleID", "EstadoProductoID", "Imagen")
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [codigo, nombre, descripcion, subcategoriaId, tipoMuebleId || null, estadoProductoId || null, imagen]);

        res.status(201).json({ message: "Creado", codigo });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getProduct = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, s."CategoriaID", s."CodigoSubcategoria", c."CodigoCategoria", tm."Tipo" as "TipoMueble", ep."Estado" as "EstadoProducto"
            FROM Productos p
            LEFT JOIN Subcategorias s ON p."SubcategoriaID" = s."SubcategoriaID"
            LEFT JOIN Categorias c ON s."CategoriaID" = c."CategoriaID"
            LEFT JOIN TipoMuebles tm ON p."TipoMuebleID" = tm."TipoMuebleID"
            LEFT JOIN EstadoProducto ep ON p."EstadoProductoID" = ep."EstadoProductoID"
            WHERE p."ProductoID" = $1
        `, [req.params.id]);
        if(result.rows.length === 0) return res.status(404).json({message: "No encontrado"});
        res.json(result.rows[0]);
    } catch(e) { res.status(500).json({message: e.message}); }
};

export const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, subcategoriaId, tipoMuebleId, estadoProductoId } = req.body;
    const imagen = req.file ? req.file.buffer : null;

    try {
        const check = await pool.query('SELECT 1 FROM DetalleCotizaciones WHERE "ProductoID"=$1 LIMIT 1', [id]);
        if(check.rows.length > 0) return res.status(409).json({ message: "En uso" });

        let sql = 'UPDATE Productos SET "Nombre"=$1, "Descripcion"=$2, "SubcategoriaID"=$3, "TipoMuebleID"=$4, "EstadoProductoID"=$5';
        let vals = [nombre, descripcion, subcategoriaId, tipoMuebleId || null, estadoProductoId || null];
        
        if (imagen) { sql += `, "Imagen"=$${vals.length+1}`; vals.push(imagen); }
        sql += ` WHERE "ProductoID"=$${vals.length+1}`; vals.push(id);

        await pool.query(sql, vals);
        res.json({ message: "Actualizado" });
    } catch(e) { res.status(500).json({ message: e.message }); }
};

export const deleteProduct = async (req, res) => {
    try {
        await pool.query('DELETE FROM Productos WHERE "ProductoID"=$1', [req.params.id]);
        res.json({ message: "Eliminado" });
    } catch(e) {
        if(e.code === '23503') return res.status(400).json({message: "En uso"});
        res.status(500).json({message: e.message});
    }
};

export const checkProductUsage = async (req, res) => {
    try {
        const resCheck = await pool.query('SELECT 1 FROM DetalleCotizaciones WHERE "ProductoID"=$1 LIMIT 1', [req.params.id]);
        res.json({ inUse: resCheck.rows.length > 0 });
    } catch(e) { res.status(500).json({message: e.message}); }
};