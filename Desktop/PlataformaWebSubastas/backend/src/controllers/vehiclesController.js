const oracledb = require('oracledb');
const { getPool } = require('../config/oracle');

// 1. Obtener catálogo global con filtros multitarea
const getCatalogo = async (req, res) => {
  let conn;
  try {
    const { marca, anio, combustible, danio, search } = req.query;

    let sql = `
      SELECT 
        v.ID_VEHICULO,
        v.VIN,
        v.TIPO_ARTICULO,
        v.ANIO,
        v.MARCA,
        v.MODELO,
        v.MOTOR,
        v.COMBUSTIBLE,
        v.TRANSMISION,
        v.TRACCION,
        v.ESTADO_DANIO,
        s.ID_SUBASTA,
        s.MONTO_BASE,
        s.PRECIO_ACTUAL,
        s.FECHA_FIN,
        s.ESTADO AS ESTADO_SUBASTA,
        (SELECT URL_FOTO FROM FOTOS_VEHICULO_1890199521 f 
         WHERE f.ID_VEHICULO = v.ID_VEHICULO AND f.ORDEN = 1 AND ROWNUM = 1) AS FOTO_PRINCIPAL
      FROM VEHICULOS_1890199521 v
      JOIN SUBASTAS_1890199521 s ON v.ID_VEHICULO = s.ID_VEHICULO
      WHERE 1=1
    `;

    const binds = {};

    if (marca) {
      sql += ` AND LOWER(v.MARCA) LIKE :marca`;
      binds.marca = `%${marca.toLowerCase()}%`;
    }
    if (anio) {
      sql += ` AND v.ANIO = :anio`;
      binds.anio = Number(anio);
    }
    if (combustible) {
      sql += ` AND LOWER(v.COMBUSTIBLE) = LOWER(:combustible)`;
      binds.combustible = combustible;
    }
    if (danio) {
      sql += ` AND UPPER(v.ESTADO_DANIO) = UPPER(:danio)`;
      binds.danio = danio;
    }
    if (search) {
      sql += ` AND (LOWER(v.MARCA) LIKE :search OR LOWER(v.MODELO) LIKE :search OR LOWER(v.VIN) LIKE :search)`;
      binds.search = `%${search.toLowerCase()}%`;
    }

    sql += ` ORDER BY s.FECHA_INICIO DESC`;

    conn = await getPool().getConnection();
    const result = await conn.execute(sql, binds);

    return res.json(result.rows);
  } catch (error) {
    console.error('Error en getCatalogo:', error);
    return res.status(500).json({ mensaje: 'Error al obtener inventario de vehículos.' });
  } finally {
    if (conn) await conn.close();
  }
};

// 2. Detalle completo de vehículo, carrusel de fotos y estado de subasta
const getDetalleVehiculo = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getPool().getConnection();

    // Consultar datos del vehículo y subasta
    const vehiculoQuery = await conn.execute(
      `SELECT 
         v.*,
         s.ID_SUBASTA,
         s.MONTO_BASE,
         s.PRECIO_ACTUAL,
         s.FECHA_INICIO,
         s.FECHA_FIN,
         s.ESTADO AS ESTADO_SUBASTA,
         s.ID_USUARIO_GANADOR
       FROM VEHICULOS_1890199521 v
       JOIN SUBASTAS_1890199521 s ON v.ID_VEHICULO = s.ID_VEHICULO
       WHERE v.ID_VEHICULO = :id`,
      [Number(id)]
    );

    if (vehiculoQuery.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Vehículo no encontrado.' });
    }

    const vehiculo = vehiculoQuery.rows[0];

    // Consultar galería completa de fotos ordenadas
    const fotosQuery = await conn.execute(
      `SELECT ID_FOTO, URL_FOTO, ORDEN 
       FROM FOTOS_VEHICULO_1890199521 
       WHERE ID_VEHICULO = :id 
       ORDER BY ORDEN ASC`,
      [Number(id)]
    );

    vehiculo.FOTOS = fotosQuery.rows;

    return res.json(vehiculo);
  } catch (error) {
    console.error('Error en getDetalleVehiculo:', error);
    return res.status(500).json({ mensaje: 'Error al consultar detalle del vehículo.' });
  } finally {
    if (conn) await conn.close();
  }
};

