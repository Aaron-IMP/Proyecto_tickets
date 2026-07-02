import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ChevronRight, Search } from 'lucide-react';
import { listarEventosApi } from '../../api/eventos-api';
import { formatearFecha, formatearPrecio } from '../../utils/formato';

/* ─── Skeleton card ───────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-[#15151D] border border-[#3A3A48] rounded-[12px] overflow-hidden animate-pulse">
      <div className="h-40 bg-[#2A2A35]" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-[#2A2A35] rounded-lg w-3/4" />
        <div className="h-3 bg-[#2A2A35] rounded-lg w-1/2" />
        <div className="h-3 bg-[#2A2A35] rounded-lg w-2/3" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 bg-[#2A2A35] rounded-lg w-24" />
          <div className="h-9 bg-[#2A2A35] rounded-xl w-28" />
        </div>
      </div>
    </div>
  );
}

/* ─── EventoCard ──────────────────────────────── */
function EventoCard({ evento }) {
  const navigate = useNavigate();
  const pocos = Number(evento.stock_total) > 0 && Number(evento.stock_total) <= 20;
  const agotado = Number(evento.stock_total) === 0;

  return (
    <div
      onClick={() => navigate(`/eventos/${evento.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/eventos/${evento.id}`); } }}
      role="button"
      tabIndex={0}
      aria-label={`Ver entradas de ${evento.nombre_artista} — ${evento.nombre}`}
      className="bg-[#15151D] border border-[#3A3A48] rounded-[12px] overflow-hidden
                 hover:border-[#7C3AED] hover:-translate-y-1 transition-all duration-200
                 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/50
                 cursor-pointer group"
    >
      {/* Banner */}
      <div className="h-40 relative overflow-hidden">
        {evento.banner_url
          ? <img src={evento.banner_url} alt={evento.nombre_artista}
                 className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/40 via-[#1F1F2B] to-[#0A0A0F]" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-[#15151D] via-black/30 to-transparent" />
        {/* Badge stock */}
        {agotado ? (
          <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5
                           bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] rounded-full">
            Agotado
          </span>
        ) : pocos ? (
          <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5
                           bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#F59E0B] rounded-full">
            ¡Últimas!
          </span>
        ) : null}
        <p className="absolute bottom-4 left-4 right-4 text-white font-bold text-base leading-tight
                      group-hover:text-[#C4B5FD] transition-colors drop-shadow-md">
          {evento.nombre_artista}
        </p>
      </div>

      <div className="p-5">
        <h3 className="text-white font-semibold text-sm mb-3 truncate">{evento.nombre}</h3>

        <div className="space-y-1.5 mb-4">
          <p className="text-[#A8A8B3] text-xs flex items-center gap-1.5">
            <Calendar size={12} className="text-[#96969F] shrink-0" />
            <span>{formatearFecha(evento.fecha_hora)}</span>
          </p>
          <p className="text-[#A8A8B3] text-xs flex items-center gap-1.5">
            <MapPin size={12} className="text-[#96969F] shrink-0" />
            <span className="truncate">{evento.lugar}</span>
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#96969F] text-[10px] uppercase tracking-wide mb-0.5">Desde</p>
            <p className="text-[#7C3AED] font-bold text-base font-mono tracking-tight">
              {formatearPrecio(evento.precio_desde)}
            </p>
          </div>
          <button
            className="px-4 py-2 border border-[#7C3AED]/50 text-[#7C3AED] text-xs font-semibold
                       rounded-xl hover:bg-[#7C3AED] hover:text-white transition-all
                       cursor-pointer bg-transparent"
            onClick={(e) => { e.stopPropagation(); navigate(`/eventos/${evento.id}`); }}
          >
            Ver entradas
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Hero ────────────────────────────────────── */
function Hero({ evento }) {
  const navigate = useNavigate();
  if (!evento) return null;
  return (
    <div
      onClick={() => navigate(`/eventos/${evento.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/eventos/${evento.id}`); } }}
      role="button"
      tabIndex={0}
      aria-label={`Evento destacado: ${evento.nombre}. Ver detalles`}
      className="relative h-64 md:h-72 rounded-2xl overflow-hidden mb-10 cursor-pointer group
                 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/60"
    >
      {/* Imagen o gradiente de fondo */}
      {evento.banner_url
        ? <img src={evento.banner_url} alt={evento.nombre_artista}
               className="absolute inset-0 w-full h-full object-cover" />
        : <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] via-[#4C1D95] to-[#0A0A0F]" />
            <div className="absolute inset-0 opacity-10"
                 style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          </>
      }
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <div className="absolute bottom-0 left-0 p-7">
        <span className="inline-block text-[10px] font-bold tracking-widest uppercase
                         text-[#7C3AED] bg-white/10 border border-white/20 px-3 py-1 rounded-full mb-3">
          Próximo evento destacado
        </span>
        <h2 className="text-white text-2xl md:text-3xl font-extrabold leading-tight mb-1">
          {evento.nombre}
        </h2>
        <p className="text-white/75 font-medium">{evento.nombre_artista}</p>
        <p className="text-white/50 text-xs mt-1 flex items-center gap-1">
          <Calendar size={11} /> <span>{formatearFecha(evento.fecha_hora)}</span>
          <span className="mx-1">·</span>
          <MapPin size={11} /> {evento.lugar}
        </p>
      </div>

      <button
        className="absolute bottom-7 right-7 flex items-center gap-2 px-5 py-2.5
                   bg-white text-[#7C3AED] text-sm font-bold rounded-xl
                   hover:bg-white/90 transition-all active:scale-95 cursor-pointer border-0"
        onClick={(e) => { e.stopPropagation(); navigate(`/eventos/${evento.id}`); }}
      >
        Ver evento <ChevronRight size={14} />
      </button>
    </div>
  );
}

/* ─── Pills config ────────────────────────────── */
const PILLS = [
  { id: 'todos',    label: 'Todos' },
  { id: 'semana',   label: 'Esta semana' },
  { id: 'mes',      label: 'Este mes' },
  { id: 'proximos', label: 'Próximos' },
];

/* ─── Home ────────────────────────────────────── */
export default function Home() {
  const [eventos, setEventos]   = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro]     = useState('todos');
  const [orden, setOrden]       = useState('fecha-asc');

  useEffect(() => {
    listarEventosApi()
      .then(({ data }) => setEventos(data.eventos))
      .catch(() => setError('No se pudieron cargar los eventos'))
      .finally(() => setCargando(false));
  }, []);

  const eventosFiltrados = useMemo(() => {
    const ahora    = new Date();
    const finSemana = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);
    const finMes    = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);
    const query     = busqueda.toLowerCase().trim();

    const filtrado = eventos.filter(e => {
      const f = new Date(e.fecha_hora);
      if (f < ahora) return false;               // el evento ya pasó — no se muestra ni se vende
      if (query &&
          !e.nombre.toLowerCase().includes(query) &&
          !e.nombre_artista.toLowerCase().includes(query)) return false;
      if (filtro === 'semana')   return f <= finSemana;
      if (filtro === 'mes')      return f <= finMes;
      return true;                               // 'proximos' y 'todos' → todos los futuros
    });

    return [...filtrado].sort((a, b) => {
      if (orden === 'precio-asc')  return Number(a.precio_desde) - Number(b.precio_desde);
      if (orden === 'precio-desc') return Number(b.precio_desde) - Number(a.precio_desde);
      return new Date(a.fecha_hora) - new Date(b.fecha_hora);
    });
  }, [eventos, busqueda, filtro, orden]);

  // Evento destacado del Hero: el próximo evento futuro más cercano (nunca uno ya pasado).
  const eventoDestacado = useMemo(() => {
    const ahora = new Date();
    return [...eventos]
      .filter(e => new Date(e.fecha_hora) >= ahora)
      .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))[0] || null;
  }, [eventos]);

  const hayDatos      = !cargando && !error && eventos.length > 0;
  const sinResultados = hayDatos && eventosFiltrados.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Hero skeleton */}
      {cargando && (
        <div className="h-64 bg-[#15151D] rounded-2xl animate-pulse mb-10" />
      )}
      {!cargando && <Hero evento={eventoDestacado} />}

      {/* Cabecera */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-xl">Próximos eventos</h2>
        {hayDatos && (
          <span className="text-[#A8A8B3] text-sm">
            {eventosFiltrados.length} evento{eventosFiltrados.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Búsqueda + filtros — solo cuando hay datos cargados */}
      {hayDatos && (
        <>
          {/* Input búsqueda */}
          <div className="relative mb-3">
            <Search size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#96969F] pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar artista o evento..."
              aria-label="Buscar artista o evento"
              className="w-full pl-10 pr-10 py-3 bg-[#1F1F2B] border border-[#3A3A48] rounded-xl
                         text-white text-sm placeholder-[#96969F] outline-none
                         focus:border-[#7C3AED] transition-all"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center
                           justify-center text-[#96969F] hover:text-white transition-colors
                           cursor-pointer bg-transparent border-0 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtros + orden — cuadrícula 2×2 en móvil, fila en desktop */}
          <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-center sm:gap-3">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-1 sm:min-w-0">
              {PILLS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setFiltro(p.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border text-center
                               whitespace-nowrap transition-all cursor-pointer sm:py-1.5
                               ${filtro === p.id
                                 ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                                 : 'bg-[#1F1F2B] border-[#3A3A48] text-[#A8A8B3] hover:border-[#7C3AED]/50 hover:text-white'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <select
              value={orden}
              onChange={e => setOrden(e.target.value)}
              aria-label="Ordenar eventos"
              className="w-full px-3 py-2 bg-[#1F1F2B] border border-[#3A3A48] rounded-xl
                         text-[#A8A8B3] text-xs outline-none cursor-pointer transition-all
                         focus:border-[#7C3AED] sm:w-auto sm:shrink-0 sm:py-1.5"
            >
              <option value="fecha-asc">Fecha: más cercana</option>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
            </select>
          </div>
        </>
      )}

      {/* Skeleton grid */}
      {cargando && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Error de red */}
      {!cargando && error && (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">😕</p>
          <p className="text-[#A8A8B3]">{error}</p>
        </div>
      )}

      {/* Sin eventos en la BD */}
      {!cargando && !error && eventos.length === 0 && (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🎵</p>
          <p className="text-white font-semibold mb-2">No hay eventos disponibles</p>
          <p className="text-[#A8A8B3] text-sm">Vuelve pronto para ver nuevos conciertos.</p>
        </div>
      )}

      {/* Sin resultados de búsqueda */}
      {sinResultados && busqueda.trim() && (
        <div className="text-center py-20">
          <Search size={48} className="text-[#3A3A48] mx-auto mb-5" />
          <p className="text-white font-semibold mb-2">
            No encontramos eventos para "{busqueda.trim()}"
          </p>
          <p className="text-[#A8A8B3] text-sm mb-5">
            Intenta con otro nombre de artista o evento
          </p>
          <button
            onClick={() => { setBusqueda(''); setFiltro('todos'); }}
            className="text-[#7C3AED] text-sm hover:underline cursor-pointer bg-transparent border-0"
          >
            Ver todos los eventos
          </button>
        </div>
      )}

      {/* Sin resultados por filtro de fecha */}
      {sinResultados && !busqueda.trim() && (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📅</p>
          <p className="text-white font-semibold mb-2">No hay eventos en este período</p>
          <p className="text-[#A8A8B3] text-sm mb-5">Prueba con otro filtro</p>
          <button
            onClick={() => setFiltro('todos')}
            className="text-[#7C3AED] text-sm hover:underline cursor-pointer bg-transparent border-0"
          >
            Ver todos los eventos
          </button>
        </div>
      )}

      {/* Grid */}
      {!cargando && !error && eventosFiltrados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventosFiltrados.map(e => <EventoCard key={e.id} evento={e} />)}
        </div>
      )}
    </div>
  );
}
