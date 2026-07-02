const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth-routes');
const eventoRoutes = require('./routes/evento-routes');
const ticketRoutes = require('./routes/ticket-routes');
const reventaRoutes    = require('./routes/reventa-routes');
const incidenteRoutes  = require('./routes/incidente-routes');
const pagoRoutes       = require('./routes/pago-routes');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/eventos', eventoRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/reventas',    reventaRoutes);
app.use('/api/incidentes', incidenteRoutes);
app.use('/api/pagos',      pagoRoutes);

// Manejador global de errores — siempre al final
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  res.status(status).json({ error: message });
});

module.exports = app;
