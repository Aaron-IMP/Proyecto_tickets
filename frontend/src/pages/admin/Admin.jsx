import { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Trash2, Calendar, MapPin, Layers, LayoutGrid, Users, CheckCircle2, BarChart2, X, TrendingUp, Ticket, UserCheck, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { listarEventosAdminApi, crearEventoApi, metricasEventoApi, compradoresEventoApi, cancelarEventoApi } from '../../api/eventos-api';
import { useAuth } from '../../context/AuthContext';
import { formatearFecha, formatearPrecio } from '../../utils/formato';
import { useModalAccesible } from '../../hooks/useModalAccesible';

const ESTADO = {
  activo:     { cls: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30', label: 'Activo' },
  cancelado:  { cls: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30', label: 'Cancelado' },
  finalizado: { cls: 'bg-[#2A2A35] text-[#96969F] border-[#3A3A48]',       label: 'Finalizado' },
};

const FORM_INICIAL = {
  nombre: '', nombreArtista: '', fechaHora: '',
  lugar: '', descripcion: '', bannerUrl: '',
};

const zonaVacia = () => ({ _id: Date.now() + Math.random(), nombreZona: '', precio: '', stockTotal: '' });

/* ─── Skeleton ────────────────────────────────── */
function Skeleton() {
  return (
    <div className="bg-[#15151D] border border-[#2A2A35] rounded-xl p-4 animate-pulse space-y-3">
      <div className="flex justify-between gap-3">
        <div className="h-4 bg-[#2A2A35] rounded w-1/2" />
        <div className="h-5 bg-[#2A2A35] rounded-full w-16" />
      </div>
      <div className="h-3 bg-[#2A2A35] rounded w-2/3" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-3 bg-[#2A2A35] rounded" />
        <div className="h-3 bg-[#2A2A35] rounded" />
        <div className="h-3 bg-[#2A2A35] rounded col-span-2" />
      </div>
      <div className="flex justify-between pt-1 border-t border-[#2A2A35]">
        <div className="h-3 bg-[#2A2A35] rounded w-32" />
        <div className="h-3 bg-[#2A2A35] rounded w-20" />
      </div>
    </div>
  );
}

/* ─── ModalDetalle ────────────────────────────── */
function ModalDetalle({ evento, metricas, compradores, cargando, onCerrar }) {
  useModalAccesible(onCerrar);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-detalle"
        className="w-full max-w-2xl bg-[#15151D] border border-[#3A3A48] rounded-2xl
                      flex flex-col max-h-[90vh] shadow-2xl shadow-black/60">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[#2A2A35] shrink-0">
          <div className="min-w-0 pr-4">
            <h2 id="titulo-detalle" className="text-white font-bold text-lg truncate">{evento.nombre_artista}</h2>
            <p className="text-[#A8A8B3] text-sm truncate">{evento.nombre}</p>
          </div>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg
                       border border-[#3A3A48] text-[#96969F] hover:text-white
                       hover:border-[#7C3AED]/50 transition-all cursor-pointer bg-transparent"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {cargando ? (
            <div className="space-y-4 animate-pulse">
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-[#2A2A35] rounded-xl h-20" />
                ))}
              </div>
              <div className="bg-[#2A2A35] rounded-xl h-32" />
              <div className="bg-[#2A2A35] rounded-xl h-40" />
            </div>
          ) : (
            <>
              {/* Métricas resumen — apiladas verticalmente */}
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Recaudación total', value: formatearPrecio(metricas.recaudacion_total), icon: TrendingUp, color: 'text-[#10B981]', border: 'border-[#10B981]/20' },
                  { label: 'Tickets vendidos',  value: metricas.tickets_vendidos,                  icon: Ticket,     color: 'text-[#7C3AED]', border: 'border-[#7C3AED]/20' },
                  { label: 'Ocupación',          value: `${metricas.porcentaje_ocupacion}%`,         icon: BarChart2,  color: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20' },
                ].map(({ label, value, icon: Icon, color, border }) => (
                  <div key={label} className={`bg-[#0A0A0F] border ${border} rounded-xl px-4 py-3 flex items-center gap-3`}>
                    <Icon size={18} className={`${color} shrink-0`} />
                    <p className="text-[#96969F] text-xs font-medium flex-1 min-w-0">{label}</p>
                    <p className={`text-lg font-extrabold ${color} font-mono shrink-0 text-right`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Tabla de zonas */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={14} className="text-[#7C3AED]" />
                  <h3 className="text-white text-sm font-bold">Ventas por zona</h3>
                </div>
                {metricas.por_zona.length === 0 ? (
                  <p className="text-[#96969F] text-xs text-center py-4">Sin zonas registradas.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#2A2A35]">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#2A2A35] text-[#96969F]">
                          <th className="text-left px-3 py-2.5 font-medium">Zona</th>
                          <th className="text-right px-3 py-2.5 font-medium">Precio</th>
                          <th className="text-right px-3 py-2.5 font-medium">Stock</th>
                          <th className="text-right px-3 py-2.5 font-medium">Vendidos</th>
                          <th className="text-right px-3 py-2.5 font-medium">Disponibles</th>
                          <th className="text-right px-3 py-2.5 font-medium">Recaudación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metricas.por_zona.map((z, i) => (
                          <tr key={i} className="border-b border-[#2A2A35]/50 last:border-0
                                                  hover:bg-[#2A2A35]/30 transition-colors">
                            <td className="px-3 py-2.5 text-white font-medium">{z.nombre_zona}</td>
                            <td className="px-3 py-2.5 text-[#A8A8B3] text-right font-mono">{formatearPrecio(z.precio)}</td>
                            <td className="px-3 py-2.5 text-[#A8A8B3] text-right">{z.stock_total}</td>
                            <td className="px-3 py-2.5 text-[#7C3AED] text-right font-semibold">{z.vendidos}</td>
                            <td className="px-3 py-2.5 text-[#10B981] text-right">{z.disponibles}</td>
                            <td className="px-3 py-2.5 text-[#10B981] text-right font-mono font-semibold">{formatearPrecio(z.recaudacion)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Últimos compradores */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck size={14} className="text-[#7C3AED]" />
                  <h3 className="text-white text-sm font-bold">Últimos compradores</h3>
                </div>
                {compradores.length === 0 ? (
                  <p className="text-[#96969F] text-xs text-center py-4">Ningún ticket vendido aún.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#2A2A35]">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#2A2A35] text-[#96969F]">
                          <th className="text-left px-3 py-2.5 font-medium">Comprador</th>
                          <th className="text-left px-3 py-2.5 font-medium">Zona</th>
                          <th className="text-right px-3 py-2.5 font-medium">Precio</th>
                          <th className="text-center px-3 py-2.5 font-medium">Estado</th>
                          <th className="text-right px-3 py-2.5 font-medium">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compradores.map((c, i) => (
                          <tr key={i} className="border-b border-[#2A2A35]/50 last:border-0
                                                  hover:bg-[#2A2A35]/30 transition-colors">
                            <td className="px-3 py-2.5">
                              <p className="text-white font-medium truncate max-w-[120px]">{c.nombre}</p>
                              <p className="text-[#96969F] truncate max-w-[120px]">{c.email}</p>
                            </td>
                            <td className="px-3 py-2.5 text-[#A8A8B3]">{c.nombre_zona}</td>
                            <td className="px-3 py-2.5 text-[#A8A8B3] text-right font-mono">{formatearPrecio(c.precio)}</td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
                                ${c.estado === 'usado'
                                  ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                                  : 'bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/30'}`}>
                                {c.estado}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-[#96969F] text-right whitespace-nowrap">
                              {formatearFecha(c.fecha_emision)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── ModalConfirmarCancelacion ───────────────── */
function ModalConfirmarCancelacion({ evento, cancelando, onConfirmar, onCerrar }) {
  useModalAccesible(() => { if (!cancelando) onCerrar(); }, { bloquearCierre: cancelando });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !cancelando) onCerrar(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-cancelar"
        className="w-full max-w-md bg-[#15151D] border border-[#3A3A48] rounded-2xl p-6 shadow-2xl shadow-black/60">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#EF4444]/10 rounded-xl flex items-center justify-center shrink-0">
            <Ban size={18} className="text-[#EF4444]" />
          </div>
          <div className="min-w-0">
            <h2 id="titulo-cancelar" className="text-white font-bold">¿Cancelar este evento?</h2>
            <p className="text-[#A8A8B3] text-xs truncate">{evento.nombre_artista} — {evento.nombre}</p>
          </div>
        </div>

        <p className="text-[#A8A8B3] text-sm mb-6 leading-relaxed">
          Esta acción marcará todos los tickets como reembolsados. No se puede deshacer.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCerrar}
            disabled={cancelando}
            className="flex-1 py-2.5 border border-[#3A3A48] text-[#A8A8B3] hover:text-white
                       hover:border-[#7C3AED]/50 text-sm font-semibold rounded-xl transition-all
                       cursor-pointer bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            No, mantener
          </button>
          <button
            onClick={onConfirmar}
            disabled={cancelando}
            className="flex-1 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm
                       font-semibold rounded-xl transition-all cursor-pointer border-0
                       disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {cancelando ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Cancelando...
              </span>
            ) : 'Sí, cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── EventoAdminCard ─────────────────────────── */
function EventoAdminCard({ evento, onVerDetalle, onCancelar }) {
  const badge = ESTADO[evento.estado] || ESTADO.activo;
  return (
    <div className="bg-[#15151D] border border-[#3A3A48] rounded-xl p-4
                    hover:border-[#7C3AED]/40 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-white font-bold truncate">{evento.nombre_artista}</p>
          <p className="text-[#A8A8B3] text-xs truncate">{evento.nombre}</p>
        </div>
        <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-[#96969F]">
        <span className="flex items-center gap-1.5">
          <Calendar size={11} className="text-[#7C3AED] shrink-0" />
          <span className="truncate">{formatearFecha(evento.fecha_hora)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Layers size={11} className="text-[#7C3AED] shrink-0" />
          {Number(evento.total_zonas) || 0} zona{Number(evento.total_zonas) !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1.5 col-span-2">
          <MapPin size={11} className="text-[#7C3AED] shrink-0" />
          <span className="truncate">{evento.lugar}</span>
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-[#2A2A35] flex flex-col gap-2
                      sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#96969F] text-xs">
            {Number(evento.stock_total || 0).toLocaleString()} entradas disponibles
          </span>
          <span className="text-[#7C3AED] text-xs font-bold font-mono">
            Desde {formatearPrecio(evento.precio_desde)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onVerDetalle(evento)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1 text-[10px]
                       font-semibold text-[#A8A8B3] hover:text-white border border-[#3A3A48]
                       hover:border-[#7C3AED]/50 px-2.5 py-1.5 rounded-lg transition-all
                       cursor-pointer bg-transparent"
          >
            <BarChart2 size={11} /> Métricas
          </button>
          {evento.estado === 'activo' && (
            <button
              onClick={() => onCancelar(evento)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 text-[10px]
                         font-semibold text-white bg-[#EF4444] hover:bg-[#DC2626]
                         px-2.5 py-1.5 rounded-lg transition-all cursor-pointer border-0"
            >
              <Ban size={11} /> Cancelar evento
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── InputField ──────────────────────────────── */
function InputField({ label, ...props }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[#A8A8B3] mb-1.5">{label}</span>
      <input
        {...props}
        className="w-full px-3.5 py-2.5 bg-[#2A2A35] border border-[#3A3A48] rounded-xl
                   text-white text-sm placeholder-[#96969F] outline-none
                   focus:border-[#7C3AED] transition-all"
      />
    </label>
  );
}

/* ─── ZonaFila ────────────────────────────────── */
function ZonaFila({ zona, onChange, onRemove, canRemove }) {
  return (
    <div className="flex gap-2 items-start bg-[#1A1A24] border border-[#3A3A48] rounded-xl p-3">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          value={zona.nombreZona}
          onChange={(e) => onChange('nombreZona', e.target.value)}
          placeholder="Zona (VIP…)"
          aria-label="Nombre de la zona"
          className="px-3 py-2 bg-[#2A2A35] border border-[#3A3A48] rounded-lg
                     text-white text-xs placeholder-[#96969F] outline-none
                     focus:border-[#7C3AED] transition-all"
        />
        <input
          type="number"
          min="1"
          value={zona.precio}
          onChange={(e) => onChange('precio', e.target.value)}
          placeholder="Precio"
          aria-label="Precio de la zona"
          className="px-3 py-2 bg-[#2A2A35] border border-[#3A3A48] rounded-lg
                     text-white text-xs placeholder-[#96969F] outline-none
                     focus:border-[#7C3AED] transition-all"
        />
        <input
          type="number"
          min="1"
          value={zona.stockTotal}
          onChange={(e) => onChange('stockTotal', e.target.value)}
          placeholder="Stock"
          aria-label="Stock de la zona"
          className="px-3 py-2 bg-[#2A2A35] border border-[#3A3A48] rounded-lg
                     text-white text-xs placeholder-[#96969F] outline-none
                     focus:border-[#7C3AED] transition-all"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label="Eliminar zona"
        className="w-8 h-8 flex items-center justify-center shrink-0 rounded-lg
                   border border-[#3A3A48] text-[#96969F] hover:text-[#EF4444]
                   hover:border-[#EF4444]/40 transition-all
                   disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer bg-transparent"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

/* ─── Admin ───────────────────────────────────── */
export default function Admin() {
  const { usuario } = useAuth();

  const [form, setForm]         = useState(FORM_INICIAL);
  const [zonas, setZonas]       = useState([zonaVacia()]);
  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [exitoMsg, setExitoMsg]   = useState('');

  const [eventos, setEventos]   = useState([]);
  const [cargando, setCargando] = useState(true);

  const [eventoDetalle,   setEventoDetalle]   = useState(null);
  const [metricas,        setMetricas]        = useState(null);
  const [compradores,     setCompradores]     = useState([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const [eventoAConfirmar, setEventoAConfirmar] = useState(null);
  const [cancelando,       setCancelando]       = useState(false);

  const cargarEventos = useCallback(() => {
    setCargando(true);
    listarEventosAdminApi()
      .then(({ data }) => setEventos(data.eventos))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargarEventos(); }, [cargarEventos]);

  const abrirDetalle = async (evento) => {
    setEventoDetalle(evento);
    setMetricas(null);
    setCompradores([]);
    setCargandoDetalle(true);
    try {
      const [{ data: m }, { data: c }] = await Promise.all([
        metricasEventoApi(evento.id),
        compradoresEventoApi(evento.id),
      ]);
      setMetricas(m);
      setCompradores(c.compradores);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarDetalle = () => setEventoDetalle(null);

  const iniciarCancelacion = (evento) => setEventoAConfirmar(evento);
  const cerrarModalCancelacion = () => setEventoAConfirmar(null);

  const confirmarCancelacion = async () => {
    setCancelando(true);
    try {
      const { data } = await cancelarEventoApi(eventoAConfirmar.id);
      toast.success(`Evento cancelado. ${data.tickets_afectados} ticket${data.tickets_afectados !== 1 ? 's' : ''} marcado${data.tickets_afectados !== 1 ? 's' : ''} como reembolsado${data.tickets_afectados !== 1 ? 's' : ''}`);
      setEventoAConfirmar(null);
      cargarEventos();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cancelar el evento.');
    } finally {
      setCancelando(false);
    }
  };

  const setField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const agregarZona    = () => setZonas(prev => [...prev, zonaVacia()]);
  const eliminarZona   = (id) => setZonas(prev => prev.filter(z => z._id !== id));
  const actualizarZona = (id, key, val) =>
    setZonas(prev => prev.map(z => z._id === id ? { ...z, [key]: val } : z));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorForm('');
    setExitoMsg('');

    const obligatorios = ['nombre', 'nombreArtista', 'fechaHora', 'lugar'];
    for (const k of obligatorios) {
      if (!form[k].trim()) {
        setErrorForm('Completa todos los campos obligatorios (*).');
        return;
      }
    }

    for (const z of zonas) {
      if (!z.nombreZona.trim() || !z.precio || !z.stockTotal) {
        setErrorForm('Completa todos los campos de cada zona.');
        return;
      }
      if (Number(z.precio) <= 0 || Number(z.stockTotal) <= 0) {
        setErrorForm('El precio y el stock de cada zona deben ser mayores a 0.');
        return;
      }
    }

    setEnviando(true);
    try {
      const payload = {
        ...form,
        categorias: zonas.map(z => ({
          nombreZona: z.nombreZona.trim(),
          precio:     Number(z.precio),
          stockTotal: Number(z.stockTotal),
        })),
      };
      await crearEventoApi(payload);
      setExitoMsg('¡Evento creado exitosamente!');
      setForm(FORM_INICIAL);
      setZonas([zonaVacia()]);
      cargarEventos();
    } catch (err) {
      setErrorForm(err.response?.data?.error || 'Error al crear el evento.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Panel de administración</h1>
        <p className="text-[#A8A8B3] text-sm mt-1">Bienvenido, {usuario?.nombre}</p>
      </div>

      {/* Layout dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

        {/* ── Columna izquierda: formulario (2/5) ── */}
        <div className="lg:col-span-2">
          <div className="bg-[#15151D] border border-[#3A3A48] rounded-2xl p-6">

            <div className="flex items-center gap-2 mb-6">
              <LayoutGrid size={18} className="text-[#7C3AED]" />
              <h2 className="text-white font-bold">Crear evento</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <InputField
                label="Nombre del evento *"
                value={form.nombre}
                onChange={setField('nombre')}
                placeholder="Ej: Noche de Rock Clásico"
              />
              <InputField
                label="Nombre del artista *"
                value={form.nombreArtista}
                onChange={setField('nombreArtista')}
                placeholder="Ej: The Rolling Stones"
              />
              <InputField
                label="Fecha y hora *"
                type="datetime-local"
                value={form.fechaHora}
                onChange={setField('fechaHora')}
              />
              <InputField
                label="Lugar / Venue *"
                value={form.lugar}
                onChange={setField('lugar')}
                placeholder="Ej: Estadio Nacional, Lima"
              />

              <div>
                <label htmlFor="evento-descripcion" className="block text-xs font-medium text-[#A8A8B3] mb-1.5">
                  Descripción
                </label>
                <textarea
                  id="evento-descripcion"
                  value={form.descripcion}
                  onChange={setField('descripcion')}
                  placeholder="Describe el evento..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-[#2A2A35] border border-[#3A3A48] rounded-xl
                             text-white text-sm placeholder-[#96969F] outline-none resize-none
                             focus:border-[#7C3AED] transition-all"
                />
              </div>

              <InputField
                label="URL de imagen (opcional)"
                value={form.bannerUrl}
                onChange={setField('bannerUrl')}
                placeholder="https://..."
              />

              {/* Zonas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-[#A8A8B3]">
                    Zonas / Categorías *
                  </label>
                  <p className="text-[#96969F] text-[10px]">Zona · Precio · Stock</p>
                </div>

                <div className="space-y-2">
                  {zonas.map((z) => (
                    <ZonaFila
                      key={z._id}
                      zona={z}
                      onChange={(key, val) => actualizarZona(z._id, key, val)}
                      onRemove={() => eliminarZona(z._id)}
                      canRemove={zonas.length > 1}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={agregarZona}
                  className="mt-2 w-full py-2.5 flex items-center justify-center gap-1.5
                             border border-dashed border-[#3A3A48] text-[#96969F]
                             hover:text-white hover:border-[#7C3AED]/50
                             text-xs font-medium rounded-xl transition-all
                             cursor-pointer bg-transparent"
                >
                  <PlusCircle size={13} /> Agregar zona
                </button>
              </div>

              {/* Mensajes */}
              {errorForm && (
                <div className="px-4 py-3 bg-[#EF4444]/10 border border-[#EF4444]/25
                                rounded-xl text-[#EF4444] text-xs">
                  {errorForm}
                </div>
              )}
              {exitoMsg && (
                <div className="px-4 py-3 bg-[#10B981]/10 border border-[#10B981]/25
                                rounded-xl text-[#10B981] text-xs flex items-center gap-2">
                  <CheckCircle2 size={14} /> {exitoMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="w-full py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold
                           text-sm rounded-xl transition-all shadow-lg shadow-[#7C3AED]/25
                           disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-0
                           active:scale-[0.99]"
              >
                {enviando ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creando...
                  </span>
                ) : 'Crear evento'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Columna derecha: lista (3/5) ──────── */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-[#7C3AED]" />
              <h2 className="text-white font-bold">Eventos creados</h2>
            </div>
            {!cargando && (
              <span className="text-[#96969F] text-xs">
                {eventos.length} evento{eventos.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {cargando ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} />)}
            </div>
          ) : eventos.length === 0 ? (
            <div className="bg-[#15151D] border border-[#3A3A48] rounded-2xl py-20 text-center">
              <div className="w-16 h-16 bg-[#1F1F2B] rounded-2xl flex items-center
                              justify-center mx-auto mb-4">
                <LayoutGrid size={28} className="text-[#3A3A48]" />
              </div>
              <p className="text-white font-semibold mb-1">No has creado eventos aún</p>
              <p className="text-[#A8A8B3] text-sm">
                Usa el formulario para agregar tu primer evento.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {eventos.map(e => (
                <EventoAdminCard key={e.id} evento={e} onVerDetalle={abrirDetalle} onCancelar={iniciarCancelacion} />
              ))}
            </div>
          )}
        </div>

      </div>

      {eventoDetalle && (
        <ModalDetalle
          evento={eventoDetalle}
          metricas={metricas}
          compradores={compradores}
          cargando={cargandoDetalle}
          onCerrar={cerrarDetalle}
        />
      )}

      {eventoAConfirmar && (
        <ModalConfirmarCancelacion
          evento={eventoAConfirmar}
          cancelando={cancelando}
          onConfirmar={confirmarCancelacion}
          onCerrar={cerrarModalCancelacion}
        />
      )}
    </div>
  );
}
