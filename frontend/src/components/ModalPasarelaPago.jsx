/**
 * ModalPasarelaPago.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Modal de pasarela de pagos SIMULADA para Teleticket.
 *
 * Props:
 *   zona          – { id, nombre_zona, precio }
 *   cantidad      – número de tickets a comprar
 *   onExito(uuids)– callback cuando los N pagos se aprueban; recibe array de ticket UUIDs
 *   onCerrar()    – callback para cerrar el modal
 * ─────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useRef } from 'react';
import {
  CreditCard, Smartphone, X, Lock, CheckCircle2,
  XCircle, ChevronRight, AlertTriangle, ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { procesarPagoApi } from '../api/pagos-api';
import { formatearPrecio } from '../utils/formato';

/* ── helpers ── */
const METODOS = [
  { id: 'tarjeta', label: 'Tarjeta',  icon: CreditCard,  sub: 'Crédito o débito' },
  { id: 'yape',    label: 'Yape',     icon: Smartphone,  sub: 'Pago móvil'       },
  { id: 'plin',    label: 'Plin',     icon: Smartphone,  sub: 'Pago móvil'       },
];

// Formatea "1234567890123456" → "1234 5678 9012 3456"
function formatCard(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
// Formatea "1225" → "12/25"
function formatExp(val) {
  const d = val.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

function InputTarjeta({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[#A8A8B3] text-xs font-medium">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full bg-[#1F1F2B] border border-[#3A3A48] rounded-xl px-4 py-3 text-white text-sm ' +
  'placeholder-[#55556A] focus:outline-none focus:border-[#7C3AED] transition-colors font-mono';

/* ══════════════════════════════════════════════════════════════════════
   PASO 1 — Selección de método
══════════════════════════════════════════════════════════════════════ */
function PasoMetodo({ metodo, setMetodo, onSiguiente }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[#A8A8B3] text-sm">Elige cómo quieres pagar:</p>

      <div className="flex flex-col gap-2">
        {METODOS.map(({ id, label, icon: Icon, sub }) => (
          <button
            key={id}
            onClick={() => setMetodo(id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left
                        transition-all cursor-pointer bg-transparent
                        ${metodo === id
                          ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                          : 'border-[#3A3A48] hover:border-[#7C3AED]/40 bg-[#1F1F2B]'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                             ${metodo === id ? 'bg-[#7C3AED]' : 'bg-[#2A2A35]'}`}>
              <Icon size={18} className={metodo === id ? 'text-white' : 'text-[#A8A8B3]'} />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">{label}</p>
              <p className="text-[#96969F] text-xs">{sub}</p>
            </div>
            {/* Radio visual */}
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                             ${metodo === id ? 'border-[#7C3AED]' : 'border-[#3A3A48]'}`}>
              {metodo === id && <div className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onSiguiente}
        disabled={!metodo}
        className="w-full py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold
                   rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed
                   cursor-pointer border-0 flex items-center justify-center gap-2 text-sm"
      >
        Continuar <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PASO 2 — Formulario de tarjeta
══════════════════════════════════════════════════════════════════════ */
function FormTarjeta({ subtotal, cantidad, onPagar, procesando, error }) {
  const [numero, setNumero]   = useState('');
  const [titular, setTitular] = useState('');
  const [venc, setVenc]       = useState('');
  const [cvv, setCvv]         = useState('');

  const valido =
    numero.replace(/\s/g, '').length === 16 &&
    titular.trim().length >= 3 &&
    /^\d{2}\/\d{2}$/.test(venc) &&
    cvv.length >= 3;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valido || procesando) return;
    onPagar({ numeroTarjeta: numero.replace(/\s/g, ''), nombreTitular: titular, vencimiento: venc, cvv });
  };

  /* Feedback visual de la tarjeta */
  const ultimos4 = numero.replace(/\s/g, '').slice(-4) || '----';
  const isTestRechazo = ['0000', '1111'].includes(ultimos4);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Mini-preview de tarjeta */}
      <div className={`relative h-36 rounded-2xl p-5 overflow-hidden select-none
                       ${isTestRechazo
                         ? 'bg-gradient-to-br from-[#7f1d1d] to-[#450a0a]'
                         : 'bg-gradient-to-br from-[#4C1D95] via-[#7C3AED] to-[#2563EB]'}`}>
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-1">
            <div className="w-6 h-6 rounded-full bg-white/30" />
            <div className="w-6 h-6 rounded-full bg-white/20 -ml-2" />
          </div>
          <CreditCard size={20} className="text-white/60" />
        </div>
        <p className="text-white font-mono text-sm tracking-widest mb-2">
          {numero || '•••• •••• •••• ••••'}
        </p>
        <div className="flex justify-between">
          <p className="text-white/70 text-xs uppercase">{titular || 'NOMBRE TITULAR'}</p>
          <p className="text-white/70 text-xs">{venc || 'MM/AA'}</p>
        </div>
        {isTestRechazo && (
          <div className="absolute top-2 right-2 bg-[#EF4444] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
            TEST — RECHAZADA
          </div>
        )}
      </div>

      <InputTarjeta label="Número de tarjeta">
        <input
          className={inputCls}
          value={numero}
          onChange={e => setNumero(formatCard(e.target.value))}
          placeholder="1234 5678 9012 3456"
          inputMode="numeric"
          maxLength={19}
          required
        />
      </InputTarjeta>

      <InputTarjeta label="Nombre del titular">
        <input
          className={`${inputCls} font-sans uppercase`}
          value={titular}
          onChange={e => setTitular(e.target.value.toUpperCase())}
          placeholder="COMO APARECE EN LA TARJETA"
          maxLength={40}
          required
        />
      </InputTarjeta>

      <div className="grid grid-cols-2 gap-3">
        <InputTarjeta label="Vencimiento">
          <input
            className={inputCls}
            value={venc}
            onChange={e => setVenc(formatExp(e.target.value))}
            placeholder="MM/AA"
            inputMode="numeric"
            maxLength={5}
            required
          />
        </InputTarjeta>
        <InputTarjeta label="CVV">
          <input
            className={inputCls}
            value={cvv}
            onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="•••"
            inputMode="numeric"
            type="password"
            maxLength={4}
            required
          />
        </InputTarjeta>
      </div>

      {/* Hint tarjetas de prueba */}
      <div className="bg-[#1F1F2B] border border-[#3A3A48] rounded-xl p-3">
        <p className="text-[#96969F] text-[10px] leading-relaxed">
          <span className="text-[#A8A8B3] font-semibold">Tarjetas de prueba: </span>
          cualquier número funciona excepto terminados en{' '}
          <span className="text-[#EF4444] font-mono">0000</span> (fondos insuficientes)
          {' '}o{' '}
          <span className="text-[#EF4444] font-mono">1111</span> (expirada).
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-[#EF4444]/10 border border-[#EF4444]/25
                        rounded-xl text-[#EF4444] text-sm">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!valido || procesando}
        className="w-full py-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl
                   transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
                   border-0 flex items-center justify-center gap-2 text-sm"
      >
        {procesando ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Procesando pago...
          </>
        ) : (
          <>
            <Lock size={14} />
            Pagar {cantidad > 1 ? `${cantidad} tickets · ` : ''}{formatearPrecio(subtotal)}
          </>
        )}
      </button>
    </form>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PASO 2 — Formulario Yape / Plin
══════════════════════════════════════════════════════════════════════ */
function FormMovil({ metodo, subtotal, cantidad, onPagar, procesando, error }) {
  const [telefono, setTelefono] = useState('');

  const valido = /^\d{9}$/.test(telefono);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valido || procesando) return;
    onPagar({ telefono });
  };

  const colorMap = { yape: '#6C0AC7', plin: '#00B4D8' };
  const color = colorMap[metodo] || '#7C3AED';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Avatar simulado de la app */}
      <div className="flex flex-col items-center py-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
             style={{ background: color }}>
          <Smartphone size={30} className="text-white" />
        </div>
        <p className="text-white font-bold capitalize">{metodo}</p>
        <p className="text-[#96969F] text-xs mt-1">Ingresa el número vinculado a tu cuenta</p>
      </div>

      <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-xl px-4 py-3
                      flex justify-between items-center">
        <span className="text-[#A8A8B3] text-sm">
          {cantidad > 1 ? `${cantidad} tickets` : '1 ticket'}
        </span>
        <span className="text-[#7C3AED] font-bold font-mono">{formatearPrecio(subtotal)}</span>
      </div>

      <InputTarjeta label="Número de celular (9 dígitos)">
        <input
          className={inputCls}
          value={telefono}
          onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 9))}
          placeholder="987 654 321"
          inputMode="numeric"
          maxLength={9}
          required
        />
      </InputTarjeta>

      <div className="bg-[#1F1F2B] border border-[#3A3A48] rounded-xl p-3">
        <p className="text-[#96969F] text-[10px] leading-relaxed">
          <span className="text-[#A8A8B3] font-semibold">Modo prueba:</span>{' '}
          {metodo === 'yape' ? 'Yape' : 'Plin'} siempre aprueba el pago en esta simulación.
          Ingresa cualquier número de 9 dígitos.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-[#EF4444]/10 border border-[#EF4444]/25
                        rounded-xl text-[#EF4444] text-sm">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!valido || procesando}
        className="w-full py-4 text-white font-bold rounded-xl transition-all
                   disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
                   border-0 flex items-center justify-center gap-2 text-sm"
        style={{ background: procesando ? '#4B5563' : color }}
      >
        {procesando ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <Lock size={14} />
            Confirmar pago · {formatearPrecio(subtotal)}
          </>
        )}
      </button>
    </form>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PASO 3 — Resultado (aprobado / rechazado)
══════════════════════════════════════════════════════════════════════ */
function PasoResultado({ exito, mensaje, onCerrar, onReintentar }) {
  return (
    <div className="flex flex-col items-center text-center gap-4 py-4">
      {exito ? (
        <>
          <div className="w-20 h-20 bg-[#10B981]/15 rounded-full flex items-center justify-center">
            <CheckCircle2 size={44} className="text-[#10B981]" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-1">¡Pago aprobado!</h3>
            <p className="text-[#96969F] text-sm">{mensaje}</p>
          </div>
          <div className="flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/25
                          rounded-xl px-4 py-2.5 w-full justify-center">
            <ShieldCheck size={15} className="text-[#10B981]" />
            <span className="text-[#10B981] text-xs font-semibold">Ticket generado y confirmado</span>
          </div>
          <button
            onClick={onCerrar}
            className="w-full py-3.5 bg-[#10B981] hover:bg-[#059669] text-white font-bold
                       rounded-xl transition-all cursor-pointer border-0 text-sm"
          >
            Ver mis tickets
          </button>
        </>
      ) : (
        <>
          <div className="w-20 h-20 bg-[#EF4444]/15 rounded-full flex items-center justify-center">
            <XCircle size={44} className="text-[#EF4444]" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-1">Pago rechazado</h3>
            <p className="text-[#96969F] text-sm">{mensaje}</p>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={onReintentar}
              className="w-full py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold
                         rounded-xl transition-all cursor-pointer border-0 text-sm"
            >
              Intentar de nuevo
            </button>
            <button
              onClick={onCerrar}
              className="w-full py-3 border border-[#3A3A48] text-[#A8A8B3] hover:text-white
                         hover:border-[#7C3AED]/50 font-semibold rounded-xl transition-all
                         cursor-pointer bg-transparent text-sm"
            >
              Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════════════════ */
export default function ModalPasarelaPago({ zona, cantidad, onExito, onCerrar }) {
  const [paso, setPaso]         = useState('metodo');   // 'metodo' | 'formulario' | 'resultado'
  const [metodo, setMetodo]     = useState('');
  const [procesando, setProcesando] = useState(false);
  const [error, setError]       = useState('');
  const [resultado, setResultado] = useState(null);    // { exito, mensaje }

  const subtotal = zona.precio * cantidad;
  const overlayRef = useRef(null);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && !procesando) onCerrar();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [procesando, onCerrar]);

  const pagarConDatos = async (datosPago) => {
    setProcesando(true);
    setError('');
    try {
      const responses = await Promise.all(
        Array.from({ length: cantidad }, () =>
          procesarPagoApi({
            categoriaTicketId: zona.id,
            metodo,
            ...datosPago,
          })
        )
      );
      const uuids = responses.map(r => r.data.ticketUuid);
      setResultado({ exito: true, mensaje: `Tu${cantidad > 1 ? 's ' + cantidad : ''} ticket${cantidad > 1 ? 's' : ''} ha${cantidad > 1 ? 'n' : ''} sido generado${cantidad > 1 ? 's' : ''} y confirmado${cantidad > 1 ? 's' : ''}. ¡Disfruta el evento!` });
      setPaso('resultado');
      toast.success(`¡Pago aprobado! ${cantidad > 1 ? `${cantidad} tickets` : 'Ticket'} generado${cantidad > 1 ? 's' : ''}.`);
      // Callback diferido para que el usuario vea la pantalla de éxito
      setTimeout(() => onExito(uuids), 1800);
    } catch (err) {
      const motivo = err.response?.data?.motivo
        || err.response?.data?.error
        || 'Error al procesar el pago. Intenta de nuevo.';
      setResultado({ exito: false, mensaje: motivo });
      setPaso('resultado');
      toast.error('Pago rechazado');
    } finally {
      setProcesando(false);
    }
  };

  const reintentar = () => {
    setResultado(null);
    setError('');
    setPaso('formulario');
  };

  const titulosPaso = {
    metodo:     'Método de pago',
    formulario: metodo === 'tarjeta' ? 'Datos de tarjeta' : `Pagar con ${metodo.charAt(0).toUpperCase() + metodo.slice(1)}`,
    resultado:  resultado?.exito ? '¡Listo!' : 'Transacción fallida',
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current && !procesando) onCerrar(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-pasarela"
        className="w-full max-w-sm bg-[#15151D] border border-[#3A3A48] rounded-2xl
                   shadow-2xl shadow-black/60 flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2A2A35]">
          <div className="flex items-center gap-3">
            {paso === 'formulario' && (
              <button
                onClick={() => { if (!procesando) setPaso('metodo'); }}
                className="text-[#A8A8B3] hover:text-white transition-colors bg-transparent border-0
                           cursor-pointer p-0 text-sm"
                disabled={procesando}
              >
                ←
              </button>
            )}
            <div>
              <h2 id="titulo-pasarela" className="text-white font-bold text-sm">
                {titulosPaso[paso]}
              </h2>
              {paso !== 'resultado' && (
                <p className="text-[#7C3AED] font-mono text-xs font-bold mt-0.5">
                  {formatearPrecio(subtotal)}
                  {cantidad > 1 && <span className="text-[#96969F] font-sans font-normal"> · {cantidad} tickets</span>}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => { if (!procesando) onCerrar(); }}
            disabled={procesando}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#2A2A35]
                       hover:bg-[#3A3A48] text-[#A8A8B3] hover:text-white transition-colors
                       cursor-pointer border-0 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Cerrar"
          >
            <X size={15} />
          </button>
        </div>

        {/* Badge de seguridad */}
        {paso !== 'resultado' && (
          <div className="mx-6 mt-3 flex items-center gap-2 bg-[#10B981]/8 border border-[#10B981]/20
                          rounded-lg px-3 py-2">
            <Lock size={11} className="text-[#10B981] shrink-0" />
            <span className="text-[#10B981] text-[10px] font-medium">
              Pago seguro simulado · Entorno de pruebas
            </span>
          </div>
        )}

        {/* Contenido */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {paso === 'metodo' && (
            <PasoMetodo
              metodo={metodo}
              setMetodo={setMetodo}
              onSiguiente={() => setPaso('formulario')}
            />
          )}

          {paso === 'formulario' && metodo === 'tarjeta' && (
            <FormTarjeta
              subtotal={subtotal}
              cantidad={cantidad}
              onPagar={pagarConDatos}
              procesando={procesando}
              error={error}
            />
          )}

          {paso === 'formulario' && (metodo === 'yape' || metodo === 'plin') && (
            <FormMovil
              metodo={metodo}
              subtotal={subtotal}
              cantidad={cantidad}
              onPagar={pagarConDatos}
              procesando={procesando}
              error={error}
            />
          )}

          {paso === 'resultado' && resultado && (
            <PasoResultado
              exito={resultado.exito}
              mensaje={resultado.mensaje}
              onCerrar={onCerrar}
              onReintentar={reintentar}
            />
          )}
        </div>

        {/* Footer */}
        {paso !== 'resultado' && (
          <div className="px-6 pb-4 pt-2 border-t border-[#2A2A35]">
            <p className="text-[#55556A] text-[10px] text-center leading-relaxed">
              Este es un entorno de simulación. No se realizan cobros reales.
              <br />
              Teleticket · Pasarela de pagos v1.0 (Demo)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