// 3. Crear publicación de vehículo (Mínimo 5 fotos y monto base >= Q. 20,000)
const publicarVehiculo = async (req, res) => {
  const idUsuario = req.usuario.id;
  const {
    vin, tipoArticulo, anio, marca, modelo, motor,
    cilindros, transmision, combustible, traccion, estadoDanio,
    fotos, // Arreglo de strings con URLs: ["url1", "url2", "url3", "url4", "url5"]
    montoBase, fechaInicio, fechaFin
  } = req.body;

  // Validaciones obligatorias de negocio
  if (!fotos || !Array.isArray(fotos) || fotos.length < 5) {
    return res.status(400).json({ mensaje: 'Debe proporcionar una galería de mínimo 5 fotografías.' });
  }

  const baseNumerica = Number(montoBase);
  if (isNaN(baseNumerica) || baseNumerica < 20000) {
    return res.status(400).json({ mensaje: 'El monto base debe ser igual o superior a Q. 20,000.00.' });
  }

  let conn;
  try {
    conn = await getPool().getConnection();

    // Insertar vehículo
    const vehiculoResult = await conn.execute(
      `INSERT INTO VEHICULOS_1890199521 (
         ID_USUARIO_PROPIETARIO, VIN, TIPO_ARTICULO, ANIO, MARCA, MODELO,
         MOTOR, CILINDROS, TRANSMISION, COMBUSTIBLE, TRACCION, ESTADO_DANIO
       ) VALUES (
         :idUsuario, :vin, :tipoArticulo, :anio, :marca, :modelo,
         :motor, :cilindros, :transmision, :combustible, :traccion, :estadoDanio
       ) RETURN ID_VEHICULO INTO :idVehiculo`,
      {
        idUsuario,
        vin,
        tipoArticulo,
        anio: Number(anio),
        marca,
        modelo,
        motor,
        cilindros: Number(cilindros),
        transmision,
        combustible,
        traccion,
        estadoDanio,
        idVehiculo: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );

    const nuevoIdVehiculo = vehiculoResult.outBinds.idVehiculo[0];

    // Insertar las 5+ fotos en FOTOS_VEHICULO_1890199521
    for (let i = 0; i < fotos.length; i++) {
      await conn.execute(
        `INSERT INTO FOTOS_VEHICULO_1890199521 (ID_VEHICULO, URL_FOTO, ORDEN)
         VALUES (:idVehiculo, :url, :orden)`,
        {
          idVehiculo: nuevoIdVehiculo,
          url: fotos[i],
          orden: i + 1
        }
      );
    }

    // Programar la subasta asociada
    const fInicio = fechaInicio ? new Date(fechaInicio) : new Date();
    const fFin = fechaFin ? new Date(fechaFin) : new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 horas default

    await conn.execute(
      `INSERT INTO SUBASTAS_1890199521 (
         ID_VEHICULO, MONTO_BASE, PRECIO_ACTUAL, FECHA_INICIO, FECHA_FIN, ESTADO
       ) VALUES (
         :idVehiculo, :montoBase, :montoBase, :fechaInicio, :fechaFin, 'EN_VIVO'
       )`,
      {
        idVehiculo: nuevoIdVehiculo,
        montoBase: baseNumerica,
        fechaInicio: fInicio,
        fechaFin: fFin
      }
    );

    // Confirmar transacción completa
    await conn.commit();

    return res.status(201).json({
      mensaje: 'Vehículo publicado e ingresado a subasta exitosamente.',
      idVehiculo: nuevoIdVehiculo
    });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error('Error en publicarVehiculo:', error);
    return res.status(500).json({ mensaje: 'Error al procesar la publicación del lote.' });
  } finally {
    if (conn) await conn.close();
  }
};

// 4. Mis Publicaciones (Vehículos consignados por el usuario logueado)
const getMisPublicaciones = async (req, res) => {
  const idUsuario = req.usuario.id;
  let conn;
  try {
    conn = await getPool().getConnection();
    const result = await conn.execute(
      `SELECT 
         v.*,
         s.ID_SUBASTA,
         s.MONTO_BASE,
         s.PRECIO_ACTUAL,
         s.ESTADO AS ESTADO_SUBASTA,
         s.FECHA_FIN,
         (SELECT URL_FOTO FROM FOTOS_VEHICULO_1890199521 f 
          WHERE f.ID_VEHICULO = v.ID_VEHICULO AND f.ORDEN = 1 AND ROWNUM = 1) AS FOTO_PRINCIPAL
       FROM VEHICULOS_1890199521 v
       LEFT JOIN SUBASTAS_1890199521 s ON v.ID_VEHICULO = s.ID_VEHICULO
       WHERE v.ID_USUARIO_PROPIETARIO = :idUsuario
       ORDER BY v.FECHA_CREACION DESC`,
      [idUsuario]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Error en getMisPublicaciones:', error);
    return res.status(500).json({ mensaje: 'Error al obtener sus publicaciones.' });
  } finally {
    if (conn) await conn.close();
  }
};

// 5. Editar publicación de vehículo
const editarVehiculo = async (req, res) => {
  const idUsuario = req.usuario.id;
  const { id } = req.params;
  const { tipoArticulo, anio, marca, modelo, motor, cilindros, transmision, combustible, traccion, estadoDanio } = req.body;

  let conn;
  try {
    conn = await getPool().getConnection();

    // Validar propiedad del vehículo
    const checkVehiculo = await conn.execute(
      `SELECT ID_USUARIO_PROPIETARIO FROM VEHICULOS_1890199521 WHERE ID_VEHICULO = :id`,
      [Number(id)]
    );

    if (checkVehiculo.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Vehículo no encontrado.' });
    }

    if (checkVehiculo.rows[0].ID_USUARIO_PROPIETARIO !== idUsuario) {
      return res.status(403).json({ mensaje: 'No tiene permisos para modificar esta publicación.' });
    }

    await conn.execute(
      `UPDATE VEHICULOS_1890199521
       SET TIPO_ARTICULO = :tipoArticulo,
           ANIO = :anio,
           MARCA = :marca,
           MODELO = :modelo,
           MOTOR = :motor,
           CILINDROS = :cilindros,
           TRANSMISION = :transmision,
           COMBUSTIBLE = :combustible,
           TRACCION = :traccion,
           ESTADO_DANIO = :estadoDanio
       WHERE ID_VEHICULO = :id`,
      {
        tipoArticulo,
        anio: Number(anio),
        marca,
        modelo,
        motor,
        cilindros: Number(cilindros),
        transmision,
        combustible,
        traccion,
        estadoDanio,
        id: Number(id)
      },
      { autoCommit: true }
    );

    return res.json({ mensaje: 'Publicación actualizada correctamente.' });
  } catch (error) {
    console.error('Error en editarVehiculo:', error);
    return res.status(500).json({ mensaje: 'Error al actualizar el vehículo.' });
  } finally {
    if (conn) await conn.close();
  }
};

module.exports = {
  getCatalogo,
  getDetalleVehiculo,
  publicarVehiculo,
  getMisPublicaciones,
  editarVehiculo
};