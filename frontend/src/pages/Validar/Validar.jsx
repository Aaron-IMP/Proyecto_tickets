import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  ScanLine, CheckCircle2, XCircle, RefreshCw,
  Calendar, MapPin, User, Keyboard, Camera, AlertTriangle, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { validarTicketApi } from '../../api/tickets-api';
import { reportarIncidenteApi } from '../../api/incidentes-api';
import { useModalAccesible } from '../../hooks/useModalAccesible';

const READER_ID = 'qr-reader';

const fmt = (iso) =>
  new Date(iso).toLocaleDateString('es-PE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

/* ─── ResultadoValido ─────────────────────────── */
function ResultadoValido({ ticket }) {
  return (
    <div className="bg-[#15151D] border-2 border-[#10B981]/40 rounded-2xl overflow-hidden shadow-xl shadow-[#10B981]/10">
      <div className="bg-[#10B981]/15 border-b border-[#10B981]/20 px-6 py-5 flex items-center gap-4">
        <CheckCircle2 size={48} className="text-[#10B981] shrink-0" />
        <div>
          <p className="text-[#10B981] font-black text-xl tracking-wide">ACCESO PERMITIDO ✓</p>
          <p className="text-[#10B981]/70 text-sm">Ticket válido — entrada autorizada</p>
        </div>
      </div>
      <div className="px-6 py-5 space-y-4">
        <div className="flex items-center gap-3 bg-[#1F1F2B] rounded-xl p-4">
          <div className="w-10 h-10 bg-[#7C3AED] rounded-full flex items-center justify-center
                          text-white font-bold text-sm shrink-0">
            {ticket.usuario_nombre?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold">{ticket.usuario_nombre}</p>
            <p className="text-[#A8A8B3] text-xs">{ticket.usuario_email}</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { icono: ScanLine, label: 'Evento',  valor: ticket.evento_nombre },
            { icono: User,     label: 'Artista', valor: ticket.nombre_artista },
            { icono: MapPin,   label: 'Zona',    valor: ticket.nombre_zona },
            { icono: Calendar, label: 'Fecha',   valor: fmt(ticket.fecha_hora) },
          ].map(({ icono: Icon, label, valor }) => (
            <div key={label} className="flex items-start gap-3 py-2 border-b border-[#2A2A35] last:border-0">
              <Icon size={15} className="text-[#96969F] shrink-0 mt-0.5" />
              <div>
                <p className="text-[#96969F] text-[11px] uppercase tracking-wide">{label}</p>
                <p className="text-white text-sm font-medium capitalize">{valor}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── ResultadoError ──────────────────────────── */
function ResultadoError({ mensaje, tipo }) {
  const esUsado    = tipo === 'TICKET_YA_USADO';
  const esExpirado = tipo === 'TOKEN_INVALIDO';

  const subtitulo = esUsado
    ? 'Ticket ya utilizado'
    : esExpirado
      ? 'QR inválido o expirado'
      : 'Ticket inválido';

  const descripcion = esUsado
    ? 'Este ticket ya fue escaneado previamente. No se permite el reingreso.'
    : esExpirado
      ? 'El QR expiró o es una captura de pantalla. Pide al asistente que muestre el código actualizado.'
      : 'El código no corresponde a ningún ticket registrado o no está activo.';

  return (
    <div className="bg-[#15151D] border-2 border-[#EF4444]/40 rounded-2xl overflow-hidden shadow-xl shadow-[#EF4444]/10">
      <div className="bg-[#EF4444]/10 border-b border-[#EF4444]/20 px-6 py-5 flex items-center gap-4">
        <XCircle size={48} className="text-[#EF4444] shrink-0" />
        <div>
          <p className="text-[#EF4444] font-black text-xl tracking-wide">
            ACCESO DENEGADO ✗
          </p>
          <p className="text-[#EF4444]/70 text-sm">{subtitulo}</p>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="text-[#A8A8B3] text-sm">{descripcion}</p>
      </div>
    </div>
  );
}

/* ─── ModalReporte ────────────────────────────── */
function ModalReporte({ ticketUuid, onCerrar }) {
  const [descripcion, setDescripcion] = useState('');
  const [enviando,    setEnviando]    = useState(false);
  const MAX = 500;

  useModalAccesible(() => { if (!enviando) onCerrar(); }, { bloquearCierre: enviando });

  const handleEnviar = async () => {
    if (descripcion.trim().length < 10) {
      toast.error('Describe el incidente con al menos 10 caracteres');
      return;
    }
    setEnviando(true);
    try {
      await reportarIncidenteApi(descripcion.trim(), ticketUuid || null);
      toast.success('Incidente reportado correctamente');
      onCerrar();
    } catch {
      toast.error('No se pudo enviar el reporte. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !enviando) onCerrar(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-reporte"
        className="w-full max-w-md bg-[#15151D] border border-[#3A3A48] rounded-2xl
                      shadow-2xl shadow-black/60 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5
                        border-b border-[#2A2A35] bg-[#EF4444]/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#EF4444]/10 rounded-xl flex items-center
                            justify-center shrink-0">
              <AlertTriangle size={17} className="text-[#EF4444]" />
            </div>
            <div>
              <p id="titulo-reporte" className="text-white font-bold text-sm">Reportar incidente</p>
              <p className="text-[#96969F] text-[11px]">
                {ticketUuid ? `Ticket: ${ticketUuid.slice(0, 8)}…` : 'Sin ticket asociado'}
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            disabled={enviando}
            aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center rounded-lg border
                       border-[#3A3A48] text-[#96969F] hover:text-white
                       hover:border-[#7C3AED]/50 transition-all cursor-pointer
                       bg-transparent disabled:opacity-40"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="reporte-desc" className="block text-xs font-medium text-[#A8A8B3] mb-2">
              Descripción del incidente
            </label>
            <textarea
              id="reporte-desc"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value.slice(0, MAX))}
              placeholder="Describe lo ocurrido: comportamiento sospechoso, ticket duplicado, intento de acceso no autorizado…"
              rows={5}
              autoFocus
              className="w-full px-4 py-3 bg-[#2A2A35] border border-[#3A3A48] rounded-xl
                         text-white text-sm placeholder-[#96969F] outline-none resize-none
                         focus:border-[#7C3AED] transition-all leading-relaxed"
            />
            <p className={`text-[11px] text-right mt-1 transition-colors
                           ${descripcion.length >= MAX ? 'text-[#EF4444]' : 'text-[#96969F]'}`}>
              {descripcion.length}/{MAX}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCerrar}
              disabled={enviando}
              className="flex-1 py-2.5 border border-[#3A3A48] text-[#A8A8B3] text-sm
                         font-semibold rounded-xl hover:text-white hover:border-[#7C3AED]/50
                         transition-all cursor-pointer bg-transparent
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleEnviar}
              disabled={enviando || descripcion.trim().length < 10}
              className="flex-1 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm
                         font-semibold rounded-xl transition-all cursor-pointer border-0
                         disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {enviando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                   rounded-full animate-spin" />
                  Enviando…
                </span>
              ) : 'Enviar reporte'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Esquinas del visor ──────────────────────── */
function Esquinas() {
  const base = 'absolute w-7 h-7 border-[#7C3AED]';
  return (
    <>
      <div className={`${base} top-3 left-3 border-t-[3px] border-l-[3px] rounded-tl-lg`} />
      <div className={`${base} top-3 right-3 border-t-[3px] border-r-[3px] rounded-tr-lg`} />
      <div className={`${base} bottom-3 left-3 border-b-[3px] border-l-[3px] rounded-bl-lg`} />
      <div className={`${base} bottom-3 right-3 border-b-[3px] border-r-[3px] rounded-br-lg`} />
    </>
  );
}

/* ─── Validar ─────────────────────────────────── */
export default function Validar() {
  const [modo, setModo]           = useState('scanner'); // 'scanner' | 'manual'
  const [uuid, setUuid]           = useState('');
  const [resultado, setResultado] = useState(null);
  const [tipoError, setTipoError] = useState('');
  const [msgError, setMsgError]   = useState('');
  const [cargando, setCargando]   = useState(false);
  const [camError, setCamError]   = useState('');

  const [modalReporte, setModalReporte] = useState(false);

  const scannerRef    = useRef(null);
  const procesandoRef = useRef(false);

  const hayResultado = !!(resultado || tipoError);

  // UUID limpio (sin el token TOTP) para el reporte
  const uuidParaReporte = uuid ? uuid.split(':')[0] : '';

  /* ── lógica de validación ─────────────────────── */
  const validarUuid = useCallback(async (texto) => {
    const limpio = texto?.trim();
    if (!limpio) return;
    setCargando(true);
    setResultado(null);
    setTipoError('');
    setMsgError('');
    try {
      const { data } = await validarTicketApi(limpio);
      setResultado(data.ticket);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al validar';
      setMsgError(msg);
      if (msg.toLowerCase().includes('usado')) {
        setTipoError('TICKET_YA_USADO');
        toast.error('Este ticket ya fue usado');
      } else if (msg.toLowerCase().includes('inválido o expirado') || msg.toLowerCase().includes('invalido o expirado')) {
        setTipoError('TOKEN_INVALIDO');
        toast.error('QR expirado — pide el código actualizado');
      } else {
        setTipoError('TICKET_INVALIDO');
      }
    } finally {
      setCargando(false);
      procesandoRef.current = false;
    }
  }, []);

  /* ── control del escáner ──────────────────────── */
  const detenerEscaner = useCallback(async () => {
    if (!scannerRef.current) return;
    try {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      scannerRef.current.clear();
    } catch (_) { /* ignore */ }
    scannerRef.current = null;
  }, []);

  const iniciarEscaner = useCallback(async () => {
    if (scannerRef.current) return;
    setCamError('');
    procesandoRef.current = false;

    try {
      const scanner = new Html5Qrcode(READER_ID, { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, aspectRatio: 1.0 },
        (decodedText) => {
          if (procesandoRef.current) return;
          procesandoRef.current = true;
          detenerEscaner().then(() => validarUuid(decodedText.trim()));
        },
        () => {} // ignorar errores de frame
      );
    } catch (_) {
      scannerRef.current = null;
      setCamError('No se pudo acceder a la cámara. Usa el modo manual.');
    }
  }, [detenerEscaner, validarUuid]);

  /* ── ciclo de vida del escáner ────────────────── */
  useEffect(() => {
    if (modo !== 'scanner' || hayResultado || cargando) {
      detenerEscaner();
      return;
    }
    // pequeño delay para asegurar que el div está en el DOM
    const timer = setTimeout(iniciarEscaner, 200);
    return () => {
      clearTimeout(timer);
      detenerEscaner();
    };
  }, [modo, hayResultado, cargando, iniciarEscaner, detenerEscaner]);

  // cleanup al desmontar
  useEffect(() => () => { detenerEscaner(); }, [detenerEscaner]);

  /* ── handlers ─────────────────────────────────── */
  const resetear = () => {
    setUuid('');
    setResultado(null);
    setTipoError('');
    setMsgError('');
    setCamError('');
    setModalReporte(false);
    setModo('scanner');
  };

  const irAManual = () => {
    detenerEscaner();
    setModo('manual');
  };

  const handleManual = async (e) => {
    e.preventDefault();
    await validarUuid(uuid);
  };

  /* ── render ───────────────────────────────────── */
  return (
    <div className="max-w-lg mx-auto px-4 py-10">

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex w-16 h-16 bg-[#1F1F2B] border border-[#3A3A48] rounded-2xl
                        items-center justify-center mb-5">
          <ScanLine size={28} className="text-[#7C3AED]" />
        </div>
        <h1 className="text-2xl font-bold text-white">Validar entrada</h1>
        <p className="text-[#A8A8B3] text-sm mt-1">
          {modo === 'scanner'
            ? 'Escanea el código QR del ticket'
            : 'Ingresa el UUID del ticket'}
        </p>
      </div>

      {/* ── Modo escáner ─── */}
      {modo === 'scanner' && !hayResultado && !cargando && (
        <div className="flex flex-col items-center gap-5">

          {/* Viewport */}
          <div className="relative w-72 mx-auto">
            {/* El div donde html5-qrcode inyecta el video */}
            <div
              id={READER_ID}
              className="w-72 min-h-72 rounded-2xl overflow-hidden bg-[#0A0A0F]"
            />
            {/* Esquinas moradas encima del video */}
            {!camError && (
              <div className="absolute inset-0 pointer-events-none z-20">
                <Esquinas />
              </div>
            )}
            {/* Error de cámara */}
            {camError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center
                              bg-[#0A0A0F] rounded-2xl z-20 px-6 gap-3">
                <Camera size={32} className="text-[#3A3A48]" />
                <p className="text-[#EF4444] text-sm text-center">{camError}</p>
              </div>
            )}
          </div>

          <p className="text-[#96969F] text-sm text-center">
            Apunta al código QR del ticket
          </p>

          <button
            onClick={irAManual}
            className="flex items-center gap-1.5 text-[#96969F] text-xs
                       hover:text-[#A8A8B3] transition-colors"
          >
            <Keyboard size={12} /> Ingresar código manualmente
          </button>
        </div>
      )}

      {/* ── Modo manual ─── */}
      {modo === 'manual' && !hayResultado && !cargando && (
        <form onSubmit={handleManual} className="flex flex-col gap-4">
          <div>
            <label htmlFor="uuid-manual" className="block text-xs font-medium text-[#A8A8B3] mb-2">
              Código QR del ticket
            </label>
            <input
              id="uuid-manual"
              type="text"
              value={uuid}
              onChange={(e) => setUuid(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:123456"
              autoFocus
              className="w-full px-4 py-4 bg-[#2A2A35] border border-[#3A3A48] rounded-xl
                         text-white text-sm placeholder-[#96969F] outline-none
                         focus:border-[#7C3AED] transition-all font-mono"
            />
            <p className="text-[#96969F] text-[11px] mt-1.5">
              Formato: UUID:TOKEN (6 dígitos). El escáner lo lee automáticamente.
            </p>
          </div>

          <button
            type="submit"
            disabled={!uuid.trim()}
            className="w-full py-4 bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.99]
                       text-white font-bold rounded-xl transition-all
                       shadow-lg shadow-[#7C3AED]/25 cursor-pointer border-0
                       disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            Validar ticket
          </button>

          <button
            type="button"
            onClick={() => setModo('scanner')}
            className="flex items-center justify-center gap-1.5 text-[#96969F] text-xs
                       hover:text-[#A8A8B3] transition-colors"
          >
            <Camera size={12} /> ← Usar escáner
          </button>
        </form>
      )}

      {/* ── Cargando ─── */}
      {cargando && !hayResultado && (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="w-12 h-12 border-[3px] border-[#7C3AED]/20 border-t-[#7C3AED]
                          rounded-full animate-spin" />
          <p className="text-[#A8A8B3] text-sm">Validando ticket...</p>
        </div>
      )}

      {/* ── Resultados ─── */}
      {resultado && <ResultadoValido ticket={resultado} />}
      {tipoError  && <ResultadoError mensaje={msgError} tipo={tipoError} />}

      {/* Botón "Reportar incidente" — solo en resultados de error */}
      {tipoError && (
        <button
          onClick={() => setModalReporte(true)}
          className="mt-3 w-full py-3 flex items-center justify-center gap-2
                     border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/10
                     hover:border-[#EF4444]/60 text-sm font-semibold rounded-xl
                     transition-all cursor-pointer bg-transparent"
        >
          <AlertTriangle size={15} /> Reportar incidente
        </button>
      )}

      {/* Botón para escanear otro */}
      {hayResultado && (
        <button
          onClick={resetear}
          className="mt-3 w-full py-3.5 flex items-center justify-center gap-2
                     border border-[#3A3A48] text-[#A8A8B3] hover:text-white hover:border-[#7C3AED]
                     text-sm font-semibold rounded-xl transition-all cursor-pointer bg-transparent"
        >
          <RefreshCw size={15} /> Escanear otro
        </button>
      )}

      {/* Modal de reporte */}
      {modalReporte && (
        <ModalReporte
          ticketUuid={uuidParaReporte}
          onCerrar={() => setModalReporte(false)}
        />
      )}
    </div>
  );
}
