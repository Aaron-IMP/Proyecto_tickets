import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, Smartphone, CheckCircle2, XCircle,
  Clock, ArrowLeft, Receipt, ExternalLink,
} from 'lucide-react';
import { historialPagosApi } from '../../api/pagos-api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatearPrecio, formatearFecha } from '../../utils/formato';

/* ── helpers visuales ── */
const ESTADO_CONFIG = {
  aprobado:    { label: 'Aprobado',    icon: CheckCircle2, color: '#10B981', bg: '#10B981/10', border: '#10B981/25' },
  rechazado:   { label: 'Rechazado',   icon: XCircle,      color: '#EF4444', bg: '#EF4444/10', border: '#EF4444/25' },
  pendiente:   { label: 'Pendiente',   icon: Clock,        color: '#F59E0B', bg: '#F59E0B/10', border: '#F59E0B/25' },
  reembolsado: { label: 'Reembolsado', icon: Receipt,      color: '#A8A8B3', bg: '#A8A8B3/10', border: '#A8A8B3/25' },
};

const METODO_CONFIG = {
  tarjeta: { label: 'Tarjeta', icon: CreditCard },
  yape:    { label: 'Yape',    icon: Smartphone },
  plin:    { label: 'Plin',    icon: Smartphone },
};

function BadgeEstado({ estado }) {
  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.pendiente;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold`}
          style={{ color: cfg.color, background: `color-mix(in srgb, ${cfg.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${cfg.color} 25%, transparent)` }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function FilaPago({ pago, onVerTicket }) {
  const metCfg = METODO_CONFIG[pago.metodo] || METODO_CONFIG.tarjeta;
  const MetIcon = metCfg.icon;

  return (
    <div className="bg-[#15151D] border border-[#2A2A35] rounded-2xl p-5 hover:border-[#3A3A48]
                    transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{pago.evento_nombre}</p>
          <p className="text-[#7C3AED] text-xs mt-0.5">{pago.nombre_zona}</p>
        </div>
        <BadgeEstado estado={pago.estado} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Método */}
          <div className="flex items-center gap-1.5 text-[#A8A8B3] text-xs">
            <MetIcon size={13} />
            <span>{metCfg.label}</span>
            {pago.ultimos_digitos && (
              <span className="font-mono">···· {pago.ultimos_digitos}</span>
            )}
            {pago.telefono && (
              <span className="font-mono">{pago.telefono}</span>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-white font-bold font-mono">{formatearPrecio(pago.monto)}</p>
          <p className="text-[#55556A] text-[10px] mt-0.5">
            {pago.fecha_creacion ? formatearFecha(pago.fecha_creacion) : '—'}
          </p>
        </div>
      </div>

      {/* Referencia + ver ticket */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2A2A35]">
        <p className="text-[#55556A] text-[10px] font-mono truncate max-w-[60%]">
          Ref: {pago.referencia}
        </p>
        {pago.estado === 'aprobado' && pago.ticket_uuid && (
          <button
            onClick={() => onVerTicket(pago.ticket_uuid)}
            className="flex items-center gap-1 text-[#7C3AED] hover:text-[#9D5FF5] text-[11px]
                       font-semibold transition-colors bg-transparent border-0 cursor-pointer p-0"
          >
            Ver ticket <ExternalLink size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Pagos() {
  const navigate = useNavigate();
  const [pagos, setPagos]       = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    historialPagosApi()
      .then(({ data }) => setPagos(data.pagos || []))
      .catch(() => setError('No se pudo cargar el historial de pagos'))
      .finally(() => setCargando(false));
  }, []);

  const totales = pagos.reduce(
    (acc, p) => {
      if (p.estado === 'aprobado') acc.aprobados += Number(p.monto);
      if (p.estado === 'rechazado') acc.rechazados++;
      return acc;
    },
    { aprobados: 0, rechazados: 0 },
  );

  if (cargando) return <LoadingSpinner texto="Cargando historial..." />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Cabecera */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#A8A8B3] hover:text-white text-sm
                   transition-colors mb-6 cursor-pointer bg-transparent border-0 p-0"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#7C3AED]/15 rounded-xl flex items-center justify-center">
          <Receipt size={20} className="text-[#7C3AED]" />
        </div>
        <div>
          <h1 className="text-white font-bold text-xl">Historial de pagos</h1>
          <p className="text-[#96969F] text-xs">{pagos.length} transacciones</p>
        </div>
      </div>

      {/* Stats */}
      {pagos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#10B981]/8 border border-[#10B981]/20 rounded-xl p-4">
            <p className="text-[#96969F] text-xs mb-1">Total pagado</p>
            <p className="text-[#10B981] font-bold font-mono text-lg">
              {formatearPrecio(totales.aprobados)}
            </p>
          </div>
          <div className="bg-[#EF4444]/8 border border-[#EF4444]/20 rounded-xl p-4">
            <p className="text-[#96969F] text-xs mb-1">Rechazados</p>
            <p className="text-[#EF4444] font-bold text-lg">{totales.rechazados}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-[#EF4444]/10 border border-[#EF4444]/25 rounded-xl
                        text-[#EF4444] text-sm">
          {error}
        </div>
      )}

      {/* Lista */}
      {pagos.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-[#2A2A35] rounded-2xl flex items-center justify-center
                          mx-auto mb-4">
            <Receipt size={28} className="text-[#55556A]" />
          </div>
          <p className="text-white font-semibold mb-1">Sin transacciones</p>
          <p className="text-[#96969F] text-sm">
            Aquí aparecerán tus pagos cuando compres entradas.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pagos.map(pago => (
            <FilaPago
              key={pago.id}
              pago={pago}
              onVerTicket={(uuid) => navigate(`/ticket/${uuid}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
