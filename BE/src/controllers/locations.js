import { pool } from '../../db.js';

export const getDepartamentos = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Departamentos');
        res.json(result.rows);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getMunicipiosByDept = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Municipios WHERE "DepartamentoID" = $1', [req.params.departamentoId]);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getDistritosByMun = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Distritos WHERE "MunicipioID" = $1', [req.params.municipioId]);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ message: error.message }); }
};