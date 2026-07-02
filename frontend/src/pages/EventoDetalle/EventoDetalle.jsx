import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Minus, Plus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { obtenerEventoApi } from '../../api/eventos-api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ModalPasarelaPago from '../../components/ModalPasarelaPago';
import { formatearFecha, formatearPrecio } from '../../utils/formato';

function StockBadge({ disponible }) {
  if (disponible === 0)
    return <span className="text-[10px] font-bold text-[#EF4444]">Sin stock</span>;
  if (disponible <= 20)
    return <span className="text-[10px] font-bold text-[#F59E0B]">¡Solo quedan {disponible}!</span>;
  return <span className="text-[10px] font-bold text-[#10B981]">{disponible} disponibles</span>;
}

export default function EventoDetalle() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { usuario, estaAutenticado } = useAuth();

  const [evento, setEvento]           = useState(null);
  const [cargando, setCargando]       = useState(true);
  const [zona, setZona]               = useState(null);
  const [cantidad, setCantidad]       = useState(1);
  const [error, setError]             = useState('');
  const [mostrarPasarela, setMostrarPasarela] = useState(false);

  useEffect(() => {
    obtenerEventoApi(id)
      .then(({ data }) => setEvento(data.evento))
      .catch(() => setError('Evento no encontrado'))
      .finally(() => setCargando(false));
  }, [id]);

  const subtotal    = zona ? zona.precio * cantidad : 0;
  const maxCantidad = zona ? Math.min(4, zona.stock_disponible) : 1;

  /* Callback cuando la pasarela aprueba los pagos */
  const handleExitoPago = (ticketUuids) => {
    setMostrarPasarela(false);
    toast.success(
      ticketUuids.length > 1
        ? `¡${ticketUuids.length} tickets comprados! Revisa Mis tickets`
        : '¡Ticket comprado! Revisa Mis tickets',
    );
    navigate('/mis-tickets');
  };

  if (cargando) return <LoadingSpinner texto="Cargando evento..." />;
  if (!evento)  return (
    <div className="text-center py-20 text-[#EF4444]">{error || 'Evento no encontrado'}</div>
  );

  const eventoPasado = new Date(evento.fecha_hora) < new Date();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32">

      {/* Volver */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#A8A8B3] hover:text-white text-sm
                   transition-colors mb-6 cursor-pointer bg-transparent border-0 p-0"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      {/* Banner */}
      <div className="relative h-52 md:h-64 rounded-2xl overflow-hidden mb-8">
        {evento.banner_url
          ? <img src={evento.banner_url} alt={evento.nombre_artista}
                 className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] via-[#4C1D95] to-[#1F1F2B]" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-7">
          <p className="text-[#7C3AED] text-xs font-bold uppercase tracking-widest mb-2
                        bg-white/10 border border-white/20 px-3 py-1 rounded-full inline-block">
            {evento.estado}
          </p>
          <h1 className="text-white text-2xl md:text-3xl font-extrabold leading-tight">
            {evento.nombre_artista}
          </h1>
          <p className="text-white/70 font-medium">{evento.nombre}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8">
        <p className="text-[#A8A8B3] text-sm flex items-center gap-2">
          <Calendar size={15} className="text-[#7C3AED]" />
          <span>{formatearFecha(evento.fecha_hora)}</span>
        </p>
        <p className="text-[#A8A8B3] text-sm flex items-center gap-2">
          <MapPin size={15} className="text-[#7C3AED]" /> {evento.lugar}
        </p>
      </div>

      {evento.descripcion && (
        <p className="text-[#A8A8B3] text-sm leading-relaxed mb-8 border-l-2 border-[#7C3AED]/40 pl-4">
          {evento.descripcion}
        </p>
      )}

      {error && (
        <div className="mb-6 px-4 py-3 bg-[#EF4444]/10 border border-[#EF4444]/25 rounded-xl
                        text-[#EF4444] text-sm">
          {error}
        </div>
      )}

      {eventoPasado ? (
        <div className="bg-[#15151D] border border-[#EF4444]/30 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 bg-[#EF4444]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar size={26} className="text-[#EF4444]" />
          </div>
          <p className="text-white font-semibold mb-1">Evento finalizado</p>
          <p className="text-[#96969F] text-sm">
            Este evento ya ocurrió, por lo que las entradas ya no están disponibles.
          </p>
        </div>
      ) : (
        <>
          {/* Selector de zona */}
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Users size={18} className="text-[#7C3AED]" /> Elige tu zona
          </h2>

          <div className="flex flex-col gap-3 mb-6">
            {evento.categorias?.map((cat) => {
              const seleccionada = zona?.id === cat.id;
              const agotada      = cat.stock_disponible === 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => { if (!agotada) { setZona(cat); setCantidad(1); } }}
                  disabled={agotada}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all cursor-pointer
                              bg-transparent flex items-center justify-between
                              ${seleccionada
                                ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                                : agotada
                                  ? 'border-[#3A3A48] opacity-50 cursor-not-allowed'
                                  : 'border-[#3A3A48] hover:border-[#7C3AED]/50 bg-[#1F1F2B]'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                                     ${seleccionada ? 'border-[#7C3AED]' : 'border-[#3A3A48]'}`}>
                      {seleccionada && <div className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{cat.nombre_zona}</p>
                      <StockBadge disponible={cat.stock_disponible} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#7C3AED] font-bold text-xl font-mono">{formatearPrecio(cat.precio)}</p>
                    {agotada && (
                      <span className="text-[10px] bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30
                                       px-2 py-0.5 rounded-full font-bold">Sin stock</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Cantidad */}
          {zona && (
            <div className="flex items-center justify-between bg-[#1F1F2B] border border-[#3A3A48]
                            rounded-xl p-5 mb-4">
              <div>
                <p className="text-white font-semibold text-sm">Cantidad</p>
                <p className="text-[#96969F] text-xs">Máximo 4 por compra</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCantidad(c => Math.max(1, c - 1))}
                  disabled={cantidad <= 1}
                  aria-label="Disminuir cantidad"
                  className="w-9 h-9 rounded-xl border border-[#3A3A48] text-white flex items-center
                             justify-center hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all
                             disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-[#2A2A35]"
                >
                  <Minus size={14} />
                </button>
                <span className="text-white font-bold text-xl w-6 text-center">{cantidad}</span>
                <button
                  onClick={() => setCantidad(c => Math.min(maxCantidad, c + 1))}
                  disabled={cantidad >= maxCantidad}
                  aria-label="Aumentar cantidad"
                  className="w-9 h-9 rounded-xl border border-[#3A3A48] text-white flex items-center
                             justify-center hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all
                             disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-[#2A2A35]"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Resumen */}
          {zona && (
            <div className="bg-[#15151D] border border-[#3A3A48] rounded-xl p-4 mb-4">
              <div className="flex justify-between text-sm text-[#A8A8B3] mb-2">
                <span>{zona.nombre_zona} × {cantidad}</span>
                <span>{formatearPrecio(zona.precio)} c/u</span>
              </div>
              <div className="flex justify-between font-bold text-white border-t border-[#3A3A48] pt-2 mt-2">
                <span>Subtotal</span>
                <span className="text-[#7C3AED] font-mono text-lg">{formatearPrecio(subtotal)}</span>
              </div>
            </div>
          )}

          {/* Barra sticky de compra */}
          {zona && (
            <div className="fixed bottom-0 left-0 right-0 bg-[#15151D]/95 backdrop-blur
                            border-t border-[#3A3A48] px-4 py-4 z-50">
              <div className="max-w-4xl mx-auto">
                {!estaAutenticado ? (
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-4 border border-[#7C3AED] text-[#7C3AED] font-semibold
                               rounded-xl hover:bg-[#7C3AED] hover:text-white transition-all
                               cursor-pointer bg-transparent text-sm"
                  >
                    Inicia sesión para comprar
                  </button>
                ) : usuario.rol !== 'cliente' ? (
                  <p className="text-center text-[#A8A8B3] text-sm py-3">
                    Solo los clientes pueden comprar tickets.
                  </p>
                ) : (
                  <button
                    onClick={() => setMostrarPasarela(true)}
                    className="w-full py-4 bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.99]
                               text-white font-bold rounded-xl transition-all shadow-lg shadow-[#7C3AED]/30
                               cursor-pointer border-0 text-sm"
                  >
                    Comprar · {formatearPrecio(subtotal)}
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de pasarela de pagos */}
      {mostrarPasarela && zona && (
        <ModalPasarelaPago
          zona={zona}
          cantidad={cantidad}
          onExito={handleExitoPago}
          onCerrar={() => setMostrarPasarela(false)}
        />
      )}
    </div>
  );
}
