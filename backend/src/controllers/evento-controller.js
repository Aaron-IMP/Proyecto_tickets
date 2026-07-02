const eventoService = require('../services/evento-service');

const listar = async (req, res) => {
  try {
    const eventos = await eventoService.listarEventos();
    return res.status(200).json({ eventos });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const obtener = async (req, res) => {
  try {
    const evento = await eventoService.obtenerEvento(req.params.id);
    return res.status(200).json({ evento });
  } catch (error) {
    if (error.message === 'EVENTO_NO_ENCONTRADO') {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const crear = async (req, res) => {
  try {
    const { nombre, fechaHora, categorias } = req.body;

    if (!nombre || !fechaHora || !categorias || categorias.length === 0) {
      return res.status(400).json({ error: 'Nombre, fechaHora y al menos una categoría son requeridos' });
    }

    const evento = await eventoService.crearNuevoEvento(req.body, req.usuario.id);
    return res.status(201).json({ mensaje: 'Evento creado', evento });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const verMetricas = async (req, res) => {
  try {
    const datos = await eventoService.metricas(req.params.id);
    return res.status(200).json(datos);
  } catch (error) {
    if (error.message === 'EVENTO_NO_ENCONTRADO') {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const verCompradores = async (req, res) => {
  try {
    const lista = await eventoService.compradores(req.params.id);
    return res.status(200).json({ compradores: lista });
  } catch (error) {
    if (error.message === 'EVENTO_NO_ENCONTRADO') {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const listarAdmin = async (req, res) => {
  try {
    const eventos = await eventoService.listarTodosLosEventos();
    return res.status(200).json({ eventos });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const cancelar = async (req, res) => {
  try {
    const resultado = await eventoService.cancelar(req.params.id);
    return res.status(200).json({
      mensaje: 'Evento cancelado exitosamente',
      tickets_afectados: resultado.tickets_afectados,
    });
  } catch (error) {
    if (error.message === 'EVENTO_NO_ENCONTRADO') {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    if (error.message === 'EVENTO_YA_CANCELADO') {
      return res.status(400).json({ error: 'El evento ya está cancelado' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { listar, listarAdmin, obtener, crear, verMetricas, verCompradores, cancelar };
