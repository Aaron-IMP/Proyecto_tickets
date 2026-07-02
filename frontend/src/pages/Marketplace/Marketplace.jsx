import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Tag, ShoppingBag, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { listarReventasApi, comprarReventaApi } from '../../api/reventas-api';
import { useAuth } from '../../context/AuthContext';
import { formatearFecha, formatearPrecio } from '../../utils/formato';
import LoadingSpinner from '../../components/LoadingSpinner';

/* ─── Skeleton ────────────────────────────────── */
function Skeleton() {
  return (
    <div className="bg-[#15151D] border border-[#2A2A35] rounded-[12px] overflow-hidden animate-pulse">
      <div className="flex">
        <div className="w-1.5 bg-[#2A2A35] shrink-0" />
        <div className="flex-1 p-3 sm:p-5 space-y-3">
          <div className="space-y-1.5">
            <div className="h-4 bg-[#2A2A35] rounded w-2/3" />
            <div className="h-3 bg-[#2A2A35] rounded w-1/2" />
          </div>
          <div className="h-3 bg-[#2A2A35] rounded-full w-20" />
          <div className="space-y-1.5">
            <div className="h-3 bg-[#2A2A35] rounded w-full" />
            <div className="h-3 bg-[#2A2A35] rounded w-3/4" />
          </div>
          <div className="flex items-end justify-between pt-1 border-t border-[#2A2A35]">
            <div className="space-y-1">
              <div className="h-3 bg-[#2A2A35] rounded w-16" />
              <div className="h-6 bg-[#2A2A35] rounded w-24" />
              <div className="h-3 bg-[#2A2A35] rounded w-20" />
            </div>
            <div className="h-9 bg-[#2A2A35] rounded-xl w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ReventaCard ─────────────────────────────── */
function ReventaCard({ reventa, onComprar, comprando, usuarioId }) {
  const esMio = reventa.vendedor_id === usuarioId;

  return (
    <div className={`bg-[#15151D] border rounded-[12px] overflow-hidden transition-colors
                     ${esMio
                       ? 'border-[#F59E0B]/30'
                       : 'border-[#3A3A48] hover:border-[#7C3AED]/40'}`}>
      <div className="flex">
        {/* Franja lateral */}
        <div className={`w-1.5 shrink-0 ${esMio ? 'bg-[#F59E0B]' : 'bg-[#7C3AED]'}`} />

        {/* Contenido */}
        <div className="flex-1 min-w-0 p-3 sm:p-5">

          {/* Artista + evento */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-sm sm:text-base truncate">
                {reventa.nombre_artista}
              </p>
              <p className="text-[#A8A8B3] text-xs truncate">{reventa.evento_nombre}</p>
            </div>
            {esMio && (
              <span className="shrink-0 text-[10px] text-[#F59E0B] font-semibold px-2 py-0.5
                               bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-full">
                Mío
              </span>
            )}
          </div>

          {/* Zona */}
          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border
                           bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/30 mb-2 max-w-full truncate">
            {reventa.nombre_zona}
          </span>

          {/* Fecha + lugar — stacked con truncate */}
          <div className="flex flex-col gap-1 mb-3">
            <p className="text-[#96969F] text-xs flex items-center gap-1.5 min-w-0">
              <Calendar size={11} className="shrink-0" />
              <span className="truncate">{formatearFecha(reventa.fecha_hora)}</span>
            </p>
            <p className="text-[#96969F] text-xs flex items-center gap-1.5 min-w-0">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate">{reventa.lugar}</span>
            </p>
          </div>

          {/* Precios + acción */}
          <div className="flex items-end justify-between gap-3 pt-3 border-t border-[#2A2A35]">
            <div className="min-w-0">
              <p className="text-[#96969F] text-xs line-through mb-0.5 font-mono">
                {formatearPrecio(reventa.precio_original)}
              </p>
              <p className="text-[#7C3AED] text-lg sm:text-xl font-extrabold font-mono leading-none">
                {formatearPrecio(reventa.precio_reventa)}
              </p>
              <p className="text-[#96969F] text-[10px] mt-1 truncate">
                Por <span className="text-[#A8A8B3]">{reventa.vendedor_nombre}</span>
              </p>
            </div>

            {!esMio && (
              <button
                onClick={() => onComprar(reventa.id)}
                disabled={comprando === reventa.id}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-[#7C3AED]
                           hover:bg-[#6D28D9] text-white text-xs font-semibold rounded-xl
                           transition-all cursor-pointer border-0 disabled:opacity-50
                           disabled:cursor-not-allowed active:scale-95"
              >
                {comprando === reventa.id ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Comprando...</>
                ) : (
                  <><ShoppingBag size={13} /> Comprar</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Marketplace ─────────────────────────────── */
export default function Marketplace() {
  const [reventas, setReventas]   = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [comprando, setComprando] = useState(null);

  const { usuario, estaAutenticado } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    listarReventasApi()
      .then(({ data }) => setReventas(data.reventas))
      .finally(() => setCargando(false));
  }, []);

  const handleComprar = async (reventaId) => {
    if (!estaAutenticado) {
      toast.error('Inicia sesión para comprar tickets');
      navigate('/login');
      return;
    }

    setComprando(reventaId);
    try {
      await comprarReventaApi(reventaId);
      toast.success('¡Ticket adquirido! Ya aparece en Mis tickets.');
      navigate('/mis-tickets');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al comprar el ticket');
    } finally {
      setComprando(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <ArrowUpDown size={22} className="text-[#7C3AED]" />
        <h1 className="text-2xl font-bold text-white">Marketplace</h1>
      </div>
      <p className="text-[#A8A8B3] text-sm mb-8 ml-9">
        {cargando ? 'Cargando...' : `${reventas.length} ticket${reventas.length !== 1 ? 's' : ''} en reventa`}
      </p>

      {cargando ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} />)}
        </div>
      ) : reventas.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-[#1F1F2B] rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Tag size={36} className="text-[#3A3A48]" />
          </div>
          <p className="text-white font-semibold mb-2">Sin tickets en reventa</p>
          <p className="text-[#A8A8B3] text-sm">Vuelve más tarde o explora los eventos disponibles.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reventas.map(r => (
            <ReventaCard
              key={r.id}
              reventa={r}
              onComprar={handleComprar}
              comprando={comprando}
              usuarioId={usuario?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
