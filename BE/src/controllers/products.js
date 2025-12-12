import { getConnection, sql } from '../../db.js';

// ---------------------------------------------------
// 1. UTILIDADES (Categorías y Subcategorías)
// ---------------------------------------------------

export const getCategories = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT * FROM Categorias");
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getSubcategories = async (req, res) => {
    const { catId } = req.params;
    // Validación de ID
    if (!catId || isNaN(parseInt(catId))) return res.json([]); 

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input("catId", sql.Int, parseInt(catId))
            .query("SELECT * FROM Subcategorias WHERE CategoriaID = @catId");
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTiposMueble = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT * FROM TipoMuebles");
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getEstadosProducto = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT * FROM EstadoProducto");
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------------
// 3. CONSULTAS Y UTILIDADES PÚBLICAS
// ---------------------------------------------------

export const getProducts = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                p.ProductoID, p.CodigoProducto, p.Nombre, p.Descripcion,
                p.SubcategoriaID, p.TipoMuebleID, p.EstadoProductoID,
                s.Nombre as Subcategoria, s.CategoriaID,
                c.Nombre as Categoria,
                tm.Tipo as TipoMueble, ep.Estado as EstadoProducto
            FROM Productos p
            LEFT JOIN Subcategorias s ON p.SubcategoriaID = s.SubcategoriaID
            LEFT JOIN Categorias c ON s.CategoriaID = c.CategoriaID
            LEFT JOIN TipoMuebles tm ON p.TipoMuebleID = tm.TipoMuebleID
            LEFT JOIN EstadoProducto ep ON p.EstadoProductoID = ep.EstadoProductoID
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- FIX CRÍTICO: Validación de ID en imagen ---
export const getProductImage = async (req, res) => {
    const { id } = req.params;
    
    // Si el ID no es un número válido, devolvemos 404 sin molestar a la BD
    if (!id || isNaN(parseInt(id))) {
        return res.status(404).send("ID inválido");
    }

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input("id", sql.Int, parseInt(id))
            .query("SELECT Imagen FROM Productos WHERE ProductoID = @id");

        if (result.recordset.length > 0 && result.recordset[0].Imagen) {
            res.setHeader('Content-Type', 'image/jpeg');
            res.send(result.recordset[0].Imagen);
        } else {
            res.status(404).send("Imagen no encontrada");
        }
    } catch (error) {
        console.error("Error obteniendo imagen:", error.message);
        res.status(500).send(error.message);
    }
};

