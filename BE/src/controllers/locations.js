// BE/src/controllers/locations.js
import { getConnection, sql } from '../../db.js';

// 1. Obtener todos los Departamentos
export const getDepartamentos = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT * FROM Departamentos");
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Obtener Municipios filtrados por Departamento
export const getMunicipiosByDept = async (req, res) => {
    const { departamentoId } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input("deptId", sql.Int, departamentoId)
            .query("SELECT * FROM Municipios WHERE DepartamentoID = @deptId");
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Obtener Distritos filtrados por Municipio
export const getDistritosByMun = async (req, res) => {
    const { municipioId } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input("munId", sql.Int, municipioId)
            .query("SELECT * FROM Distritos WHERE MunicipioID = @munId");
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};