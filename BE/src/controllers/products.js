// BE/src/controllers/products.js
import { getConnection, sql } from '../../db.js';

export const createProduct = async (req, res) => {
  // Multer pone el archivo en req.file y los textos en req.body
  const { codigo, nombre, descripcion } = req.body;
  const imagen = req.file ? req.file.buffer : null; // Aquí obtenemos los datos binarios

  if (!codigo || !nombre || !descripcion) {
    return res.status(400).json({ message: "Código, Nombre y Descripción son obligatorios" });
  }

  try {
    const pool = await getConnection();

    await pool.request()
      .input("codigo", sql.NVarChar, codigo)
      .input("nombre", sql.NVarChar, nombre)
      .input("descripcion", sql.NVarChar, descripcion)
      .input("imagen", sql.VarBinary, imagen) // Importante: Tipo VarBinary
      .query("INSERT INTO Productos (CodigoProducto, Nombre, Descripcion, Imagen) VALUES (@codigo, @nombre, @descripcion, @imagen)");

    res.status(201).json({ message: "Producto guardado con éxito" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT ProductoID, CodigoProducto, Nombre, Descripcion FROM Productos");
    // Nota: No traemos la imagen en la lista general para no hacer lenta la consulta (SELECT * pesaría mucho)
    
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Endpoint extra para obtener la imagen de un producto específico
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