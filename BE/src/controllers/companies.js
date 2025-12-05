import { getConnection } from '../../db.js';

export const getCompanies = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT * FROM Empresas");
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};