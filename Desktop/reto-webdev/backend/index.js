require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sql, poolPromise } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const EVALUADOR_URL = process.env.EVALUADOR_URL || 'http://52.171.58.51:8080';

// 1. Catálogo de misiones
app.get('/api/misiones', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Misiones ORDER BY misionId ASC');
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar catálogo', detalle: error.message });
  }
});

// 2. Listar estudiantes y progreso
app.get('/api/estudiantes', async (req, res) => {
  try {
    const pool = await poolPromise;
    const query = `
      SELECT 
        e.carnet, e.nombre, e.correo,
        m.misionId, m.titulo AS misionTitulo,
        ISNULL(em.estado, 0) AS estado
      FROM Estudiantes e
      CROSS JOIN Misiones m
      LEFT JOIN EstudianteMisiones em 
        ON e.carnet = em.carnet AND m.misionId = em.misionId
      ORDER BY e.carnet, m.misionId;
    `;
    const result = await pool.request().query(query);

    const estudiantesMap = {};
    result.recordset.forEach(row => {
      if (!estudiantesMap[row.carnet]) {
        estudiantesMap[row.carnet] = {
          carnet: row.carnet,
          nombre: row.nombre,
          correo: row.correo,
          misiones: []
        };
      }
      estudiantesMap[row.carnet].misiones.push({
        misionId: row.misionId,
        titulo: row.misionTitulo || `Misión ${row.misionId}`,
        estado: Boolean(row.estado)
      });
    });

    res.json(Object.values(estudiantesMap));
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar estudiantes', detalle: error.message });
  }
});

// 3. Registrar o actualizar Maestro-Detalle
app.post('/api/registro', async (req, res) => {
  const { maestro, detalle } = req.body;

  if (!maestro || !maestro.carnet || !detalle || !Array.isArray(detalle)) {
    return res.status(400).json({ 
      error: 'Formato incorrecto', 
      mensaje: 'El JSON debe incluir el objeto maestro (con carnet) y el arreglo detalle.' 
    });
  }

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // Validar catálogo de misiones
    const misionesCatalog = await new sql.Request(transaction).query('SELECT misionId FROM Misiones');
    const validMisionIds = new Set(misionesCatalog.recordset.map(m => m.misionId));

    for (const item of detalle) {
      if (!validMisionIds.has(item.misionId)) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Error de referencia',
          mensaje: `La misionId ${item.misionId} no existe en el catálogo de Misiones.`
        });
      }
    }

    // Upsert Estudiante
    const queryEstudiante = `
      MERGE Estudiantes AS target
      USING (SELECT @carnet AS carnet, @nombre AS nombre, @correo AS correo) AS source
      ON (target.carnet = source.carnet)
      WHEN MATCHED THEN
        UPDATE SET target.nombre = source.nombre, target.correo = source.correo
      WHEN NOT MATCHED THEN
        INSERT (carnet, nombre, correo) VALUES (source.carnet, source.nombre, source.correo);
    `;

    await new sql.Request(transaction)
      .input('carnet', sql.VarChar, maestro.carnet)
      .input('nombre', sql.VarChar, maestro.nombre || '')
      .input('correo', sql.VarChar, maestro.correo || '')
      .query(queryEstudiante);

    // Upsert Detalle
    const queryDetalle = `
      MERGE EstudianteMisiones AS target
      USING (SELECT @carnet AS carnet, @misionId AS misionId, @estado AS estado) AS source
      ON (target.carnet = source.carnet AND target.misionId = source.misionId)
      WHEN MATCHED THEN
        UPDATE SET target.estado = source.estado
      WHEN NOT MATCHED THEN
        INSERT (carnet, misionId, estado) VALUES (source.carnet, source.misionId, source.estado);
    `;

    for (const item of detalle) {
      await new sql.Request(transaction)
        .input('carnet', sql.VarChar, maestro.carnet)
        .input('misionId', sql.Int, item.misionId)
        .input('estado', sql.Bit, item.estado ? 1 : 0)
        .query(queryDetalle);
    }

    await transaction.commit();

    // Replicar al evaluador central
    try {
      await fetch(`${EVALUADOR_URL}/api/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maestro, detalle }),
        signal: AbortSignal.timeout(4000)
      });
    } catch (evalErr) {
      console.warn('El evaluador central no respondió a la sincronización:', evalErr.message);
    }

    return res.status(200).json({
      exito: true,
      mensaje: 'Estudiante y misiones procesados exitosamente.'
    });

  } catch (error) {
    if (transaction._acquiredConnection) {
      await transaction.rollback();
    }
    return res.status(500).json({ error: 'Error durante la transacción', detalle: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API en ejecución en el puerto ${PORT}`));