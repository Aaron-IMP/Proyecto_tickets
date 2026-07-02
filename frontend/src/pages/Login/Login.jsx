import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

function InputConIcono({ icono: Icono, type, name, value, onChange, placeholder, rightEl }) {
  return (
    <div className="relative flex items-center">
      <span className="absolute left-4 text-[#96969F]">
        <Icono size={16} />
      </span>
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
                   focus:border-[#7C3AED] focus:bg-[#2A2A35]/80 transition-all"
      />
      {rightEl && (
        <span className="absolute right-4 text-[#96969F]">{rightEl}</span>
      )}
    </div>
  );
}

export default function Login() {
  const [form, setForm]         = useState({ email: '', contrasena: '' });
  const [verPass, setVerPass]   = useState(false);
  const [error, setError]       = useState('');
  const [cargando, setCargando] = useState(false);
  const { login }               = useAuth();
  const navigate                = useNavigate();

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const { usuario } = await login(form.email, form.contrasena);
      toast.success(`¡Bienvenido de vuelta, ${usuario.nombre}!`);
      if (usuario.rol === 'admin')        navigate('/admin');
      else if (usuario.rol === 'seguridad') navigate('/validar');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales incorrectas');
      if (err.response) toast.error('Correo o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0A0A0F]">
      <div className="w-full max-w-[380px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-[#7C3AED] rounded-2xl items-center justify-center mb-5 shadow-lg shadow-[#7C3AED]/30">
            <Ticket size={28} className="text-white" />
          </div>
          <h1 className="text-[28px] font-bold text-white tracking-tight">Bienvenido</h1>
          <p className="text-[#A8A8B3] text-sm mt-1">Ingresa a tu cuenta</p>
        </div>

        {/* Card */}
        <div className="bg-[#15151D] border border-[#3A3A48] rounded-2xl p-7 shadow-xl">

          {error && (
            <div className="mb-5 px-4 py-3 bg-[#EF4444]/10 border border-[#EF4444]/25 rounded-xl
                            text-[#EF4444] text-sm flex items-center gap-2">
              <span className="text-base">⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#A8A8B3] mb-2">Correo electrónico</label>
              <InputConIcono
                icono={Mail}
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tu@correo.com"
              />
            </div>

            <div>
              <label htmlFor="contrasena" className="block text-xs font-medium text-[#A8A8B3] mb-2">Contraseña</label>
              <InputConIcono
                icono={Lock}
                type={verPass ? 'text' : 'password'}
                name="contrasena"
                value={form.contrasena}
                onChange={handleChange}
                placeholder="••••••••"
                rightEl={
                  <button type="button" onClick={() => setVerPass(p => !p)}
                          aria-label={verPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          className="cursor-pointer text-[#96969F] hover:text-white transition-colors bg-transparent border-0 p-0">
                    {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
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
                  Ingresando...
                </span>
              ) : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#A8A8B3] mt-6">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-[#7C3AED] hover:text-[#6D28D9] font-semibold no-underline transition-colors">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
