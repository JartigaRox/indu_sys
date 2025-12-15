import { pool } from '../../db.js';

export const getCompanies = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Empresas');
        res.json(result.rows);
    } catch (error) { res.status(500).json({ message: error.message }); }
};