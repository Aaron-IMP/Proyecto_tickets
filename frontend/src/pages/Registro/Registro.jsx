import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import { registroApi } from '../../api/auth-api';

function Campo({ icono: Icono, label, name, type, value, onChange, placeholder, rightEl }) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-medium text-[#A8A8B3] mb-2">{label}</label>
      <div className="relative flex items-center">
        <span className="absolute left-4 text-[#96969F]"><Icono size={16} /></span>
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          className="w-full pl-11 pr-11 py-3.5 bg-[#2A2A35] border border-[#3A3A48] rounded-xl
                     text-white text-sm placeholder-[#96969F] outline-none
                     focus:border-[#7C3AED] transition-all"
        />
        {rightEl && <span className="absolute right-4 text-[#96969F]">{rightEl}</span>}
      </div>
    </div>
  );
}

export default function Registro() {
  const [form, setForm]         = useState({ nombre: '', email: '', contrasena: '', confirmar: '' });
  const [verPass, setVerPass]   = useState(false);
  const [error, setError]       = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate                = useNavigate();

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.contrasena !== form.confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (form.contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setCargando(true);
    try {
      await registroApi(form.nombre, form.email, form.contrasena);
      toast.success('Cuenta creada correctamente');
      navigate('/login', { state: { exito: '¡Cuenta creada! Ahora inicia sesión.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la cuenta');
    } finally {
      setCargando(false);
    }
  };

  const togglePass = (
    <button type="button" onClick={() => setVerPass(p => !p)}
            aria-label={verPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="cursor-pointer text-[#96969F] hover:text-white transition-colors bg-transparent border-0 p-0">
      {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  const coinciden = form.confirmar && form.contrasena === form.confirmar;
  const noCoinciden = form.confirmar && form.contrasena !== form.confirmar;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#0A0A0F]">
      <div className="w-full max-w-[380px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-[#7C3AED] rounded-2xl items-center justify-center mb-5 shadow-lg shadow-[#7C3AED]/30">
            <Ticket size={28} className="text-white" />
          </div>
          <h1 className="text-[28px] font-bold text-white tracking-tight">Crear cuenta</h1>
          <p className="text-[#A8A8B3] text-sm mt-1">Regístrate para comprar tickets</p>
        </div>

        {/* Card */}
        <div className="bg-[#15151D] border border-[#3A3A48] rounded-2xl p-7 shadow-xl">

          {error && (
            <div className="mb-5 px-4 py-3 bg-[#EF4444]/10 border border-[#EF4444]/25 rounded-xl
                            text-[#EF4444] text-sm flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Campo icono={User}  label="Nombre completo"   name="nombre"    type="text"     value={form.nombre}    onChange={handleChange} placeholder="Juan Pérez" />
            <Campo icono={Mail}  label="Correo electrónico" name="email"     type="email"    value={form.email}     onChange={handleChange} placeholder="tu@correo.com" />
            <Campo icono={Lock}  label="Contraseña"         name="contrasena" type={verPass ? 'text' : 'password'} value={form.contrasena} onChange={handleChange} placeholder="Mínimo 6 caracteres" rightEl={togglePass} />

            {/* Confirmar con indicador visual */}
            <div>
              <label htmlFor="confirmar" className="block text-xs font-medium text-[#A8A8B3] mb-2">Confirmar contraseña</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-[#96969F]"><Lock size={16} /></span>
                <input
                  id="confirmar"
                  type={verPass ? 'text' : 'password'}
                  name="confirmar"
                  value={form.confirmar}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  required
                  className={`w-full pl-11 pr-11 py-3.5 bg-[#2A2A35] rounded-xl text-white text-sm
                              placeholder-[#96969F] outline-none transition-all border
                              ${coinciden    ? 'border-[#10B981]' :
                                noCoinciden  ? 'border-[#EF4444]' :
                                               'border-[#3A3A48] focus:border-[#7C3AED]'}`}
                />
                {coinciden   && <span className="absolute right-4 text-[#10B981]">✓</span>}
                {noCoinciden && <span className="absolute right-4 text-[#EF4444]">✗</span>}
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="mt-2 w-full py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-[0.98]
                         text-white text-sm font-semibold rounded-xl transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-0
                         shadow-lg shadow-[#7C3AED]/25"
            >
              {cargando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando cuenta...
                </span>
              ) : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#A8A8B3] mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-[#7C3AED] hover:text-[#6D28D9] font-semibold no-underline transition-colors">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
