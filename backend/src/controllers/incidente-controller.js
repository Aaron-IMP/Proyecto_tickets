const { crearIncidente } = require('../queries/incidente-queries');

const reportar = async (req, res) => {
  try {
    const { descripcion, ticketUuid } = req.body;

    if (!descripcion || !descripcion.trim()) {
      return res.status(400).json({ error: 'La descripción es requerida' });
    }
    if (descripcion.trim().length < 10) {
      return res.status(400).json({ error: 'La descripción debe tener al menos 10 caracteres' });
    }

    await crearIncidente(req.usuario.id, descripcion.trim(), ticketUuid || null);

    return res.status(201).json({ mensaje: 'Incidente reportado' });
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { reportar };
