const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { initOraclePool } = require('./config/oracle');
const registerAuctionSockets = require('./sockets/auctionSocket');

// Rutas
const authRoutes = require('./routes/authRoutes');
const vehiclesRoutes = require('./routes/vehiclesRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Endpoints REST
app.use('/api/auth', authRoutes);
app.use('/api/vehiculos', vehiclesRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'Online', bd: 'FREEPDB1' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

registerAuctionSockets(io);

const PORT = process.env.PORT || 4000;

initOraclePool().then(() => {
  server.listen(PORT, () => {
    console.log(`Web API y WebSockets escuchando en puerto ${PORT}`);
  });
});