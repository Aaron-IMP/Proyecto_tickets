import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Ticket, CheckCircle2, Shield, Mail, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { misTicketsApi } from '../../api/tickets-api';
import { cambiarPasswordApi } from '../../api/auth-api';
import { formatearFecha } from '../../utils/formato';

const ROL_BADGE = {
  cliente:   { cls: 'bg-[#7C3AED]/15 text-[#7C3AED] border-[#7C3AED]/30', label: 'Cliente' },
  admin:     { cls: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30', label: 'Admin' },
  seguridad: { cls: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30', label: 'Seguridad' },
};

function InputPass({ label, name, value, onChange, show, onToggleShow, placeholder }) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-medium text-[#A8A8B3] mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#96969F] pointer-events-none">
          <Lock size={15} />
        </span>
        <input
          id={name}
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder || '••••••••'}
          required
          className="w-full pl-10 pr-11 py-3 bg-[#2A2A35] border border-[#3A3A48] rounded-xl
                     text-white text-sm placeholder-[#96969F] outline-none
                     focus:border-[#7C3AED] transition-all"
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#96969F] hover:text-white
                     transition-colors cursor-pointer bg-transparent border-0 p-0"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

export default function Perfil() {
  const { usuario } = useAuth();
  const badge = ROL_BADGE[usuario?.rol] || ROL_BADGE.cliente;

  /* ── Estadísticas ─────────────────────────── */
  const [tickets, setTickets]             = useState([]);
  const [cargandoStats, setCargandoStats] = useState(true);

  useEffect(() => {
    misTicketsApi()
      .then(({ data }) => setTickets(data.tickets))
      .finally(() => setCargandoStats(false));
  }, []);

  const stats = {
    total:   tickets.length,
    usados:  tickets.filter(t => t.estado === 'usado').length,
    activos: tickets.filter(t => t.estado === 'activo').length,
  };

  /* ── Cambio de contraseña ─────────────────── */
  const [form, setForm]         = useState({ actual: '', nueva: '', confirmar: '' });
  const [mostrar, setMostrar]   = useState({ actual: false, nueva: false, confirmar: false });
  const [error, setError]       = useState('');
  const [enviando, setEnviando] = useState(false);

  const toggle      = (campo) => setMostrar(p => ({ ...p, [campo]: !p[campo] }));
  const handleChange = (e)    => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleCambiar = async (e) => {
    e.preventDefault();
    setError('');

    if (form.nueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (form.nueva !== form.confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (form.nueva === form.actual) {
      setError('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    setEnviando(true);
    try {
      await cambiarPasswordApi(form.actual, form.nueva);
      toast.success('Contraseña actualizada correctamente');
      setForm({ actual: '', nueva: '', confirmar: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar la contraseña');
    } finally {
      setEnviando(false);
    }
  };

  /* ── Iniciales del avatar ─────────────────── */
  const palabras  = usuario?.nombre?.split(' ').filter(Boolean) || [];
  const iniciales = palabras.length >= 2
    ? (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase()
    : (palabras[0]?.[0] || '?').toUpperCase();

  const formularioCompleto = form.actual && form.nueva && form.confirmar;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* ── Sección 1: Info del usuario ───────── */}
      <div className="bg-[#15151D] border border-[#3A3A48] rounded-2xl p-7 mb-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

          {/* Avatar */}
          <div className="w-20 h-20 shrink-0 bg-[#7C3AED] rounded-full flex items-center justify-center
                          text-white text-2xl font-extrabold shadow-lg shadow-[#7C3AED]/25 select-none">
            {iniciales}
          </div>

          {/* Datos */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap mb-3">
              <h1 className="text-white text-xl font-bold">{usuario?.nombre}</h1>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge.cls}`}>
                {badge.label}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-[#A8A8B3] text-sm flex items-center justify-center sm:justify-start gap-2">
                <Mail size={14} className="text-[#96969F] shrink-0" />
                {usuario?.email}
              </p>
              {usuario?.fechaRegistro && (
                <p className="text-[#A8A8B3] text-sm flex items-center justify-center sm:justify-start gap-2">
                  <Calendar size={14} className="text-[#96969F] shrink-0" />
                  <span>Miembro desde {formatearFecha(usuario.fechaRegistro)}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sección 2: Estadísticas ───────────── */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Tickets comprados', valor: stats.total,   icon: Ticket,       color: 'text-[#7C3AED]', border: 'border-[#7C3AED]/20' },
          { label: 'Eventos asistidos', valor: stats.usados,  icon: CheckCircle2, color: 'text-[#10B981]', border: 'border-[#10B981]/20' },
          { label: 'Tickets activos',   valor: stats.activos, icon: Shield,       color: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20' },
        ].map(({ label, valor, icon: Icon, color, border }) => (
          <div key={label}
               className={`bg-[#15151D] border ${border} rounded-xl p-4 text-center`}>
            <Icon size={20} className={`${color} mx-auto mb-2`} />
            {cargandoStats ? (
              <div className="h-7 bg-[#2A2A35] rounded-lg w-8 mx-auto animate-pulse mb-1.5" />
            ) : (
              <p className={`text-2xl font-extrabold ${color} mb-1`}>{valor}</p>
            )}
            <p className="text-[#96969F] text-[10px] font-medium leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Sección 3: Cambiar contraseña ─────── */}
      <div className="bg-[#15151D] border border-[#3A3A48] rounded-2xl p-7">
        <div className="flex items-center gap-2 mb-6">
          <Lock size={18} className="text-[#7C3AED]" />
          <h2 className="text-white font-bold">Cambiar contraseña</h2>
        </div>

        <form onSubmit={handleCambiar} className="space-y-4">
          <InputPass
            label="Contraseña actual"
            name="actual"
            value={form.actual}
            onChange={handleChange}
            show={mostrar.actual}
            onToggleShow={() => toggle('actual')}
          />
          <InputPass
            label="Nueva contraseña"
            name="nueva"
            value={form.nueva}
            onChange={handleChange}
            show={mostrar.nueva}
            onToggleShow={() => toggle('nueva')}
            placeholder="Mínimo 6 caracteres"
          />
          <InputPass
            label="Confirmar nueva contraseña"
            name="confirmar"
            value={form.confirmar}
            onChange={handleChange}
            show={mostrar.confirmar}
            onToggleShow={() => toggle('confirmar')}
          />

          {error && (
            <div className="px-4 py-3 bg-[#EF4444]/10 border border-[#EF4444]/25 rounded-xl
                            text-[#EF4444] text-sm flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={enviando || !formularioCompleto}
            className="w-full py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.99]
                       text-white font-bold text-sm rounded-xl transition-all
                       shadow-lg shadow-[#7C3AED]/25 cursor-pointer border-0
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {enviando ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Actualizando...
              </span>
            ) : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
