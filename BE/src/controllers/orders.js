// BE/src/controllers/orders.controller.js
import { getConnection, sql } from '../../db.js';

export const createOrder = async (req, res) => {
    const { 
        clienteId, 
        fechaEntrega, 
        ejecutivoVentasId 
    } = req.body;

    // "ElaboradoPor" es el usuario que está usando el sistema ahora mismo
    const elaboradoPorId = req.user.id; 

    if (!clienteId || !fechaEntrega) {
        return res.status(400).json({ message: "Cliente y Fecha de Entrega son obligatorios" });
    }

    try {
        const pool = await getConnection();

        await pool.request()
            .input("clienteId", sql.Int, clienteId)
            .input("fechaEntrega", sql.DateTime, fechaEntrega) // Formato YYYY-MM-DD
            .input("elaboradoPorId", sql.Int, elaboradoPorId)
            .input("ejecutivoVentasId", sql.Int, ejecutivoVentasId || null) // Puede ser opcional
            .query(`
                INSERT INTO Pedidos (ClienteID, FechaEntrega, ElaboradoPorID, EjecutivoVentasID)
                VALUES (@clienteId, @fechaEntrega, @elaboradoPorId, @ejecutivoVentasId)
            `);

        res.status(201).json({ message: "Pedido de inicio generado correctamente" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getOrders = async (req, res) => {
    try {
        const pool = await getConnection();
        // Doble JOIN a Usuarios para obtener nombres distintos
        const result = await pool.request().query(`
            SELECT 
                p.PedidoID, 
                p.FechaOrdenInicio, 
                p.FechaEntrega,
                c.NombreCliente,
                u1.Username as ElaboradoPor,
                u2.Username as EjecutivoVentas
            FROM Pedidos p
            INNER JOIN Clientes c ON p.ClienteID = c.ClienteID
            INNER JOIN Usuarios u1 ON p.ElaboradoPorID = u1.UsuarioID
            LEFT JOIN Usuarios u2 ON p.EjecutivoVentasID = u2.UsuarioID
            ORDER BY p.FechaOrdenInicio DESC
        `);
        
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};