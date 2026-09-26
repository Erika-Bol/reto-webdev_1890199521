const { getPool } = require('../config/oracle');
const oracledb = require('oracledb');
require('dotenv').config();

const SUFFIX = process.env.CARNET_SUFFIX || '';

module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('join_auction', (auctionId) => {
      socket.join(`auction_${auctionId}`);
    });

    socket.on('submit_bid', async ({ auctionId, userId, amount }) => {
      let conn;
      try {
        conn = await getPool().getConnection();

        const result = await conn.execute(
          `BEGIN REGISTRAR_PUJA${SUFFIX}(:auctionId, :userId, :amount, :res); END;`,
          {
            auctionId: Number(auctionId),
            userId: Number(userId),
            amount: Number(amount),
            res: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 250 }
          }
        );

        const status = result.outBinds.res;

        if (status === 'OK') {
          io.to(`auction_${auctionId}`).emit('bid_update', {
            auctionId,
            currentPrice: amount,
            winnerId: userId,
            timestamp: new Date().toISOString()
          });
        } else {
          socket.emit('bid_error', { message: status });
        }
      } catch (err) {
        socket.emit('bid_error', { message: 'Fallo interno al procesar puja' });
      } finally {
        if (conn) await conn.close();
      }
    });

    socket.on('disconnect', () => {});
  });
};