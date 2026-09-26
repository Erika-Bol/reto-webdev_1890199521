const oracledb = require('oracledb');
require('dotenv').config();

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool;

async function initOraclePool() {
  try {
    pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 2
    });
    console.log('Conectado a Oracle Database (FREEPDB1)');
  } catch (error) {
    console.error('Error al inicializar el pool de Oracle:', error);
    process.exit(1);
  }
}

function getPool() {
  return pool;
}

module.exports = { initOraclePool, getPool };