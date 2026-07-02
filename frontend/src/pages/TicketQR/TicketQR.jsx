import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Calendar, MapPin, RefreshCw, ShieldCheck } from 'lucide-react';
import { misTicketsApi, obtenerTokenApi } from '../../api/tickets-api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatearFecha } from '../../utils/formato';

/* ─── Barra de cuenta regresiva ───────────────── */
function ContadorTotp({ segundos }) {
  const porcentaje = (segundos / 30) * 100;
  const color =
    segundos > 10 ? '#10B981' :
    segundos > 5  ? '#F59E0B' :
    '#EF4444';

  return (
    <div className="w-full" style={{ maxWidth: 256 }}>
      <p
        style={{ color }}
        className={`text-xs text-center mb-1.5 font-semibold transition-colors
                    ${segundos <= 5 ? 'animate-pulse' : ''}`}
      >
        <ShieldCheck size={11} className="inline mr-1 mb-0.5" />
        Se renueva en {segundos}s
      </p>
      <div className="w-full h-1.5 bg-[#2A2A35] rounded-full overflow-hidden">
        <div
          style={{ width: `${porcentaje}%`, backgroundColor: color }}
          className="h-full rounded-full transition-all duration-1000 ease-linear"
        />
      </div>
    </div>
  );
}

/* ─── TicketQR ────────────────────────────────── */
export default function TicketQR() {
  const { uuid }   = useParams();
  const navigate   = useNavigate();

  const [ticket,    setTicket]    = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [segundos,  setSegundos]  = useState(30);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState('');
  const [errorQR,   setErrorQR]   = useState('');

  const refrescando = useRef(false);

  /* ── 1. Cargar datos del ticket ── */
  useEffect(() => {
    misTicketsApi()
      .then(({ data }) => {
        const t = data.tickets.find(x => x.codigo_uuid === uuid);
        if (!t) setError('Ticket no encontrado');
        else     setTicket(t);
      })
      .catch(() => setError('Error al cargar el ticket'))
      .finally(() => setCargando(false));
  }, [uuid]);

  /* ── 2. Pedir token TOTP al servidor ── */
  const obtenerToken = useCallback(async () => {
    if (refrescando.current) return;
    refrescando.current = true;
    setErrorQR('');
    try {
      const { data } = await obtenerTokenApi(uuid);
      setTokenData(data);
      setSegundos(data.segundosRestantes);
    } catch {
      setErrorQR('No se pudo actualizar el QR.');
    } finally {
      refrescando.current = false;
    }
  }, [uuid]);

  /* ── 3. Iniciar QR dinámico cuando el ticket esté activo ── */
  useEffect(() => {
    if (ticket?.estado === 'activo') obtenerToken();
  }, [ticket, obtenerToken]);

  /* ── 4. Cuenta regresiva + auto-refresh ── */
  useEffect(() => {
    if (!tokenData || ticket?.estado !== 'activo') return;

    if (segundos <= 0) {
      obtenerToken();
      return;
    }

    const timer = setTimeout(() => setSegundos(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [segundos, tokenData, ticket, obtenerToken]);

  /* ── Renders de estado ── */
  if (cargando) return <LoadingSpinner texto="Cargando ticket..." />;

  if (error) return (
    <div className="text-center py-20">
      <p className="text-[#EF4444] mb-4">{error}</p>
      <button
        onClick={() => navigate('/mis-tickets')}
        className="text-[#7C3AED] text-sm cursor-pointer bg-transparent border-0 hover:underline"
      >
        ← Mis tickets
      </button>
    </div>
  );

  const activo  = ticket.estado === 'activo';
  const qrValue = tokenData ? `${uuid}:${tokenData.token}` : uuid;

  return (
    <div className="max-w-sm mx-auto px-4 py-8">

      {/* Header nav */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/mis-tickets')}
          aria-label="Volver a mis tickets"
          className="w-9 h-9 rounded-xl bg-[#1F1F2B] border border-[#3A3A48] flex items-center
                     justify-center text-[#A8A8B3] hover:text-white hover:border-[#7C3AED]
                     transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-white font-bold">Mi ticket</h1>
      </div>

      {/* Boleto */}
      <div className="bg-[#15151D] border border-[#3A3A48] rounded-2xl overflow-hidden relative shadow-2xl">

        {/* Overlay si está usado / en reventa / etc. */}
        {!activo && (
          <div className="absolute inset-0 bg-black/75 flex items-center justify-center z-20 rounded-2xl">
            <div className="text-center rotate-[-12deg]">
              <p className="text-[#EF4444] text-3xl font-black tracking-widest
                            border-4 border-[#EF4444] px-6 py-3 rounded-xl select-none">
                {ticket.estado === 'reembolsado' ? 'REEMBOLSADO' : 'TICKET USADO'}
              </p>
            </div>
          </div>
        )}

        {/* Cabecera del boleto */}
        <div className="bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] px-6 py-6">
          <p className="text-white/60 text-[10px] uppercase tracking-widest mb-1">Teleticket</p>
          <h2 className="text-white text-xl font-extrabold leading-tight mb-1">
            {ticket.nombre_artista}
          </h2>
          <p className="text-white/75 text-sm font-medium">{ticket.evento_nombre}</p>
        </div>

        {/* Info del evento */}
        <div className="px-6 py-4 space-y-2.5 border-b border-dashed border-[#3A3A48]">
          <p className="text-[#A8A8B3] text-xs flex items-center gap-2">
            <Calendar size={13} className="text-[#7C3AED] shrink-0" />
            <span>{formatearFecha(ticket.fecha_hora)}</span>
          </p>
          <p className="text-[#A8A8B3] text-xs flex items-center gap-2">
            <MapPin size={13} className="text-[#7C3AED] shrink-0" />
            <span>{ticket.lugar}</span>
          </p>
          <div className="pt-1">
            <span className="text-xs font-bold px-3 py-1 bg-[#7C3AED]/15 text-[#7C3AED]
                             border border-[#7C3AED]/30 rounded-full">
              {ticket.nombre_zona}
            </span>
          </div>
        </div>

        {/* Perforación decorativa */}
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#0A0A0F] rounded-full -ml-2 shrink-0" />
          <div className="flex-1 border-t-2 border-dashed border-[#3A3A48]" />
          <div className="w-4 h-4 bg-[#0A0A0F] rounded-full -mr-2 shrink-0" />
        </div>

        {/* QR dinámico */}
        <div className="flex flex-col items-center px-6 py-7 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-lg">
            {tokenData ? (
              <QRCodeSVG
                value={qrValue}
                size={256}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="H"
                includeMargin={false}
              />
            ) : (
              /* Placeholder mientras carga el primer token */
              <div className="w-64 h-64 flex flex-col items-center justify-center gap-3">
                <span className="w-10 h-10 border-4 border-[#7C3AED]/20 border-t-[#7C3AED]
                                 rounded-full animate-spin" />
                <p className="text-[#96969F] text-xs">Generando QR seguro...</p>
              </div>
            )}
          </div>

          {/* Contador de renovación */}
          {tokenData && activo && (
            <ContadorTotp segundos={segundos} />
          )}

          {/* Error al refrescar token */}
          {errorQR && (
            <button
              onClick={obtenerToken}
              className="flex items-center gap-1.5 text-[#EF4444] text-xs
                         hover:text-white transition-colors cursor-pointer bg-transparent border-0"
            >
              <RefreshCw size={12} /> {errorQR} Reintentar
            </button>
          )}

          <p className="text-[#96969F] text-[9px] font-mono break-all text-center leading-relaxed">
            {uuid}
          </p>

          {activo && (
            <p className="text-[#96969F] text-[10px] text-center">
              Muestra este código y tu DNI al ingresar
            </p>
          )}
        </div>
      </div>

      {/* Badge de estado */}
      <div className={`mt-4 px-4 py-3 rounded-xl text-center text-xs font-semibold border
                       ${activo
                         ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                         : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'}`}>
        {activo
          ? '✓ Ticket válido — QR se renueva cada 30 segundos'
          : '✗ Este ticket ya fue utilizado'}
      </div>
    </div>
  );
}
