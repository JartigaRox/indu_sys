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
// 2. CREACIÓN DE PRODUCTO (Lógica Maestra)
// ---------------------------------------------------

export const createProduct = async (req, res) => {
    // Multer pone el archivo en req.file y los textos en req.body
    const { nombre, descripcion, subcategoriaId } = req.body;
    const imagen = req.file ? req.file.buffer : null; // Buffer binario de la imagen

    if (!nombre || !subcategoriaId) {
        return res.status(400).json({ message: "Nombre y Subcategoría son obligatorios" });
    }

    try {
        const pool = await getConnection();

        // PASO A: Obtener las siglas de la categoría y subcategoría (Ej: 'OFI', 'ARM')
        const codesResult = await pool.request()
            .input("subId", sql.Int, subcategoriaId)
            .query(`
                SELECT s.CodigoSubcategoria, c.CodigoCategoria 
                FROM Subcategorias s
                INNER JOIN Categorias c ON s.CategoriaID = c.CategoriaID
                WHERE s.SubcategoriaID = @subId
            `);

        if (codesResult.recordset.length === 0) {
            return res.status(400).json({ message: "Subcategoría inválida" });
        }

        const { CodigoCategoria, CodigoSubcategoria } = codesResult.recordset[0];

        // PASO B: Calcular el siguiente número correlativo (Global)
        // Buscamos el ID máximo actual en la tabla Productos y le sumamos 1
        const idResult = await pool.request().query("SELECT ISNULL(MAX(ProductoID), 0) + 1 as NextID FROM Productos");
        const nextId = idResult.recordset[0].NextID;

        // PASO C: Armar el Código Final (Ej: OFI-ARM-00001)
        // .padStart(5, '0') se asegura de que el número tenga 5 dígitos (agrega ceros a la izquierda)
        const codigoFinal = `${CodigoCategoria}-${CodigoSubcategoria}-${nextId.toString().padStart(5, '0')}`;

        // PASO D: Insertar el producto en la Base de Datos
        await pool.request()
            .input("codigo", sql.NVarChar, codigoFinal)
            .input("nombre", sql.NVarChar, nombre)
            .input("descripcion", sql.NVarChar, descripcion)
            .input("subId", sql.Int, subcategoriaId)
            .input("imagen", sql.VarBinary, imagen) // Tipo VarBinary para la foto
            .query(`
                INSERT INTO Productos (CodigoProducto, Nombre, Descripcion, SubcategoriaID, Imagen) 
                VALUES (@codigo, @nombre, @descripcion, @subId, @imagen)
            `);

        res.status(201).json({ message: "Producto guardado con éxito", codigo: codigoFinal });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al crear producto", error: error.message });
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