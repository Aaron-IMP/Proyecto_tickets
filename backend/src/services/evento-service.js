const {
  listarTodosEventos,
  cancelarEvento,
  listarEventosActivos,
  buscarEventoPorId,
  obtenerCategoriasPorEvento,
  crearEvento,
  crearCategoriaTicket,
  obtenerMetricasPorEvento,
  obtenerCompradores,
} = require('../queries/evento-queries');

const listarEventos = async () => {
  return await listarEventosActivos();
};

const obtenerEvento = async (id) => {
  const evento = await buscarEventoPorId(id);
  if (!evento) {
    throw new Error('EVENTO_NO_ENCONTRADO');
  }

  const categorias = await obtenerCategoriasPorEvento(id);
  return { ...evento, categorias };
};

const crearNuevoEvento = async (datos, administradorId) => {
  const { nombre, nombreArtista, fechaHora, lugar, descripcion, bannerUrl, categorias } = datos;

  const evento = await crearEvento(
    nombre, nombreArtista, fechaHora, lugar, descripcion, bannerUrl, administradorId
  );

  const categoriasCreadas = await Promise.all(
    categorias.map((cat) =>
      crearCategoriaTicket(evento.id, cat.nombreZona, cat.precio, cat.stockTotal, cat.stockTotal)
    )
  );

  return { ...evento, categorias: categoriasCreadas };
};

const metricas = async (eventoId) => {
  const evento = await buscarEventoPorId(eventoId);
  if (!evento) throw new Error('EVENTO_NO_ENCONTRADO');

  const por_zona = await obtenerMetricasPorEvento(eventoId);

  const tickets_vendidos  = por_zona.reduce((s, z) => s + Number(z.vendidos), 0);
  const recaudacion_total = por_zona.reduce((s, z) => s + Number(z.recaudacion), 0);
  const stock_total_sum   = por_zona.reduce((s, z) => s + Number(z.stock_total), 0);
  const porcentaje_ocupacion = stock_total_sum > 0
    ? Math.round((tickets_vendidos / stock_total_sum) * 100)
    : 0;

  return { recaudacion_total, tickets_vendidos, porcentaje_ocupacion, por_zona };
};

const compradores = async (eventoId) => {
  const evento = await buscarEventoPorId(eventoId);
  if (!evento) throw new Error('EVENTO_NO_ENCONTRADO');

  const lista = await obtenerCompradores(eventoId);
  return lista;
};

const listarTodosLosEventos = async () => {
  return await listarTodosEventos();
};

const cancelar = async (eventoId) => {
  return await cancelarEvento(eventoId);
};

module.exports = { listarEventos, listarTodosLosEventos, obtenerEvento, crearNuevoEvento, metricas, compradores, cancelar };
