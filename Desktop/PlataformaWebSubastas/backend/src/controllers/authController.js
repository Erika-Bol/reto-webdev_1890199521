const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const oracledb = require('oracledb');
const { getPool } = require('../config/oracle');

// Registro de usuario
const registrarUsuario = async (req, res) => {
  const { nombres, apellidos, correo, telefono, password } = req.body;

  if (!nombres || !apellidos || !correo || !telefono || !password) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
  }

  let conn;
  try {
    conn = await getPool().getConnection();

    // 1. Validar si el correo ya existe
    const checkUser = await conn.execute(
      `SELECT ID_USUARIO FROM USUARIOS_1890199521 WHERE LOWER(CORREO) = LOWER(:correo)`,
      [correo]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ mensaje: 'El correo electrónico ya está registrado.' });
    }

    // 2. Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Insertar usuario
    const result = await conn.execute(
      `INSERT INTO USUARIOS_1890199521 (NOMBRES, APELLIDOS, CORREO, TELEFONO, PASSWORD_HASH, ROL)
       VALUES (:nombres, :apellidos, :correo, :telefono, :passwordHash, 'USUARIO')
       RETURN ID_USUARIO INTO :idGenerado`,
      {
        nombres,
        apellidos,
        correo,
        telefono,
        passwordHash,
        idGenerado: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );

    const nuevoId = result.outBinds.idGenerado[0];

    return res.status(201).json({
      mensaje: 'Usuario registrado exitosamente.',
      usuarioId: nuevoId
    });
  } catch (error) {
    console.error('Error en registrarUsuario:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor al registrar usuario.' });
  } finally {
    if (conn) await conn.close();
  }
};

// Login de usuario
const loginUsuario = async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ mensaje: 'Debe ingresar correo y contraseña.' });
  }

  let conn;
  try {
    conn = await getPool().getConnection();

    const result = await conn.execute(
      `SELECT ID_USUARIO, NOMBRES, APELLIDOS, CORREO, PASSWORD_HASH, ROL 
       FROM USUARIOS_1890199521 
       WHERE LOWER(CORREO) = LOWER(:correo)`,
      [correo]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
    }

    const user = result.rows[0];

    // Verificar hash
    const passwordValido = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!passwordValido) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.ID_USUARIO,
        correo: user.CORREO,
        nombres: user.NOMBRES,
        rol: user.ROL
      },
      process.env.JWT_SECRET || 'copart_super_secret_key_2026',
      { expiresIn: '8h' }
    );

    return res.json({
      mensaje: 'Autenticación exitosa',
      token,
      usuario: {
        id: user.ID_USUARIO,
        nombres: user.NOMBRES,
        apellidos: user.APELLIDOS,
        correo: user.CORREO,
        rol: user.ROL
      }
    });
  } catch (error) {
    console.error('Error en loginUsuario:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor al autenticar.' });
  } finally {
    if (conn) await conn.close();
  }
};

module.exports = { registrarUsuario, loginUsuario };