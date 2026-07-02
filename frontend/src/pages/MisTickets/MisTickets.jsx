import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, QrCode, Ticket, Tag, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { misTicketsApi } from '../../api/tickets-api';
import { publicarReventaApi, cancelarReventaApi, misPublicacionesApi, misVentasApi } from '../../api/reventas-api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatearFecha, formatearPrecio } from '../../utils/formato';
import { useModalAccesible } from '../../hooks/useModalAccesible';

const BADGE = {
  activo:      { cls: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30', label: 'Activo' },
  usado:       { cls: 'bg-[#2A2A35] text-[#96969F] border-[#3A3A48]',       label: 'Usado' },
  reembolsado: { cls: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30', label: 'Reembolsado' },
  en_reventa:  { cls: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30', label: 'En reventa' },
  revendido:   { cls: 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30', label: 'Revendido' },
};

/* ─── ModalRevender ───────────────────────────── */
function ModalRevender({ ticket, publicando, onPublicar, onCerrar }) {
  const [precio, setPrecio] = useState('');
  const valido = precio !== '' && Number(precio) > 0;

  useModalAccesible(() => { if (!publicando) onCerrar(); }, { bloquearCierre: publicando });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !publicando) onCerrar(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-revender"
        className="w-full max-w-sm bg-[#15151D] border border-[#3A3A48] rounded-2xl p-6 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 bg-[#7C3AED]/10 rounded-xl flex items-center justify-center shrink-0">
              <Tag size={18} className="text-[#7C3AED]" />
            </div>
            <div className="min-w-0">
              <h2 id="titulo-revender" className="text-white font-bold">Revender ticket</h2>
              <p className="text-[#A8A8B3] text-xs truncate">
                {ticket.nombre_artista} — {ticket.nombre_zona}
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            disabled={publicando}
            aria-label="Cerrar"
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border border-[#3A3A48]
                       text-[#96969F] hover:text-white hover:border-[#7C3AED]/50 transition-all
                       cursor-pointer bg-transparent disabled:opacity-40"
          >
            <X size={15} />
          </button>
        </div>

        <div className="mb-5">
          <label htmlFor="precio-reventa" className="block text-xs font-medium text-[#A8A8B3] mb-1.5">
            Precio de reventa (S/)
          </label>
          <input
            id="precio-reventa"
            type="number"
            min="1"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="Ej: 120"
            autoFocus
            className="w-full px-3.5 py-2.5 bg-[#2A2A35] border border-[#3A3A48] rounded-xl
                       text-white text-sm placeholder-[#96969F] outline-none
                       focus:border-[#7C3AED] transition-all"
          />
          <p className="text-[#96969F] text-[10px] mt-1.5">
            Precio original: {formatearPrecio(ticket.precio)}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCerrar}
            disabled={publicando}
            className="flex-1 py-2.5 border border-[#3A3A48] text-[#A8A8B3] hover:text-white
                       hover:border-[#7C3AED]/50 text-sm font-semibold rounded-xl transition-all
                       cursor-pointer bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={() => onPublicar(ticket.codigo_uuid, precio)}
            disabled={publicando || !valido}
            className="flex-1 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm
                       font-semibold rounded-xl transition-all cursor-pointer border-0
                       disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {publicando ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Publicando...
              </span>
            ) : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── TicketCard ──────────────────────────────── */
function TicketCard({ ticket, reventaInfo, onRevender, onCancelarReventa, cancelando }) {
  const navigate = useNavigate();
  const badge     = BADGE[ticket.estado] || BADGE.activo;
  const activo    = ticket.estado === 'activo';
  const enReventa = ticket.estado === 'en_reventa';

  return (
    <div className={`bg-[#15151D] border rounded-[12px] overflow-hidden transition-all
                     ${activo || enReventa
                       ? 'border-[#3A3A48] hover:border-[#7C3AED]/50'
                       : 'border-[#2A2A35] opacity-75'}`}>
      <div className="flex">

        {/* Franja lateral */}
        <div className={`w-1.5 shrink-0
                         ${activo    ? 'bg-[#7C3AED]' :
                           enReventa ? 'bg-[#F59E0B]' :
                           'bg-[#3A3A48]'}`} />

        {/* Contenido */}
        <div className="flex-1 min-w-0 p-3 sm:p-5">

          {/* Artista + badge */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-sm sm:text-base truncate">
                {ticket.nombre_artista}
              </p>
              <p className="text-[#A8A8B3] text-xs truncate">{ticket.evento_nombre}</p>
            </div>
            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
              {badge.label}
            </span>
          </div>

          {/* Fecha + lugar — stacked con truncate */}
          <div className="flex flex-col gap-1 mb-3">
            <p className="text-[#96969F] text-xs flex items-center gap-1.5 min-w-0">
              <Calendar size={11} className="shrink-0" />
              <span className="truncate">{formatearFecha(ticket.fecha_hora)}</span>
            </p>
            <p className="text-[#96969F] text-xs flex items-center gap-1.5 min-w-0">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate">{ticket.lugar}</span>
            </p>
          </div>

          {/* Zona + precio */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold px-2 py-0.5 bg-[#7C3AED]/15 text-[#7C3AED]
                             border border-[#7C3AED]/30 rounded-full max-w-[140px] truncate">
              {ticket.nombre_zona}
            </span>
            <span className="text-[#96969F] text-xs font-mono shrink-0">
              {formatearPrecio(ticket.precio)}
            </span>
          </div>

          {/* Botones de acción */}
          {activo && (
            <div className="flex gap-2">
              <button
                onClick={() => onRevender(ticket)}
                className="flex-1 flex items-center justify-center gap-1 py-2 px-2
                           text-[#F59E0B] text-xs font-semibold border border-[#F59E0B]/40
                           hover:border-[#F59E0B] hover:bg-[#F59E0B]/10 rounded-xl transition-all
                           cursor-pointer bg-transparent"
              >
                <Tag size={12} /> Revender
              </button>
              <button
                onClick={() => navigate(`/ticket/${ticket.codigo_uuid}`)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2
                           bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold
                           rounded-xl transition-all cursor-pointer border-0 active:scale-95"
              >
                <QrCode size={13} /> Ver QR
              </button>
            </div>
          )}

          {enReventa && reventaInfo && (
            <>
              <p className="text-[#F59E0B] text-xs mb-2 flex items-center gap-1.5">
                <Tag size={11} className="shrink-0" />
                Publicado por {formatearPrecio(reventaInfo.precio_reventa)}
              </p>
              <button
                onClick={() => onCancelarReventa(reventaInfo.id)}
                disabled={cancelando === reventaInfo.id}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3
                           text-[#EF4444] text-xs font-semibold border border-[#EF4444]/40
                           hover:border-[#EF4444] hover:bg-[#EF4444]/10 rounded-xl transition-all
                           cursor-pointer bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelando === reventaInfo.id ? (
                  <span className="w-3 h-3 border-2 border-[#EF4444]/30 border-t-[#EF4444]
                                   rounded-full animate-spin" />
                ) : (
                  <X size={12} />
                )}
                Cancelar publicación
              </button>
            </>
          )}

          {ticket.estado === 'reembolsado' && (
            <p className="text-[#EF4444] text-xs">Este evento fue cancelado</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── MisTickets ──────────────────────────────── */
export default function MisTickets() {
  const [tickets, setTickets]               = useState([]);
  const [reventasPorTicket, setReventasPorTicket] = useState({});
  const [ventas, setVentas]                 = useState([]);
  const [cargando, setCargando]             = useState(true);

  const [ticketARevender, setTicketARevender] = useState(null);
  const [publicando, setPublicando]           = useState(false);
  const [cancelando, setCancelando]           = useState(null);

  const cargar = () => {
    setCargando(true);
    Promise.all([misTicketsApi(), misPublicacionesApi(), misVentasApi()])
      .then(([{ data: t }, { data: r }, { data: v }]) => {
        setTickets(t.tickets);
        const mapa = {};
        r.reventas.forEach(rv => { mapa[rv.ticket_id] = rv; });
        setReventasPorTicket(mapa);
        setVentas(v.ventas);
      })
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const handlePublicar = async (codigoUuid, precio) => {
    setPublicando(true);
    try {
      await publicarReventaApi(codigoUuid, Number(precio));
      toast.success('Ticket publicado en el marketplace');
      setTicketARevender(null);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al publicar');
    } finally {
      setPublicando(false);
    }
  };

  const handleCancelarReventa = async (reventaId) => {
    setCancelando(reventaId);
    try {
      await cancelarReventaApi(reventaId);
      toast.success('Publicación cancelada. Ticket restaurado.');
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cancelar');
    } finally {
      setCancelando(null);
    }
  };

  if (cargando) return <LoadingSpinner texto="Cargando tus tickets..." />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      <div className="flex items-center gap-3 mb-2">
        <Ticket size={22} className="text-[#7C3AED]" />
        <h1 className="text-2xl font-bold text-white">Mis tickets</h1>
      </div>
      <p className="text-[#A8A8B3] text-sm mb-8 ml-9">
        {tickets.length} entrada{tickets.length !== 1 ? 's' : ''}
      </p>

      {tickets.length === 0 && ventas.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-[#1F1F2B] rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Ticket size={36} className="text-[#3A3A48]" />
          </div>
          <p className="text-white font-semibold mb-2">No tienes tickets aún</p>
          <p className="text-[#A8A8B3] text-sm mb-6">¡Explora los eventos disponibles!</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#7C3AED] hover:bg-[#6D28D9]
                       text-white text-sm font-semibold rounded-xl no-underline transition-all"
          >
            Ver eventos
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {tickets.map(t => (
            <TicketCard
              key={t.id}
              ticket={t}
              reventaInfo={reventasPorTicket[t.id]}
              onRevender={setTicketARevender}
              onCancelarReventa={handleCancelarReventa}
              cancelando={cancelando}
            />
          ))}
          {ventas.length > 0 && (
            <>
              <p className="text-[#A8A8B3] text-xs font-semibold uppercase tracking-widest mt-2 ml-1">
                Tickets vendidos
              </p>
              {ventas.map(v => (
                <TicketCard
                  key={`venta-${v.id}`}
                  ticket={{
                    id:            v.ticket_id,
                    estado:        'revendido',
                    nombre_artista: v.nombre_artista,
                    evento_nombre:  v.evento_nombre,
                    fecha_hora:     v.fecha_hora,
                    lugar:          v.lugar,
                    nombre_zona:    v.nombre_zona,
                    precio:         v.precio_reventa,
                  }}
                  reventaInfo={null}
                  onRevender={() => {}}
                  onCancelarReventa={() => {}}
                  cancelando={null}
                />
              ))}
            </>
          )}
        </div>
      )}

      {ticketARevender && (
        <ModalRevender
          ticket={ticketARevender}
          publicando={publicando}
          onPublicar={handlePublicar}
          onCerrar={() => setTicketARevender(null)}
        />
      )}
    </div>
  );
}