export const createProduct = async (req, res) => {
    const { nombre, descripcion, subcategoriaId, tipoMuebleId, estadoProductoId } = req.body;
    const imagen = req.file ? req.file.buffer : null;

    if (!nombre || !subcategoriaId) return res.status(400).json({ message: "Datos incompletos" });

    try {
        const pool = await getConnection();

        // 1. Obtener códigos
        const codesResult = await pool.request()
            .input("subId", sql.Int, subcategoriaId)
            .query(`SELECT s.CodigoSubcategoria, c.CodigoCategoria FROM Subcategorias s INNER JOIN Categorias c ON s.CategoriaID = c.CategoriaID WHERE s.SubcategoriaID = @subId`);
        
        if (codesResult.recordset.length === 0) return res.status(400).json({ message: "Subcategoría inválida" });

        const { CodigoCategoria, CodigoSubcategoria } = codesResult.recordset[0];

        // 2. Correlativo
        const idResult = await pool.request()
            .input("subId", sql.Int, subcategoriaId)
            .query(`
                SELECT ISNULL(MAX(CAST(RIGHT(CodigoProducto, 4) AS INT)), 0) + 1 as NextID 
                FROM Productos 
                WHERE SubcategoriaID = @subId
            `);
        const nextId = idResult.recordset[0].NextID;

        // 3. Código Final
        const codigoFinal = `${CodigoCategoria}-${CodigoSubcategoria}-${nextId.toString().padStart(4, '0')}`;

        await pool.request()
            .input("codigo", sql.NVarChar, codigoFinal)
            .input("nombre", sql.NVarChar, nombre)
            .input("descripcion", sql.NVarChar, descripcion)
            .input("subId", sql.Int, subcategoriaId)
            .input("tipoMuebleId", sql.Int, tipoMuebleId || null)
            .input("estadoProductoId", sql.Int, estadoProductoId || null)
            .input("imagen", sql.VarBinary, imagen)
            .query(`INSERT INTO Productos (CodigoProducto, Nombre, Descripcion, SubcategoriaID, TipoMuebleID, EstadoProductoID, Imagen) VALUES (@codigo, @nombre, @descripcion, @subId, @tipoMuebleId, @estadoProductoId, @imagen)`);

        res.status(201).json({ message: "Producto creado", codigo: codigoFinal });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// --- FIX: Validación en getProduct ---
export const getProduct = async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) return res.status(400).json({ message: "ID inválido" });

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input("id", sql.Int, parseInt(id))
            .query(`
                SELECT 
                    p.*, s.CategoriaID, s.CodigoSubcategoria, c.CodigoCategoria,
                    tm.Tipo as TipoMueble, ep.Estado as EstadoProducto
                FROM Productos p
                LEFT JOIN Subcategorias s ON p.SubcategoriaID = s.SubcategoriaID
                LEFT JOIN Categorias c ON s.CategoriaID = c.CategoriaID
                LEFT JOIN TipoMuebles tm ON p.TipoMuebleID = tm.TipoMuebleID
                LEFT JOIN EstadoProducto ep ON p.EstadoProductoID = ep.EstadoProductoID
                WHERE p.ProductoID = @id
            `);
        if (result.recordset.length === 0) return res.status(404).json({ message: "Producto no encontrado" });
        res.json(result.recordset[0]);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// --- FIX: Validación en updateProduct ---
export const updateProduct = async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) return res.status(400).json({ message: "ID inválido" });

    const { nombre, descripcion, subcategoriaId, tipoMuebleId, estadoProductoId } = req.body;
    const imagen = req.file ? req.file.buffer : null;

    try {
        const pool = await getConnection();

        // 1. VALIDACIÓN: Verificar si el producto ya está en cotizaciones
        const checkUsage = await pool.request()
            .input("id", sql.Int, parseInt(id))
            .query("SELECT TOP 1 1 FROM DetalleCotizaciones WHERE ProductoID = @id");

        if (checkUsage.recordset.length > 0) {
            // Retornamos 409 (Conflict) para que el frontend sepa qué hacer
            return res.status(409).json({ 
                message: "No se puede editar: El producto ya forma parte de cotizaciones o pedidos históricos. Modificarlo afectaría documentos existentes." 
            });
        }

        // 2. Si no está en uso, procedemos a actualizar
        const request = pool.request()
            .input("id", sql.Int, parseInt(id))
            .input("nombre", sql.NVarChar, nombre)
            .input("descripcion", sql.NVarChar, descripcion)
            .input("subId", sql.Int, subcategoriaId)
            .input("tipoMuebleId", sql.Int, tipoMuebleId || null)
            .input("estadoProductoId", sql.Int, estadoProductoId || null);

        let query = "UPDATE Productos SET Nombre = @nombre, Descripcion = @descripcion, SubcategoriaID = @subId, TipoMuebleID = @tipoMuebleId, EstadoProductoID = @estadoProductoId";
        
        if (imagen) {
            request.input("imagen", sql.VarBinary, imagen);
            query += ", Imagen = @imagen";
        }
        
        query += " WHERE ProductoID = @id";
        await request.query(query);

        res.json({ message: "Producto actualizado" });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// --- ELIMINAR PRODUCTO (Se queda igual) ---
export const deleteProduct = async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) return res.status(400).json({ message: "ID inválido" });

    try {
        const pool = await getConnection();
        await pool.request().input("id", sql.Int, parseInt(id)).query("DELETE FROM Productos WHERE ProductoID = @id");
        res.json({ message: "Producto eliminado" });
    } catch (error) {
        if (error.number === 547) {
            return res.status(400).json({ message: "No se puede eliminar: El producto ya está en cotizaciones." });
        }
        res.status(500).json({ message: error.message });
    }
};

export const checkProductUsage = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        // Solo necesitamos saber si existe al menos 1 registro (TOP 1 1)
        const result = await pool.request()
            .input("id", sql.Int, parseInt(id))
            .query("SELECT TOP 1 1 FROM DetalleCotizaciones WHERE ProductoID = @id");

        // Devolvemos true si encontró registros, false si está limpio
        res.json({ inUse: result.recordset.length > 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};