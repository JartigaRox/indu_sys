import { getConnection, sql } from '../../db.js';

// ---------------------------------------------------
// 1. UTILIDADES (Categorías y Subcategorías)
// ---------------------------------------------------

// Obtener todas las categorías (Para el primer Select)
export const getCategories = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT * FROM Categorias");
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener subcategorías filtradas por ID de categoría (Para el segundo Select)
export const getSubcategories = async (req, res) => {
    const { catId } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input("catId", sql.Int, catId)
            .query("SELECT * FROM Subcategorias WHERE CategoriaID = @catId");
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ---------------------------------------------------
// 3. CONSULTAS Y UTILIDADES PÚBLICAS
// ---------------------------------------------------

// Listar productos (Optimizado para el buscador del frontend)
export const getProducts = async (req, res) => {
    try {
        const pool = await getConnection();
        // Hacemos JOIN para traer los nombres legibles de categoría/subcategoría
        const result = await pool.request().query(`
            SELECT 
                p.ProductoID, p.CodigoProducto, p.Nombre, p.Descripcion,
                s.Nombre as Subcategoria, c.Nombre as Categoria
            FROM Productos p
            LEFT JOIN Subcategorias s ON p.SubcategoriaID = s.SubcategoriaID
            LEFT JOIN Categorias c ON s.CategoriaID = c.CategoriaID
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener la imagen de un producto (Para usar en <img src="...">)
// ESTA RUTA NO DEBE TENER 'verifyToken' EN EL ARCHIVO DE RUTAS
export const getProductImage = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query("SELECT Imagen FROM Productos WHERE ProductoID = @id");

        if (result.recordset.length > 0 && result.recordset[0].Imagen) {
            res.setHeader('Content-Type', 'image/jpeg'); // O image/png
            res.send(result.recordset[0].Imagen);
        } else {
            res.status(404).send("Imagen no encontrada");
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
};

export const createProduct = async (req, res) => {
    const { nombre, descripcion, subcategoriaId } = req.body;
    const imagen = req.file ? req.file.buffer : null;

    if (!nombre || !subcategoriaId) return res.status(400).json({ message: "Datos incompletos" });

    try {
        const pool = await getConnection();

        // 1. Obtener códigos de categoría
        const codesResult = await pool.request()
            .input("subId", sql.Int, subcategoriaId)
            .query(`SELECT s.CodigoSubcategoria, c.CodigoCategoria FROM Subcategorias s INNER JOIN Categorias c ON s.CategoriaID = c.CategoriaID WHERE s.SubcategoriaID = @subId`);
        
        const { CodigoCategoria, CodigoSubcategoria } = codesResult.recordset[0];

        // 2. Correlativo
        const idResult = await pool.request().query("SELECT ISNULL(MAX(ProductoID), 0) + 1 as NextID FROM Productos");
        const nextId = idResult.recordset[0].NextID;

        // 3. CAMBIO A 4 DÍGITOS AQUÍ: .padStart(4, '0')
        const codigoFinal = `${CodigoCategoria}-${CodigoSubcategoria}-${nextId.toString().padStart(4, '0')}`;

        await pool.request()
            .input("codigo", sql.NVarChar, codigoFinal)
            .input("nombre", sql.NVarChar, nombre)
            .input("descripcion", sql.NVarChar, descripcion)
            .input("subId", sql.Int, subcategoriaId)
            .input("imagen", sql.VarBinary, imagen)
            .query(`INSERT INTO Productos (CodigoProducto, Nombre, Descripcion, SubcategoriaID, Imagen) VALUES (@codigo, @nombre, @descripcion, @subId, @imagen)`);

        res.status(201).json({ message: "Producto creado", codigo: codigoFinal });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// --- NUEVO: OBTENER PRODUCTO POR ID (Para editar) ---
export const getProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input("id", sql.Int, id)
            .query(`
                SELECT 
                    p.*, 
                    s.CategoriaID,
                    s.CodigoSubcategoria,
                    c.CodigoCategoria
                FROM Productos p
                LEFT JOIN Subcategorias s ON p.SubcategoriaID = s.SubcategoriaID
                LEFT JOIN Categorias c ON s.CategoriaID = c.CategoriaID
                WHERE p.ProductoID = @id
            `);
        res.json(result.recordset[0]);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// --- NUEVO: ACTUALIZAR PRODUCTO ---
export const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, subcategoriaId } = req.body;
    const imagen = req.file ? req.file.buffer : null; // Si viene imagen nueva

    try {
        const pool = await getConnection();
        const request = pool.request()
            .input("id", sql.Int, id)
            .input("nombre", sql.NVarChar, nombre)
            .input("descripcion", sql.NVarChar, descripcion)
            .input("subId", sql.Int, subcategoriaId);

        let query = "UPDATE Productos SET Nombre = @nombre, Descripcion = @descripcion, SubcategoriaID = @subId";
        
        // Solo actualizamos imagen si el usuario subió una nueva
        if (imagen) {
            request.input("imagen", sql.VarBinary, imagen);
            query += ", Imagen = @imagen";
        }
        
        query += " WHERE ProductoID = @id";
        await request.query(query);

        res.json({ message: "Producto actualizado" });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// --- NUEVO: ELIMINAR PRODUCTO ---
export const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        // Cuidado: Si el producto está en cotizaciones, SQL dará error por FK.
        // Lo ideal sería un "Soft Delete" (Estado = Inactivo), pero por ahora haremos delete físico.
        await pool.request().input("id", sql.Int, id).query("DELETE FROM Productos WHERE ProductoID = @id");
        res.json({ message: "Producto eliminado" });
    } catch (error) {
        if (error.number === 547) {
            return res.status(400).json({ message: "No se puede eliminar: El producto ya está en cotizaciones." });
        }
        res.status(500).json({ message: error.message });
    }
};